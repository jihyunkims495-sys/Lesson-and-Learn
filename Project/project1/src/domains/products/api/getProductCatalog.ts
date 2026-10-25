import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '@/domains/categories/types/category.types';
import type { FileInfo } from '@/domains/files/types/file.types';
import type { ProductListItem } from '@/domains/products/types/product.types';

interface CategoryRow {
    id: string;
    parent_id: string | null;
    name: string;
    sort_order: number;
}

interface ProductImageRow {
    id: number;
    storage_path: string;
    original_name: string;
    mime_type: string;
    file_size: number;
    role: 'main' | 'detail' | 'model' | 'hover';
    sort_order: number;
    created_at: string;
}

interface ProductRow {
    id: number;
    category_id: string;
    name: string;
    list_price: number;
    sale_price: number;
    is_new: boolean;
    created_at: string;
    product_images: ProductImageRow[];
}

export interface ProductCatalog {
    products: ProductListItem[];
    categories: Category[];
    missingImageCount: number;
}

// URL 만료 전에 화면에서 다시 조회합니다. URL 자체는 DB에 저장하지 않습니다.
export const PRODUCT_IMAGE_URL_LIFETIME = 60 * 60;

export async function getProductCatalog(
    supabase: SupabaseClient,
    signal: AbortSignal,
): Promise<ProductCatalog> {
    const [categoryResult, productResult] = await Promise.all([
        supabase
            .from('categories')
            .select('id, parent_id, name, sort_order')
            .eq('is_active', true)
            .order('sort_order')
            .order('id')
            .abortSignal(signal)
            .overrideTypes<CategoryRow[], { merge: false }>(),
        supabase
            .from('products')
            .select(
                `
                id, category_id, name, list_price, sale_price, is_new, created_at,
                product_images(id, storage_path, original_name, mime_type,
                    file_size, role, sort_order, created_at)
            `,
            )
            .eq('status', 'active')
            .order('sort_order')
            .order('id')
            .abortSignal(signal)
            .overrideTypes<ProductRow[], { merge: false }>(),
    ]);

    signal.throwIfAborted();
    if (categoryResult.error) throw categoryResult.error;
    if (productResult.error) throw productResult.error;

    const categories = categoryResult.data.map((row) => ({
        ...row,
        depth: row.parent_id === null ? 0 : 1,
    }));
    const categoryNames = new Map(categories.map((row) => [row.id, row.name]));
    const paths = [
        ...new Set(
            productResult.data.flatMap((product) =>
                product.product_images.map((image) => image.storage_path),
            ),
        ),
    ];
    const imageUrls = new Map<string, string>();

    if (paths.length > 0) {
        const { data } = await supabase.storage
            .from('product-images')
            .createSignedUrls(paths, PRODUCT_IMAGE_URL_LIFETIME);
        signal.throwIfAborted();

        // 파일 하나가 누락돼도 상품명과 가격은 조회할 수 있게 합니다.
        for (const image of data ?? []) {
            if (!image.error && image.path && image.signedUrl) {
                imageUrls.set(image.path, image.signedUrl);
            }
        }
    }

    const products = productResult.data.map((row): ProductListItem => ({
        id: row.id,
        categoryId: row.category_id,
        categoryName: categoryNames.get(row.category_id) ?? '미분류',
        name: row.name,
        listPrice: row.list_price,
        salePrice: row.sale_price,
        new: row.is_new,
        createdAt: row.created_at,
        images: [...row.product_images]
            // 전용 hover 이미지가 있으면 카드의 두 번째 이미지로 우선 사용합니다.
            .sort(
                (a, b) =>
                    Number(b.role === 'hover') - Number(a.role === 'hover') ||
                    a.sort_order - b.sort_order ||
                    a.id - b.id,
            )
            .map((image): FileInfo => ({
                id: image.id,
                gid: image.storage_path,
                location:
                    image.role === 'main' ? 'product_main' : 'product_desc',
                original_name: image.original_name,
                content_type: image.mime_type,
                extension:
                    image.original_name.split('.').pop()?.toLowerCase() ?? '',
                file_size: image.file_size,
                done: imageUrls.has(image.storage_path),
                seq: image.sort_order,
                created_at: image.created_at,
                url: imageUrls.get(image.storage_path),
            })),
    }));

    return {
        products,
        categories,
        missingImageCount: paths.length - imageUrls.size,
    };
}
