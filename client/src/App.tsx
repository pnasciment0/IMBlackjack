import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { join } from 'path';

const BACK_CARD_URL = 'https://deckofcardsapi.com/static/img/back.png';
const BASE_API_URL = "http://localhost:3001";

const generatePlayerID = () => {
  // Implement your ID generation logic here.
  // For example, generating a random 6-digit ID.
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const App: React.FC = () => {
  const [playerID, setPlayerID] = useState(generatePlayerID());
  const [players, setPlayers] = useState<string[]>([]);
  // const [displayName, setDisplayName] = useState('');
  const [gameID, setGameID] = useState('');
  const [inGame, setInGame] = useState(false);

  const startNewGame = async () => {
    try {
      await createOrEnsurePlayer();

      const response = await axios.post(`${BASE_API_URL}/api/games/create`, {
        hostPlayerID: playerID
      });

      const newGameID = response.data.gameId; 
      console.log('Game created:', newGameID);
      
      setGameID(newGameID);
      setPlayers([playerID]);
      setInGame(true);
    } catch (error) {
      console.error('Failed to create a new game:', error);
    }
  }

  const joinExistingGame = async (gameIdToJoin: string) => {
    try {
      await createOrEnsurePlayer();

      const response = await axios.post(`${BASE_API_URL}/api/game/${gameIdToJoin}/join`, {
        playerID, 
      });

      const joinedGameID = response.data.gameID;  
      if (joinedGameID) {
        setGameID(joinedGameID);
      }
    } catch (error) {
      console.error('Failed to join the existing game:', error);
    }
  }

  const createOrEnsurePlayer = async () => {
    try {
      const response = await axios.post(`${BASE_API_URL}/api/players/create`, {
        playerID,
      });
      console.log('Player created or confirmed:', response.data);
    } catch (error) {
      console.error('Failed to create or confirm player:', error);
    }
  };

  return (
    <div className="App" style={{backgroundColor: 'green'}}>
      <header className="App-header">
        <h1>Welcome to Blackjack!</h1>
        <p>Your Player ID: {playerID}</p>
        <div>
          <label>
            Or log in as:
            <input 
              type="text" 
              value={playerID}
              onChange={(e) => setPlayerID(e.target.value)}
              placeholder="another user"
            />
          </label>
        </div>
        {/* <div>
          <label>
            Display Name: 
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional"
            />
          </label>
        </div> */}
        {inGame ? (
          <>
            <p>Game ID: {gameID}</p>
            <p>Total Players: {players.length}</p>
            <ul>
              {players.map((p, index) => (
                <li key={index}>{p}</li>
              ))}
            </ul>
            <div>
              <img src={BACK_CARD_URL} alt="Card back" />
              <img src={BACK_CARD_URL} alt="Card back" />
            </div>
            <button disabled={players.length < 2}>Start Game</button>
          </>
        ) : (
          <div className="buttons">
            <button onClick={startNewGame}>Start a New Game</button>
            <button onClick={() => joinExistingGame(gameID)}>Join an Existing Game</button>
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
