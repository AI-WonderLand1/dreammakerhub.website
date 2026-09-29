import assert from "node:assert/strict";
import { test } from "node:test";
import { assertSafeControllerEnvironment } from "./release-gates.mjs";

const base = {
  RAILWAY_TOKEN: "scoped-test-token",
  RAILWAY_ENVIRONMENT_ID: "customer-test-environment-id",
  WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID: "customer-test-environment-id",
  RAILWAY_ENVIRONMENT_NAME: "customer-ide-test",
  WONDERSPACE_CUSTOMER_RUNTIME_ENABLED: "true",
  WONDERSPACE_PRIVATE_NETWORK_REVIEWED: "true",
  WONDERSPACE_TESTER_USER_IDS: [
    "b45ec537-89b3-49b5-879a-3a0805873ff0",
    "4e863ff6-27a9-46c1-87d0-06e27b57b988",
  ].join(","),
  WONDERSPACE_MONTHLY_RESERVED_MINUTES: "30",
};

test("approved isolated sandbox test environment passes structural gate", () => {
  assert.doesNotThrow(() => assertSafeControllerEnvironment({ ...base }));
});

test("production and missing approval never launch customer VMs", () => {
  for (const change of [
    { RAILWAY_ENVIRONMENT_NAME: "production" },
    { RAILWAY_ENVIRONMENT_NAME: "prod" },
    { RAILWAY_ENVIRONMENT_ID: "live-production-environment-id" },
    { WONDERSPACE_CUSTOMER_ISOLATED_ENVIRONMENT_ID: "" },
    { WONDERSPACE_PRIVATE_NETWORK_REVIEWED: "false" },
  ]) {
    assert.throws(() => assertSafeControllerEnvironment({ ...base, ...change }), /separately approved/);
  }
});

test("broad account token fallback and missing project token are rejected even in paused mode", () => {
  assert.throws(() => assertSafeControllerEnvironment({
    ...base, WONDERSPACE_CUSTOMER_RUNTIME_ENABLED: "false", RAILWAY_TOKEN: "",
  }), /scoped/);
  assert.throws(() => assertSafeControllerEnvironment({
    ...base, WONDERSPACE_CUSTOMER_RUNTIME_ENABLED: "false", RAILWAY_API_TOKEN: "wide-token",
  }), /scoped/);
});

test("pilot needs two distinct valid test identities and bounded resource reservations", () => {
  assert.throws(() => assertSafeControllerEnvironment({
    ...base, WONDERSPACE_TESTER_USER_IDS: base.WONDERSPACE_TESTER_USER_IDS.split(",")[0],
  }), /Two distinct/);
  assert.throws(() => assertSafeControllerEnvironment({
    ...base, WONDERSPACE_TESTER_USER_IDS: base.WONDERSPACE_TESTER_USER_IDS.split(",")[0] +
      "," + base.WONDERSPACE_TESTER_USER_IDS.split(",")[0],
  }), /Two distinct/);
  assert.throws(() => assertSafeControllerEnvironment({
    ...base, WONDERSPACE_MONTHLY_RESERVED_MINUTES: "999999",
  }), /15-60/);
});
