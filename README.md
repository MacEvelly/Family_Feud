# Family Feud using Node.js Express & Socket.io

This is an experiment to create a server with a live socket in order to set up a **game host instance** and an **audiance display instance** for a web app.  Once the host is selected, they will have control over the audiance board and points.  

## Install and start

```bash
git clone https://github.com/MacEvelly/Family-Feud.git
cd Family-Feud
npm install
npm start
```

Terminal should respond with:

```bash
Listening on 8080
```

## Play Family Feud

### Creating a New Game (Host)

1. Open a browser at http://localhost:8080/
2. Click **Create New Game** 
3. You'll receive a unique 6-character **Game Code** (e.g., ABC123)
4. Share this code with your audience/players
5. Click **Start Game** to begin hosting
6. As the **host** you can:
   * Click to reveal answers
   * Assign points to teams
   * Go to new questions
   * Mark wrong answers

### Joining a Game (Audience/Players)

1. Open a browser at http://localhost:8080/
2. Enter the **Game Code** provided by the host
3. Click **Join Game**
4. You'll automatically enter the game board
5. Watch the host control the game in real-time

**Note:** Multiple players can join the same game using the same code. All participants will see synchronized game updates.

### Default instance:
![Default instance](public/img/Default.jpg)

### Host instance:
![Host instance](public/img/Host.jpg)

### Audience instance:
![Host instance](public/img/Audience.jpg)

