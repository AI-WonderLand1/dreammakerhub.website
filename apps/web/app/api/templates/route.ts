import { NextResponse } from 'next/server';

// In-memory template store (could be replaced with DB later)
const serverTemplates: Array<{ id: string; name: string; description: string; elements: any[]; createdAt: string }> = [];

export async function GET() {
  return NextResponse.json({ templates: serverTemplates });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, elements } = body;
    if (!name || !elements) {
      return NextResponse.json({ message: 'Name and elements are required' }, { status: 400 });
    }
    const template = {
      id: `api-template-${Date.now()}`,
      name,
      description: `${elements.length} block${elements.length !== 1 ? 's' : ''}`,
      elements,
      createdAt: new Date().toISOString(),
    };
    serverTemplates.push(template);
    return NextResponse.json({ message: 'Template saved', template }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  }
}
