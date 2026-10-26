import type { SupabaseClient } from '@supabase/supabase-js';
import { PRODUCT_IMAGE_URL_LIFETIME } from '@/domains/products/api/getProductCatalog';

/*
 * 상품 상세 한 건을 Supabase에서 조회합니다.
 *
 * 가져오는 것
 * 1. 상품 정보 (이름·설명·관리·배송 안내·가격)
 * 2. 상품 이미지 (역할 main·detail·model과 저장 경로)
 * 3. 사이즈 옵션 (product_variants: 옵션 번호·사이즈·재고)
 *
 * 이미지 주소는 비공개 버킷의 1시간짜리 서명 URL입니다. URL은 저장하지 않고 화면에서만 씁니다.
 * 장바구니처럼 오래 보관해야 하는 곳에는 URL 대신 저장 경로(storagePath)를 넘깁니다.
 */

// 이미지 버킷 이름 (getProductCatalog와 같은 버킷). 장바구니 이미지 재발급에서도 사용합니다.
export const PRODUCT_IMAGE_BUCKET = 'product-images';

interface ProductDetailImageRow {
    id: number;
    storage_path: string;
    role: 'main' | 'detail' | 'model' | 'hover';
    sort_order: number;
    alt_text: string | null;
}

interface ProductDetailRow {
    id: number;
    category_id: string;
    name: string;
    detail: string;
    product_care: string;
    shipping: string;
    list_price: number;
    sale_price: number;
    is_new: boolean;
    product_images: ProductDetailImageRow[];
}

interface ProductVariantRow {
    id: number;
    size_label: string;
    stock_quantity: number;
    sort_order: number;
}

/** 상세 화면에 쓰는 이미지 한 장 */
export interface ProductDetailImage {
    id: number;
    /** 버킷 안의 파일 경로. 장바구니에 저장해 두고 나중에 URL을 다시 받는 데 사용합니다. */
    storagePath: string;
    /** 1시간짜리 서명 URL. 발급에 실패하면 undefined */
    url: string | undefined;
    role: ProductDetailImageRow['role'];
    sortOrder: number;
    alt: string;
}

/** 사이즈 옵션 하나 (DB product_variants 한 줄) */
export interface ProductVariant {
    /** 옵션 번호. 장바구니·결제에서 이 번호로 DB 가격을 다시 확인합니다. */
    id: number;
    sizeLabel: string;
    stockQuantity: number;
}

/** 상품 상세 화면에 필요한 데이터 전체 */
export interface ProductDetailData {
    id: number;
    categoryId: string;
    name: string;
    detail: string;
    productCare: string;
    shipping: string;
    listPrice: number;
    salePrice: number;
    isNew: boolean;
    images: ProductDetailImage[];
    variants: ProductVariant[];
}

/**
 * 상품 id로 상세 정보를 조회합니다.
 * 판매 중(status = 'active')이 아니거나 없는 상품이면 null을 돌려줍니다.
 */
export async function getProductDetail(
    supabase: SupabaseClient,
    productId: number,
    signal: AbortSignal,
): Promise<ProductDetailData | null> {
    // 상품(+이미지)과 사이즈 옵션을 동시에 조회합니다.
    const [productResult, variantResult] = await Promise.all([
        supabase
            .from('products')
            .select(
                `
                id, category_id, name, detail, product_care, shipping,
                list_price, sale_price, is_new,
                product_images(id, storage_path, role, sort_order, alt_text)
            `,
            )
            .eq('id', productId)
            .eq('status', 'active')
            .limit(1)
            .abortSignal(signal)
            .overrideTypes<ProductDetailRow[], { merge: false }>(),
        supabase
            .from('product_variants')
            .select('id, size_label, stock_quantity, sort_order')
            .eq('product_id', productId)
            .eq('is_active', true)
            .order('sort_order')
            .order('id')
            .abortSignal(signal)
            .overrideTypes<ProductVariantRow[], { merge: false }>(),
    ]);

    signal.throwIfAborted();
    if (productResult.error) throw productResult.error;
    if (variantResult.error) throw variantResult.error;

    const row = productResult.data[0];
    if (!row) return null;

    // 이미지 순서: sort_order → id
    const imageRows = [...row.product_images].sort(
        (a, b) => a.sort_order - b.sort_order || a.id - b.id,
    );

    // 저장 경로 목록으로 서명 URL을 한 번에 발급합니다.
    const imageUrls = new Map<string, string>();
    if (imageRows.length > 0) {
        const { data } = await supabase.storage
            .from(PRODUCT_IMAGE_BUCKET)
            .createSignedUrls(
                imageRows.map((image) => image.storage_path),
                PRODUCT_IMAGE_URL_LIFETIME,
            );
        signal.throwIfAborted();

        // 파일 하나가 누락돼도 상품 정보는 보여 줄 수 있게, 성공한 것만 담습니다.
        for (const image of data ?? []) {
            if (!image.error && image.path && image.signedUrl) {
                imageUrls.set(image.path, image.signedUrl);
            }
        }
    }

    return {
        id: row.id,
        categoryId: row.category_id,
        name: row.name,
        detail: row.detail,
        productCare: row.product_care,
        shipping: row.shipping,
        listPrice: row.list_price,
        salePrice: row.sale_price,
        isNew: row.is_new,
        images: imageRows.map((image) => ({
            id: image.id,
            storagePath: image.storage_path,
            url: imageUrls.get(image.storage_path),
            role: image.role,
            sortOrder: image.sort_order,
            alt: image.alt_text ?? `${row.name} 이미지 ${image.sort_order}`,
        })),
        variants: variantResult.data.map((variant) => ({
            id: variant.id,
            sizeLabel: variant.size_label,
            stockQuantity: variant.stock_quantity,
        })),
    };
}
