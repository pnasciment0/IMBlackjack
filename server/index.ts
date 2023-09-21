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
  addPlayerToGame
} from './apiController';
import http from 'http';
import WebSocket from 'ws';

initializeDb()
  .then((db) => {
    const app = express();
    const PORT = process.env.PORT || 3001;

    const activeConnections: { [playerID: string]: WebSocket } = {};

    const server = http.createServer(app);

    app.use(cors());
    app.use(bodyParser.json());

    app.get('/api/players', (req, res) => listPlayers(db, req, res));
    app.post('/api/players/create', (req, res) => createPlayer(db, req, res));
    app.get('/api/players/:id', (req, res) => getPlayer(db, req, res));

    app.get('/api/games', (req, res) => listAllGames(db, req, res));
    app.post('/api/games/create', (req, res) => createGame(db, req, res));

    app.post('/api/game/:gameId/join', async (req, res) => {
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
