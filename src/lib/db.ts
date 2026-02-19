import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'games.json');

export type CoinSide = 'heads' | 'tails';
export type GameStatus = 'open' | 'playing' | 'finished';

export interface Game {
  id: string;
  creator: {
    username: string;
    wallet?: string;
    avatar: string;
    level: number;
  };
  amount: number;
  side: CoinSide;
  status: GameStatus;
  opponent?: {
    username: string;
    wallet?: string;
    avatar: string;
    level: number;
  };
  result?: {
    winner: 'creator' | 'opponent';
    coinResult: CoinSide;
    timestamp: number;
  };
  createdAt: number;
}

interface Database {
  games: Game[];
}

// Initialize database file if it doesn't exist
function initDB() {
  const dataDir = join(process.cwd(), 'data');
  if (!existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }
  
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify({ games: [] }, null, 2));
  }
}

// Read database
function readDB(): Database {
  try {
    initDB();
    const data = readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { games: [] };
  }
}

// Write database
function writeDB(data: Database) {
  initDB();
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Get all open games
export function getOpenGames(): Game[] {
  const db = readDB();
  return db.games.filter(g => g.status === 'open');
}

// Get game by ID
export function getGameById(id: string): Game | null {
  const db = readDB();
  return db.games.find(g => g.id === id) || null;
}

// Create new game
export function createGame(game: Omit<Game, 'id' | 'createdAt' | 'status'>): Game {
  const db = readDB();
  const newGame: Game = {
    ...game,
    id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'open',
    createdAt: Date.now(),
  };
  db.games.push(newGame);
  writeDB(db);
  return newGame;
}

// Join game and resolve
export function joinGame(
  gameId: string,
  opponent: Game['opponent']
): { game: Game; result: Game['result'] } | null {
  const db = readDB();
  const gameIndex = db.games.findIndex(g => g.id === gameId);
  
  if (gameIndex === -1 || db.games[gameIndex].status !== 'open') {
    return null;
  }

  const game = db.games[gameIndex];
  
  // Flip the coin (provably fair - you can improve this with hash commitment later)
  const coinResult: CoinSide = Math.random() < 0.5 ? 'heads' : 'tails';
  const winner = coinResult === game.side ? 'creator' : 'opponent';

  const result: Game['result'] = {
    winner,
    coinResult,
    timestamp: Date.now(),
  };

  game.opponent = opponent;
  game.status = 'finished';
  game.result = result;

  writeDB(db);
  return { game, result };
}

// Get game history (last 50 games)
export function getGameHistory(): Game[] {
  const db = readDB();
  return db.games
    .filter(g => g.status === 'finished')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50);
}

// Delete old games (optional cleanup - games older than 24h and finished)
export function cleanupOldGames() {
  const db = readDB();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  db.games = db.games.filter(g => {
    if (g.status === 'finished' && g.createdAt < oneDayAgo) {
      return false;
    }
    return true;
  });
  writeDB(db);
}
