'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/shared/lib/supabase/client';

export default function useAuthUser() {
    const [session, setSession] = useState<{
        user: User | null;
        isLoading: boolean;
    }>({ user: null, isLoading: true });

    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            let active = true;
            queueMicrotask(() => {
                if (active) setSession({ user: null, isLoading: false });
            });
            return () => {
                active = false;
            };
        }

        // 로그인, 로그아웃, 토큰 갱신 시 현재 사용자를 다시 반영한다.
        // 구독 직후 INITIAL_SESSION 이벤트로 저장된 세션도 함께 전달된다.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession({ user: session?.user ?? null, isLoading: false });
        });

        return () => subscription.unsubscribe();
    }, []);

    async function signOut() {
        const result = await getSupabaseClient()?.auth.signOut();
        if (result?.error) throw result.error;
    }

    return { ...session, signOut };
}
