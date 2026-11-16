import assert from "node:assert/strict";
import { test } from "node:test";
import { validateSupabaseEnv } from "./env-config.mjs";

const config = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
};
test("rejects missing configuration", () => {
  assert.throws(() => validateSupabaseEnv({}), /Set NEXT_PUBLIC/);
});
test("accepts publishable keys and HTTPS origins", () => {
  assert.doesNotThrow(() => validateSupabaseEnv(config));
});
test("accepts local HTTP for isolated validation", () => {
  assert.doesNotThrow(() => validateSupabaseEnv({ ...config, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }));
});
test("rejects nonlocal HTTP, URL credentials and paths", () => {
  for (const url of ["http://example.com", "https://name:password@example.com", "https://example.com/rest/v1", "not-a-url"]) {
    assert.throws(() => validateSupabaseEnv({ ...config, NEXT_PUBLIC_SUPABASE_URL: url }));
  }
});
test("rejects secret and service-role keys without printing them", () => {
  const jwt = `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.signature`;
  for (const key of ["sb_secret_test_only", jwt, "malformed"]) {
    assert.throws(() => validateSupabaseEnv({ ...config, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key }), /secret keys are forbidden/);
  }
});
test("accepts legacy anon key format without claiming to authenticate it", () => {
  const jwt = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
  assert.doesNotThrow(() => validateSupabaseEnv({ ...config, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: jwt }));
});
