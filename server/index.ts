import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { initializeDb } from './database/db';
import { 
  createPlayer,
  getPlayer,
  createGame,
  listPlayers,
  listAllGames
} from './apiController';
import http from 'http';
import WebSocket from 'ws';

initializeDb()
  .then((db) => {
    const app = express();
    const PORT = process.env.PORT || 3001;

    // Initialize HTTP server using Express
    const server = http.createServer(app);

    app.use(cors());
    app.use(bodyParser.json());

    app.get('/api/players', (req, res) => listPlayers(db, req, res));
    app.post('/api/players/create', (req, res) => createPlayer(db, req, res));
    app.get('/api/players/:id', (req, res) => getPlayer(db, req, res));
    app.get('/api/games', (req, res) => listAllGames(db, req, res));
    app.post('/api/games/create', (req, res) => createGame(db, req, res));

    // Initialize WebSocket server
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        // Handle incoming WebSocket messages here
        console.log('Received:', message);
      });

      ws.send('Hello from server');
    });

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
