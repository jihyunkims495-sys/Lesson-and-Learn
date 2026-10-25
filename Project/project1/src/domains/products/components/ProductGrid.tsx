/**
 * 상품 배열을 여러 열로 배치하는 컴포넌트입니다.
 * 상품을 직접 조회하거나 선택 상태를 만들지 않고 ProductList에서 받은 값을 사용합니다.
 * 카드 하나의 모양은 ProductCard가 담당하고, 이 파일은 카드들의 배치를 담당합니다.
 * ProductList의 클라이언트 컴포넌트 경계 안에서 사용됩니다.
 */
import ProductCard from '@/domains/products/components/ProductCard';
import type { ProductListItem } from '@/domains/products/types/product.types';

interface ProductGridProps {
    /** 화면에 나열할 상품들입니다. 비어 있으면 안내 문구를 표시합니다. */
    products: ProductListItem[];
    /** ProductList에서 선택한 열 개수입니다. 현재 버튼은 '3'·'4'·'6'을 전달합니다. */
    grid: string;
}

export default function ProductGrid({ products, grid }: ProductGridProps) {
    // 선택한 값에 맞는 Tailwind 클래스를 고릅니다. 3도 4도 아니면 6열 클래스를 씁니다.
    // 완성된 클래스 이름을 적어 Tailwind가 필요한 CSS를 찾아 생성할 수 있게 합니다.
    // lg:는 기본 설정 기준 화면 너비 1024px 이상에서만 적용됩니다.
    // 현재 작은 화면의 열 개수는 아래 기본·md 클래스가 결정하며, 반응형 세부 조정은 추후 작업입니다.
    const gridClass =
        grid === '3'
            ? 'lg:grid-cols-3'
            : grid === '4'
              ? 'lg:grid-cols-4'
              : 'lg:grid-cols-6';

    // length는 배열에 들어 있는 항목 개수입니다. 함수가 아니므로 괄호 없이 사용합니다.
    // 상품이 없으면 여기서 먼저 반환해 빈 그리드 대신 안내 문구를 보여줍니다.
    if (products.length === 0) {
        return (
            <p className="py-24 text-center text-sm text-neutral-500">
                등록된 상품이 없습니다.
            </p>
        );
    }

    // 기본 2열 → md(기본 768px 이상) 3열 → lg 이상에서 선택한 3·4·6열로 표시합니다.
    // gap-x는 열 사이, gap-y는 행 사이 간격이며 lg 이상에서는 가로 간격을 늘립니다.
    // aria-label은 보조 기술에 이 목록의 용도를 설명합니다.
    return (
        <ul
            aria-label="상품 목록"
            className={`grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6 ${gridClass}`}
        >
            {/*
             * 상품마다 목록 항목 하나와 카드 하나를 만듭니다. key는 상품의 고유 ID입니다.
             * product에는 상품 객체 전체를 전달합니다.
             * 열 개수는 배치만 결정하며 ProductCard는 상품 정보를 항상 표시합니다.
             */}
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard product={product} />
                </li>
            ))}
        </ul>
    );
}
