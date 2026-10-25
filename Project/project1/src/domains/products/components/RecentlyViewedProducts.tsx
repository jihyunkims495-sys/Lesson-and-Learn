/*
 * 최근 본 상품 (RECENTLY VIEWED)
 *
 * 동작
 * 1. 상세 페이지에 들어오면 지금 보는 상품 id를 브라우저 저장소(localStorage)에 기록
 * 2. 저장된 id 목록을 읽어서, 지금 보는 상품을 뺀 나머지를 최근 본 순서대로 ProductRail로 표시
 *
 * localStorage: 브라우저 안에 글자를 저장해 두는 공간. 새로고침하거나 창을 닫아도 남아 있음
 *              (다른 사람·다른 기기와는 공유되지 않음)
 *
 * 'use client': localStorage는 브라우저에만 있으므로 클라이언트 컴포넌트여야 함
 */
'use client';

// useEffect: 화면을 그린 "뒤에" 실행할 일 / useSyncExternalStore: React 바깥의 값(저장소)을 읽어 오는 함수
import { useEffect, useSyncExternalStore } from 'react';
import ProductRail from '@/domains/products/components/ProductRail';
import type { ProductListItem } from '@/domains/products/types/product.types';

// 브라우저 저장소에 저장할 때 쓰는 이름(키)
const STORAGE_KEY = 'onepiece-recently-viewed';
// 같은 탭 안에서 "저장소 값이 바뀌었다"고 알릴 때 쓰는 이벤트 이름 (직접 정한 이름)
const CHANGE_EVENT = 'recently-viewed-change';
// 최대 몇 개까지 기억할지
const MAX_ITEMS = 10;

/*
 * 저장된 글자('[3,1,7]')를 숫자 id 배열로 바꾸는 함수
 * 배열이 아니거나 글자 형식이 깨져 있으면 빈 배열로 처리해서 화면이 깨지지 않게 함
 */
function readIds(raw: string): number[] {
    try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
            ? parsed.filter((id): id is number => typeof id === 'number')
            : [];
    } catch {
        return [];
    }
}

// 지금 저장소 값을 글자 그대로 읽음. 저장소를 못 쓰는 환경(시크릿 모드 등)이면 빈 목록
function getSnapshot() {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? '[]';
    } catch {
        return '[]';
    }
}

// 서버에서 화면을 미리 그릴 때 쓰는 값. 서버에는 localStorage가 없으므로 항상 빈 목록
function getServerSnapshot() {
    return '[]';
}

/*
 * 저장소 값이 바뀌는 것을 감시하는 함수 (useSyncExternalStore가 사용)
 * 'storage': 다른 탭에서 바꿨을 때 브라우저가 보내 주는 신호
 * CHANGE_EVENT: 같은 탭에서 바꿨을 때 직접 보내는 신호 (아래 useEffect에서 보냄)
 */
function subscribe(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(CHANGE_EVENT, onChange);
    };
}

// currentProductId: 지금 보는 상품 id / products: 전체 상품 목록 (id로 상품 정보를 찾을 때 사용)
type RecentlyViewedProductsProps = {
    currentProductId: number;
    products: ProductListItem[];
};

export default function RecentlyViewedProducts({
    currentProductId,
    products,
}: RecentlyViewedProductsProps) {
    // 저장소 값을 읽고, 값이 바뀌면 자동으로 화면을 다시 그림
    const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    /*
     * 화면을 그린 뒤, 지금 보는 상품을 "최근 본 목록" 맨 앞에 기록
     * [지금 상품, ...나머지(지금 상품 제외)] → 중복 없이 맨 앞으로, 앞에서부터 MAX_ITEMS개만 남김
     * [currentProductId]: 다른 상품으로 이동할 때마다 다시 실행
     */
    useEffect(() => {
        const ids = readIds(getSnapshot());
        const nextIds = [
            currentProductId,
            ...ids.filter((id) => id !== currentProductId),
        ].slice(0, MAX_ITEMS);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
            window.dispatchEvent(new Event(CHANGE_EVENT));
        } catch {
            // 저장소를 쓸 수 없는 환경에서는 기록하지 않음
        }
    }, [currentProductId]);

    // 저장된 id → 상품 정보로 바꿈. 지금 보는 상품과 목록에 없는 id(삭제된 상품 등)는 뺌
    const viewedProducts = readIds(raw)
        .filter((id) => id !== currentProductId)
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is ProductListItem => product !== undefined);

    // 목록이 비어 있으면(처음 방문) ProductRail이 아무것도 그리지 않음
    return <ProductRail title="Recently viewed" products={viewedProducts} />;
}
