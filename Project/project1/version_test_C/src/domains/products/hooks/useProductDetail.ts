'use client';

import { useEffect, useState } from 'react';
import {
    getProductCatalog,
    PRODUCT_IMAGE_URL_LIFETIME,
} from '@/domains/products/api/getProductCatalog';
import {
    getProductDetail,
    type ProductDetailData,
} from '@/domains/products/api/getProductDetail';
import type { ProductListItem } from '@/domains/products/types/product.types';
import { getSupabaseClient } from '@/shared/lib/supabase/client';

/*
 * 상품 상세 화면의 데이터 불러오기 (ProductCatalog와 같은 방식)
 *
 * - 상품 상세(+사이즈 옵션)와, 하단 추천·최근 본 상품에 쓸 전체 상품 목록을 함께 불러옵니다.
 * - 이미지 서명 URL이 1시간 뒤 만료되므로 30분마다 다시 불러옵니다.
 * - 전체 상품 목록은 실패해도 상세 화면은 보여 줍니다. (하단 상품 줄만 비어 보임)
 *
 * status
 *   loading  : 불러오는 중
 *   error    : 조회 실패 (retry로 다시 시도)
 *   notFound : 없는 상품이거나 판매 중이 아님
 *   success  : product(상세)와 catalogProducts(전체 상품 목록)를 사용
 */
// products.id 컬럼(INTEGER)의 최댓값
const MAX_DB_INTEGER = 2147483647;

type ProductDetailState =
    | { status: 'loading' }
    | { status: 'error'; productId: number }
    | { status: 'notFound'; productId: number }
    | {
          status: 'success';
          productId: number;
          product: ProductDetailData;
          catalogProducts: ProductListItem[];
      };

export default function useProductDetail(productId: number) {
    const [state, setState] = useState<ProductDetailState>({
        status: 'loading',
    });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            // 주소가 숫자가 아니거나 DB 정수 범위를 벗어나면 조회하지 않고 "없는 상품"으로 처리합니다.
            if (
                !Number.isSafeInteger(productId) ||
                productId < 1 ||
                productId > MAX_DB_INTEGER
            ) {
                setState({ status: 'notFound', productId });
                return;
            }
            try {
                const supabase = getSupabaseClient();
                if (!supabase)
                    throw new Error('Supabase 환경 변수가 없습니다.');

                const [detailResult, catalogResult] = await Promise.allSettled([
                    getProductDetail(supabase, productId, controller.signal),
                    getProductCatalog(supabase, controller.signal),
                ]);
                if (controller.signal.aborted) return;
                if (detailResult.status === 'rejected')
                    throw detailResult.reason;

                if (!detailResult.value) {
                    setState({ status: 'notFound', productId });
                    return;
                }
                if (catalogResult.status === 'rejected') {
                    console.error('추천 상품 조회 실패:', catalogResult.reason);
                }
                setState({
                    status: 'success',
                    productId,
                    product: detailResult.value,
                    catalogProducts:
                        catalogResult.status === 'fulfilled'
                            ? catalogResult.value.products
                            : [],
                });
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('상품 상세 조회 실패:', error);
                // 이미 화면에 보이는 상품이 있으면(30분 갱신·뒤로 가기 중 일시 오류) 그 화면을 유지합니다.
                setState((previousState) =>
                    previousState.status === 'success' &&
                    previousState.productId === productId
                        ? previousState
                        : { status: 'error', productId },
                );
            }
        }

        const onVisible = () => {
            if (document.visibilityState === 'visible') void load();
        };
        window.addEventListener('focus', onVisible);
        window.addEventListener('online', onVisible);
        document.addEventListener('visibilitychange', onVisible);
        void load();
        // 오래 열린 페이지에서도 서명 URL이 만료되지 않도록 30분마다 갱신합니다.
        const refresh = window.setInterval(
            () => void load(),
            (PRODUCT_IMAGE_URL_LIFETIME * 1000) / 2,
        );
        return () => {
            controller.abort();
            window.removeEventListener('focus', onVisible);
            window.removeEventListener('online', onVisible);
            document.removeEventListener('visibilitychange', onVisible);
            window.clearInterval(refresh);
        };
    }, [productId, attempt]);

    function retry() {
        setState({ status: 'loading' });
        setAttempt((value) => value + 1);
    }

    // 다른 상품으로 이동한 직후에는 이전 상품 결과 대신 "불러오는 중"으로 봅니다.
    // Object.is: 주소가 숫자가 아닐 때의 NaN끼리도 같은 값으로 비교하기 위해 사용 (NaN === NaN은 false)
    const isCurrent =
        state.status !== 'loading' && Object.is(state.productId, productId);
    return {
        state: isCurrent ? state : ({ status: 'loading' } as const),
        retry,
    };
}
