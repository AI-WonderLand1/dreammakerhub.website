/**
 * Pure deployment preflight. PRIVATE sandbox networking is required by Railway
 * public domains, but can reach sibling services in the SAME environment.
 * Never launch customer sandboxes alongside the production database/website.
 */
export function assertSafeControllerEnvironment(env) {
  if (!env.RAILWAY_TOKEN || env.RAILWAY_API_TOKEN) {
    throw new Error("Controller requires a scoped RAILWAY_TOKEN; broad bearer-token fallback is forbidden.");
  }
  if (env.WONDERSPACE_CUSTOMER_RUNTIME_ENABLED !== "true") return;

  const actual = env.RAILWAY_ENVIRONMENT_ID || "";
  const expected = env.WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID || "";
  const name = (env.RAILWAY_ENVIRONMENT_NAME || "").trim().toLowerCase();
  if (!actual || !expected || actual !== expected || !name ||
      name === "production" || name === "prod" ||
      env.WONDERSPACE_PRIVATE_NETWORK_REVIEWED !== "true") {
    throw new Error(
      "Customer Sandboxes require a separately approved Railway environment, isolated from all production services.",
    );
  }
  // A pilot must be able to demonstrate independent identity boundaries.
  // This checks configuration shape, not successful two-user testing.
  const testers = (env.WONDERSPACE_TESTER_USER_IDS || "").split(",")
    .map(id => id.trim().toLowerCase()).filter(Boolean);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (testers.length < 2 || new Set(testers).size !== testers.length ||
      testers.some(id => !uuid.test(id))) {
    throw new Error("Two distinct, verified non-operator test accounts must be allowlisted.");
  }
  const minutes = Number(env.WONDERSPACE_MONTHLY_RESERVED_MINUTES);
  if (!Number.isSafeInteger(minutes) || minutes < 15 || minutes > 60) {
    throw new Error("Sandbox pilot requires a monthly reservation allowance of 15-60 minutes.");
  }
}
