import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const html = `<!DOCTYPE html>
<html>
<head><title>Sign in</title></head>
<body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
  <div style="text-align:center">
    <h1 style="margin-bottom:24px">AI Wonderland</h1>
    <script authed="window.location.href='/dashboard'" src="https://replit.com/public/js/repl-auth-v2.js"></script>
    <p style="margin-top:16px;font-size:14px;color:#666">Sign in with your Replit account to continue</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
