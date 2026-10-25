'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useAuthUser from '@/domains/auth/hooks/useAuthUser';
import type { OrderHistoryEntry } from '../types/order.types';

const labels: Record<string, string> = {
    READY: '결제 대기',
    IN_PROGRESS: '승인 확인 중',
    DONE: '결제 완료',
    CANCELED: '결제 취소',
    PARTIAL_CANCELED: '부분 취소',
    ABORTED: '결제 실패',
    EXPIRED: '결제 만료',
    WAITING_FOR_DEPOSIT: '입금 대기',
};
const date = (value: string) =>
    new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Seoul',
    }).format(new Date(value));
const won = (value: number) =>
    `${new Intl.NumberFormat('ko-KR').format(value)}원`;
const filters = [
    { id: 'all', label: '전체' },
    { id: 'paid', label: '결제 완료' },
    { id: 'pending', label: '결제 대기' },
    { id: 'cancelled', label: '취소' },
    { id: 'failed', label: '실패·만료' },
] as const;
type OrderFilter = (typeof filters)[number]['id'];

function latestPayment(order: OrderHistoryEntry) {
    return [...order.payments].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
    )[0];
}
function orderGroup(order: OrderHistoryEntry): OrderFilter {
    const payment = latestPayment(order);
    if (
        order.status === 'cancelled' ||
        payment?.status === 'CANCELED' ||
        payment?.status === 'PARTIAL_CANCELED'
    )
        return 'cancelled';
    if (payment?.status === 'DONE') return 'paid';
    if (payment?.status === 'ABORTED' || payment?.status === 'EXPIRED')
        return 'failed';
    return 'pending';
}

export default function OrderHistory({
    embedded = false,
}: {
    embedded?: boolean;
}) {
    const { user, isLoading } = useAuthUser();
    const userId = user?.id ?? '';
    const [attempt, setAttempt] = useState(0);
    const [filter, setFilter] = useState<OrderFilter>('all');
    const [result, setResult] = useState<{
        userId: string;
        entries?: OrderHistoryEntry[];
        error?: string;
        login?: boolean;
    } | null>(null);
    useEffect(() => {
        if (isLoading || !userId) return;
        const controller = new AbortController();
        fetch('/api/orders', { cache: 'no-store', signal: controller.signal })
            .then(async (response) => {
                const body = await response.json();
                if (!controller.signal.aborted)
                    setResult(
                        response.ok
                            ? { userId, entries: body }
                            : {
                                  userId,
                                  error: body.message,
                                  login: response.status === 401,
                              },
                    );
            })
            .catch(() => {
                if (!controller.signal.aborted)
                    setResult({
                        userId,
                        error: '주문 내역을 불러오지 못했습니다.',
                    });
            });
        return () => controller.abort();
    }, [userId, isLoading, attempt]);
    // Hide prior account data immediately on sign-out or account switch.
    const current = result?.userId === userId ? result : null;
    const entries = user && !isLoading ? current?.entries : undefined;
    const shown = entries?.filter(
        (order) => filter === 'all' || orderGroup(order) === filter,
    );
    const Container = embedded ? 'section' : 'main';
    const Heading = embedded ? 'h2' : 'h1';

    return (
        <Container
            lang="ko"
            aria-label="주문·결제 내역"
            className={
                embedded
                    ? ''
                    : 'mx-auto min-h-[75vh] max-w-4xl px-5 py-12 sm:px-9'
            }
        >
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-7">
                <Heading className="text-xl font-normal tracking-wide">
                    주문·결제 내역
                </Heading>
                <Link
                    href={embedded ? '/cart' : '/mypage'}
                    className="text-xs text-gray-500 hover:text-black"
                >
                    {embedded ? '장바구니 보기' : '마이페이지'}
                </Link>
            </div>
            <p className="py-5 text-xs leading-6 text-gray-500">
                테스트 결제 내역입니다. 실제 금액 청구와 상품 배송은 진행되지
                않습니다. 최근 주문 50건을 기준으로 표시합니다.
            </p>
            {entries && (
                <>
                    <dl className="mb-6 grid grid-cols-3 divide-x divide-gray-200 rounded-xl border border-gray-200 py-6 text-center">
                        {[
                            { label: '전체 주문', count: entries.length },
                            {
                                label: '결제 완료',
                                count: entries.filter(
                                    (order) => orderGroup(order) === 'paid',
                                ).length,
                            },
                            {
                                label: '결제 대기',
                                count: entries.filter(
                                    (order) => orderGroup(order) === 'pending',
                                ).length,
                            },
                        ].map((stat) => (
                            <div key={stat.label} className="px-2">
                                <dt className="text-[11px] text-gray-500">
                                    {stat.label}
                                </dt>
                                <dd className="mt-3 text-2xl font-normal">
                                    {stat.count}
                                    <span className="ml-1 text-xs text-gray-400">
                                        건
                                    </span>
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <div
                        role="group"
                        aria-label="주문 상태 필터"
                        className="mb-6 flex flex-wrap gap-2"
                    >
                        {filters.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                aria-pressed={filter === option.id}
                                onClick={() => setFilter(option.id)}
                                className={`min-h-9 rounded-full border px-4 text-[11px] transition-colors ${filter === option.id ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-black'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
            {isLoading ? (
                <p
                    role="status"
                    className="py-16 text-center text-sm text-gray-500"
                >
                    로그인 상태를 확인하는 중입니다…
                </p>
            ) : !user ? (
                <div className="rounded-xl border border-gray-200 py-16 text-center">
                    <p className="text-sm">
                        로그인하면 주문 내역을 확인할 수 있습니다.
                    </p>
                    <Link
                        href="/login?next=/mypage"
                        className="mt-6 inline-block rounded-lg bg-black px-7 py-3 text-xs text-white"
                    >
                        로그인하기
                    </Link>
                </div>
            ) : !current ? (
                <p
                    role="status"
                    className="py-16 text-center text-sm text-gray-500"
                >
                    주문 내역을 불러오는 중입니다…
                </p>
            ) : current.error ? (
                <div
                    role="alert"
                    className="rounded-xl border border-gray-200 py-14 text-center text-sm"
                >
                    <p>{current.error}</p>
                    {current.login ? (
                        <Link
                            href="/login?next=/mypage"
                            className="mt-6 inline-block rounded-lg bg-black px-7 py-3 text-xs text-white"
                        >
                            로그인하기
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAttempt((value) => value + 1)}
                            className="mt-6 text-xs underline underline-offset-4"
                        >
                            다시 불러오기
                        </button>
                    )}
                </div>
            ) : !shown?.length ? (
                <div className="rounded-xl border border-gray-200 px-5 py-16 text-center">
                    <p className="text-sm">
                        {entries?.length
                            ? '선택한 상태의 주문이 없습니다.'
                            : '아직 주문 내역이 없습니다.'}
                    </p>
                    <p className="mt-3 text-xs leading-6 text-gray-500">
                        {entries?.length
                            ? '다른 상태를 선택하면 주문을 확인할 수 있습니다.'
                            : '주문을 완료하면 이곳에서 상품과 결제 정보를 확인할 수 있습니다.'}
                    </p>
                    {!entries?.length && (
                        <Link
                            href="/products"
                            className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-black px-7 text-xs text-white hover:bg-gray-800"
                        >
                            상품 둘러보기
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-5">
                    {shown.map((order) => {
                        const payment = latestPayment(order);
                        return (
                            <article
                                key={order.id}
                                className="rounded-xl border border-gray-200 p-5 sm:p-7"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 text-xs">
                                    <div>
                                        <p className="text-gray-500">
                                            {date(order.created_at)}
                                        </p>
                                        <p className="mt-2 break-all">
                                            {order.order_number}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-gray-100 px-3 py-1.5">
                                        {order.status === 'cancelled'
                                            ? '주문 취소'
                                            : payment
                                              ? (labels[payment.status] ??
                                                payment.status)
                                              : '결제 정보 없음'}
                                    </span>
                                </div>
                                <ul className="space-y-3 py-5 text-sm">
                                    {order.order_items.map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex justify-between gap-4"
                                        >
                                            <div>
                                                {item.product_name}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {item.option_text} ·{' '}
                                                    {item.quantity}개
                                                </p>
                                            </div>
                                            <span className="text-xs whitespace-nowrap">
                                                {won(
                                                    item.unit_price *
                                                        item.quantity,
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex flex-wrap justify-between gap-3 border-t border-gray-100 pt-4 text-xs">
                                    <p className="text-gray-500">
                                        {payment?.method ?? '결제수단 미확정'}
                                        {payment?.approved_at
                                            ? ` · ${date(payment.approved_at)}`
                                            : ''}
                                    </p>
                                    <strong className="text-sm font-medium">
                                        {won(order.total_amount)}
                                    </strong>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </Container>
    );
}
