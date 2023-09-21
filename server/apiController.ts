import { Request, Response } from 'express';
import sqlite3 from 'sqlite3';

// =========== Player CRUD =============

export const createPlayer = (db: sqlite3.Database, req: Request, res: Response) => {
  const { playerID } = req.body;
  const query = 'INSERT INTO players (id, score) VALUES (?, ?)';
  
  db.run(query, [playerID, 0], function(err) {
    if (err) {
      return res.status(500).json(err);
    }
    const newPlayer = {
    playerID,
      score: 0
    };
    res.json(newPlayer);
  });
};


export const listAllGames = (db: sqlite3.Database, req: Request, res: Response) => {
  const query = 'SELECT * FROM games';

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

export const listPlayers = (db: sqlite3.Database, req: Request, res: Response) => {
  const query = 'SELECT * FROM players';

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

export const getPlayer = (db: sqlite3.Database, req: Request, res: Response) => {
  const query = 'SELECT * FROM players WHERE id = ?';
  
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json(err);
    }
    if (!row) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(row);
  });
};

// =========== Games CRUD =============

export const createGame = (db: sqlite3.Database, req: Request, res: Response) => {
  // You might receive some initial state from the request body, for example.
  const initialState = req.body.state || '';
  const currentPlayer = req.body.hostPlayerID || null; // Maybe it's null initially

  const sql = 'INSERT INTO games (state, currentPlayer) VALUES (?, ?)';
  
  db.run(sql, [initialState, currentPlayer], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    // Send back the ID of the newly created game
    return res.status(201).json({ gameId: this.lastID });
  });
}

export const addPlayerToGame = (req: Request, res: Response) => {
  
}

// =========== Actions CRUD =============
