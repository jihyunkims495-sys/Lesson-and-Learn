import Link from 'next/link';
import { CircleCheck } from 'lucide-react';

import type { TestPaymentReceipt } from '@/domains/orders/types/order.types';

export default function OrderReceipt({
    receipt,
}: {
    receipt: TestPaymentReceipt;
}) {
    return (
        <main
            lang="ko"
            className="mx-auto min-h-[70vh] max-w-xl px-5 py-16 sm:py-24"
        >
            <CircleCheck
                size={32}
                strokeWidth={1}
                className="mx-auto mb-6"
                aria-hidden="true"
            />
            <h1 className="text-center text-2xl">
                테스트 결제가 완료되었습니다
            </h1>
            <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
                실제 금액은 청구되지 않으며, 상품이 배송되지 않습니다.
            </p>
            <dl className="mt-10 space-y-5 rounded-xl border border-gray-200 p-5 text-xs sm:p-7">
                <div className="flex flex-wrap justify-between gap-3">
                    <dt className="text-gray-500">주문번호</dt>
                    <dd className="text-right break-all">
                        {receipt.orderNumber}
                    </dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">주문 상품</dt>
                    <dd className="text-right">{receipt.orderName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">결제수단</dt>
                    <dd>{receipt.method}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">승인 일시</dt>
                    <dd className="text-right">
                        {new Intl.DateTimeFormat('ko-KR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'Asia/Seoul',
                        }).format(new Date(receipt.approvedAt))}
                    </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
                    <dt>결제 금액</dt>
                    <dd className="text-base">
                        {new Intl.NumberFormat('ko-KR').format(receipt.amount)}
                        원
                    </dd>
                </div>
            </dl>
            <Link
                href="/mypage"
                className="mt-7 block text-center text-xs underline underline-offset-4"
            >
                주문·결제 내역 보기
            </Link>
            <Link
                href="/products"
                className="mt-8 flex min-h-13 items-center justify-center rounded-lg bg-black px-7 py-4 text-xs text-white hover:bg-gray-800"
            >
                쇼핑 계속하기
            </Link>
        </main>
    );
}
