import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

// 환경 변수가 없으면 null을 반환해, Supabase 설정 전에도 나머지 페이지는 그대로 동작하게 한다.
export function getSupabaseClient() {
    if (!supabaseUrl || !supabaseKey) {
        return null;
    }

    // 여러 컴포넌트가 같은 세션을 공유하도록 클라이언트를 한 번만 만든다.
    client ??= createBrowserClient(supabaseUrl, supabaseKey);
    return client;
}
