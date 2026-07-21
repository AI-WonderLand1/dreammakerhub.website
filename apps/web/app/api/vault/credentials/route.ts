import { NextResponse } from 'next/server';
import { getConvaiCredentials } from '@/lib/oracle-vault';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const credentials = await getConvaiCredentials();
    
    if (!credentials) {
      return NextResponse.json(
        { error: 'Credentials not available' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      apiKey: credentials.apiKey,
      characterId: credentials.characterId
    });
  } catch (error) {
    logger.error('Error fetching vault credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}