import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

// No real project, credentials or authenticated data are used by this check.
const probe = createServer();
await new Promise((resolve, reject) => probe.once("error", reject).listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const require = createRequire(import.meta.url);
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_validation_only",
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
let logs = "";
let startupError;
server.on("error", (error) => { startupError = error; });
server.stdout.on("data", (chunk) => { logs += chunk; });
server.stderr.on("data", (chunk) => { logs += chunk; });
const origin = `http://127.0.0.1:${port}`;
const results = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error("Next server exited before startup.");
    try {
      const response = await fetch(`${origin}/login`, { signal: AbortSignal.timeout(1000) });
      if (response.status === 200) { ready = true; break; }
    } catch { /* Wait only for the local server. */ }
    await delay(200);
  }
  assert.ok(ready, "Next server did not become ready.");
  const checks = [
    ["/login", 200, null],
    ["/", 307, "/todos"],
    ["/todos", 200, "/login"],
    ["/todos/11111111-1111-4111-8111-111111111111", 200, "/login"],
    ["/todos/------------------------------------", 200, null],
    ["/auth/callback", 307, "/login?error=confirmation"],
  ];
  for (const [path, status, location] of checks) {
    const response = await fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, status, path);
    const html = await response.text();
    if (location) {
      if (response.status === 200) {
        // loading.tsx starts streaming before redirect(); Next emits a browser redirect.
        assert.match(html, /http-equiv="refresh"/);
        assert.ok(html.includes(`url=${location}`), `${path} streamed redirect`);
      } else {
        const target = new URL(response.headers.get("location"), origin);
        assert.equal(target.pathname + target.search, location, `${path} redirect`);
      }
    }
    if (path === "/login") {
      assert.match(html, /나만의 할 일/);
      assert.match(html, /type="email"/);
      assert.match(html, /type="password"/);
    }
    if (path.includes("------------------------------------")) {
      assert.match(html, /NEXT_HTTP_ERROR_FALLBACK;404/);
      assert.match(html, /noindex/);
    }
    results.push({ path, status, behavior: location ? `redirect ${location}` : "render", result: "PASS" });
  }
  console.log(JSON.stringify({ scope: "Unauthenticated local HTTP only; no Supabase Auth/RLS verification", results }, null, 2));
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  const stopped = new Promise((resolve) => server.once("exit", resolve));
  if (server.exitCode === null) {
    server.kill();
    await Promise.race([stopped, delay(5000)]);
  }
}
