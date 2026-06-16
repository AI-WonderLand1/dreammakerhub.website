import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
<<<<<<< HEAD
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/public-pages/auth?error=oauth_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
=======
  return NextResponse.redirect(new URL('/dashboard', request.url));
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
}
