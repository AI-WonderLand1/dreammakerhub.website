type WorkerRequest = {
  language: string;
  code: string;
  apiKey?: string;
};

type OutgoingMessage =
  | { type: "log"; message: string }
  | { type: "output"; result: unknown }
  | { type: "done" }
  | { type: "error"; message: string };

type SseEvent = {
  event: string;
  data: string;
};

const DEFAULT_ENDPOINT = "/api/wonderspace/runners";

let activeController: AbortController | null = null;

const isString = (value: unknown): value is string => typeof value === "string";

function normalizeMessage(payload: unknown): WorkerRequest | { error: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid worker payload" };
  }

  const { language, code, apiKey } = payload as Record<string, unknown>;

  if (!isString(language) || !isString(code)) {
    return { error: "Both language and code are required strings" };
  }

  if (apiKey !== undefined && !isString(apiKey)) {
    return { error: "apiKey must be a string when provided" };
  }

  return { language, code, apiKey };
}

function parseSseChunk(chunk: string): SseEvent | null {
  const lines = chunk.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return { event, data: dataLines.join("\n") };
}

function dispatchSseEvent(evt: SseEvent) {
  const payload = evt.data;

  switch (evt.event) {
    case "output": {
      try {
        const parsed = JSON.parse(payload);
        postMessage({ type: "output", result: parsed } satisfies OutgoingMessage);
      } catch {
        postMessage({ type: "output", result: payload } satisfies OutgoingMessage);
      }
      break;
    }
    case "done":
      postMessage({ type: "done" } satisfies OutgoingMessage);
      break;
    default:
      postMessage({ type: "log", message: payload } satisfies OutgoingMessage);
  }
}

async function streamEventSource(request: WorkerRequest, signal: AbortSignal) {
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    "Content-Type": "application/json"
  };

  if (request.apiKey) {
    headers.Authorization = `Bearer ${request.apiKey}`;
  }

  let response = await fetch(DEFAULT_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ language: request.language, code: request.code }),
    headers,
    signal
  });

  if (response.status === 405) {
    await response.body?.cancel().catch(() => null);
    response = await fetch(DEFAULT_ENDPOINT, {
      headers,
      signal
    });
  }

  if (!response.ok) {
    throw new Error(`Server responded with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("The worker stream did not include a body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\n\n/);
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const parsed = parseSseChunk(part);
      if (parsed) {
        dispatchSseEvent(parsed);
        if (parsed.event === "done") {
          await reader.cancel().catch(() => null);
          return;
        }
      }
    }
  }
}

self.addEventListener("message", (event: MessageEvent<unknown>) => {
  const normalized = normalizeMessage(event.data);

  if ("error" in normalized) {
    postMessage({ type: "error", message: normalized.error } satisfies OutgoingMessage);
    return;
  }

  if (activeController) {
    activeController.abort();
  }

  const controller = new AbortController();
  activeController = controller;

  streamEventSource(normalized, controller.signal).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown streaming error";
    postMessage({ type: "error", message } satisfies OutgoingMessage);
  }).finally(() => {
    if (activeController === controller) {
      activeController = null;
    }
  });
});
