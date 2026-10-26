import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProductListItem } from '../types/product.types';
import { sortProducts } from './sortProducts';

function product(
    id: number,
    salePrice: number,
    createdAt: string,
): ProductListItem {
    return {
        id,
        salePrice,
        listPrice: 100000 - salePrice,
        createdAt,
        categoryId: '11',
        categoryName: 'JACKET',
        name: `상품 ${id}`,
        images: [],
        new: false,
    };
}

describe('상품 정렬', () => {
    const products = [
        product(3, 20000, '2026-10-20T00:00:00Z'),
        product(1, 50000, '2026-10-22T00:00:00Z'),
        product(2, 20000, '2026-10-22T00:00:00Z'),
    ];
    const ids = (rows: ProductListItem[]) => rows.map((row) => row.id);

    it('정가가 아닌 판매가로 정렬하고 같은 가격은 기본 순서를 유지한다', () => {
        assert.deepEqual(ids(sortProducts(products, 'price-low')), [3, 2, 1]);
        assert.deepEqual(ids(sortProducts(products, 'price-high')), [1, 3, 2]);
    });

    it('신상품 표시 여부와 무관하게 등록일을 우선하고 같은 등록일은 ID 내림차순으로 정렬한다', () => {
        assert.deepEqual(ids(sortProducts(products, 'newest')), [2, 1, 3]);
    });

    it('정렬 후 기본순으로 돌아가면 원래 조회 순서를 복원한다', () => {
        sortProducts(products, 'price-low');
        sortProducts(products, 'newest');
        assert.deepEqual(ids(sortProducts(products, 'default')), [3, 1, 2]);
        assert.deepEqual(sortProducts([], 'newest'), []);
    });
});
