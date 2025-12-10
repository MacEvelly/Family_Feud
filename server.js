const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require("socket.io").listen(server);
const port = Number(process.env.PORT) || 8080;

server.listen(port);
console.log('Listening on ' + port);

app.use('/public', express.static('public'))
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

// Store active game sessions
const games = {};

// Generate a random 6-character game code
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Make sure code is unique
    if (games[code]) {
        return generateGameCode();
    }
    return code;
}

io.sockets.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Create a new game session
    socket.on('createGame', (data) => {
        const gameCode = generateGameCode();
        games[gameCode] = {
            host: socket.id,
            players: [socket.id],
            createdAt: new Date(),
            currentQuestion: 0,
            flippedCards: [],
            team1Score: 0,
            team2Score: 0,
            boardScore: 0,
            audioSettings: {
                isMuted: false,
                backgroundVolume: 0.3,
                sfxVolume: 0.7
            }
        };
        socket.join(gameCode);
        socket.gameCode = gameCode;
        console.log('Game created:', gameCode);
        socket.emit('gameCreated', { gameCode: gameCode });
    });

    // Join an existing game session
    socket.on('joinGame', (data) => {
        const gameCode = data.gameCode.toUpperCase();
        if (games[gameCode]) {
            socket.join(gameCode);
            socket.gameCode = gameCode;
            games[gameCode].players.push(socket.id);
            console.log('Player joined game:', gameCode);
            const game = games[gameCode];
            // Send current game state to the new player
            socket.emit('gameJoined', { 
                gameCode: gameCode, 
                isHost: false,
                gameState: {
                    currentQuestion: game.currentQuestion,
                    flippedCards: game.flippedCards,
                    team1Score: game.team1Score,
                    team2Score: game.team2Score,
                    boardScore: game.boardScore,
                    audioSettings: game.audioSettings
                }
            });
            // Notify other players
            socket.to(gameCode).emit('playerJoined', { playerId: socket.id });
        } else {
            socket.emit('joinError', { message: 'Game not found' });
        }
    });

    // Handle game actions within a room
    socket.on('talking', (data) => {
        if (socket.gameCode && games[socket.gameCode]) {
            const game = games[socket.gameCode];
            
            // Update game state on server
            if (data.trigger === 'newQuestion') {
                // If questionIndex is provided, use it (for initial sync), otherwise increment
                if (data.questionIndex !== undefined) {
                    game.currentQuestion = data.questionIndex;
                } else {
                    game.currentQuestion = (game.currentQuestion || 0) + 1;
                }
                game.flippedCards = [];
                game.boardScore = 0;
                data.questionIndex = game.currentQuestion;
            } else if (data.trigger === 'flipCard') {
                if (!game.flippedCards) game.flippedCards = [];
                if (game.flippedCards.indexOf(data.num) === -1) {
                    game.flippedCards.push(data.num);
                }
            } else if (data.trigger === 'boardScoreUpdate') {
                // Client sends board score when it changes
                game.boardScore = data.boardScore || 0;
            } else if (data.trigger === 'awardTeam1') {
                game.team1Score = (game.team1Score || 0) + (game.boardScore || 0);
                game.boardScore = 0;
            } else if (data.trigger === 'awardTeam2') {
                game.team2Score = (game.team2Score || 0) + (game.boardScore || 0);
                game.boardScore = 0;
            }
            
            // Broadcast to all players in the same game room (including sender)
            io.to(socket.gameCode).emit('listening', data);
        }
    });
    
    // Request current game state
    socket.on('requestGameState', () => {
        if (socket.gameCode && games[socket.gameCode]) {
            const game = games[socket.gameCode];
            socket.emit('gameStateUpdate', {
                currentQuestion: game.currentQuestion,
                flippedCards: game.flippedCards || [],
                team1Score: game.team1Score || 0,
                team2Score: game.team2Score || 0,
                boardScore: game.boardScore || 0,
                audioSettings: game.audioSettings
            });
        }
    });
    
    // Handle audio control changes from host
    socket.on('audioControl', (data) => {
        if (socket.gameCode && games[socket.gameCode]) {
            const game = games[socket.gameCode];
            // Only allow host to control audio
            if (game.host === socket.id) {
                // Update game audio settings
                if (data.type === 'mute') {
                    game.audioSettings.isMuted = data.isMuted;
                } else if (data.type === 'backgroundVolume') {
                    game.audioSettings.backgroundVolume = data.volume;
                } else if (data.type === 'sfxVolume') {
                    game.audioSettings.sfxVolume = data.volume;
                }
                // Broadcast to all players in the game
                io.to(socket.gameCode).emit('audioUpdate', {
                    type: data.type,
                    isMuted: game.audioSettings.isMuted,
                    backgroundVolume: game.audioSettings.backgroundVolume,
                    sfxVolume: game.audioSettings.sfxVolume
                });
            }
        }
    });

    // Handle localStorage sync from host
    socket.on('localStorageSync', (data) => {
        if (socket.gameCode && games[socket.gameCode]) {
            const game = games[socket.gameCode];
            // Only allow host to sync localStorage
            if (game.host === socket.id) {
                // Broadcast to all players in the game (except the host)
                socket.to(socket.gameCode).emit('localStorageSync', {
                    data: data.data
                });
                console.log('Broadcasted localStorage sync to players in game:', socket.gameCode);
            }
        }
    });
    
    // Handle localStorage sync request from players
    socket.on('requestLocalStorageSync', (data) => {
        if (socket.gameCode && games[socket.gameCode]) {
            const game = games[socket.gameCode];
            // Forward request to host
            io.to(game.host).emit('requestLocalStorageSync', {
                fromSocketId: socket.id
            });
            console.log('Forwarded localStorage sync request to host from:', socket.id);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        if (socket.gameCode && games[socket.gameCode]) {
            const game = games[socket.gameCode];
            // Remove player from game
            game.players = game.players.filter(id => id !== socket.id);
            
            // If host disconnects or no players left, clean up the game
            if (game.host === socket.id || game.players.length === 0) {
                console.log('Game ended:', socket.gameCode);
                delete games[socket.gameCode];
            }
        }
    });
});