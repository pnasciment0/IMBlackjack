-- schema.sql
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    score INTEGER,
    game_id INTEGER,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state TEXT,
    currentPlayer INTEGER,
    hostPlayer INTEGER,
    FOREIGN KEY (currentPlayer) REFERENCES players(id)
    FOREIGN KEY (hostPlayer) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS player_games (
    player_id INTEGER,
    game_id INTEGER,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    PRIMARY KEY (player_id, game_id)
);

CREATE TABLE IF NOT EXISTS player_hands (
    game_id INTEGER,
    player_id INTEGER,
    card_code TEXT,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    PRIMARY KEY (game_id, player_id, card_code)
);

CREATE TABLE IF NOT EXISTS game_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    player_id INTEGER,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS game_scores (
    game_id INTEGER,
    player_id INTEGER,
    score INTEGER,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    PRIMARY KEY (game_id, player_id)
);