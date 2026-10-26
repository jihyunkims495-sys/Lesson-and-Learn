'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, LogOut, ShoppingBag, UserRound } from 'lucide-react';
import useAuthUser from '@/domains/auth/hooks/useAuthUser';
import OrderHistory from '@/domains/orders/components/OrderHistory';

export default function MyPage() {
    const { user, isLoading, signOut } = useAuthUser();
    const [signingOut, setSigningOut] = useState(false);
    const [message, setMessage] = useState('');
    const displayName =
        typeof user?.user_metadata?.display_name === 'string'
            ? user.user_metadata.display_name.trim()
            : '';

    async function handleSignOut() {
        setSigningOut(true);
        setMessage('');
        try {
            await signOut();
        } catch {
            setMessage('로그아웃하지 못했습니다. 다시 시도해 주세요.');
        } finally {
            setSigningOut(false);
        }
    }

    return (
        <main
            lang="ko"
            className="mx-auto min-h-[75vh] max-w-7xl px-5 py-10 sm:px-9 sm:py-14"
        >
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-gray-200 pb-8">
                <div>
                    <p className="mb-3 text-[10px] tracking-[0.25em] text-gray-400">
                        MY ACCOUNT
                    </p>
                    <h1 className="text-[28px] font-normal tracking-wide">
                        마이페이지
                    </h1>
                </div>
                <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black"
                >
                    쇼핑 계속하기 <ArrowRight size={14} aria-hidden="true" />
                </Link>
            </div>

            {isLoading ? (
                <p
                    role="status"
                    className="py-24 text-center text-sm text-gray-500"
                >
                    회원 정보를 확인하는 중입니다…
                </p>
            ) : !user ? (
                <section className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
                    <UserRound size={30} strokeWidth={1} aria-hidden="true" />
                    <h2 className="mt-6 text-lg">로그인이 필요합니다</h2>
                    <p className="mt-3 text-xs leading-6 text-gray-500">
                        로그인하면 나의 주문과 결제 내역을 확인할 수 있습니다.
                    </p>
                    <Link
                        href="/login?next=/mypage"
                        className="mt-7 flex min-h-12 w-full max-w-64 items-center justify-center rounded-lg bg-black px-7 text-xs text-white hover:bg-gray-800"
                    >
                        로그인하기
                    </Link>
                    <Link
                        href="/signup"
                        className="mt-5 text-xs text-gray-500 underline underline-offset-4"
                    >
                        회원가입
                    </Link>
                </section>
            ) : (
                <div className="grid items-start gap-9 pt-9 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
                    <aside
                        aria-label="내 계정"
                        className="rounded-xl border border-gray-200 p-5 sm:p-6"
                    >
                        <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-gray-100">
                            <UserRound
                                size={19}
                                strokeWidth={1.3}
                                aria-hidden="true"
                            />
                        </div>
                        <h2 className="text-sm leading-6">
                            {displayName ? `${displayName}님` : '회원님'},
                            안녕하세요.
                        </h2>
                        <p className="mt-2 text-xs leading-6 break-all text-gray-500">
                            {user.email}
                        </p>
                        <nav
                            aria-label="마이페이지 메뉴"
                            className="mt-6 border-y border-gray-100 py-5"
                        >
                            <a
                                href="#my-orders"
                                className="flex items-center gap-3 text-xs"
                                aria-current="location"
                            >
                                <ShoppingBag
                                    size={15}
                                    strokeWidth={1.3}
                                    aria-hidden="true"
                                />
                                주문·결제 내역
                            </a>
                        </nav>
                        <button
                            type="button"
                            disabled={signingOut}
                            onClick={handleSignOut}
                            className="mt-5 inline-flex min-h-9 items-center gap-2 text-xs text-gray-500 hover:text-black disabled:opacity-50"
                        >
                            <LogOut size={13} aria-hidden="true" />
                            {signingOut ? '로그아웃 중…' : '로그아웃'}
                        </button>
                        {message && (
                            <p
                                role="alert"
                                className="mt-3 text-xs text-red-700"
                            >
                                {message}
                            </p>
                        )}
                    </aside>
                    <div id="my-orders" className="min-w-0 scroll-mt-8">
                        <OrderHistory embedded />
                    </div>
                </div>
            )}
        </main>
    );
}
