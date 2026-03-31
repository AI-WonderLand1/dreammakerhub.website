export async function GET() {
  return Response.json({ 
    status: 'operational',
    timestamp: new Date().toISOString(),
    message: 'AI-Wonderland is running normally'
  });
}
