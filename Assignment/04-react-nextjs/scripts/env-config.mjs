// Values are never included in errors because this also runs in deployment logs.
export function validateSupabaseEnv(env = process.env) {
  const urlName = "NEXT_PUBLIC_SUPABASE_URL";
  const keyName = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
  const url = env[urlName]?.trim();
  const key = env[keyName]?.trim();
  if (!url || !key) {
    throw new Error(`Set ${urlName} and ${keyName} before building or starting.`);
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${urlName} must be a valid HTTPS URL (HTTP is allowed on loopback).`);
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) ||
      parsed.username || parsed.password || parsed.search || parsed.hash ||
      parsed.pathname !== "/") {
    throw new Error(`${urlName} must be an HTTPS origin (HTTP is allowed on loopback).`);
  }
  let publicKey = key.startsWith("sb_publishable_");
  if (!publicKey && key.split(".").length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
      publicKey = payload.role === "anon";
    } catch {
      // A malformed JWT is rejected without exposing the original value.
    }
  }
  if (!publicKey) {
    throw new Error(`${keyName} must be a publishable key or legacy anon key; secret keys are forbidden.`);
  }
}
