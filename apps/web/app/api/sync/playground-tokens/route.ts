import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

// Validate UUID format
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Sanitize string inputs
const sanitize = (val: unknown, maxLen = 100) => String(val || "").slice(0, maxLen);

/**
 * POST /api/sync/playground-tokens
 * Syncs token purchases, grants, and balance between platforms.
 */
export async function POST(req: NextRequest) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();

    const apiKey = req.headers.get("x-sync-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing sync key", traceId }, { status: 401 });
    }

    const { data: validKey } = await supabase
      .from("sync_keys")
      .select("id")
      .eq("key", apiKey)
      .eq("active", true)
      .single();

    if (!validKey) {
      return NextResponse.json({ ok: false, error: "Invalid sync key", traceId }, { status: 401 });
    }

    const body = await req.json();
    const { userId, action, amount, reason, transactionId } = body;

    if (!userId || !action || amount === undefined) {
      return NextResponse.json({ ok: false, error: "Missing required fields", traceId }, { status: 400 });
    }

    // Validate inputs
    if (!isValidUUID(userId)) {
      return NextResponse.json({ ok: false, error: "Invalid userId format", traceId }, { status: 400 });
    }

    const validActions = ["add", "subtract", "set"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid action", traceId }, { status: 400 });
    }

    const sanitizedAmount = Math.max(0, Math.min(1000000, Math.floor(Number(amount))));
    const sanitizedReason = sanitize(reason);
    const sanitizedTxId = transactionId ? sanitize(transactionId, 200) : null;

    // Get current balance
    const { data: current } = await supabase
      .from("token_balances")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const currentBalance = current?.balance || 0;
    let newBalance = currentBalance;

    // Calculate new balance based on action
    switch (action) {
      case "add":
        newBalance = currentBalance + sanitizedAmount;
        break;
      case "subtract":
        newBalance = Math.max(0, currentBalance - sanitizedAmount);
        break;
      case "set":
        newBalance = sanitizedAmount;
        break;
    }

    // Upsert balance
    const { error: balanceError } = await supabase
      .from("token_balances")
      .upsert({
        user_id: userId,
        balance: newBalance,
        last_updated: new Date().toISOString(),
        source: "playground",
      }, { onConflict: "user_id" });

    if (balanceError) {
      return NextResponse.json({ ok: false, error: balanceError.message, traceId }, { status: 500 });
    }

    // Log the transaction
    await supabase.from("token_transactions").insert({
      user_id: userId,
      action,
      amount: sanitizedAmount,
      previous_balance: currentBalance,
      new_balance: newBalance,
      reason: sanitizedReason || "playground_sync",
      transaction_id: sanitizedTxId,
      source: "playground",
      created_at: new Date().toISOString(),
    });

    // Log sync event
    await supabase.from("sync_log").insert({
      source: "playground",
      event_type: "tokens",
      user_id: userId,
      payload: { action, amount: sanitizedAmount, previousBalance: currentBalance, newBalance },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      userId,
      balance: newBalance,
      action,
      amount: sanitizedAmount,
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Token sync failed", traceId }, { status: 500 });
  }
}

/**
 * GET /api/sync/playground-tokens
 * Get token balance and transaction history.
 */
export async function GET(req: NextRequest) {
  const traceId = randomUUID();

  try {
    const supabase = await createSupabaseServerClient();
    const userId = req.nextUrl.searchParams.get("userId");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing userId", traceId }, { status: 400 });
    }

    // Get current balance
    const { data: balance } = await supabase
      .from("token_balances")
      .select("balance, last_updated")
      .eq("user_id", userId)
      .single();

    // Get recent transactions
    const { data: transactions } = await supabase
      .from("token_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return NextResponse.json({
      ok: true,
      userId,
      balance: balance?.balance || 0,
      lastUpdated: balance?.last_updated,
      transactions: transactions || [],
      traceId,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Fetch failed", traceId }, { status: 500 });
  }
}
