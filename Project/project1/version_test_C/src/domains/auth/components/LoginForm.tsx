'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/ui/button';
import AuthField from '@/domains/auth/components/AuthField';
import AuthLogo from '@/domains/auth/components/AuthLogo';
import { getSupabaseClient } from '@/shared/lib/supabase/client';
import type { LoginFormValues } from '@/domains/auth/types/auth.types';
import {
    validateLoginForm,
    type LoginFormErrors,
} from '@/domains/auth/utils/validateLoginForm';

export default function LoginForm() {
    const router = useRouter();
    const [values, setValues] = useState<LoginFormValues>({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setValues((previousValues) => ({ ...previousValues, [name]: value }));
        // 사용자가 수정을 시작한 필드의 오류는 바로 지워 재입력을 방해하지 않는다.
        setFieldErrors((previousErrors) => ({
            ...previousErrors,
            [name]: undefined,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);

        const errors = validateLoginForm(values);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            setErrorMessage(
                'Login is unavailable. Supabase environment variables are not configured.',
            );
            return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email.trim(),
            password: values.password,
        });
        setIsSubmitting(false);

        if (error) {
            setErrorMessage(error.message);
            return;
        }

        // Only these known destinations are accepted, avoiding arbitrary redirects.
        const next = new URLSearchParams(window.location.search).get('next');
        router.push(next === '/mypage' || next === '/checkout' ? next : '/');
    }

    return (
        <div className="mx-auto flex w-full max-w-[360px] flex-col items-center">
            <AuthLogo />

            <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-12 flex w-full flex-col gap-6"
            >
                <AuthField
                    label="EMAIL"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    error={fieldErrors.email}
                    onChange={handleChange}
                />

                <AuthField
                    label="PASSWORD"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={values.password}
                    error={fieldErrors.password}
                    onChange={handleChange}
                />

                <Link
                    href="/forgot-password"
                    className="-mt-2 self-end text-xs text-black/60 underline-offset-4 hover:text-black hover:underline"
                >
                    Forgot password?
                </Link>

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
                    {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
                </Button>

                <p className="text-center text-xs text-black/60">
                    New to ONEPIECE?{' '}
                    <Link
                        href="/signup"
                        className="font-semibold tracking-widest text-black underline-offset-4 hover:underline"
                    >
                        JOIN
                    </Link>
                </p>
            </form>
        </div>
    );
}
