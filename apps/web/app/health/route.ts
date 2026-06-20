export async function GET() {
  return Response.json({ status: 'ok', path: '/health' });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
