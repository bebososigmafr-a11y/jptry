"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { cn } from "@/lib/utils";

type CoinSide = "heads" | "tails";
type GameStatus = "idle" | "creating" | "joining" | "flipping" | "finished";

type OpenGame = {
  id: string;
  creator: {
    username: string;
    level: number;
    avatar: string;
  };
  amount: number;
  side: CoinSide;
};

type GameResult = {
  winner: "creator" | "opponent";
  coinResult: CoinSide;
  creatorWon: boolean;
  opponentWon: boolean;
  winnerUsername: string;
  loserUsername: string;
};

export function CoinflipGame() {
  const [betAmount, setBetAmount] = useState(0.1);
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [openGames, setOpenGames] = useState<OpenGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [username] = useState(() => `Player${Math.floor(Math.random() * 9999)}`);

  // Fetch open games from backend
  const fetchOpenGames = useCallback(async () => {
    try {
      const response = await fetch('/api/games/open');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setOpenGames(data.games);
    } catch (err) {
      console.error('Error fetching games:', err);
    }
  }, []);

  // Fetch games on mount and every 3 seconds
  useEffect(() => {
    fetchOpenGames();
    const interval = setInterval(fetchOpenGames, 3000);
    return () => clearInterval(interval);
  }, [fetchOpenGames]);

  const increaseBet = () => {
    setBetAmount(prev => parseFloat((prev + 0.01).toFixed(2)));
  };

  const decreaseBet = () => {
    if (betAmount > 0.01) {
      setBetAmount(prev => parseFloat((prev - 0.01).toFixed(2)));
    }
  };

  const handleSideSelect = (side: CoinSide) => {
    setSelectedSide(side);
    setError(null);
  };

  const handleCreateGame = async () => {
    if (!selectedSide || betAmount <= 0) {
      setError('Please select a side and enter a valid bet amount');
      return;
    }

    setLoading(true);
    setError(null);
    setGameStatus("creating");

    try {
      const response = await fetch('/api/games/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          amount: betAmount,
          side: selectedSide,
          level: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create game');
      }

      const data = await response.json();
      setSuccess(`Game created! Waiting for opponent... (${betAmount} SOL on ${selectedSide})`);
      setGameStatus("idle");
      fetchOpenGames(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
      setGameStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (game: OpenGame) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGameStatus("joining");

    try {
      const response = await fetch(`/api/games/${game.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          level: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join game');
      }

      const data = await response.json();
      
      // Animate coin flip
      setGameStatus("flipping");
      
      setTimeout(() => {
        const result: GameResult = {
          winner: data.result.winner,
          coinResult: data.result.coinResult,
          creatorWon: data.result.winner === 'creator',
          opponentWon: data.result.winner === 'opponent',
          winnerUsername: data.result.winner === 'creator' ? game.creator.username : username,
          loserUsername: data.result.winner === 'creator' ? username : game.creator.username,
        };
        
        setLastResult(result);
        setGameStatus("finished");
        
        if (result.opponentWon) {
          setSuccess(`🎉 You WON ${game.amount * 2} SOL! The coin landed on ${result.coinResult}.`);
        } else {
          setError(`You lost ${game.amount} SOL. The coin landed on ${result.coinResult}.`);
        }
        
        fetchOpenGames(); // Refresh the list
        
        // Reset after 5 seconds
        setTimeout(() => {
          setGameStatus("idle");
          setLastResult(null);
        }, 5000);
      }, 2000); // 2 second coin flip animation
      
    } catch (err: any) {
      setError(err.message || 'Failed to join game');
      setGameStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pt-20 md:pt-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400">
          {success}
        </div>
      )}
      
      {/* Coin Flip Animation Overlay */}
      {gameStatus === "flipping" && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin-slow mb-4">
              <Image
                src="/images/coin-heads.png"
                alt="Flipping"
                width={200}
                height={200}
                className="rounded-full"
              />
            </div>
            <p className="text-white text-2xl font-bold">Flipping coin...</p>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold airstrike-font text-white">Coinflip</h1>
        <p className="text-gray-400 mt-2">The classic 50/50 game mode.</p>
        <p className="text-sm text-gray-500 mt-1">Playing as: {username}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Bet Controls */}
        <div className="md:col-span-2">
          <Card className="bg-solpot-black/80 border-solpot-gray-dark/50 p-6 gradient-border">
            {/* Bet Amount Control */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-400 mb-2">Bet Amount</label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-solpot-gray-dark/50 border-solpot-gray-dark hover:bg-solpot-gray-dark/70"
                  onClick={decreaseBet}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-white">{betAmount.toFixed(2)}</div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-solpot-gray-dark/50 border-solpot-gray-dark hover:bg-solpot-gray-dark/70"
                  onClick={increaseBet}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Coin Side Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-400 mb-4">Choose Side</label>
              <div className="flex justify-center gap-12">
                <button
                  className={cn(
                    "relative flex flex-col items-center transition-transform transform hover:scale-105",
                    selectedSide === "heads" && "scale-105"
                  )}
                  onClick={() => handleSideSelect("heads")}
                >
                  <div className={cn(
                    "w-32 h-32 rounded-full overflow-hidden border-4 mb-2 transition-colors",
                    selectedSide === "heads" ? "border-solpot-purple" : "border-transparent"
                  )}>
                    <Image
                      src="/images/coin-heads.png"
                      alt="Heads"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white font-medium">Heads</span>
                </button>

                <button
                  className={cn(
                    "relative flex flex-col items-center transition-transform transform hover:scale-105",
                    selectedSide === "tails" && "scale-105"
                  )}
                  onClick={() => handleSideSelect("tails")}
                >
                  <div className={cn(
                    "w-32 h-32 rounded-full overflow-hidden border-4 mb-2 transition-colors",
                    selectedSide === "tails" ? "border-solpot-purple" : "border-transparent"
                  )}>
                    <Image
                      src="/images/coin-tails.png"
                      alt="Tails"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white font-medium">Tails</span>
                </button>
              </div>
            </div>

            {/* Create Game Button */}
            <Button
              className="bg-solpot-purple hover:bg-solpot-purple/90 text-white w-full py-6 text-lg disabled:opacity-50"
              disabled={!selectedSide || betAmount <= 0 || loading || gameStatus !== "idle"}
              onClick={handleCreateGame}
            >
              {loading && gameStatus === "creating" ? "Creating..." : "Create Game"}
            </Button>
          </Card>
        </div>

        {/* Right Column - Open Games */}
        <div>
          <Card className="bg-solpot-black/80 border-solpot-gray-dark/50 h-full gradient-border">
            <div className="p-4 border-b border-solpot-gray-dark/50 flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-solpot-purple mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12.75c-1.148 0-2.278-.08-3.4-.237l.18.632c.917.202 1.717.432 2.462.667.766.235 1.479.352 2.138.352.659 0 1.37-.117 2.134-.352.746-.235 1.548-.465 2.464-.667l.183-.633c-1.122.158-2.252.237-3.4.237H12Zm0 6.75c-.74 0-1.462-.085-2.175-.262-.713-.174-1.425-.383-2.137-.626C7.044 18.32 6.33 18.01 5.67 17.62c-.66-.39-1.232-.812-1.725-1.261a9.036 9.036 0 0 1-1.386-1.76C2.156 13.9 1.891 13.15 1.55 12.4c-.34-.75-.473-1.707-.4-2.875.073-1.168.296-2.066.668-2.694.372-.63.837-1.044 1.395-1.238.558-.194 1.162-.291 1.812-.291l14.15.002c.65 0 1.25.097 1.808.291.559.194 1.021.607 1.393 1.237.372.629.595 1.526.67 2.694.074 1.168-.058 2.125-.394 2.875-.336.75-.602 1.5-1.004 2.25-.402.75-.877 1.353-1.389 1.76-.51.408-1.087.83-1.726 1.26-.64.433-1.352.77-2.14 1.014-.788.244-1.497.463-2.134.626-.637.172-1.364.264-2.177.264h-.07l-.02-.025h.02Z" fill="currentColor" />
                </svg>
                <span className="text-white font-medium">Open Games</span>
              </div>
              <div className="text-solpot-purple text-sm font-medium">
                {openGames.length}
              </div>
            </div>

            <div className="max-h-[480px] overflow-y-auto p-2">
              {openGames.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No open games. Create one!
                </div>
              ) : (
                openGames.map((game) => (
                  <div key={game.id} className="flex items-center p-3 hover:bg-white/5 rounded-md transition-colors">
                    <div className="w-8 h-8 mr-3 flex-shrink-0">
                      <Image
                        src={game.side === "heads" ? "/images/coin-heads.png" : "/images/coin-tails.png"}
                        alt={game.side}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>

                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <img
                              src={game.creator.avatar}
                              alt={game.creator.username}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                          </Avatar>
                          <span className="font-medium text-white truncate">{game.creator.username}</span>
                          <span className="ml-2 text-xs bg-solpot-purple px-1.5 rounded">{game.creator.level}</span>
                        </div>
                        <div className="text-sm font-medium text-white ml-8 mt-1">{game.amount} SOL</div>
                      </div>

                      <Button
                        className="ml-auto bg-solpot-green hover:bg-solpot-green/90 text-white text-xs h-8 rounded-md disabled:opacity-50"
                        disabled={loading || gameStatus !== "idle"}
                        onClick={() => handleJoinGame(game)}
                      >
                        {loading && gameStatus === "joining" ? "Joining..." : "Join"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-solpot-gray-dark/50">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Pending Games: {openGames.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
