import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

type UsageRecord = {
  userId: string;
  count: number;
};

type UsageState = {
  [userId: string]: number;
};

async function readUsageState(): Promise<UsageState> {
  try {
    const raw = await fs.readFile(USAGE_FILE, "utf8");
    return JSON.parse(raw) as UsageState;
  } catch {
    return {};
  }
}

async function writeUsageState(state: UsageState) {
  await ensureDataDir();
  await fs.writeFile(USAGE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export class UsageTracker {
  async increment(userId: string, amount: number = 1): Promise<number> {
    const state = await readUsageState();
    const current = state[userId] ?? 0;
    const next = current + amount;
    state[userId] = next;
    await writeUsageState(state);
    return next;
  }

  async get(userId: string): Promise<number> {
    const state = await readUsageState();
    return state[userId] ?? 0;
  }

  async getAll(): Promise<UsageRecord[]> {
    const state = await readUsageState();
    return Object.entries(state).map(([userId, count]) => ({ userId, count }));
  }
}

// Backward-compatible helpers for existing call sites.
const tracker = new UsageTracker();

export async function trackUsage(userId: string, tokens: number): Promise<void> {
  await tracker.increment(userId, tokens);
}

export async function getUsage(userId: string): Promise<{ userId: string; used: number; limit: number }> {
  const used = await tracker.get(userId);
  const limit = 10000;
  return { userId, used, limit };
}

export async function hasUsageRemaining(userId: string): Promise<boolean> {
  const usage = await getUsage(userId);
  return usage.used < usage.limit;
}
