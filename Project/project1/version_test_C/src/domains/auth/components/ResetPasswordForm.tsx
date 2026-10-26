'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/ui/button';
import AuthField from '@/domains/auth/components/AuthField';
import AuthLogo from '@/domains/auth/components/AuthLogo';
import BackToLoginLink from '@/domains/auth/components/BackToLoginLink';
import usePasswordRecoverySession, {
    type RecoverySessionStatus,
} from '@/domains/auth/hooks/usePasswordRecoverySession';
import { getSupabaseClient } from '@/shared/lib/supabase/client';
import {
    PASSWORD_POLICY_MESSAGE,
    validateNewPassword,
    type NewPasswordErrors,
    type NewPasswordValues,
} from '@/domains/auth/utils/validateNewPassword';

const REDIRECT_DELAY_MS = 1500;

const UNUSABLE_LINK_MESSAGES: Record<
    Exclude<RecoverySessionStatus, 'checking' | 'ready'>,
    string
> = {
    expired: 'This reset link has expired. Please request a new one.',
    invalid:
        'This reset link is invalid or has already been used. Please request a new one.',
    unavailable:
        'Password recovery is unavailable. Supabase environment variables are not configured.',
};

export default function ResetPasswordForm() {
    const recoveryStatus = usePasswordRecoverySession();

    return (
        <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
            <AuthLogo />
            <div className="mt-12 w-full">
                {recoveryStatus === 'checking' && (
                    <p
                        role="status"
                        className="text-center text-xs text-black/60"
                    >
                        Verifying your reset link...
                    </p>
                )}
                {recoveryStatus === 'ready' && <NewPasswordForm />}
                {recoveryStatus !== 'checking' &&
                    recoveryStatus !== 'ready' && (
                        <UnusableLinkNotice
                            message={UNUSABLE_LINK_MESSAGES[recoveryStatus]}
                        />
                    )}
            </div>
        </div>
    );
}

function UnusableLinkNotice({ message }: { message: string }) {
    return (
        <div className="flex flex-col gap-6">
            <p role="alert" className="text-xs leading-relaxed text-red-600">
                {message}
            </p>
            <Link
                href="/forgot-password"
                className="flex h-12 items-center justify-center bg-black text-xs tracking-[0.3em] text-white hover:bg-black/80"
            >
                REQUEST A NEW LINK
            </Link>
            <BackToLoginLink />
        </div>
    );
}

function NewPasswordForm() {
    const router = useRouter();
    const [values, setValues] = useState<NewPasswordValues>({
        password: '',
        passwordConfirm: '',
    });
    const [fieldErrors, setFieldErrors] = useState<NewPasswordErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setValues((previousValues) => ({ ...previousValues, [name]: value }));
        setFieldErrors((previousErrors) => ({
            ...previousErrors,
            [name]: undefined,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        const errors = validateNewPassword(values);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            setErrorMessage(UNUSABLE_LINK_MESSAGES.unavailable);
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.updateUser({
            password: values.password,
        });

        if (error) {
            setIsSubmitting(false);
            setErrorMessage(
                error.code === 'same_password'
                    ? 'Your new password must be different from your current password.'
                    : 'We could not reset your password. Please request a new reset link.',
            );
            return;
        }

        // 복구용 세션을 정리하고 새 비밀번호로 다시 로그인하게 한다.
        await supabase.auth.signOut();
        setIsCompleted(true);
        setTimeout(() => router.replace('/login'), REDIRECT_DELAY_MS);
    }

    if (isCompleted) {
        return (
            <p role="status" className="text-center text-xs text-black/70">
                Your password has been reset. Redirecting to login...
            </p>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full flex-col gap-6"
        >
            <p className="text-xs leading-relaxed text-black/60">
                {PASSWORD_POLICY_MESSAGE}
            </p>

            <AuthField
                label="NEW PASSWORD"
                name="password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                error={fieldErrors.password}
                onChange={handleChange}
            />

            <AuthField
                label="CONFIRM NEW PASSWORD"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                value={values.passwordConfirm}
                error={fieldErrors.passwordConfirm}
                onChange={handleChange}
            />

            {errorMessage && (
                <p role="alert" className="text-xs text-red-600">
                    {errorMessage}
                </p>
            )}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-none bg-black text-xs tracking-[0.3em] text-white hover:bg-black/80"
            >
                {isSubmitting ? 'RESETTING...' : 'RESET PASSWORD'}
            </Button>

            <BackToLoginLink />
        </form>
    );
}
