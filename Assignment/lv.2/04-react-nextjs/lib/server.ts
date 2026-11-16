import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function serverClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) => {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            // Server Component의 읽기 전용 쿠키는 proxy.ts에서 갱신한다.
            // Route Handler인 인증 callback에서는 이 쓰기가 허용된다.
          }
        },
      },
    },
  );
}
