import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import {
    getProductCatalog,
    PRODUCT_IMAGE_URL_LIFETIME,
} from './getProductCatalog';

const categories = [
    { id: 'outer', parent_id: null, name: 'OUTER', sort_order: 1 },
    { id: 'coat', parent_id: 'outer', name: 'COAT', sort_order: 1 },
];

function image(id: number, role: string, sortOrder: number) {
    return {
        id,
        role,
        sort_order: sortOrder,
        storage_path: `${role}.png`,
        original_name: `${role}.png`,
        mime_type: 'image/png',
        file_size: 1024,
        created_at: '2026-10-21T00:00:00Z',
    };
}

const products = [
    {
        id: 42,
        category_id: 'coat',
        name: 'DB 상품',
        list_price: 20000,
        sale_price: 15000,
        is_new: true,
        created_at: '2026-10-22T00:00:00Z',
        product_images: [
            image(3, 'detail', 3),
            image(1, 'main', 1),
            image(4, 'hover', 4),
            image(2, 'model', 2),
        ],
    },
];

function fixture(
    options: {
        empty?: boolean;
        productError?: boolean;
        missingImage?: string;
        storageError?: boolean;
    } = {},
) {
    const requests: { url: URL; body: unknown }[] = [];
    const fakeFetch: typeof fetch = async (input, init) => {
        if (init?.signal?.aborted)
            throw new DOMException('Aborted', 'AbortError');
        const url = new URL(
            input instanceof Request ? input.url : String(input),
        );
        requests.push({
            url,
            body: init?.body ? JSON.parse(String(init.body)) : undefined,
        });
        if (url.pathname === '/rest/v1/categories')
            return Response.json(options.empty ? [] : categories);
        if (url.pathname === '/rest/v1/products') {
            if (options.productError)
                return Response.json(
                    { code: '42501', message: 'permission denied' },
                    { status: 403 },
                );
            return Response.json(options.empty ? [] : products);
        }
        if (url.pathname === '/storage/v1/object/sign/product-images') {
            if (options.storageError)
                return Response.json(
                    { message: 'Storage unavailable' },
                    { status: 400 },
                );
            const { paths } = JSON.parse(String(init?.body)) as {
                paths: string[];
            };
            return Response.json(
                paths.map((path) =>
                    path === options.missingImage
                        ? { path, error: 'Object not found', signedURL: null }
                        : {
                              path,
                              error: null,
                              signedURL: `/object/sign/product-images/${path}?token=test`,
                          },
                ),
            );
        }
        throw new Error(`Unexpected request: ${url.pathname}`);
    };
    const client = createClient('https://catalog.supabase.test', 'test-key', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: { fetch: fakeFetch },
    });
    return { client, requests };
}

describe('Supabase 상품 목록 조회', () => {
    it('공개 상품과 카테고리를 조회하고 DB 응답과 서명 URL을 카드 타입으로 변환한다', async () => {
        const { client, requests } = fixture();
        const catalog = await getProductCatalog(
            client,
            new AbortController().signal,
        );
        assert.equal(catalog.products.length, 1);
        const product = catalog.products[0];
        assert.equal(product.id, 42);
        assert.equal(product.categoryId, 'coat');
        assert.equal(product.categoryName, 'COAT');
        assert.equal(product.listPrice, 20000);
        assert.equal(product.salePrice, 15000);
        assert.equal(product.new, true);
        assert.equal(product.createdAt, '2026-10-22T00:00:00Z');
        assert.deepEqual(
            catalog.categories.map((row) => row.depth),
            [0, 1],
        );
        assert.equal(
            product.images.find((row) => row.location === 'product_main')?.url,
            'https://catalog.supabase.test/storage/v1/object/sign/product-images/main.png?token=test',
        );
        assert.equal(
            product.images.find((row) => row.location === 'product_desc')
                ?.original_name,
            'hover.png',
        );
        assert.equal(catalog.missingImageCount, 0);
        const productRequest = requests.find(
            (row) => row.url.pathname === '/rest/v1/products',
        )!;
        assert.ok(
            productRequest.url.searchParams
                .get('select')
                ?.includes('created_at'),
        );
        assert.equal(
            productRequest.url.searchParams.get('status'),
            'eq.active',
        );
        assert.equal(
            productRequest.url.searchParams.get('order'),
            'sort_order.asc,id.asc',
        );
        assert.equal(
            requests
                .find((row) => row.url.pathname === '/rest/v1/categories')
                ?.url.searchParams.get('is_active'),
            'eq.true',
        );
        const signing = requests.find((row) =>
            row.url.pathname.includes('/object/sign/'),
        )!;
        assert.equal(
            (signing.body as { expiresIn: number }).expiresIn,
            PRODUCT_IMAGE_URL_LIFETIME,
        );
    });

    it('이미지 하나가 누락되어도 상품을 유지하고 누락 건수와 빈 이미지 주소를 반환한다', async () => {
        const { client } = fixture({ missingImage: 'main.png' });
        const catalog = await getProductCatalog(
            client,
            new AbortController().signal,
        );
        assert.equal(catalog.products.length, 1);
        assert.equal(catalog.missingImageCount, 1);
        const main = catalog.products[0].images.find(
            (row) => row.location === 'product_main',
        );
        assert.equal(main?.url, undefined);
        assert.equal(main?.done, false);
    });

    it('Storage 요청 실패와 상품 조회 실패를 구분한다', async () => {
        const { client } = fixture({ storageError: true });
        const catalog = await getProductCatalog(
            client,
            new AbortController().signal,
        );
        assert.equal(catalog.products.length, 1);
        assert.equal(catalog.missingImageCount, 4);
        const { client: denied } = fixture({ productError: true });
        await assert.rejects(
            getProductCatalog(denied, new AbortController().signal),
            { message: 'permission denied' },
        );
    });

    it('상품이 없으면 빈 목록을 반환하고 Storage 요청은 보내지 않는다', async () => {
        const { client, requests } = fixture({ empty: true });
        assert.deepEqual(
            await getProductCatalog(client, new AbortController().signal),
            {
                products: [],
                categories: [],
                missingImageCount: 0,
            },
        );
        assert.equal(requests.length, 2);
    });

    it('취소된 요청의 결과는 전달하지 않는다', async () => {
        const { client } = fixture();
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(getProductCatalog(client, controller.signal), {
            name: 'AbortError',
        });
    });
});
