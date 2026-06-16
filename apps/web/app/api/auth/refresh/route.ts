import { NextRequest, NextResponse } from 'next/server';

export const runtime = "nodejs";

<<<<<<< HEAD
export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Refresh token is required' 
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      logger.error('Token refresh error', { error });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to refresh token. Please login again.' 
        },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid refresh token' 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      }
    });

  } catch (error: any) {
    logger.error('Unexpected refresh error', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
=======
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: false, error: 'Use Replit login' }, { status: 401 });
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}
