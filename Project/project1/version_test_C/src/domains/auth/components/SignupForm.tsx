'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { getSupabaseClient } from '@/shared/lib/supabase/client';
import type { SignupFormValues } from '@/domains/auth/types/auth.types';

const MIN_PASSWORD_LENGTH = 6;

export default function SignupForm() {
    const router = useRouter();
    const [values, setValues] = useState<SignupFormValues>({
        email: '',
        password: '',
        passwordConfirm: '',
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        setValues((previousValues) => ({ ...previousValues, [name]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setInfoMessage(null);

        if (values.password !== values.passwordConfirm) {
            setErrorMessage('비밀번호가 일치하지 않습니다.');
            return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            setErrorMessage(
                'Supabase 환경 변수가 설정되지 않았습니다. .env.local을 확인해 주세요.',
            );
            return;
        }

        setIsSubmitting(true);
        const { data, error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
        });
        setIsSubmitting(false);

        if (error) {
            setErrorMessage(error.message);
            return;
        }

        // 이메일 인증이 켜져 있으면 세션 없이 사용자만 생성된다.
        if (!data.session) {
            setInfoMessage(
                '가입 확인 메일을 보냈습니다. 메일 인증 후 로그인해 주세요.',
            );
            return;
        }

        router.push('/');
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-sm flex-col gap-4"
        >
            <h1 className="mb-4 text-2xl font-semibold">JOIN</h1>

            <label className="flex flex-col gap-2 text-sm">
                EMAIL
                <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={values.email}
                    onChange={handleChange}
                    className="h-10"
                />
            </label>

            <label className="flex flex-col gap-2 text-sm">
                PASSWORD
                <Input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={values.password}
                    onChange={handleChange}
                    className="h-10"
                />
            </label>

            <label className="flex flex-col gap-2 text-sm">
                PASSWORD CONFIRM
                <Input
                    type="password"
                    name="passwordConfirm"
                    autoComplete="new-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={values.passwordConfirm}
                    onChange={handleChange}
                    className="h-10"
                />
            </label>

            {errorMessage && (
                <p role="alert" className="text-sm text-red-600">
                    {errorMessage}
                </p>
            )}
            {infoMessage && (
                <p className="text-sm text-gray-600">{infoMessage}</p>
            )}

            <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 h-10 rounded-none bg-black text-white hover:bg-black/80"
            >
                {isSubmitting ? '...' : 'JOIN'}
            </Button>

            <Link
                href="/login"
                className="text-center text-sm text-gray-500 underline-offset-4 hover:underline"
            >
                이미 계정이 있으신가요? LOGIN
            </Link>
        </form>
    );
}
