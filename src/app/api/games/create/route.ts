import { NextRequest, NextResponse } from 'next/server';
import { createGame, type CoinSide } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, amount, side, wallet, avatar, level } = body;

    // Validation
    if (!username || !amount || !side) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount < 0.01 || amount > 100) {
      return NextResponse.json(
        { error: 'Amount must be between 0.01 and 100 SOL' },
        { status: 400 }
      );
    }

    if (side !== 'heads' && side !== 'tails') {
      return NextResponse.json(
        { error: 'Side must be "heads" or "tails"' },
        { status: 400 }
      );
    }

    // Create game
    const game = createGame({
      creator: {
        username,
        wallet,
        avatar: avatar || `https://solpot.com/avatars/9.x/thumbs/svg?seed=${username}&backgroundColor=ad98ff&shapeColor=f1f4dc&scale=80`,
        level: level || 1,
      },
      amount: Number(amount),
      side: side as CoinSide,
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}
