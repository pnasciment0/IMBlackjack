import { Request, Response } from 'express';
import sqlite3 from 'sqlite3';

interface ExistenceCheckRow {
  gameExists: number;
  playerExists: number;
}

interface PlayerGameRow {
  game_id: number | null; //game_id and not gameId bc schema.sql defines it as game_id
  hostPlayer: number | null; // the ID of the player who's turn it is (defaults to the player ID that created the game)
}

// =========== Player CRUD =============

export const createPlayer = (db: sqlite3.Database, req: Request, res: Response) => {
  const { playerID } = req.body;

  // First, check if the player already exists
  const checkExistenceQuery = 'SELECT EXISTS(SELECT 1 FROM players WHERE id = ?) AS playerExists';
  
  db.get(checkExistenceQuery, [playerID], (err, row: ExistenceCheckRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // If the player exists, do nothing and return
    if (row && row.playerExists) {
      return res.status(200).json({ message: 'Player ID already exists' });
    }

    // Otherwise, insert the new player
    const query = 'INSERT INTO players (id, score) VALUES (?, ?)';
    db.run(query, [playerID, 0], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const newPlayer = {
        playerID,
        score: 0
      };
      res.status(201).json(newPlayer);
    });
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

export const createGame = (db: sqlite3.Database, req: Request, res: Response): Promise<any> => {
  return new Promise((resolve, reject) => {
    const initialState = req.body.state || '';
    const hostPlayer = req.body.hostPlayerID || null; 
  
    console.log(hostPlayer);

    const sql = 'INSERT INTO games (state, hostPlayer) VALUES (?, ?)';
    
    db.serialize(() => {
      db.run(sql, [initialState, hostPlayer], function(err) {
        if (err) {
          reject(err);
          return res.status(400).json({ error: err.message });
        }

        const newGameId = this.lastID;

        const updatePlayerWithGameIDQuery = 'UPDATE players SET game_id = ? WHERE id = ?';
      
        db.run(updatePlayerWithGameIDQuery, [newGameId, hostPlayer], function(err) {
          if (err) {
            reject(err);
            return res.status(400).json({ error: err.message });
          }

          // Send back the ID of the newly created game
          res.status(201).json({ gameId: newGameId });
          resolve({ gameId: newGameId });
        });
      })
    })
  });
};

export const addPlayerToGame = (db: sqlite3.Database, req: Request, res: Response): Promise<any> => {
  return new Promise((resolve, reject) => {

    const gameId = req.params.gameId;
    const playerId = req.body.playerID;

    const checkExistenceQuery = `
      SELECT EXISTS(SELECT 1 FROM games WHERE id = ?) AS gameExists,
             EXISTS(SELECT 1 FROM players WHERE id = ?) AS playerExists;
    `;

    db.get(checkExistenceQuery, [gameId, playerId], (err, row: ExistenceCheckRow) => {
      if (err) {
        reject(err);
        return res.status(500).json({ error: err.message });
      }

      if (row && !row.gameExists) {
        reject(new Error('Game not found'));
        return res.status(404).json({ message: 'Game not found' });
      }

      const checkPlayerGameQuery = 'SELECT game_id FROM players WHERE id = ?';

      db.get(checkPlayerGameQuery, [playerId], (err, row: PlayerGameRow) => {
        if (err) {
          reject(err);
          return res.status(500).json({ error: err.message });
        }

        if (row && row.game_id !== null) {
          reject(new Error('Player already in another game'));
          return res.status(409).json({ message: 'Player already in another game' });
        }

        const addPlayerQuery = 'UPDATE players SET game_id = ? WHERE id = ?';

        db.run(addPlayerQuery, [gameId, playerId], function(err) {
          if (err) {
            reject(err);
            return res.status(500).json({ error: err.message });
          }
          const fetchhostPlayerQuery = 'SELECT hostPlayer FROM games WHERE id = ?';

          db.get(fetchhostPlayerQuery, [gameId], (err, row: PlayerGameRow) => {
            if (err) {
              reject(err);
              return res.status(500).json({ error: err.message });
            }

            const hostPlayer = row ? row.hostPlayer : null;
            resolve(hostPlayer);  // Resolve with hostPlayer ID
            res.status(201).json({ message: 'Player added to game', hostPlayer });
          });
        });
      });
    });
  });
}

// =========== Actions CRUD =============
