'use client';

import { useEffect, useState } from 'react';
import {
    getProductCatalog,
    PRODUCT_IMAGE_URL_LIFETIME,
    type ProductCatalog as CatalogData,
} from '@/domains/products/api/getProductCatalog';
import ProductList from '@/domains/products/components/ProductList';
import { getSupabaseClient } from '@/shared/lib/supabase/client';

type CatalogState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'success'; data: CatalogData };

export default function ProductCatalog() {
    const [state, setState] = useState<CatalogState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            try {
                const supabase = getSupabaseClient();
                if (!supabase)
                    throw new Error('Supabase 환경 변수가 없습니다.');
                const data = await getProductCatalog(
                    supabase,
                    controller.signal,
                );
                if (!controller.signal.aborted)
                    setState({ status: 'success', data });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('상품 목록 조회 실패:', error);
                setState({ status: 'error' });
            }
        }

        void load();
        // 오래 열린 페이지에서도 서명 URL이 만료되지 않도록 30분마다 갱신합니다.
        const refresh = window.setInterval(
            () => void load(),
            (PRODUCT_IMAGE_URL_LIFETIME * 1000) / 2,
        );
        return () => {
            controller.abort();
            window.clearInterval(refresh);
        };
    }, [attempt]);

    function retry() {
        setState({ status: 'loading' });
        setAttempt((value) => value + 1);
    }

    if (state.status === 'loading') {
        return (
            <p
                role="status"
                className="py-24 text-center text-sm text-neutral-500"
            >
                상품을 불러오는 중입니다.
            </p>
        );
    }

    if (state.status === 'error') {
        return (
            <div role="alert" className="space-y-4 py-24 text-center text-sm">
                <p>상품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
                <button
                    type="button"
                    onClick={retry}
                    className="cursor-pointer rounded border px-4 py-2"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <>
            {state.data.missingImageCount > 0 && (
                <div
                    role="status"
                    className="flex items-center justify-center gap-4 px-5 py-4 text-sm text-neutral-600"
                >
                    <p>일부 상품 이미지를 불러오지 못했습니다.</p>
                    <button
                        type="button"
                        onClick={retry}
                        className="cursor-pointer underline"
                    >
                        다시 시도
                    </button>
                </div>
            )}
            <ProductList
                products={state.data.products}
                categories={state.data.categories}
            />
        </>
    );
}
