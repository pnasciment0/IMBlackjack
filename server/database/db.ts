import fs from 'fs';
import sqlite3 from 'sqlite3';

export const initializeDb = (): Promise<sqlite3.Database> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
        return;
      }
      console.log('Connected to the SQLite database.');
      
      // Check if 'players' table exists
      db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='players';`, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row) {
          console.log('Tables already exist, skipping schema setup.');
          resolve(db);
          return;
        }
        
        // If 'players' table doesn't exist, proceed to read schema
        fs.readFile('./database/schema.sql', 'utf8', (err, data) => {
          if (err) {
            console.error('Error reading schema file:', err);
            reject(err);
            return;
          }

          const queries = data.split(';').filter(Boolean);

          db.serialize(() => {
            for (const query of queries) {
              db.run(query.trim(), (err) => {
                if (err) {
                  console.error('Error executing query:', err);
                  reject(err);
                  return;
                }
              });
            }
            console.log('All tables created');
            resolve(db);
          });
        });
      });
    });
  });
}
