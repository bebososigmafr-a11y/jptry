import { NextResponse } from 'next/server';
import { getOpenGames } from '@/lib/db';

export async function GET() {
  try {
    const games = getOpenGames();
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching open games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
