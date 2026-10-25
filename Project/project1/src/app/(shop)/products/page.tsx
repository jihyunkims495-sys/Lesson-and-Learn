import { Suspense } from 'react';
import ProductCatalog from '@/domains/products/components/ProductCatalog';

export default function Products() {
    // ProductList는 useSearchParams로 ?category= 값을 읽으므로 Suspense로 감싸야 빌드 시 정적 렌더링이 실패하지 않습니다.
    return (
        <Suspense
            fallback={
                <p
                    role="status"
                    className="py-24 text-center text-sm text-neutral-500"
                >
                    상품을 불러오는 중입니다.
                </p>
            }
        >
            <ProductCatalog />
        </Suspense>
    );
}
