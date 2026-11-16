import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const authHeaders: Record<string, string> = {};
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies, headers) => {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          const previousCookies = response.cookies.getAll();
          response = NextResponse.next({ request });
          previousCookies.forEach((cookie) => response.cookies.set(cookie));
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.assign(authHeaders, headers);
          Object.entries(authHeaders).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    },
  );
  await db.auth.getUser();
  return response;
}
export const config = { matcher: ["/todos/:path*", "/login"] };
