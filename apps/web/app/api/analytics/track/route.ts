export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return new Response(JSON.stringify({ ok: true, received: body }), {
    status: 200,
  });
}
