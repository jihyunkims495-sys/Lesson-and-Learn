'use client';

import { useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import AuthField from '@/domains/auth/components/AuthField';
import BackToLoginLink from '@/domains/auth/components/BackToLoginLink';
import AuthLogo from '@/domains/auth/components/AuthLogo';
import { getSupabaseClient } from '@/shared/lib/supabase/client';
import { validateEmail } from '@/domains/auth/utils/validateEmail';

// 가입 여부와 관계없이 같은 문구를 보여 계정 존재 여부를 노출하지 않는다.
const SENT_MESSAGE =
    'If an account exists for this email, a password reset link has been sent. Please check your inbox.';

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        setEmail(event.target.value);
        setEmailError(undefined);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        const validationError = validateEmail(email);
        setEmailError(validationError);
        if (validationError) {
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            setErrorMessage(
                'Password recovery is unavailable. Supabase environment variables are not configured.',
            );
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim(),
            { redirectTo: `${window.location.origin}/reset-password` },
        );
        setIsSubmitting(false);

        if (error) {
            setErrorMessage(
                error.status === 429
                    ? 'Too many requests. Please try again in a few minutes.'
                    : 'We could not send the reset link. Please try again later.',
            );
            return;
        }

        setIsSent(true);
    }

    return (
        <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
            <AuthLogo />

            {isSent ? (
                <div className="mt-12 flex w-full flex-col gap-6">
                    <p
                        role="status"
                        className="text-xs leading-relaxed text-black/70"
                    >
                        {SENT_MESSAGE}
                    </p>
                    <BackToLoginLink />
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="mt-12 flex w-full flex-col gap-6"
                >
                    <p className="text-xs leading-relaxed text-black/60">
                        Enter your email and we will send you a link to reset
                        your password.
                    </p>

                    <AuthField
                        label="EMAIL"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        error={emailError}
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
                        {isSubmitting ? 'SENDING...' : 'SEND RESET LINK'}
                    </Button>

                    <BackToLoginLink />
                </form>
            )}
        </div>
    );
}
