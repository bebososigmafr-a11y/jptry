# 🎰 Solpot - Coinflip Casino

A fully functional coinflip casino built with Next.js 15, featuring a working backend and real-time game updates.

## ✨ Features

- **Coinflip Game**: Classic 50/50 heads or tails betting
- **Real-time Updates**: Open games list refreshes every 3 seconds
- **Animated Coin Flips**: Smooth flipping animation when joining games
- **Backend API**: Complete REST API for game management
- **JSON Database**: Simple file-based storage (easy to upgrade to PostgreSQL)
- **Provably Fair**: Random coin flip results (can be enhanced with cryptographic commitment)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun

### Installation

1. **Install dependencies**:
```bash
npm install
# or
bun install
```

2. **Run the development server**:
```bash
npm run dev
# or
bun dev
```

3. **Open [http://localhost:3000/coinflip](http://localhost:3000/coinflip)**

## 📁 Project Structure

```
src/
├── app/
│   ├── api/games/          # Backend API
│   │   ├── create/         # Create game
│   │   ├── open/           # List games
│   │   ├── history/        # History
│   │   └── [id]/join/      # Join game
│   └── coinflip/           # Coinflip page
├── components/
│   └── coinflip-game.tsx   # Main component
├── lib/
│   └── db.ts               # Database
└── data/
    └── games.json          # JSON DB
```

## 🎮 How It Works

### Create Game
1. Set bet amount
2. Choose heads/tails
3. Click "Create Game"
4. Wait for opponent

### Join Game
1. Click "Join" on open game
2. Watch coin flip (2s animation)
3. See result
4. Winner gets 2x bet amount

## 🗄️ Database

JSON file at `data/games.json`. Easy to upgrade to Postgres later.

## 📝 TODO

- [ ] Real Solana wallet integration
- [ ] Admin dashboard for manual payouts
- [ ] Chat/trollbox
- [ ] User profiles
- [ ] PostgreSQL migration
- [ ] WebSocket for real-time
- [ ] More games (Jackpot, etc.)

---

**Built with Next.js 15 + React + TailwindCSS**
