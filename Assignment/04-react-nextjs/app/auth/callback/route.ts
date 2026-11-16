import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "../../../lib/server";

function redirectWithoutCache(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const client = await serverClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return redirectWithoutCache(request, "/todos");
  }
  return redirectWithoutCache(request, "/login?error=confirmation");
}
