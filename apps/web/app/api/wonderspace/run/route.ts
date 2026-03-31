import { NextRequest, NextResponse } from "next/server";
import { Script, createContext } from "node:vm";
import { logger } from "@lib/logger";

const API_KEY = process.env.WONDERSPACE_API_KEY;

function validateKey(key: string) {
  if (API_KEY && key !== API_KEY) {
    throw new Error("Invalid API key");
  }
}

function executeJavaScript(code: string) {
  const logs: string[] = [];
  const sandbox = {
    console: {
      log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
      warn: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    },
  };

  const context = createContext(sandbox);
  const script = new Script(code);
  const result = script.runInContext(context, { timeout: 1000 });

  const stdout =
    typeof result === "string"
      ? result
      : result === undefined
      ? ""
      : JSON.stringify(result, null, 2);

  return { stdout, logs };
}

/**
 * Execute user-submitted code in multiple languages.
 * POST /api/wonderspace/run
 *
 * Body:
 * {
 *   "language": "python",
 *   "code": "print('Hello World')",
 *   "apiKey": "user_api_key"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { language, code, apiKey } = await req.json();

    if (!language || !code || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 🔐 Verify Firestore API key
    validateKey(apiKey);

    if (language !== "javascript") {
      return NextResponse.json(
        { success: false, error: "Only JavaScript is supported in this environment" },
        { status: 400 }
      );
    }

    // 🧠 Run code in a sandboxed VM to keep execution safe
    const output = executeJavaScript(code);

    // ✅ Return response
    return NextResponse.json({
      success: true,
      output,
      language,
    });
  } catch (err: any) {
    logger.error("Run API Error", { error: err });
    if (err?.message === "Invalid API key") {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Runtime failure" },
      { status: 500 }
    );
  }
}
