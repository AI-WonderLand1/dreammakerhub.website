// apps/web/lib/webcontainer.ts
"use client";

import { auth, WebContainer, type WebContainerProcess } from "@webcontainer/api";

let containerPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (containerPromise) return containerPromise;

  containerPromise = (async () => {
    await auth.init({
      clientId: "wc_api_wonderingtribe_7254a85d8ff580f6d0f5206c5d51d04d",
      scope: "",
    });

    const wc = await WebContainer.boot();
    return wc;
  })();

  return containerPromise;
}

/**
 * Mount a simple virtual filesystem.
 * You can replace this with a real repo loader later.
 */
export async function mountFiles(files: Record<string, string>) {
  const wc = await getWebContainer();

  await wc.mount(
    Object.fromEntries(
      Object.entries(files).map(([path, content]) => [
        path,
        { file: { contents: content } },
      ]),
    ),
  );
}

export async function runCommand(
  cmd: string,
  args: string[] = [],
  onData?: (data: string) => void,
): Promise<number> {
  const wc = await getWebContainer();

  const proc: WebContainerProcess = await wc.spawn(cmd, args);

  const output = proc.output;

  if (onData) {
    const reader = output.getReader();
    (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        onData(value);
      }
    })();
  }

  const exitCode = await proc.exit;
  return exitCode;
}

export async function startDevServer(onLog?: (line: string) => void) {
  await mountFiles({
    "package.json": JSON.stringify(
      {
        name: "wc-test",
        private: true,
        scripts: {
          dev: "pnpm -r --filter !ai-wonderland dev",
        },
      },
      null,
      2,
    ),
  });

  return runCommand("pnpm", ["dev"], onLog);
}
