import { NextRequest, NextResponse } from 'next/server';
import { joinGame, getGameById } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, wallet, avatar, level } = body;

    // Validation
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if game exists
    const existingGame = getGameById(id);
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (existingGame.status !== 'open') {
      return NextResponse.json(
        { error: 'Game is no longer available' },
        { status: 400 }
      );
    }

    // Join game
    const result = joinGame(id, {
      username,
      wallet,
      avatar: avatar || `https://solpot.com/avatars/9.x/thumbs/svg?seed=${username}&backgroundColor=ad98ff&shapeColor=f1f4dc&scale=80`,
      level: level || 1,
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to join game' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      game: result.game,
      result: result.result 
    });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    );
  }
}
