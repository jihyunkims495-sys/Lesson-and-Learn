import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { getProductDetail } from './getProductDetail';
import { checkCartAvailability } from '@/domains/cart/api/checkCartAvailability';
import { addProductToCart } from '@/domains/cart/utils/addProductToCart';

function fixture(
    options: {
        empty?: boolean;
        variants?: boolean;
        denied?: boolean;
        storageFail?: boolean;
        stock?: number;
        price?: number;
    } = {},
) {
    const requests: { method: string; url: URL }[] = [];
    const client = createClient(
        'https://detail.supabase.test',
        'public-test-key',
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
            global: {
                fetch: async (input, init) => {
                    const url = new URL(
                        input instanceof Request ? input.url : String(input),
                    );
                    requests.push({ method: init?.method ?? 'GET', url });
                    if (init?.signal?.aborted)
                        throw new DOMException('Aborted', 'AbortError');
                    if (options.denied)
                        return Response.json(
                            { message: 'permission denied' },
                            { status: 403 },
                        );
                    if (url.pathname === '/rest/v1/products')
                        return Response.json(
                            options.empty
                                ? []
                                : [
                                      {
                                          id: 5,
                                          category_id: '11',
                                          name: 'DB 자켓',
                                          detail: 'DB 설명',
                                          product_care: 'DB 관리',
                                          shipping: 'DB 배송',
                                          list_price: 120000,
                                          sale_price: 114460,
                                          is_new: false,
                                          product_images: [
                                              {
                                                  id: 2,
                                                  storage_path: 'model.png',
                                                  role: 'model',
                                                  sort_order: 2,
                                                  alt_text: null,
                                              },
                                              {
                                                  id: 1,
                                                  storage_path: 'main.png',
                                                  role: 'main',
                                                  sort_order: 0,
                                                  alt_text: '대표',
                                              },
                                          ],
                                      },
                                  ],
                        );
                    if (url.pathname === '/rest/v1/product_variants')
                        return Response.json(
                            options.variants === false
                                ? []
                                : [
                                      {
                                          id: 1,
                                          size_label: 'M',
                                          stock_quantity: options.stock ?? 100,
                                          sort_order: 0,
                                          products: {
                                              name: 'DB 자켓',
                                              sale_price:
                                                  options.price ?? 114460,
                                              status: 'active',
                                          },
                                      },
                                  ],
                        );
                    if (
                        url.pathname ===
                        '/storage/v1/object/sign/product-images'
                    ) {
                        if (options.storageFail)
                            return Response.json(
                                { message: 'storage failed' },
                                { status: 500 },
                            );
                        const body = JSON.parse(String(init?.body)) as {
                            paths: string[];
                            expiresIn: number;
                        };
                        assert.equal(body.expiresIn, 3600);
                        return Response.json(
                            body.paths.map((path) => ({
                                path,
                                error: null,
                                signedURL: `/object/sign/product-images/${path}?token=new`,
                            })),
                        );
                    }
                    throw new Error('Unexpected endpoint');
                },
            },
        },
    );
    return { client, requests };
}
const signal = () => new AbortController().signal;
const detail = async () =>
    (await getProductDetail(fixture().client, 5, signal()))!;

describe('Supabase 상세와 결제 전 옵션 검사', () => {
    it('DB 상품·실제 옵션·정렬된 이미지와 서명 URL을 조회한다', async () => {
        const { client, requests } = fixture();
        const product = (await getProductDetail(client, 5, signal()))!;
        assert.equal(product.detail, 'DB 설명');
        assert.deepEqual(product.variants, [
            { id: 1, sizeLabel: 'M', stockQuantity: 100 },
        ]);
        assert.equal(product.images[0].storagePath, 'main.png');
        assert.ok(product.images[0].url?.endsWith('main.png?token=new'));
        const variantQuery = requests.find((request) =>
            request.url.pathname.endsWith('product_variants'),
        )!.url;
        assert.equal(variantQuery.searchParams.get('product_id'), 'eq.5');
        assert.equal(variantQuery.searchParams.get('is_active'), 'eq.true');
        assert.ok(
            requests.every((request) =>
                request.url.pathname.startsWith('/rest/')
                    ? request.method === 'GET'
                    : request.method === 'POST',
            ),
        );
    });
    it('없는 상품은 null, 옵션이 없는 상품은 빈 옵션으로 반환한다', async () => {
        assert.equal(
            await getProductDetail(
                fixture({ empty: true }).client,
                999,
                signal(),
            ),
            null,
        );
        const product = (await getProductDetail(
            fixture({ variants: false }).client,
            5,
            signal(),
        ))!;
        assert.deepEqual(product.variants, []);
        assert.equal(addProductToCart([], product, 100052).items.length, 0);
    });
    it('재고 0을 보존하고 이미지 발급 실패가 상품 정보를 없애지 않는다', async () => {
        const product = (await getProductDetail(
            fixture({ storageFail: true, stock: 0 }).client,
            5,
            signal(),
        ))!;
        assert.equal(product.variants[0].stockQuantity, 0);
        assert.equal(product.images[0].url, undefined);
        assert.equal(product.images[0].storagePath, 'main.png');
    });
    it('조회 권한 오류와 취소를 빈 옵션으로 숨기지 않는다', async () => {
        await assert.rejects(
            getProductDetail(fixture({ denied: true }).client, 5, signal()),
        );
        const controller = new AbortController();
        controller.abort();
        await assert.rejects(
            getProductDetail(fixture().client, 5, controller.signal),
        );
    });
    it('실제 옵션으로 담은 장바구니를 주문 생성 없이 GET으로 검사한다', async () => {
        const { client, requests } = fixture();
        await checkCartAvailability(
            client,
            addProductToCart([], await detail(), 1).items,
        );
        assert.ok(requests.every((request) => request.method === 'GET'));
        assert.equal(requests[0].url.searchParams.get('id'), 'in.(1)');
        assert.equal(
            requests[0].url.searchParams.get('products.status'),
            'eq.active',
        );
    });
    it('기존 임시 옵션 ID를 상품명이 있는 복구 안내로 차단한다', async () => {
        const items = addProductToCart([], await detail(), 1).items.map(
            (item) => ({ ...item, productVariantId: 100052 }),
        );
        await assert.rejects(
            checkCartAvailability(fixture().client, items),
            /DB 자켓: 현재 구매할 수 없는 옵션/,
        );
    });
    it('품절·수량 초과·변경된 가격과 네트워크 실패를 결제 준비 전에 차단한다', async () => {
        const items = addProductToCart([], await detail(), 1).items;
        await assert.rejects(
            checkCartAvailability(fixture({ stock: 0 }).client, items),
            /구매 가능한 수량/,
        );
        await assert.rejects(
            checkCartAvailability(fixture().client, [
                { ...items[0], quantity: 100 },
            ]),
            /구매 가능한 수량/,
        );
        await assert.rejects(
            checkCartAvailability(fixture({ price: 1 }).client, items),
            /가격이 변경/,
        );
        await assert.rejects(
            checkCartAvailability(fixture({ denied: true }).client, items),
            /확인하지 못했습니다/,
        );
    });
});
