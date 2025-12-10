console.clear()

// Audio Manager for Family Feud sounds
var audioManager = {
    sounds: {
        backgroundMusic: null,
        cardFlip: null,
        wrongAnswer: null,
        gameStart: null,
        pointsAwarded: null,
        newQuestion: null
    },
    isMuted: false,
    backgroundVolume: 0.3,
    sfxVolume: 0.7,
    
    init: function() {
        // Initialize background music (looping)
        try {
            this.sounds.backgroundMusic = new Audio('/public/audio/background-music.mp3');
            this.sounds.backgroundMusic.loop = true;
            this.sounds.backgroundMusic.volume = this.backgroundVolume;
            this.sounds.backgroundMusic.addEventListener('error', () => {
                console.warn('Background music file not found or failed to load');
            });
        } catch (e) {
            console.warn('Failed to initialize background music:', e);
        }
        
        // Initialize sound effects
        try {
            this.sounds.cardFlip = new Audio('/public/audio/card-flip.mp3');
            this.sounds.cardFlip.volume = this.sfxVolume;
            this.sounds.cardFlip.addEventListener('error', () => {
                console.warn('Card flip sound file not found or failed to load');
            });
        } catch (e) {
            console.warn('Failed to initialize card flip sound:', e);
        }
        
        try {
            this.sounds.wrongAnswer = new Audio('/public/audio/wrong-answer.mp3');
            this.sounds.wrongAnswer.volume = this.sfxVolume;
            this.sounds.wrongAnswer.addEventListener('error', () => {
                console.warn('Wrong answer sound file not found or failed to load');
            });
        } catch (e) {
            console.warn('Failed to initialize wrong answer sound:', e);
        }
        
        try {
            this.sounds.gameStart = new Audio('/public/audio/game-start.mp3');
            this.sounds.gameStart.volume = this.sfxVolume;
            this.sounds.gameStart.addEventListener('error', () => {
                console.warn('Game start sound file not found or failed to load');
            });
        } catch (e) {
            console.warn('Failed to initialize game start sound:', e);
        }
        
        try {
            this.sounds.pointsAwarded = new Audio('/public/audio/points-awarded.mp3');
            this.sounds.pointsAwarded.volume = this.sfxVolume;
            this.sounds.pointsAwarded.addEventListener('error', () => {
                console.warn('Points awarded sound file not found or failed to load');
            });
        } catch (e) {
            console.warn('Failed to initialize points awarded sound:', e);
        }
        
        try {
            this.sounds.newQuestion = new Audio('/public/audio/new-question.mp3');
            this.sounds.newQuestion.volume = this.sfxVolume;
            this.sounds.newQuestion.addEventListener('error', () => {
                console.warn('New question sound file not found or failed to load');
            });
        } catch (e) {
            console.warn('Failed to initialize new question sound:', e);
        }
        
        // Load saved preferences
        this.loadPreferences();
    },
    
    playBackgroundMusic: function() {
        if (!this.isMuted && this.sounds.backgroundMusic) {
            // Set volume before playing
            if (this.sounds.backgroundMusic) {
                this.sounds.backgroundMusic.volume = this.backgroundVolume;
            }
            this.sounds.backgroundMusic.play().catch(e => {
                console.log('Background music play failed (may need user interaction):', e);
            });
        }
    },
    
    stopBackgroundMusic: function() {
        if (this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.pause();
            this.sounds.backgroundMusic.currentTime = 0;
        }
    },
    
    playSound: function(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        try {
            // Clone and play to allow overlapping sounds
            var sound = this.sounds[soundName].cloneNode();
            sound.volume = this.sfxVolume;
            sound.play().catch(e => {
                // Silently fail if audio can't play (e.g., user hasn't interacted with page)
                console.log('Sound play failed (may need user interaction):', soundName);
            });
        } catch (e) {
            console.warn('Error playing sound:', soundName, e);
        }
    },
    
    toggleMute: function(sendToServer) {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBackgroundMusic();
        } else {
            this.playBackgroundMusic();
        }
        this.savePreferences();
        this.updateMuteButton();
        
        // Send to server if host (sendToServer defaults to true)
        if (sendToServer !== false && typeof app !== 'undefined' && app.isHost && app.socket) {
            app.socket.emit('audioControl', {
                type: 'mute',
                isMuted: this.isMuted
            });
        }
    },
    
    setBackgroundVolume: function(volume, sendToServer) {
        this.backgroundVolume = volume;
        if (this.sounds.backgroundMusic) {
            this.sounds.backgroundMusic.volume = volume;
        }
        this.savePreferences();
        
        // Send to server if host (sendToServer defaults to true)
        if (sendToServer !== false && typeof app !== 'undefined' && app.isHost && app.socket) {
            app.socket.emit('audioControl', {
                type: 'backgroundVolume',
                volume: volume
            });
        }
    },
    
    setSFXVolume: function(volume, sendToServer) {
        this.sfxVolume = volume;
        this.savePreferences();
        
        // Send to server if host (sendToServer defaults to true)
        if (sendToServer !== false && typeof app !== 'undefined' && app.isHost && app.socket) {
            app.socket.emit('audioControl', {
                type: 'sfxVolume',
                volume: volume
            });
        }
    },
    
    // Apply audio settings from server (for all players)
    applyAudioSettings: function(settings) {
        if (settings.isMuted !== undefined) {
            this.isMuted = settings.isMuted;
            if (this.isMuted) {
                this.stopBackgroundMusic();
            } else {
                this.playBackgroundMusic();
            }
            this.updateMuteButton();
        }
        if (settings.backgroundVolume !== undefined) {
            this.backgroundVolume = settings.backgroundVolume;
            if (this.sounds.backgroundMusic) {
                this.sounds.backgroundMusic.volume = settings.backgroundVolume;
            }
        }
        if (settings.sfxVolume !== undefined) {
            this.sfxVolume = settings.sfxVolume;
        }
        // Update UI sliders
        $('#bgVolumeSlider').val(Math.round(this.backgroundVolume * 100));
        $('#bgVolumeValue').text(Math.round(this.backgroundVolume * 100));
        $('#sfxVolumeSlider').val(Math.round(this.sfxVolume * 100));
        $('#sfxVolumeValue').text(Math.round(this.sfxVolume * 100));
    },
    
    savePreferences: function() {
        try {
            localStorage.setItem('familyFeudAudio', JSON.stringify({
                isMuted: this.isMuted,
                backgroundVolume: this.backgroundVolume,
                sfxVolume: this.sfxVolume
            }));
        } catch (e) {
            console.error('Failed to save audio preferences:', e);
        }
    },
    
    loadPreferences: function() {
        try {
            const saved = localStorage.getItem('familyFeudAudio');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.isMuted = prefs.isMuted || false;
                this.backgroundVolume = prefs.backgroundVolume || 0.3;
                this.sfxVolume = prefs.sfxVolume || 0.7;
            }
        } catch (e) {
            console.error('Failed to load audio preferences:', e);
        }
    },
    
    updateMuteButton: function() {
        var btn = $('#audioMuteBtn');
        if (btn.length) {
            btn.text(this.isMuted ? '🔇 Unmute' : '🔊 Mute');
        }
    },
    
    createAudioControls: function() {
        return $(`
            <div class='audioControls'>
                <button id='audioMuteBtn' class='audioBtn'>🔊 Mute</button>
                <div class='volumeControl'>
                    <label>Music: <span id='bgVolumeValue'>${Math.round(this.backgroundVolume * 100)}</span>%</label>
                    <input type='range' id='bgVolumeSlider' min='0' max='100' value='${Math.round(this.backgroundVolume * 100)}'/>
                </div>
                <div class='volumeControl'>
                    <label>SFX: <span id='sfxVolumeValue'>${Math.round(this.sfxVolume * 100)}</span>%</label>
                    <input type='range' id='sfxVolumeSlider' min='0' max='100' value='${Math.round(this.sfxVolume * 100)}'/>
                </div>
            </div>
        `);
    }
};

var app = {
    version: 1,
    role: "player",
    socket: io.connect(),
    jsonFile: "../public/data/FamilyFeud_Questions.json",
    currentQ: 0,
    wrong:0,
    gameCode: null,
    isHost: false,
    lobby: $(`<div class='lobby'>
                <div class='lobbyContent'>
                    <h1>Family Feud</h1>
                    <div class='lobbyOptions'>
                        <div class='lobbySection'>
                            <h2>Host a Game</h2>
                            <div id='uploadSection'>
                                <label for='questionsFile' class='fileUploadLabel'>
                                    <input type='file' id='questionsFile' accept='.json' style='display: none;'/>
                                    <span class='fileUploadBtn'>Upload Questions (JSON)</span>
                                </label>
                                <a href='/public/data/FamilyFeud_Questions.json' download='FamilyFeud_Questions_Sample.json' class='downloadSampleBtn'>Download Sample Questions</a>
                                <div id='uploadStatus' class='uploadStatus hide'></div>
                                <div id='questionsInfo' class='questionsInfo hide'>
                                    <p>Questions loaded: <span id='questionsCount'>0</span></p>
                                </div>
                            </div>
                            <button id='createGameBtn' class='lobbyBtn' disabled>Create New Game</button>
                            <div id='gameCodeDisplay' class='gameCodeDisplay hide'>
                                <p>Game Code:</p>
                                <div class='codeBox'></div>
                                <p class='instruction'>Share this code with players</p>
                                <button id='startGameBtn' class='lobbyBtn'>Start Game</button>
                            </div>
                        </div>
                        <div class='lobbySeparator'>OR</div>
                        <div class='lobbySection'>
                            <h2>Join a Game</h2>
                            <input type='text' id='gameCodeInput' placeholder='Enter Game Code' maxlength='6'/>
                            <button id='joinGameBtn' class='lobbyBtn'>Join Game</button>
                            <div id='joinError' class='error hide'></div>
                        </div>
                    </div>
                </div>
            </div>`),
    board: $(`<div class='gameBoard hide'>

                <!--- Audio Controls --->
                <div class='audioControlsContainer'></div>

                <!--- Scores --->
                <div class='score' id='boardScore'>0</div>
                <div class='score' id='team1' >0</div>
                <div class='score' id='team2' >0</div>

                <!--- Main Board --->
                <div id='middleBoard'>

                    <!--- Question --->
                    <div class='questionHolder'>
                        <span class='question'></span>
                    </div>

                    <!--- Answers --->
                    <div class='colHolder'>
                    </div>

                </div>
                <!--- Wrong --->
                <div class='wrongX wrongBoard'>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                    <img alt="not on board" src="/public/img/Wrong.svg"/>
                </div>

                <!--- Buttons --->
                <div class='btnHolder hide' id="host">
                    <div id='hostBTN'     class='button'>Be the host</div>
                    <div id='awardTeam1'  class='button' data-team='1'>Award Team 1</div>
                    <div id='newQuestion' class='button'>New Question</div>
                    <div id="wrong"       class='button wrongX'>
                        <img alt="not on board" src="/public/img/Wrong.svg"/>
                    </div>
                    <div id='awardTeam2'  class='button' data-team='2' >Award Team 2</div>
                </div>

                </div>`),
    
    // Utility functions
    shuffle: (array) => {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    },
    jsonLoaded: (data) => {
        app.allData = data;
        app.questions = Object.keys(data);
        
        // Store in localStorage
        try {
            localStorage.setItem('familyFeudQuestions', JSON.stringify(data));
            console.log('Questions stored in localStorage');
            
            // If we're the host and in a game, sync localStorage to all players
            if (app.isHost && app.gameCode && app.socket) {
                app.syncLocalStorageToPlayers();
            }
        } catch (e) {
            console.error('Failed to store questions in localStorage:', e);
        }
        
        // Update UI to show questions are loaded
        $('#questionsCount').text(app.questions.length);
        $('#questionsInfo').removeClass('hide');
        $('#createGameBtn').prop('disabled', false);
        
        // If there's pending game state, sync it now
        if (app.pendingGameState) {
            app.syncGameState(app.pendingGameState);
            app.pendingGameState = null;
        } else {
            app.makeQuestion(app.currentQ);
        }
        app.board.find('.host').hide();
    },
    
    loadQuestionsFromStorage: () => {
        try {
            const stored = localStorage.getItem('familyFeudQuestions');
            if (stored) {
                const data = JSON.parse(stored);
                app.jsonLoaded(data);
                return true;
            }
        } catch (e) {
            console.error('Failed to load questions from localStorage:', e);
        }
        return false;
    },
    
    // Sync localStorage to all players via WebSocket
    syncLocalStorageToPlayers: () => {
        if (!app.isHost || !app.gameCode || !app.socket) return;
        
        // Get all localStorage items that start with 'familyFeud'
        const localStorageData = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('familyFeud')) {
                    localStorageData[key] = localStorage.getItem(key);
                }
            }
            
            // Send to server to broadcast to all players
            app.socket.emit('localStorageSync', {
                gameCode: app.gameCode,
                data: localStorageData
            });
            console.log('Synced localStorage to players');
        } catch (e) {
            console.error('Failed to sync localStorage:', e);
        }
    },
    
    // Update localStorage from received data
    updateLocalStorageFromSync: (data) => {
        try {
            for (const key in data) {
                localStorage.setItem(key, data[key]);
                console.log('Updated localStorage:', key);
            }
            
            // If questions were synced, reload them
            if (data.familyFeudQuestions) {
                const wasLoaded = app.loadQuestionsFromStorage();
                if (wasLoaded && app.pendingGameState) {
                    app.syncGameState(app.pendingGameState);
                    app.pendingGameState = null;
                }
            }
        } catch (e) {
            console.error('Failed to update localStorage from sync:', e);
        }
    },
    
    // Request localStorage sync from host
    requestLocalStorageSync: () => {
        if (app.gameCode && app.socket && !app.isHost) {
            app.socket.emit('requestLocalStorageSync', {
                gameCode: app.gameCode
            });
            console.log('Requested localStorage sync from host');
        }
    },
    
    handleFileUpload: (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            $('#uploadStatus').html('Error: Please upload a JSON file').removeClass('hide').addClass('error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate the data structure
                if (typeof data !== 'object' || Array.isArray(data)) {
                    throw new Error('Invalid format: Expected an object with questions as keys');
                }
                
                // Check if it has at least one question
                const keys = Object.keys(data);
                if (keys.length === 0) {
                    throw new Error('No questions found in file');
                }
                
                // Validate answer format (should be array of arrays)
                for (let key of keys) {
                    if (!Array.isArray(data[key])) {
                        throw new Error(`Invalid answer format for question: ${key}`);
                    }
                }
                
                // Load the data
                app.jsonLoaded(data);
                $('#uploadStatus').html('Questions loaded successfully!').removeClass('hide error info').addClass('success');
                
                // Clear the file input
                $('#questionsFile').val('');
            } catch (error) {
                console.error('Error parsing JSON:', error);
                $('#uploadStatus').html('Error: ' + error.message).removeClass('hide').addClass('error');
            }
        };
        
        reader.onerror = () => {
            $('#uploadStatus').html('Error reading file').removeClass('hide').addClass('error');
        };
        
        reader.readAsText(file);
    },

    // Action functions
    makeQuestion: (eNum, flippedCards) => {
        if (eNum >= app.questions.length) {
            console.log('No more questions');
            return;
        }
        
        var qText = app.questions[eNum];
        var qAnswr = app.allData[qText];

        var qNum = qAnswr.length;
        qNum = (qNum < 8) ? 8 : qNum;
        qNum = (qNum % 2 != 0) ? qNum + 1 : qNum;

        var boardScore = app.board.find("#boardScore");
        var question = app.board.find(".question");
        var holderMain = app.board.find(".colHolder");

        boardScore.html(0);
        question.html(qText.replace(/&x22;/gi, '"'));
        holderMain.empty();

        app.wrong = 0;
        var wrong = app.board.find(".wrongBoard")
        $(wrong).find("img").hide()
        $(wrong).hide()

        qNum = 10

        for (var i = 0; i < qNum; i++) {
            var aLI;
            if (qAnswr[i]) {
                aLI = $(`<div class='cardHolder'>
                            <div class='card' data-id='${i}'>
                                <div class='front'>
                                    <span class='DBG'>${(i + 1)}</span>
                                    <span class='answer'>${qAnswr[i][0]}</span>
                                </div>
                                <div class='back DBG'>
                                    <span>${qAnswr[i][0]}</span>
                                    <b class='LBG'>${qAnswr[i][1]}</b>
                                </div>
                            </div>
                        </div>`)
            } else {
                aLI = $(`<div class='cardHolder empty'><div></div></div>`)
            }

            var parentDiv = holderMain//(i < (qNum / 2)) ? col1 : col2;
            aLI.on('click', {
                trigger: 'flipCard',
                num: i
            }, app.talkSocket);
            $(aLI).appendTo(parentDiv)
        }

        var cardHolders = app.board.find('.cardHolder');
        var cards = app.board.find('.card');
        var backs = app.board.find('.back');
        var cardSides = app.board.find('.card>div');

        TweenLite.set(cardHolders, {
            perspective: 800
        });
        TweenLite.set(cards, {
            transformStyle: "preserve-3d"
        });
        TweenLite.set(backs, {
            rotationX: 180
        });
        TweenLite.set(cardSides, {
            backfaceVisibility: "hidden"
        });
        cards.data("flipped", false);
        
        // If there are flipped cards to sync, flip them now
        if (flippedCards && flippedCards.length > 0) {
            setTimeout(() => {
                flippedCards.forEach(cardNum => {
                    var card = $('[data-id="' + cardNum + '"]');
                    if (card.length && !card.data("flipped")) {
                        TweenLite.set(card, { rotationX: -180 });
                        card.data("flipped", true);
                        app.getBoardScore();
                    }
                });
            }, 100);
        }
    },
    getBoardScore: () => {
        var cards = app.board.find('.card');
        var boardScore = app.board.find('#boardScore');
        var currentScore = {
            var: boardScore.html()
        };
        var score = 0;

        function tallyScore() {
            if ($(this).data("flipped")) {
                var value = $(this).find("b").html();
                score += parseInt(value)
            }
        }
        $.each(cards, tallyScore);
        TweenMax.to(currentScore, 1, {
            var: score,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
                // Send board score update to server
                if (app.gameCode && app.role === "host") {
                    app.socket.emit("talking", {
                        trigger: 'boardScoreUpdate',
                        boardScore: Math.round(currentScore.var)
                    });
                }
            },
            ease: Power3.easeOut
        });
    },
    awardPoints: (num, targetScore) => {
        var boardScore = app.board.find('#boardScore');
        var currentScore = {
            var: parseInt(boardScore.html())
        };
        var team = app.board.find("#team" + num);
        var teamScore = {
            var: parseInt(team.html())
        };
        var teamScoreUpdated = targetScore !== undefined ? targetScore : (teamScore.var + currentScore.var);
        // Play points awarded sound
        audioManager.playSound('pointsAwarded');
        TweenMax.to(teamScore, 1, {
            var: teamScoreUpdated,
            onUpdate: function () {
                team.html(Math.round(teamScore.var));
            },
            ease: Power3.easeOut
        });

        TweenMax.to(currentScore, 1, {
            var: 0,
            onUpdate: function () {
                boardScore.html(Math.round(currentScore.var));
            },
            ease: Power3.easeOut
        });
    },
    syncGameState: (gameState) => {
        if (!gameState) return;
        
        // Sync question
        if (gameState.currentQuestion !== undefined) {
            app.currentQ = gameState.currentQuestion;
            app.makeQuestion(app.currentQ, gameState.flippedCards || []);
        }
        
        // Sync scores
        if (gameState.team1Score !== undefined) {
            app.board.find("#team1").html(gameState.team1Score);
        }
        if (gameState.team2Score !== undefined) {
            app.board.find("#team2").html(gameState.team2Score);
        }
        if (gameState.boardScore !== undefined) {
            app.board.find("#boardScore").html(gameState.boardScore);
        }
        
        // Sync audio settings
        if (gameState.audioSettings) {
            audioManager.applyAudioSettings(gameState.audioSettings);
        }
        
        // Recalculate board score after syncing flipped cards
        if (gameState.flippedCards && gameState.flippedCards.length > 0) {
            setTimeout(() => {
                app.getBoardScore();
            }, 200);
        }
    },
    changeQuestion: (questionIndex) => {
        if (questionIndex !== undefined) {
            app.currentQ = questionIndex;
        } else {
            app.currentQ++;
        }
        // Play new question sound
        audioManager.playSound('newQuestion');
        app.makeQuestion(app.currentQ);
    },
    makeHost: () => {
        app.role = "host";
        app.isHost = true;
        app.board.find(".hide").removeClass('hide');
        app.board.addClass('showHost');
        // Show audio controls for host
        app.board.find('.audioControlsContainer').removeClass('hide');
        // Sync current audio settings to server when becoming host
        if (app.socket && app.gameCode) {
            app.socket.emit('audioControl', {
                type: 'backgroundVolume',
                volume: audioManager.backgroundVolume
            });
            app.socket.emit('audioControl', {
                type: 'sfxVolume',
                volume: audioManager.sfxVolume
            });
            app.socket.emit('audioControl', {
                type: 'mute',
                isMuted: audioManager.isMuted
            });
        }
        app.socket.emit("talking", {
            trigger: 'hostAssigned'
        });
    },
    createGame: () => {
        app.socket.emit('createGame', {});
    },
    joinGame: () => {
        const code = $('#gameCodeInput').val().trim().toUpperCase();
        if (code.length === 6) {
            app.socket.emit('joinGame', { gameCode: code });
        } else {
            $('#joinError').html('Please enter a 6-character game code').removeClass('hide');
        }
    },
    startGame: () => {
        app.lobby.addClass('hide');
        app.board.removeClass('hide');
        // Play game start sound and start background music
        audioManager.playSound('gameStart');
        setTimeout(() => {
            audioManager.playBackgroundMusic();
        }, 500);
        if (app.isHost) {
            // Host starts at question 0
            app.currentQ = 0;
            if (app.questions && app.questions.length > 0) {
                app.makeQuestion(0);
            }
            app.makeHost();
            // Show audio controls for host (makeHost also does this, but ensure it's shown)
            app.board.find('.audioControlsContainer').removeClass('hide');
            // Sync initial state to server
            app.socket.emit("talking", {
                trigger: 'newQuestion',
                questionIndex: 0
            });
        } else {
            // Hide audio controls for non-host players
            app.board.find('.audioControlsContainer').addClass('hide');
            // Request current game state when joining as audience
            app.socket.emit('requestGameState');
        }
    },
    flipCard: (n) => {
        console.log("card");
        console.log(n);
        var card = $('[data-id="' + n + '"]');
        var flipped = $(card).data("flipped");
        var cardRotate = (flipped) ? 0 : -180;
        TweenLite.to(card, 1, {
            rotationX: cardRotate,
            ease: Back.easeOut
        });
        flipped = !flipped;
        $(card).data("flipped", flipped);
        // Play card flip sound
        if (flipped) {
            audioManager.playSound('cardFlip');
        }
        app.getBoardScore()
    },
    wrongAnswer:()=>{
        app.wrong++
        console.log("wrong: "+ app.wrong )
        var wrong = app.board.find(".wrongBoard")
        $(wrong).find("img:nth-child("+app.wrong+")").show()
        $(wrong).show()
        // Play wrong answer sound
        audioManager.playSound('wrongAnswer');
        setTimeout(() => { 
            $(wrong).hide(); 
        }, 1000); 

    },

    // Socket Test
    talkSocket: (e) => {
        if (app.role == "host") app.socket.emit("talking", e.data);
    },
    listenSocket: (data) => {
        console.log(data);
        switch (data.trigger) {
            case "newQuestion":
                app.changeQuestion(data.questionIndex);
                break;
            case "awardTeam1":
                app.awardPoints(1);
                break;
            case "awardTeam2":
                app.awardPoints(2);
                break;
            case "flipCard":
                app.flipCard(data.num);
                break;
            case "hostAssigned":
                app.board.find('#hostBTN').remove();
                break;
            case "wrong":
                app.wrongAnswer()
                break;
        }
    },
    
    // Inital function
    init: () => {
        // Initialize audio manager
        audioManager.init();
        
        // Append lobby and board to body first
        $('body').append(app.lobby);
        $('body').append(app.board);
        
        // Add audio controls to board (hidden by default, shown only for host)
        var audioControls = audioManager.createAudioControls();
        app.board.find('.audioControlsContainer').append(audioControls).addClass('hide');
        
        // Audio control event listeners (use event delegation since controls may be hidden)
        $(document).on('click', '#audioMuteBtn', () => {
            audioManager.toggleMute();
        });
        
        $(document).on('input', '#bgVolumeSlider', function() {
            var volume = $(this).val() / 100;
            audioManager.setBackgroundVolume(volume);
            $('#bgVolumeValue').text(Math.round(volume * 100));
        });
        
        $(document).on('input', '#sfxVolumeSlider', function() {
            var volume = $(this).val() / 100;
            audioManager.setSFXVolume(volume);
            $('#sfxVolumeValue').text(Math.round(volume * 100));
        });
        
        // Update mute button display
        audioManager.updateMuteButton();
        
        // File upload event listener
        $('#questionsFile').on('change', app.handleFileUpload);
        
        // Try to load questions from localStorage first
        const loadedFromStorage = app.loadQuestionsFromStorage();
        
        // If not in localStorage, show message to upload questions
        if (!loadedFromStorage) {
            $('#uploadStatus').html('Please upload a questions file to start. Download the sample file to see the format.').removeClass('hide').addClass('info');
        }
        
        // Lobby event listeners
        $('#createGameBtn').on('click', app.createGame);
        $('#joinGameBtn').on('click', app.joinGame);
        $('#startGameBtn').on('click', app.startGame);
        $('#gameCodeInput').on('input', () => {
            $('#joinError').addClass('hide');
            $('#gameCodeInput').val($('#gameCodeInput').val().toUpperCase());
        });

        // Board event listeners
        app.board.find('#hostBTN'    ).on('click', app.makeHost);
        app.board.find('#awardTeam1' ).on('click', { trigger: 'awardTeam1' }, app.talkSocket);
        app.board.find('#awardTeam2' ).on('click', { trigger: 'awardTeam2' }, app.talkSocket);
        app.board.find('#newQuestion').on('click', { trigger: 'newQuestion'}, app.talkSocket);
        app.board.find('#wrong'      ).on('click', { trigger: 'wrong'      }, app.talkSocket);

        // Socket event listeners
        app.socket.on('listening', app.listenSocket);
        
        app.socket.on('gameCreated', (data) => {
            app.gameCode = data.gameCode;
            app.isHost = true;
            $('#gameCodeDisplay .codeBox').html(data.gameCode);
            $('#gameCodeDisplay').removeClass('hide');
            $('#createGameBtn').prop('disabled', true);
            // Initialize audio settings on server when game is created
            app.socket.emit('audioControl', {
                type: 'backgroundVolume',
                volume: audioManager.backgroundVolume
            });
            app.socket.emit('audioControl', {
                type: 'sfxVolume',
                volume: audioManager.sfxVolume
            });
            app.socket.emit('audioControl', {
                type: 'mute',
                isMuted: audioManager.isMuted
            });
        });

        app.socket.on('gameJoined', (data) => {
            app.gameCode = data.gameCode;
            app.isHost = data.isHost;
            // Show audio controls if joining as host
            if (app.isHost) {
                app.board.find('.audioControlsContainer').removeClass('hide');
            } else {
                // Request localStorage sync from host when joining as player
                app.requestLocalStorageSync();
            }
            // Sync game state if provided
            if (data.gameState) {
                // Wait for questions to load first
                if (app.questions) {
                    app.syncGameState(data.gameState);
                } else {
                    // Store state to sync after questions load
                    app.pendingGameState = data.gameState;
                }
            }
            // Automatically start for audience members
            setTimeout(() => {
                app.startGame();
            }, 500);
        });
        
        app.socket.on('gameStateUpdate', (gameState) => {
            app.syncGameState(gameState);
        });
        
        // Listen for audio updates from host
        app.socket.on('audioUpdate', (audioData) => {
            // Apply audio settings to all players (host and audience)
            audioManager.applyAudioSettings({
                isMuted: audioData.isMuted,
                backgroundVolume: audioData.backgroundVolume,
                sfxVolume: audioData.sfxVolume
            });
        });

        app.socket.on('joinError', (data) => {
            $('#joinError').html(data.message).removeClass('hide');
        });

        app.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data.playerId);
            // If we're the host, sync localStorage to the new player
            if (app.isHost && app.gameCode) {
                setTimeout(() => {
                    app.syncLocalStorageToPlayers();
                }, 500);
            }
        });
        
        // Listen for localStorage sync from host
        app.socket.on('localStorageSync', (data) => {
            console.log('Received localStorage sync from host');
            app.updateLocalStorageFromSync(data.data);
        });
        
        // Host receives request for localStorage sync
        app.socket.on('requestLocalStorageSync', (data) => {
            if (app.isHost && app.gameCode) {
                console.log('Received localStorage sync request from player');
                app.syncLocalStorageToPlayers();
            }
        });
    }
};
app.init();