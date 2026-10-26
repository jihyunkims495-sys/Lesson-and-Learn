'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { resolveCartOwner } from '@/domains/cart/utils/cartOwner';
import type { CartItem } from '@/domains/cart/types/cart.types';
import type { TestPaymentReceipt } from '@/domains/orders/types/order.types';

interface CartStore {
    cartItems: CartItem[];
    setCartItems: (update: (previousItems: CartItem[]) => CartItem[]) => void;
    hasHydrated: boolean;
    completedTestOrders: string[];
    applyTestPayment: (receipt: TestPaymentReceipt) => void;
    // 장바구니를 담은 회원 ID. 비회원이면 null.
    cartOwnerId: string | null;
    syncCartOwner: (userId: string | null) => void;
}

const useCounterStore = create<CartStore>()(
    persist(
        (set) => ({
            // 새 회원과 비회원 모두 빈 장바구니로 시작한다.
            cartItems: [],
            hasHydrated: false,
            completedTestOrders: [],
            cartOwnerId: null,

            // 상품 목록과 Header가 같은 변경 결과를 읽도록 공통 상태를 갱신한다.
            setCartItems: (update) => {
                set((state) => ({
                    cartItems: update(state.cartItems),
                }));
            },
            syncCartOwner: (userId) =>
                set((state) => {
                    const { ownerId, clear } = resolveCartOwner(
                        state.cartOwnerId,
                        userId,
                    );
                    if (!clear && ownerId === state.cartOwnerId) return state;
                    return clear
                        ? { cartOwnerId: ownerId, cartItems: [] }
                        : { cartOwnerId: ownerId };
                }),
            applyTestPayment: (receipt) =>
                set((state) => {
                    if (state.completedTestOrders.includes(receipt.orderId))
                        return state;
                    return {
                        completedTestOrders: [
                            ...state.completedTestOrders,
                            receipt.orderId,
                        ],
                        cartItems: state.cartItems.flatMap((item) => {
                            const purchased = receipt.items.find(
                                (paid) =>
                                    paid.productVariantId ===
                                    item.productVariantId,
                            );
                            const quantity =
                                item.quantity - (purchased?.quantity ?? 0);
                            return quantity > 0 ? [{ ...item, quantity }] : [];
                        }),
                    };
                }),
        }),
        {
            name: 'onepiece-cart',
            storage: createJSONStorage(() => sessionStorage),
            skipHydration: true,
            version: 2,
            // 이전 버전은 데모 상품 3개를 기본으로 넣었으므로, 누가 담았는지 알 수 없는
            // 예전 장바구니는 한 번 비운다.
            migrate: (persisted) => ({
                ...(persisted as Partial<CartStore>),
                cartItems: [],
                cartOwnerId: null,
            }),
            partialize: (state) => ({
                cartItems: state.cartItems,
                completedTestOrders: state.completedTestOrders,
                cartOwnerId: state.cartOwnerId,
            }),
        },
    ),
);

export default useCounterStore;
