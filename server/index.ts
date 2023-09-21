import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { initializeDb } from './db';
import { 
  createPlayer,
  getPlayer,
  createGame,
  listPlayers,
  listAllGames,
  addPlayerToGame,
  startGame,
  hitAction
} from './apiController';
import http from 'http';
import WebSocket from 'ws';
import axios from 'axios';

initializeDb()
  .then((db) => {
    const app = express();
    const PORT = process.env.PORT || 3001;

    const activeConnections: { [playerID: string]: WebSocket } = {};

    const server = http.createServer(app);

    app.use(cors());
    app.use(bodyParser.json());

    // list all players
    app.get('/api/players', (req, res) => listPlayers(db, req, res));

    // create a new player
    app.post('/api/players/create', (req, res) => createPlayer(db, req, res));

    // get player by ID
    app.get('/api/players/:id', (req, res) => getPlayer(db, req, res));

    // list all games
    app.get('/api/games', (req, res) => listAllGames(db, req, res));

    // create a game
    app.post('/api/games/create', (req, res) => createGame(db, req, res));

    // join a game
    app.post('/api/games/:gameId/join', async (req, res) => {
      addPlayerToGame(db, req, res).then((response) => {
        const hostPlayer = response;
        const joinedPlayer = req.body.playerID;
        // Notify hostPlayer that the game can start
        if (activeConnections[hostPlayer]) {
          const ws = activeConnections[hostPlayer];
          ws.send(JSON.stringify({ type: 'playerJoined', joinedPlayer }));
        }
      }).catch((err) => {
        console.error('Error in addPlayerToGame:', err);
      });
    });

    // start a game
    app.get('/api/games/:gameId/start', (req, res) => {
      startGame(db, req, res).then(async (response) => {
        const playerIds = response.userIds;
        console.log("game start");
        console.log(response);
        for (const playerId of playerIds) {
          if (activeConnections[playerId]) {
            const ws = activeConnections[playerId];
            const deckId = response.deckId;

            const cardsRequest = await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=2`);
            const cards = cardsRequest.data.cards;

            ws.send(JSON.stringify({type: 'gameStarted', playerId, cards, deckId}))
          }
        }
      })
    });

    // player chooses 'hit'
    app.post('/api/games/:gameId/hit', (req, res) => {
      hitAction(db, req, res).then(async (response) => {
        console.log("Hit action response is: ");
        console.log(response);
        if (response.message == "Loser") {
          for (const playerId in activeConnections) {
            const ws = activeConnections[playerId];
            ws.send(JSON.stringify({type: 'playerTurn', playerId: response.nextTurn}))
          }
        }
        if (response.message == "Winner") {

        }
        if (response.message == "Continue") {

        }
        // if the player loses, choose another player and notify them its their turn
        // if the player wins, end the game, notifying all players, and notifying the winner that they have won
        // if neither, the game continues 
      })
    })

    // player chooses 'hit'
    app.post('/api/games/:gameId/stand', (req, res) => {

    })

    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type === 'register' && parsedMessage.playerID) {
          activeConnections[parsedMessage.playerID] = ws;
        }
        console.log('Received:', parsedMessage);
      });

      // ws.send('Hello from server');
    });

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
