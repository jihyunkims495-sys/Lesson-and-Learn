import type { SupabaseClient } from '@supabase/supabase-js';
import type { CartItem } from '../types/cart.types';
import { MAX_CART_QUANTITY } from '../utils/addProductToCart';

interface AvailableVariant {
    id: number;
    stock_quantity: number;
    products: { name: string; sale_price: number; status: string };
}

// 주문 생성 전 읽기만으로 검사합니다. 이전 버전의 임시 옵션 번호도 검출합니다.
export async function checkCartAvailability(
    supabase: SupabaseClient,
    items: CartItem[],
) {
    if (!items.length) throw new Error('장바구니가 비어 있습니다.');
    const { data, error } = await supabase
        .from('product_variants')
        .select('id, stock_quantity, products!inner(name, sale_price, status)')
        .in(
            'id',
            items.map((item) => item.productVariantId),
        )
        .eq('is_active', true)
        .eq('products.status', 'active')
        .overrideTypes<AvailableVariant[], { merge: false }>();
    if (error)
        throw new Error(
            '상품 옵션을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
    for (const item of items) {
        const variant = data.find(
            (entry) => entry.id === item.productVariantId,
        );
        if (!variant)
            throw new Error(
                `${item.productNameAtAdded}: 현재 구매할 수 없는 옵션입니다. 장바구니에서 삭제하고 상품 상세에서 다시 선택해 주세요.`,
            );
        if (
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > Math.min(MAX_CART_QUANTITY, variant.stock_quantity)
        )
            throw new Error(
                `${item.productNameAtAdded}: 구매 가능한 수량을 초과했습니다. 장바구니에서 수량을 줄여 주세요.`,
            );
        if (item.unitPriceAtAdded !== variant.products.sale_price)
            throw new Error(
                `${item.productNameAtAdded}: 가격이 변경됐습니다. 장바구니에서 삭제하고 상품 상세에서 다시 담아 주세요.`,
            );
    }
}
