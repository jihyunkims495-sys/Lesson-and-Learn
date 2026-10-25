import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProductToCart } from './addProductToCart';
import { cartImagePath } from './cartImagePath';
import { resolveCartOwner } from './cartOwner';
import type { ProductDetailData } from '@/domains/products/api/getProductDetail';
import type { CartItem } from '../types/cart.types';

const product: ProductDetailData = {
    id: 5,
    categoryId: '11',
    name: 'DB 자켓',
    detail: '',
    productCare: '',
    shipping: '',
    listPrice: 120000,
    salePrice: 114460,
    isNew: false,
    images: [
        {
            id: 1,
            storagePath: 'jacket.png',
            url: 'https://expired.invalid',
            role: 'main',
            sortOrder: 0,
            alt: '',
        },
    ],
    variants: [{ id: 1, sizeLabel: 'M', stockQuantity: 100 }],
};
const first = () => addProductToCart([], product, 1).items[0];

describe('DB 옵션 장바구니 담기', () => {
    it('실제 옵션 ID와 경로를 저장하며 만료되는 URL은 저장하지 않는다', () => {
        const item = first();
        assert.equal(item.productVariantId, 1);
        assert.equal(item.optionTextAtAdded, 'M');
        assert.equal(item.imageStoragePathAtAdded, 'jacket.png');
        assert.equal(item.imageUrlAtAdded, null);
    });
    it('같은 옵션은 한 줄에서 +1하고 오래된 상품명·가격·이미지도 갱신한다', () => {
        const old = {
            ...first(),
            productNameAtAdded: 'old',
            unitPriceAtAdded: 1,
            imageStoragePathAtAdded: null,
            imageUrlAtAdded: '/old.png',
        };
        const result = addProductToCart([old], product, 1);
        assert.equal(result.items.length, 1);
        assert.equal(result.items[0].quantity, 2);
        assert.equal(result.items[0].unitPriceAtAdded, 114460);
        assert.equal(result.items[0].productNameAtAdded, product.name);
        assert.equal(result.items[0].imageStoragePathAtAdded, 'jacket.png');
        assert.equal(result.items[0].imageUrlAtAdded, null);
        assert.equal(old.quantity, 1);
    });
    it('선택하지 않은 옵션이나 없는 S 사이즈를 만들지 않는다', () => {
        assert.deepEqual(addProductToCart([], product, null).items, []);
        assert.deepEqual(addProductToCart([], product, 100052).items, []);
        assert.deepEqual(
            addProductToCart([], { ...product, variants: [] }, 1).items,
            [],
        );
    });
    it('다른 옵션과 다른 상품을 별도 줄로 보관한다', () => {
        const another = {
            ...product,
            id: 1,
            variants: [{ id: 3, sizeLabel: 'L', stockQuantity: 10 }],
        };
        const result = addProductToCart([first()], another, 3);
        assert.deepEqual(
            result.items.map((item) => item.productVariantId),
            [1, 3],
        );
        assert.deepEqual(
            result.items.map((item) => item.id),
            [1, 2],
        );
    });
    it('품절과 재고 한도, 연속 담기 99개 한도를 지킨다', () => {
        assert.equal(
            addProductToCart(
                [],
                {
                    ...product,
                    variants: [{ id: 1, sizeLabel: 'M', stockQuantity: 0 }],
                },
                1,
            ).items.length,
            0,
        );
        let items: CartItem[] = [];
        for (let index = 0; index < 110; index++)
            items = addProductToCart(items, product, 1).items;
        assert.equal(items[0].quantity, 99);
        const lowStock = {
            ...product,
            variants: [{ id: 1, sizeLabel: 'M', stockQuantity: 1 }],
        };
        assert.equal(
            addProductToCart([first()], lowStock, 1).items[0].quantity,
            1,
        );
    });
});

describe('장바구니 이미지 경로 호환', () => {
    const origin = 'https://example.supabase.co';
    it('저장 경로를 우선 사용한다', () =>
        assert.equal(cartImagePath(first(), origin), 'jacket.png'));
    it('만료된 서명 URL에서 파일 경로만 복구한다', () => {
        const item = {
            ...first(),
            imageStoragePathAtAdded: null,
            imageUrlAtAdded: `${origin}/storage/v1/object/sign/product-images/folder/a%20b.png?token=expired`,
        };
        assert.equal(cartImagePath(item, origin), 'folder/a b.png');
    });
    it('기존 데모 이미지, 다른 프로젝트, 잘못된 URL은 서명 대상으로 바꾸지 않는다', () => {
        for (const url of [
            '/products/a.png',
            'https://other.supabase.co/storage/v1/object/sign/product-images/a.png',
            'invalid',
        ])
            assert.equal(
                cartImagePath(
                    {
                        ...first(),
                        imageStoragePathAtAdded: null,
                        imageUrlAtAdded: url,
                    },
                    origin,
                ),
                null,
            );
    });
});

describe('장바구니 회원 전환', () => {
    it('비회원이 담은 상품은 로그인해도 유지한다', () => {
        assert.deepEqual(resolveCartOwner(null, 'user-a'), {
            ownerId: 'user-a',
            clear: false,
        });
    });

    it('같은 회원이면 유지한다', () => {
        assert.equal(resolveCartOwner('user-a', 'user-a').clear, false);
    });

    it('로그아웃하거나 다른 회원으로 바뀌면 비운다', () => {
        assert.deepEqual(resolveCartOwner('user-a', null), {
            ownerId: null,
            clear: true,
        });
        assert.equal(resolveCartOwner('user-a', 'user-b').clear, true);
    });
});
