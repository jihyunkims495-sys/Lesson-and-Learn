'use client';

/**
 * 상품 목록 화면 전체를 구성하는 컴포넌트입니다.
 * 데이터 흐름: page.tsx → ProductCatalog → ProductList → ProductGrid → ProductCard.
 * ProductCatalog에서 조회한 상품을 그리드에 전달하고 열 개수·카테고리 버튼을 배치합니다.
 * useState·onClick·useSearchParams를 사용하므로 파일 맨 위에 'use client' 선언이 필요합니다.
 * 이 선언은 이 파일을 클라이언트 컴포넌트의 진입점으로 지정합니다.
 */
// import type은 실행할 값이 아니라 TypeScript의 타입 검사에 사용할 정의를 가져옵니다.
import type { ProductListItem } from '@/domains/products/types/product.types';
import type { Category } from '@/domains/categories/types/category.types';
import ProductGrid from '@/domains/products/components/ProductGrid';
import ProductSort from '@/domains/products/components/ProductSort';
import {
    sortProducts,
    type ProductSortOrder,
} from '@/domains/products/utils/sortProducts';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Props는 부모 컴포넌트가 이 컴포넌트에 전달하는 값의 이름과 타입입니다.
interface ProductListProps {
    /** Supabase에서 조회해 화면 타입으로 변환한 상품과 카테고리입니다. */
    products: ProductListItem[];
    categories: Category[];
}

// { products }는 전달받은 props 객체에서 products 값만 꺼내는 구조 분해 문법입니다.
export default function ProductList({
    products,
    categories,
}: ProductListProps) {
    // useState는 선택한 값을 다음 렌더링에도 기억하게 합니다.
    // 첫 번째 값은 현재 상태, 두 번째 함수는 그 상태를 변경하는 함수입니다.
    // 버튼의 값은 숫자가 아닌 문자열 '3'·'4'·'6'으로 비교하며, 처음에는 '6'을 선택합니다.
    // 선택값은 ProductGrid에 전달되어 PC 화면의 열 개수에 쓰입니다.
    const [selectedGridId, setSelectedGridId] = useState('6');
    const [sortOrder, setSortOrder] = useState<ProductSortOrder>('default');
    // 선택한 카테고리는 상태가 아니라 주소의 ?category= 값으로 관리합니다.
    // 그래서 헤더 드롭다운 링크로 들어와도, 새로고침하거나 링크를 공유해도 같은 목록이 보입니다.
    // 값이 없거나 조회된 카테고리에 없는 ID면 ALL로 처리합니다.
    const categoryParam = useSearchParams().get('category');
    const selectedCategory = categories.find(
        (category) => category.id === categoryParam,
    );
    // 버튼 강조에 쓰는 값입니다. 'all'은 ALL 버튼을 뜻하는 화면용 값이며 실제 Category의 ID가 아닙니다.
    // 소분류를 고른 경우에는 부모 대분류 ID로 같은 그룹의 소분류 목록을 찾습니다.
    const selectedCategoryId = selectedCategory?.id ?? 'all';
    const selectedTopCategoryId = selectedCategory
        ? (selectedCategory.parent_id ?? selectedCategory.id)
        : 'all';
    const selectedTopCategory = categories.find(
        (category) => category.id === selectedTopCategoryId,
    );
    // 상단에는 항상 대분류를, 하단에는 선택한 대분류의 소분류를 표시합니다.
    const topCategories = categories.filter(
        (category) => category.parent_id === null,
    );
    const subCategories = categories.filter(
        (category) => category.parent_id === selectedTopCategoryId,
    );

    // ALL이면 전체 상품을 보여줍니다.
    // 소분류를 고르면 categoryId가 같은 상품만, 대분류를 고르면 그 아래 소분류의 상품을 모두 남깁니다.
    // 상품은 소분류 ID만 가지므로 조회된 카테고리의 parent_id로 대분류를 비교합니다.
    const visibleProducts = selectedCategory
        ? products.filter(
              (product) =>
                  product.categoryId === selectedCategory.id ||
                  categories.some(
                      (category) =>
                          category.id === product.categoryId &&
                          category.parent_id === selectedCategory.id,
                  ),
          )
        : products;
    const sortedProducts = sortProducts(visibleProducts, sortOrder);

    return (
        <section>
            {/*
             * PC에서는 열 개수 선택을 왼쪽, 카테고리를 가운데, 정렬을 오른쪽에 배치합니다.
             * 작은 화면에서는 열 개수·정렬 아래에 카테고리를 배치합니다.
             * 높이는 내용에 맞춰 늘어나며 ALL PRODUCTS 선택 시 하단 박스 공간도 사라집니다.
             */}
            <div
                id="top"
                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-y-5 px-5 pt-7 pb-8 text-sm lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
            >
                {/*
                 * 열 개수 선택 버튼입니다. flex로 가로 배치하고 gap-x-6으로 간격을 줍니다.
                 * justify-self-start는 그리드 칸 왼쪽에 내용 너비만큼만 박스를 배치합니다.
                 * rounded-xl은 모서리, px-4·py-4는 안쪽 여백, shadow-md는 바깥 그림자입니다.
                 * 각 버튼의 onClick은 상태를 변경하며 전체 페이지를 새로고침하지 않습니다.
                 * 조건 ? A : B 문법으로 선택된 버튼은 검정, 나머지는 회색으로 표시합니다.
                 * cursor-pointer는 버튼에 마우스를 올릴 때 손가락 커서를 표시합니다.
                 */}
                <ul className="flex items-center gap-x-4 justify-self-start rounded-xl px-3 py-4 shadow-md sm:gap-x-6 sm:px-4">
                    {/* 3열 선택: 상품 정보는 모든 열 개수에서 항상 표시합니다. */}
                    <li>
                        <button
                            onClick={() => setSelectedGridId('3')}
                            className={`cursor-pointer ${
                                selectedGridId === '3'
                                    ? 'text-black'
                                    : 'text-gray-400'
                            }`}
                        >
                            3
                        </button>
                    </li>
                    {/* 4열 선택 */}
                    <li>
                        <button
                            onClick={() => setSelectedGridId('4')}
                            className={`cursor-pointer ${
                                selectedGridId === '4'
                                    ? 'text-black'
                                    : 'text-gray-400'
                            }`}
                        >
                            4
                        </button>
                    </li>
                    {/* 6열 선택: 초기 선택값입니다. */}
                    <li>
                        <button
                            onClick={() => setSelectedGridId('6')}
                            className={`cursor-pointer ${
                                selectedGridId === '6'
                                    ? 'text-black'
                                    : 'text-gray-400'
                            }`}
                        >
                            6
                        </button>
                    </li>
                </ul>

                <div className="col-span-2 row-start-2 flex min-w-0 flex-col items-center gap-3 lg:col-span-1 lg:col-start-2 lg:row-start-1">
                    {/* 상단 대분류는 소분류를 선택한 뒤에도 그대로 유지합니다. */}
                    <ul
                        id="category"
                        aria-label="대분류"
                        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl px-6 py-4 text-center shadow-md sm:gap-x-10 sm:px-8"
                    >
                        <li>
                            <Link
                                href="/products"
                                scroll={false}
                                aria-current={
                                    selectedTopCategoryId === 'all'
                                        ? 'page'
                                        : undefined
                                }
                                className={
                                    selectedTopCategoryId === 'all'
                                        ? 'block whitespace-nowrap text-black'
                                        : 'block whitespace-nowrap text-gray-400'
                                }
                            >
                                ALL PRODUCTS
                            </Link>
                        </li>
                        {topCategories.map((category) => (
                            <li key={category.id}>
                                <Link
                                    href={`/products?category=${category.id}`}
                                    scroll={false}
                                    aria-current={
                                        selectedTopCategoryId === category.id
                                            ? 'true'
                                            : undefined
                                    }
                                    className={
                                        selectedTopCategoryId === category.id
                                            ? 'block whitespace-nowrap text-black'
                                            : 'block whitespace-nowrap text-gray-400'
                                    }
                                >
                                    {category.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* 하단 ALL은 전체 상품이 아니라 선택한 대분류의 전체 상품으로 이동합니다. */}
                    {selectedTopCategory && subCategories.length > 0 && (
                        <ul
                            id="subcategory"
                            aria-label={`${selectedTopCategory.name} 소분류`}
                            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl px-6 py-4 text-center shadow-md sm:gap-x-10 sm:px-8"
                        >
                            <li>
                                <Link
                                    href={`/products?category=${selectedTopCategory.id}`}
                                    scroll={false}
                                    aria-current={
                                        selectedCategoryId ===
                                        selectedTopCategoryId
                                            ? 'page'
                                            : undefined
                                    }
                                    className={
                                        selectedCategoryId ===
                                        selectedTopCategoryId
                                            ? 'block whitespace-nowrap text-black'
                                            : 'block whitespace-nowrap text-gray-400'
                                    }
                                >
                                    ALL
                                </Link>
                            </li>
                            {subCategories.map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/products?category=${category.id}`}
                                        scroll={false}
                                        aria-current={
                                            selectedCategoryId === category.id
                                                ? 'page'
                                                : undefined
                                        }
                                        className={
                                            selectedCategoryId === category.id
                                                ? 'block whitespace-nowrap text-black'
                                                : 'block whitespace-nowrap text-gray-400'
                                        }
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="col-start-2 row-start-1 justify-self-end lg:col-start-3">
                    <ProductSort
                        value={sortOrder}
                        onValueChange={setSortOrder}
                    />
                </div>
            </div>

            {/*
             * 상품 목록 본문입니다. px-5로 상단 영역과 동일한 좌우 여백을 줍니다.
             * pb-24는 마지막 상품 줄과 푸터 사이에 96px 여백을 두어 두 영역을 구분합니다.
             * 선택한 카테고리로 거르고 정렬한 sortedProducts를 전달합니다.
             * grid에는 현재 선택한 문자열 값을 넘겨 ProductGrid가 열 클래스를 정하도록 합니다.
             * 해당 카테고리 상품이 없으면 ProductGrid가 안내 문구를 보여줍니다.
             */}
            <div>
                <div className="px-5 pb-24">
                    <ProductGrid
                        products={sortedProducts}
                        grid={selectedGridId}
                    />
                </div>
            </div>
        </section>
    );
}
