'use client';

import { useEffect, useState } from 'react';

import { getSupabaseClient } from '@/shared/lib/supabase/client';

export type RecoverySessionStatus =
    'checking' | 'ready' | 'expired' | 'invalid' | 'unavailable';

const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// 복구 토큰·오류 정보가 주소창과 방문 기록에 남지 않도록 경로만 남긴다.
function clearRecoveryParamsFromUrl() {
    window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname,
    );
}

/**
 * 비밀번호 복구 링크로 들어온 세션이 유효한지 확인한다.
 * - `?code=` (기본 PKCE 링크): 공용 Supabase 클라이언트가 초기화 중 자동으로 코드를 교환하고 주소에서 지운다.
 * - `#token_hash=` (권장 이메일 템플릿): 해시는 서버로 전송되지 않으므로 여기서 verifyOtp로 직접 검증한다.
 */
export default function usePasswordRecoverySession() {
    // 서버 렌더링 중 브라우저 클라이언트를 만들지 않도록 환경 변수만으로 초기 상태를 정한다.
    // NEXT_PUBLIC_ 값은 서버·브라우저에 같게 주입되어 하이드레이션 결과가 일치한다.
    const [status, setStatus] = useState<RecoverySessionStatus>(
        isSupabaseConfigured ? 'checking' : 'unavailable',
    );

    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        let isActive = true;

        function updateStatus(nextStatus: RecoverySessionStatus) {
            if (isActive) setStatus(nextStatus);
        }

        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.slice(1));
        const readParam = (key: string) =>
            url.searchParams.get(key) ?? hashParams.get(key);

        const errorCode = readParam('error_code');
        const hasLinkError = Boolean(errorCode || readParam('error'));
        const tokenHash = hashParams.get('token_hash');
        const hasCode = url.searchParams.has('code');

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') updateStatus('ready');
        });

        const verifyRecoverySession = async () => {
            if (hasLinkError) {
                clearRecoveryParamsFromUrl();
                updateStatus(
                    errorCode === 'otp_expired' ? 'expired' : 'invalid',
                );
                return;
            }

            if (tokenHash) {
                clearRecoveryParamsFromUrl();
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: 'recovery',
                });
                updateStatus(error ? 'invalid' : 'ready');
                return;
            }

            // getSession은 클라이언트 초기화(코드 교환 포함)가 끝난 뒤 결과를 돌려준다.
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const isCodeExchanged =
                hasCode &&
                !new URL(window.location.href).searchParams.has('code');

            if (session && isCodeExchanged) {
                updateStatus('ready');
                return;
            }

            // 교환에 실패한 코드(만료·다른 브라우저 등)도 주소에서 지운다.
            if (hasCode) clearRecoveryParamsFromUrl();
            setStatus((currentStatus) =>
                isActive && currentStatus === 'checking'
                    ? 'invalid'
                    : currentStatus,
            );
        };

        verifyRecoverySession();

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, []);

    return status;
}
