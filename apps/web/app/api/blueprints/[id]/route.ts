import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: blueprint, error } = await supabase
      .from("blueprints")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    return NextResponse.json(blueprint);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: blueprint, error } = await supabase
      .from("blueprints")
      .update({
        name: body.name,
        description: body.description,
        puck_data: body.puckData,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .eq("user_id", user.user.id)
      .select()
      .single();

    if (error || !blueprint) {
      return NextResponse.json({ error: "Failed to update blueprint" }, { status: 400 });
    }

    return NextResponse.json(blueprint);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("blueprints")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete blueprint" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}