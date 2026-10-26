'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { confirmPayment } from '@/domains/orders/api/tossPayment';
import OrderReceipt from '@/domains/orders/components/OrderReceipt';
import type { TestPaymentReceipt } from '@/domains/orders/types/order.types';
import useCounterStore from '@/shared/store/useCounterStore';

export default function PaymentResult({
    failed = false,
}: {
    failed?: boolean;
}) {
    const params = useSearchParams();
    const hasHydrated = useCounterStore((state) => state.hasHydrated);
    const applyTestPayment = useCounterStore((state) => state.applyTestPayment);
    const [result, setResult] = useState<{
        inputKey: string;
        receipt?: TestPaymentReceipt;
        error?: string;
    } | null>(null);
    const [attempt, setAttempt] = useState(0);
    const orderId = params.get('orderId') ?? '';
    const paymentKey = params.get('paymentKey') ?? '';
    const amount = params.get('amount') ?? '';
    const inputKey = JSON.stringify([orderId, paymentKey, amount, attempt]);
    const currentResult = result?.inputKey === inputKey ? result : null;
    const invalid = !orderId || !paymentKey || !/^\d+$/.test(amount);
    const canceled =
        params.get('code') === 'PAY_PROCESS_CANCELED' ||
        params.get('code') === 'USER_CANCEL';

    useEffect(() => {
        if (failed || invalid || !hasHydrated) return;
        let active = true;
        void confirmPayment({ orderId, paymentKey, amount: Number(amount) })
            .then((approved) => {
                if (!active) return;
                applyTestPayment(approved);
                setResult({ inputKey, receipt: approved });
            })
            .catch((failure: unknown) => {
                if (active)
                    setResult({
                        inputKey,
                        error:
                            failure instanceof Error
                                ? failure.message
                                : '승인 상태를 확인하지 못했습니다.',
                    });
            });
        return () => {
            active = false;
        };
    }, [
        failed,
        invalid,
        hasHydrated,
        orderId,
        paymentKey,
        amount,
        inputKey,
        applyTestPayment,
    ]);

    if (!failed && !invalid && currentResult?.receipt)
        return <OrderReceipt receipt={currentResult.receipt} />;
    const loading = !failed && !invalid && !currentResult;
    return (
        <main
            lang="ko"
            className="mx-auto min-h-[65vh] max-w-xl px-5 py-24 text-center"
        >
            <h1 className="text-xl leading-relaxed tracking-wide">
                {loading
                    ? '결제 승인 확인 중입니다'
                    : failed
                      ? canceled
                          ? '결제를 취소했습니다'
                          : '결제가 완료되지 않았습니다'
                      : '결제 확인이 필요합니다'}
            </h1>
            <p
                role={loading ? 'status' : 'alert'}
                className="mt-5 text-sm leading-relaxed text-gray-500"
            >
                {loading
                    ? '토스에서 결제 결과를 확인하고 있습니다. 잠시만 기다려 주세요.'
                    : failed
                      ? '장바구니는 유지됩니다. 주문 내용을 확인한 후 다시 시도해 주세요.'
                      : invalid
                        ? '결제 승인 정보가 없습니다. 주문 / 결제 화면에서 결제를 시작해 주세요.'
                        : currentResult?.error}
            </p>
            {!loading && (
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {!failed && !invalid && (
                        <button
                            type="button"
                            onClick={() => {
                                setAttempt((value) => value + 1);
                            }}
                            className="cursor-pointer border border-black px-6 py-4 text-xs"
                        >
                            승인 상태 다시 확인
                        </button>
                    )}
                    <Link
                        href="/checkout"
                        className="inline-block bg-black px-7 py-4 text-xs text-white hover:bg-gray-800"
                    >
                        주문 / 결제로 돌아가기
                    </Link>
                </div>
            )}
        </main>
    );
}
