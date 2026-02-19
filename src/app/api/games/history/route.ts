import { NextResponse } from 'next/server';
import { getGameHistory } from '@/lib/db';

export async function GET() {
  try {
    const games = getGameHistory();
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching game history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
