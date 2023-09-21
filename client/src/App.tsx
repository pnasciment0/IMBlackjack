import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { join } from 'path';

const BACK_CARD_URL = 'https://deckofcardsapi.com/static/img/back.png';
const BASE_API_URL = "http://localhost:3001";
const WS_URL = "ws://localhost:3001";

const generatePlayerID = () => {
  // Implement your ID generation logic here.
  // For example, generating a random 6-digit ID.
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const App: React.FC = () => {
  const [playerID, setPlayerID] = useState(generatePlayerID());
  const [players, setPlayers] = useState<string[]>([]);
  const [gameID, setGameID] = useState('');
  const [inGame, setInGame] = useState(false);
  const [showJoinGameInput, setShowJoinGameInput] = useState(false);
  const [inputGameID, setInputGameID] = useState('');
  const [playerCards, setPlayerCards] = useState<string[]>([]);
  const [hostPlayer, setHostPlayer] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [hasGameBegun, setHasGameBegun] = useState(false);


  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ type: 'register', playerID }));
    });

    ws.addEventListener('message', (message) => {
      try {
        console.log('Received message:', message.data);  // Debugging line
        const data = JSON.parse(message.data);
        
        if (data.type === 'playerJoined') {
          setPlayers(prevPlayers => [...prevPlayers, data.joinedPlayer]);
        } else if (data.type === 'gameStarted') {
          setPlayerCards(data.cards.map((card: any) => card.image));
          setHasGameBegun(true);
        } else if (data.type === 'playerTurn') {
          if (data.playerID === playerID) {
            setIsMyTurn(true);
          } else {
            setIsMyTurn(false);
          }
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });
    

    return () => {
      ws.close();
    };
  }, [playerID]);


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
      setHostPlayer(playerID);
    } catch (error) {
      console.error('Failed to create a new game:', error);
    }
  }

  const joinExistingGame = async (gameIdToJoin: string) => {
    try {
      await createOrEnsurePlayer();

      const response = await axios.post(`${BASE_API_URL}/api/games/${gameIdToJoin}/join`, {
        playerID, 
      });

      const joinedGameID = response.data.gameId;  
      const hostPlayer = response.data.hostPlayer;

      if (joinedGameID) {
        setGameID(joinedGameID);
        setShowJoinGameInput(false);
        setInGame(true);
      }

      if (hostPlayer) {
        setHostPlayer(hostPlayer);
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

  const beginGame = async () => {
    try {
      const response = await axios.get(`${BASE_API_URL}/api/games/${gameID}/start`);
      console.log('Game begun:', response.data);

      if (hostPlayer === playerID) {
        setIsMyTurn(true);
      }

      setHasGameBegun(true);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }

  const handleJoinGameClick = () => {
    setShowJoinGameInput(true);
  };

  const goBack = () => {
    setShowJoinGameInput(false);
  };

  const handleJoinGameSubmit = () => {
    joinExistingGame(inputGameID);
  };

  return (
    <div className="App" style={{backgroundColor: 'green'}}>
      <header className="App-header">
        <h1>Welcome to Blackjack!</h1>
        <p>Your Player ID: {playerID}</p>
        {inGame ? (
          <>
            <p>Game ID: {gameID}</p>
            {hostPlayer !== '' && hostPlayer !== playerID ? (
              <>
                <p> You have joined Player {hostPlayer}'s game!</p>
              </>
            ) : (
              <>
                <p>Total Players: {players.length}</p>
                <ul>
                  {players.map((p, index) => (
                    <li key={index}>{p}</li>
                  ))}
                </ul>
              </>
            )}
            <div>
              {playerCards.length === 0 ? (
                <>
                  <img src={BACK_CARD_URL} alt="Card back" />
                  <img src={BACK_CARD_URL} alt="Card back" />
                </>
              ) : (
                playerCards.map((cardUrl, index) => (
                  <img key={index} src={cardUrl} alt="Card" />
                ))
              )}
            </div>
            {hostPlayer === playerID && (
              <button disabled={players.length < 2 || hasGameBegun} onClick={beginGame}>Begin Game</button>
            )}
          </>
        ) : showJoinGameInput ? (
          <div>
            <label>
              Enter Game ID to join:
              <input
                type="text"
                value={inputGameID}
                onChange={(e) => setInputGameID(e.target.value)}
                placeholder="Game ID"
              />
            </label>
            <button onClick={handleJoinGameSubmit}>Join Game</button>
            <button onClick={goBack}>Back</button>
          </div>
        ) : (
          <div className="buttons">
            <button onClick={startNewGame}>Start a New Game</button>
            <button onClick={handleJoinGameClick}>Join an Existing Game</button>
          </div>
        )}
        {hasGameBegun && isMyTurn && (
          <div>
            It's your turn!
          </div>
        )}
        {hasGameBegun && !isMyTurn && (
          <>
            It isn't your turn yet.
          </>
        )}
        {hasGameBegun && (
          <div>
            <button disabled={!isMyTurn} onClick={() => {/* Handle Hit logic */}}>Hit</button>
            <button disabled={!isMyTurn} onClick={() => {/* Handle Stand logic */}}>Stand</button>
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
