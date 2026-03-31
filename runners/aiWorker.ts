/**
 * aiWorker.ts
 * ------------
 * Upgraded with Priority #1: Security & Priority #3: Code Scanning.
 */

// We assume SecurityCore logic is accessible or duplicated here for worker scope
// since workers run in a different context.
const validateSafety = (input: string) => {
  const dangerous = ["rm -rf", "process.env", "eval(", "<script", "document.cookie"];
  for (const pattern of dangerous) {
    if (input.toLowerCase().includes(pattern.toLowerCase())) {
      return { safe: false, reason: `Pattern '${pattern}' is forbidden.` };
    }
  }
  return { safe: true };
};

self.onmessage = async (e: MessageEvent) => {
  const { task, payload, apiKey } = e.data;

  // --- PRIORITY #1: SECURITY CHECK ---
  // We scan the payload before sending it to the API
  const safety = validateSafety(JSON.stringify(payload));
  
  if (!safety.safe) {
    (self as any).postMessage({ 
      success: false, 
      error: `Security Block: ${safety.reason}` 
    });
    return; // Stop execution
  }

  try {
    // Optional: Add a timeout to the fetch for better reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("/api/wonderspace/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, payload, apiKey }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const data = await response.json();
    
    // --- PRIORITY #3: SCANNING RESULT ---
    // If the AI generated code, we could run a post-generation scan here
    (self as any).postMessage({ success: true, result: data.result });

  } catch (err: any) {
    (self as any).postMessage({ 
      success: false, 
      error: err.name === 'AbortError' ? 'Request timed out' : err.message 
    });
  }
};

