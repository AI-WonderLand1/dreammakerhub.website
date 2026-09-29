import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Railway-only customer IDE entry", () => {
  const page = source("apps/web/app/wonderspace/page.tsx");
  const gate = source("apps/web/components/engines/WonderSpaceOperatorGate.tsx");
  const proxy = source("apps/web/lib/wonderspace/customer-sandbox-controller.server.ts");
  const controller = source("infra/wonderspace/customer-controller/server.mjs");
  const release = source("infra/wonderspace/customer-controller/release-gates.mjs");
  const onDemand = source("apps/web/app/wonderspace/on-demand/page.tsx");

  it("routes customers to per-user Railway sandboxes, never the shared operator Coder", () => {
    expect(page).toContain("async function railwayCustomerPilot()");
    expect(page).toContain("WONDERSPACE_CUSTOMER_RUNTIME_ENABLED");
    expect(page).toContain("NEXT_PUBLIC_WONDERSPACE_SANDBOX_UI_ENABLED");
    expect(page).toContain("WONDERSPACE_CONTROLLER_URL");
    expect(page).toContain("'/healthz'");
    expect(page).toContain("AbortSignal.timeout(2500)");
    expect(gate).toContain("if (role === 'operator') return <OperatorIdePanel />");
    expect(gate).toContain("customerPilot ? <CustomerSandboxIdeEntry />");
    expect(gate).toContain("/wonderspace/on-demand");
    expect(gate).not.toContain("CustomerWorkspaceLaunch");
    expect(gate).toContain("Private Railway IDE: setup in progress");
  });

  it("creates, starts and opens the user sandbox in one explicit paid click", () => {
    expect(onDemand).toContain("Create & open IDE");
    expect(onDemand).toContain("Resume & open");
    expect(onDemand).toContain("sendAction(access, body.workspace.id, 'start')");
    expect(onDemand).toContain("await openTicket(access, body.workspace.id)");
    expect(onDemand).toContain("Workspace saved, but opening failed:");
    expect(onDemand).toContain("Starts one metered ten-minute pilot session.");
    expect(onDemand).not.toContain("Start IDE</button>");
  });

  it("requires a separate network, valid ownership, and bounded budget", () => {
    expect(proxy).toContain("WONDERSPACE_CUSTOMER_RUNTIME_ENABLED !== 'true'");
    expect(proxy).toContain("getUser(match[1])");
    expect(controller).toContain("assertSafeControllerEnvironment(process.env)");
    expect(controller).toContain('networkIsolation: "PRIVATE"');
    expect(controller).toContain("MAX_ACTIVE = 1");
    expect(controller).toContain("saveArchive(");
    expect(release).toContain("WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID");
    expect(release).toContain("WONDERSPACE_PRIVATE_NETWORK_REVIEWED");
    expect(release).toContain('name === "production"');
    expect(release).toContain("env.RAILWAY_API_TOKEN");
  });
});
