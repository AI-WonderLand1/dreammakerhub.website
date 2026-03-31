#!/usr/bin/env node
import { spawn } from "node:child_process";

const signalingCommand = process.env.WONDER_SIGNALING_CMD ?? "pnpm --filter ai-wonder-web exec next dev -p 3001";
const unrealCommand = process.env.WONDER_UNREAL_CMD ?? "echo 'Set WONDER_UNREAL_CMD to your UE5 launch command' && sleep 5";

function start(name, command) {
  const child = spawn(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  child.on("spawn", () => {
    console.log(`[swarm] ${name} started`);
  });

  return child;
}

const processes = [
  { name: "signaling-server", child: start("signaling-server", signalingCommand) },
  { name: "unreal-instance", child: start("unreal-instance", unrealCommand) },
];

let shuttingDown = false;

function stopAll(signal = "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const proc of processes) {
    if (!proc.child.killed) {
      proc.child.kill(signal);
    }
  }
}

for (const proc of processes) {
  proc.child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.log(`[swarm] ${proc.name} exited (code=${code ?? "null"}, signal=${signal ?? "none"}), stopping remaining processes`);
      stopAll();
      process.exitCode = code ?? (signal ? 1 : 0);
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
