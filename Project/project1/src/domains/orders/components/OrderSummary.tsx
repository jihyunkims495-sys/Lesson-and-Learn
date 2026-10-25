import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import useCartImageUrls from '@/domains/cart/components/useCartImageUrls';
import type { CartItem } from '@/domains/cart/types/cart.types';

const formatWon = (price: number) =>
    `${new Intl.NumberFormat('ko-KR').format(price)}원`;

interface OrderSummaryProps {
    items: CartItem[];
    formId: string;
    paymentMessage: string;
    busy: boolean;
    sdkReady: boolean;
}

export default function OrderSummary({
    items,
    formId,
    paymentMessage,
    busy,
    sdkReady,
}: OrderSummaryProps) {
    // Supabase 이미지는 저장 경로로 서명 URL을 새로 받아 표시한다.
    const { getImageUrl, isImagePending } = useCartImageUrls(items);
    const quantity = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
        (total, item) => total + item.unitPriceAtAdded * item.quantity,
        0,
    );
    // 현재 배송비 정책. 실제 결제 연결 시 서버가 가격과 배송비를 다시 검증해야 한다.
    const shipping = 0;
    const total = subtotal + shipping;

    return (
        <aside
            aria-labelledby="order-summary-title"
            className="min-w-0 rounded-xl border border-gray-100 p-6 shadow-[0_4px_20px_#00000008] sm:p-7 lg:sticky lg:top-8"
        >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2
                    id="order-summary-title"
                    className="text-xs tracking-widest"
                >
                    주문 요약
                </h2>
                <span className="text-[10px] text-gray-400">
                    총 {quantity}개
                </span>
            </div>

            <ul className="space-y-6">
                {items.map((item) => (
                    <li
                        key={item.id}
                        className="grid grid-cols-[62px_minmax(0,1fr)] items-center gap-4"
                    >
                        <div className="relative h-[78px] bg-gray-50">
                            {getImageUrl(item) ? (
                                <Image
                                    src={getImageUrl(item) ?? ''}
                                    alt={item.productNameAtAdded}
                                    fill
                                    sizes="62px"
                                    className="object-contain"
                                />
                            ) : (
                                // 이미지 주소를 받는 중이면 빈 칸만 두고, 정말 없을 때만 안내 문구를 표시한다.
                                !isImagePending(item) && (
                                    <span className="flex h-full items-center justify-center text-center text-[9px] text-gray-400">
                                        이미지 없음
                                    </span>
                                )
                            )}
                        </div>
                        <div className="min-w-0 break-words">
                            <p className="text-[11px] leading-relaxed">
                                {item.productNameAtAdded}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                                {item.optionTextAtAdded
                                    ? `${item.optionTextAtAdded} · `
                                    : ''}
                                수량 {item.quantity}개
                            </p>
                            <p className="mt-2 text-xs">
                                {formatWon(
                                    item.unitPriceAtAdded * item.quantity,
                                )}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>

            <dl className="mt-7 space-y-3 border-t border-gray-200 pt-5 text-[11px]">
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">상품 금액</dt>
                    <dd>{formatWon(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">배송비</dt>
                    <dd>{shipping === 0 ? '무료' : formatWon(shipping)}</dd>
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-200 pt-5">
                    <dt className="tracking-widest">총 결제 금액</dt>
                    <dd className="text-base">{formatWon(total)}</dd>
                </div>
            </dl>

            {/* 왼쪽 form을 제출하므로 오른쪽 버튼에서도 기본 입력 검증이 동작한다. */}
            <button
                type="submit"
                form={formId}
                disabled={busy || !sdkReady}
                className="mt-6 flex min-h-13 w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-black px-3 py-4 text-[11px] tracking-wide text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-wait disabled:opacity-50"
            >
                {busy
                    ? '결제 진행 중…'
                    : !sdkReady
                      ? '결제창 불러오는 중…'
                      : `${formatWon(total)} 결제하기`}{' '}
                <ArrowRight size={14} aria-hidden="true" />
            </button>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-gray-400">
                테스트 결제입니다. 실제 금액은 청구되지 않습니다.
            </p>
            {paymentMessage && (
                <p
                    role="alert"
                    className="mt-4 border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-700"
                >
                    {paymentMessage}
                </p>
            )}
            <p className="mt-5 text-center">
                <Link
                    href="/cart"
                    className="text-[10px] text-gray-500 underline underline-offset-4 hover:text-black"
                >
                    장바구니 수정
                </Link>
            </p>
        </aside>
    );
}
