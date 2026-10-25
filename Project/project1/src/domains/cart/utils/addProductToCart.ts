import type { CartItem } from '../types/cart.types';
import type { ProductDetailData } from '@/domains/products/api/getProductDetail';

export const MAX_CART_QUANTITY = 99;

// 직전 상태에서 검사와 추가를 함께 수행해 연속 클릭에도 한도를 지킵니다.
export function addProductToCart(
    items: CartItem[],
    product: ProductDetailData,
    variantId: number | null,
): { items: CartItem[]; message: string } {
    const variant = product.variants.find((entry) => entry.id === variantId);
    if (!variant) return { items, message: '사이즈를 선택해 주세요.' };
    if (variant.stockQuantity <= 0)
        return { items, message: '선택한 사이즈는 품절입니다.' };
    const sameItem = items.find((item) => item.productVariantId === variant.id);
    const limit = Math.min(MAX_CART_QUANTITY, variant.stockQuantity);
    if ((sameItem?.quantity ?? 0) >= limit)
        return {
            items,
            message: `선택한 사이즈는 최대 ${limit}개까지 담을 수 있습니다.`,
        };
    const metadata = {
        unitPriceAtAdded: product.salePrice,
        productNameAtAdded: product.name,
        optionTextAtAdded: variant.sizeLabel,
        imageUrlAtAdded: null,
        imageStoragePathAtAdded:
            product.images.find((image) => image.role === 'main')
                ?.storagePath ?? null,
    };
    const nextItems = sameItem
        ? items.map((item) =>
              item.productVariantId === variant.id
                  ? { ...item, ...metadata, quantity: item.quantity + 1 }
                  : item,
          )
        : [
              ...items,
              {
                  ...metadata,
                  id: Math.max(0, ...items.map((item) => item.id)) + 1,
                  cartId: items[0]?.cartId ?? 1,
                  productVariantId: variant.id,
                  quantity: 1,
              },
          ];
    return {
        items: nextItems,
        message: `장바구니에 담았습니다. (사이즈 ${variant.sizeLabel})`,
    };
}
