import Image from 'next/image';
import { MAX_CART_QUANTITY } from '@/domains/cart/utils/addProductToCart';

import useCartImageUrls from '@/domains/cart/components/useCartImageUrls';
import { formatPrice } from '@/shared/utils/formatPrice';
import type { CartItem } from '@/domains/cart/types/cart.types';

// 상품 목록의 상태는 부모가 관리하므로, 수량 변경 요청도 부모에게 전달한다.
interface CartItemListProps {
    items: CartItem[];
    onIncreaseQuantity: (cartItemId: number) => void;
    onDecreaseQuantity: (cartItemId: number) => void;
    onRemoveItem: (cartItemId: number) => void;
}

export default function CartItemList({
    items,
    onIncreaseQuantity,
    onDecreaseQuantity,
    onRemoveItem,
}: CartItemListProps) {
    // Supabase 이미지는 저장 경로로 서명 URL을 새로 받아 표시한다 (만료된 URL을 저장하지 않기 위해).
    const { getImageUrl, isImagePending } = useCartImageUrls(items);

    // 장바구니에 담긴 상품이 없을 경우 메시지 표시하며, 장바구니의 상태를 이해할 수 있도록 안내한다.
    if (items.length === 0) {
        return <p>YOUR CART IS EMPTY.</p>;
    }

    return (
        <ul className="divide-y divide-gray-200 border-y border-gray-200">
            {items.map((item) => (
                <li key={item.id} className="flex items-start gap-6 py-6">
                    {/* 이미지가 준비된 상품만 표시해, 이미지가 없는 상품도 정보를 확인할 수 있게 한다. */}
                    {getImageUrl(item) && (
                        <Image
                            src={getImageUrl(item) ?? ''}
                            alt={item.productNameAtAdded}
                            width={1122}
                            height={1402}
                            className="h-auto w-28 shrink-0 object-contain"
                        />
                    )}
                    {/* 이미지 주소를 받는 동안 같은 크기의 빈 칸으로 자리를 잡아 화면이 밀리지 않게 한다. */}
                    {isImagePending(item) && (
                        <div
                            aria-hidden="true"
                            className="aspect-[1122/1402] w-28 shrink-0 bg-gray-50"
                        />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-base font-medium">
                            {item.productNameAtAdded}
                        </p>

                        {item.optionTextAtAdded && (
                            <p className="mt-1 text-sm text-gray-500">
                                {item.optionTextAtAdded}
                            </p>
                        )}

                        <p className="mt-3 font-semibold">
                            {formatPrice(item.unitPriceAtAdded)}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {/* 최소 수량을 1개로 유지하도록, 1개일 때 감소 버튼을 비활성화한다. */}
                            <button
                                type="button"
                                aria-label="수량 줄이기"
                                className="rounded border px-3 py-1 disabled:opacity-40"
                                disabled={item.quantity <= 1}
                                onClick={() => onDecreaseQuantity(item.id)}
                            >
                                −
                            </button>

                            <p className="min-w-6 text-center text-sm tabular-nums">
                                {item.quantity}
                            </p>

                            <button
                                type="button"
                                aria-label="수량 늘리기"
                                className="rounded border px-3 py-1 disabled:opacity-40"
                                disabled={item.quantity >= MAX_CART_QUANTITY}
                                onClick={() => onIncreaseQuantity(item.id)}
                            >
                                +
                            </button>

                            <button
                                type="button"
                                aria-label={`${item.productNameAtAdded} REMOVE`}
                                className="rounded border px-3 py-1 text-sm"
                                onClick={() => onRemoveItem(item.id)}
                            >
                                REMOVE
                            </button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
