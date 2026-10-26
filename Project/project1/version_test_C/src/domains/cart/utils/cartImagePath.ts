import type { CartItem } from '../types/cart.types';

// 이전 장바구니에 서명 URL만 남아 있어도 같은 프로젝트의 파일 경로를 복구합니다.
export function cartImagePath(
    item: CartItem,
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string | null {
    if (item.imageStoragePathAtAdded) return item.imageStoragePathAtAdded;
    if (!item.imageUrlAtAdded || !supabaseUrl) return null;
    try {
        const url = new URL(item.imageUrlAtAdded);
        const prefix = '/storage/v1/object/sign/product-images/';
        if (
            url.origin !== new URL(supabaseUrl).origin ||
            !url.pathname.startsWith(prefix)
        )
            return null;
        return decodeURIComponent(url.pathname.slice(prefix.length)) || null;
    } catch {
        return null;
    }
}
