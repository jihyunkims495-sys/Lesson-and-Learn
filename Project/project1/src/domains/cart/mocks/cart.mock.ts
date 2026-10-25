import type { CartItem } from '@/domains/cart/types/cart.types';

export const mockCartItems: CartItem[] = [
    {
        id: 1,
        cartId: 1,
        productVariantId: 1,
        quantity: 1,
        unitPriceAtAdded: 114460, // Supabase 데모 옵션 1: 블랙 집업 자켓
        productNameAtAdded: '블랙 집업 자켓',
        optionTextAtAdded: 'BLACK / M', //장바구니 담은 시점의 옵션 텍스트
        imageUrlAtAdded: '/images/cart/outerJacketBlack.png', //장바구니 담은 시점의 이미지 URL
    },
    {
        id: 2,
        cartId: 1,
        productVariantId: 2,
        quantity: 1,
        unitPriceAtAdded: 56260,
        productNameAtAdded: '블랙 반팔 티셔츠',
        optionTextAtAdded: 'BLACK / L',
        imageUrlAtAdded: '/images/cart/topTShirtBlack.png', //장바구니 담은 시점의 이미지 URL
    },
    {
        id: 3,
        cartId: 1,
        productVariantId: 3,
        quantity: 1,
        unitPriceAtAdded: 153260,
        productNameAtAdded: '아이보리 싱글 코트',
        optionTextAtAdded: 'IVORY / L',
        imageUrlAtAdded: '/images/cart/outerCoatIvory.png', //장바구니 담은 시점의 이미지 URL
    },
];
