import type { ProductListItem } from '@/domains/products/types/product.types';

export const PRODUCT_SORT_OPTIONS = [
    { value: 'default', label: 'Default' },
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
] as const;

export type ProductSortOrder = (typeof PRODUCT_SORT_OPTIONS)[number]['value'];

export function sortProducts(
    products: ProductListItem[],
    order: ProductSortOrder,
): ProductListItem[] {
    // 기본순은 Supabase의 sort_order·id 조회 순서를 그대로 유지합니다.
    if (order === 'default') return products;

    // 원본을 보존해야 기본순으로 돌아갈 때 원래 순서를 복원할 수 있습니다.
    return [...products].sort((a, b) => {
        if (order === 'price-low') return a.salePrice - b.salePrice;
        if (order === 'price-high') return b.salePrice - a.salePrice;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id;
    });
}
