// 클릭과 상태를 쓰는 파일이라는 표시 'use client';
// 컴포넌트가 클라이언트에서 렌더링되어야 함을 명시하는 JavaScript 디렉티브
// React Hooks 사용, 브라우저 전용 API 사용, 이벤트 핸들링, 상호작용이 필요한 UI 컴포넌트
'use client';

// import: 다른 파일에서 export한 것을 가져와 이 파일에서 쓸 수 있게 함
// { 이름 }: 그 파일이 이름을 붙여 내보낸 것(named export)을 같은 이름으로 가져옴
// @/: 프로젝트의 src 폴더를 뜻하는 줄임 경로 (tsconfig.json에 설정됨)
// 상태를 만드는 함수 가져오기
import { useState } from 'react';
// 클릭하면 칸 안에서 확대되고, 확대 상태에서 드래그로 이동하는 이미지 칸
import ZoomableImage from '@/domains/products/components/ZoomableImage';
// 하단 가로 상품 줄 (YOU MAY ALSO LIKE) / 최근 본 상품 줄 (RECENTLY VIEWED)
import ProductRail from '@/domains/products/components/ProductRail';
import RecentlyViewedProducts from '@/domains/products/components/RecentlyViewedProducts';
// SIZE GUIDE 버튼 + 사이즈 표 팝업
import SizeGuide from '@/domains/products/components/SizeGuide';
// Supabase에서 상품 상세·사이즈 옵션·전체 상품 목록을 불러오는 Hook
import useProductDetail from '@/domains/products/hooks/useProductDetail';
// 상품 분류별 사이즈 표 데이터
import { SIZE_GUIDE_BY_CATEGORY_ID } from '@/domains/products/mocks/sizeGuide.mock';
// 헤더·서랍과 공유하는 장바구니 저장소와 DB 옵션 담기 함수
import useCounterStore from '@/shared/store/useCounterStore';
import { addProductToCart } from '@/domains/cart/utils/addProductToCart';
// 숫자 153260을 "153,260KRW" 글자로 바꿔 주는 팀 공용 함수
import { formatPrice } from '@/shared/utils/formatPrice';

// YOU MAY ALSO LIKE에 보여 줄 추천 상품 개수
const RECOMMEND_COUNT = 4;

/*
 * 리액트 컴포넌트: 화면 조각(JSX)을 return 하는 함수
 *
 * export default: 이 파일의 "대표"로 내보냄 → 다른 파일에서 { } 없이 import ProductDetail from ... 으로 가져옴
 * function ProductDetail(): 컴포넌트 이름은 반드시 대문자로 시작 (소문자면 HTML 태그로 착각함)
 * 사용하는 곳: src/app/(shop)/products/[id]/page.tsx 에서 <ProductDetail /> 태그처럼 씀
 *
 * 화면이 다시 그려지는(리렌더링) 때: 아래 상태(useState) 값이 바뀔 때마다
 * 이 함수 전체가 처음부터 다시 실행되고, 새로 return 한 JSX로 화면이 바뀜
 */
// 바깥(page.tsx)에서 받는 값(props)의 모양
/*
 * props: 부모 컴포넌트가 자식 컴포넌트에게 넘겨주는 값
 *
 * 넘기는 쪽 (page.tsx)	<ProductDetail id={Number(id)} />  → 태그 속성처럼 씀
 * 받는 쪽 (이 파일)	ProductDetail({ id })              → 함수 매개변수로 받음
 * 두 쪽의 이름(id)이 같아야 짝이 맞음
 *
 * type 이름 = { ... }	TypeScript 타입 설계도. "이 컴포넌트는 이런 props를 받는다"를 정해 둠
 * id: number	id는 숫자여야 함 → page.tsx에서 Number(id)로 글자를 숫자로 바꿔 넘기는 이유
 * 설계도와 다르게 넘기면 (예: id를 안 넘기거나 글자로 넘기면) 빨간 밑줄로 미리 알려 줌
 */
type ProductDetailProps = {
    id: number;
};

export default function ProductDetail({ id }: ProductDetailProps) {
    /*
     * useState: 화면이 "기억"해야 하는 값(상태)을 만드는 리액트 Hook
     *
     * const [값, 값을바꾸는함수] = useState(처음값);
     * [ , ]	배열 구조 분해 할당. useState가 돌려준 두 개를 각각 이름 붙여 꺼냄
     * 값	지금 상태 (예: activeTab → 'detail')
     * 값을바꾸는함수	set으로 시작하는 이름이 관례. 이 함수로 바꿔야 화면이 다시 그려짐
     *              (activeTab = 'shipping' 처럼 직접 대입하면 화면이 바뀌지 않음)
     * 처음값	컴포넌트가 처음 그려질 때 한 번만 쓰임
     *
     * Hook 규칙: Hook은 컴포넌트 함수 맨 위쪽에서, if·반복문 밖에서 호출해야 함
     *           (매번 같은 순서로 실행되어야 리액트가 어느 값이 어느 상태인지 구분함)
     */
    const [activeTab, setActiveTab] = useState('detail'); // 지금 열린 탭을 기억. 처음은 DETAILS
    // 선택한 사이즈 옵션 번호(product_variants.id). 처음은 선택 없음(null)
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        null,
    );
    const [message, setMessage] = useState(''); // Add to cart 아래 안내 문구

    /*
     * 팀 공용 장바구니 저장소(zustand)에서 필요한 것만 꺼냄
     * useCounterStore((state) => state.값): 저장소 전체 중 이 값만 사용 → 이 값이 바뀔 때만 다시 그림
     * setCartItems: 장바구니 목록을 바꾸는 함수 (헤더 CART 숫자와 장바구니 서랍이 같이 바뀜)
     * hasHydrated: 새로고침 후 브라우저에 저장된 장바구니를 다 불러왔는지 여부
     */
    const setCartItems = useCounterStore((state) => state.setCartItems);
    const hasHydrated = useCounterStore((state) => state.hasHydrated);

    /*
     * Supabase에서 상품 상세를 불러옴 (useProductDetail.ts 참고)
     * state.status: 'loading' | 'error' | 'notFound' | 'success'
     * retry: 실패했을 때 다시 불러오는 함수
     */
    const { state, retry } = useProductDetail(id);

    /*
     * 불러오는 중·실패·없는 상품이면 안내만 보여 주고 끝냄
     *
     * 이 위치인 이유
     * - 모든 Hook(useState 3개, useCounterStore 2개, useProductDetail 1개)보다 아래:
     *   Hook은 매번 같은 순서로 실행되어야 하므로 return보다 먼저 와야 함
     * - product를 쓰는 코드보다 위: 데이터가 없는데 product.images를 읽으면 오류가 나기 때문
     */
    if (state.status === 'loading') {
        return (
            <p role="status" className="p-10 text-center text-sm">
                상품을 불러오는 중입니다.
            </p>
        );
    }
    if (state.status === 'notFound') {
        return <p className="p-10">상품을 찾을 수 없습니다.</p>;
    }
    if (state.status === 'error') {
        return (
            <div role="alert" className="space-y-4 p-10 text-center text-sm">
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

    // 여기부터는 state.status === 'success' → 상품 데이터가 반드시 있음
    const { product, catalogProducts } = state;

    // 서명 URL을 받은 이미지만 사용 (발급 실패한 파일은 빈 칸 대신 건너뜀)
    const imagesWithUrl = product.images.filter((image) => image.url);

    /*
     * 상단 왼쪽 이미지: 상세 이미지(role = 'detail')
     * 상세 이미지가 없는 상품은 대표 이미지(role = 'main')로 대신해 왼쪽이 빈칸이 되지 않게 함
     *
     * 조건 ? A : B	삼항 연산자. 조건이 참이면 A, 거짓이면 B를 leftImages에 담음
     */
    const detailImages = imagesWithUrl.filter(
        (image) => image.role === 'detail',
    );
    const leftImages =
        detailImages.length > 0
            ? detailImages
            : imagesWithUrl.filter((image) => image.role === 'main');
    // 하단: 모델 착용 사진 (role = 'model'). 없는 상품은 빈 배열 → 하단 영역에 아무것도 안 나옴
    const modelImages = imagesWithUrl.filter((image) => image.role === 'model');

    /*
     * 사이즈 옵션 (DB product_variants)
     * 옵션이 하나뿐인 상품(가방·액세서리의 FREE)은 재고가 있으면 고르지 않아도 그 옵션이 선택된 것으로 봄
     */
    const variants = product.variants;
    const activeVariantId =
        variants.length === 1 &&
        variants[0].sizeLabel === 'FREE' &&
        variants[0].stockQuantity > 0
            ? variants[0].id
            : selectedVariantId;
    const selectedVariant = variants.find(
        (variant) => variant.id === activeVariantId,
    );
    // 재고가 있는 옵션이 하나라도 있는지 (모두 품절이면 담기 버튼을 끔)
    const hasAvailableVariant = variants.some(
        (variant) => variant.stockQuantity > 0,
    );
    // 할인 중일 때만 정가에 취소선을 그어 함께 표시
    const isOnSale = product.salePrice < product.listPrice;

    // Add to cart를 눌렀을 때 실행
    /*
     * 이벤트 핸들러: 클릭 같은 사용자 행동이 일어났을 때 실행할 함수
     * handle + 대상 이름으로 짓는 것이 리액트 관례 (handleAddToCart = 장바구니 담기 처리)
     *
     * 장바구니에 담는 순서
     * 1. 고른 사이즈 옵션의 번호(DB product_variants.id)를 그대로 사용
     * 2. 장바구니에 같은 옵션이 이미 있으면 → 수량만 +1
     * 3. 없으면 → 새 장바구니 항목(CartItem)을 만들어 목록 끝에 추가
     * setCartItems((previousItems) => 새 목록): 직전 목록을 받아 새 목록을 돌려줌
     *   (원본 배열을 직접 바꾸지 않고 새 배열을 만들어야 화면이 다시 그려짐)
     */
    const handleAddToCart = () => {
        if (!selectedVariant) {
            setMessage('사이즈를 선택해 주세요.');
            return;
        }
        // 새로고침 직후 저장된 장바구니를 불러오기 전에 담으면, 불러온 값이 덮어써서 사라질 수 있음
        if (!hasHydrated) {
            setMessage(
                '장바구니를 불러오는 중입니다. 잠시 후 다시 눌러 주세요.',
            );
            return;
        }

        let nextMessage = '';
        setCartItems((previousItems) => {
            const result = addProductToCart(
                previousItems,
                product,
                activeVariantId,
            );
            nextMessage = result.message;
            return result.items;
        });
        setMessage(nextMessage);
    };

    /*
     * YOU MAY ALSO LIKE 추천 상품 (Supabase 전체 상품 목록에서 고름)
     * 1. 같은 소분류(categoryId) 상품을 먼저
     * 2. 나머지 상품을 그 뒤에 이어 붙임
     * 3. 지금 보는 상품은 빼고 앞에서부터 RECOMMEND_COUNT개만 사용
     */
    const otherProducts = catalogProducts.filter(
        (item) => item.id !== product.id,
    );
    const recommendedProducts = [
        ...otherProducts.filter(
            (item) => item.categoryId === product.categoryId,
        ),
        ...otherProducts.filter(
            (item) => item.categoryId !== product.categoryId,
        ),
    ].slice(0, RECOMMEND_COUNT);

    // 이 상품 분류에 맞는 사이즈 표. 신발·가방·액세서리처럼 표가 없으면 undefined → SIZE GUIDE 버튼 숨김
    const guide = SIZE_GUIDE_BY_CATEGORY_ID[product.categoryId];
    // 숫자형 예시 실측표를 M/L에 임의로 대응시키지 않습니다.
    const sizeGuide =
        guide &&
        variants.length > 0 &&
        variants.every((variant) =>
            guide.rows.some((row) => row.size === variant.sizeLabel),
        )
            ? guide
            : undefined;

    /*
     * return ( JSX ): 이 컴포넌트가 화면에 그릴 내용
     *
     * JSX	HTML처럼 생겼지만 JavaScript 안에서 쓰는 리액트 문법
     * className	HTML의 class 대신 씀 (class는 JavaScript 예약어라서)
     * { }	JSX 안에서 "여기는 글자가 아니라 JavaScript 값" 이라는 표시
     * {/* *\/}	JSX 안에서 주석을 쓰는 방법
     * 최상위 태그는 하나여야 함 → 여기서는 <main>이 전체를 감쌈
     */
    return (
        // px-5: 좌우 여백 20px / pb-24: 마지막 상품 줄과 푸터 사이 96px
        <main className="px-5 pb-24">
            {/*  상단 영역  */}
            <div className="wrapper flex flex-col gap-5 md:flex-row">
                <div className="image flex w-full flex-col gap-5 md:w-1/2">
                    {/*
                    배열.map((항목) => ( JSX ))	배열의 항목을 하나씩 꺼내 JSX를 하나씩 만들어 줌 (리액트에서 목록 그리는 기본 방법)
                    key={image.id}	목록의 각 항목을 구분하는 고유값. map으로 반복할 때 리액트가 꼭 요구함
                    src={image.url}	따옴표 대신 { } → 고정 글자가 아니라 객체 안의 값을 넣음
                    */}
                    {leftImages.map((image) => (
                        <ZoomableImage
                            key={image.id}
                            src={image.url ?? ''}
                            alt={image.alt}
                            fill
                            className="aspect-[3/4]"
                        />
                    ))}
                </div>
                {/*  상품 정보 영역  */}
                <div className="w-full px-4 pt-6 pb-16 text-[11px] md:w-1/2 md:pt-[22vh]">
                    <div className="sticky top-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-10 md:top-[22vh] md:mx-auto md:w-[calc(41%+5.5rem)] md:gap-x-16">
                        {/*
                        {product.name}	product 객체 안의 name 값을 화면에 표시 ("아이보리 싱글 코트")
                        {formatPrice(...)}	{ } 안에서는 함수도 실행 가능. 돌려준 결과가 표시됨
                        <del>	취소선 글자 (할인 전 정가)
                        */}
                        <div className="col-start-2 flex flex-col gap-2">
                            <h2 className="font-semibold uppercase">
                                {product.name}
                            </h2>
                            <h3>
                                {isOnSale && (
                                    <del className="mr-2 text-neutral-400">
                                        {formatPrice(product.listPrice)}
                                    </del>
                                )}
                                {formatPrice(product.salePrice)}
                            </h3>
                            <h3 className="text-neutral-400 uppercase">색상</h3>
                        </div>
                        <div className="flex items-center text-[10px] text-neutral-400 uppercase">
                            size
                        </div>
                        {/*
                        사이즈 버튼: DB 사이즈 옵션(variants)을 map으로 하나씩 그림
                        onClick={() => setSelectedVariantId(variant.id)}	누르면 선택한 옵션 번호를 바꿈 → 화면이 다시 그려짐
                        variant.id === activeVariantId ? A : B	선택된 옵션이면 검정 스타일(A), 아니면 회색 스타일(B)
                        disabled: 재고가 0인 옵션은 누를 수 없고 취소선으로 표시
                        flex-wrap: 좁은 화면이나 옵션이 많을 때 다음 줄로 내려가고 버튼은 정사각형 유지
                        */}
                        <div
                            role="group"
                            aria-label="사이즈 선택"
                            className="flex flex-wrap items-center gap-4"
                        >
                            {variants.length === 0 && (
                                <p className="text-neutral-400">
                                    현재 선택할 수 있는 사이즈가 없습니다.
                                </p>
                            )}
                            {variants.map((variant) => (
                                <button
                                    key={variant.id}
                                    type="button"
                                    disabled={variant.stockQuantity <= 0}
                                    aria-pressed={
                                        variant.id === activeVariantId
                                    }
                                    onClick={() =>
                                        setSelectedVariantId(variant.id)
                                    }
                                    className={
                                        variant.id === activeVariantId
                                            ? 'h-6 min-w-6 shrink-0 cursor-pointer rounded-sm bg-neutral-900 px-1.5 text-[10px] font-semibold text-white'
                                            : 'h-6 min-w-6 shrink-0 cursor-pointer rounded-sm bg-neutral-100 px-1.5 text-[10px] font-semibold hover:bg-neutral-200 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:line-through'
                                    }
                                >
                                    {variant.sizeLabel}
                                    {variant.stockQuantity <= 0 && (
                                        <span className="sr-only"> 품절</span>
                                    )}
                                </button>
                            ))}
                            {/* 사이즈 표가 있는 상품만 SIZE GUIDE 버튼 표시. ml-auto: 남은 공간을 밀어 오른쪽 끝에 붙임 */}
                            {sizeGuide && (
                                <div className="ml-auto flex items-center">
                                    <SizeGuide table={sizeGuide} />
                                </div>
                            )}
                        </div>
                        {/*
                        onClick={handleAddToCart}	위에서 만든 함수의 "이름"만 넘김 → 클릭할 때 리액트가 대신 실행
                        disabled: 고를 수 있는(재고가 있는) 사이즈가 하나도 없으면 담기 버튼을 끄고 SOLD OUT 표시
                        {message}	message 상태 값을 표시. setMessage로 바뀌면 이 글자도 자동으로 바뀜
                        */}
                        <div className="col-start-2 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                disabled={!hasAvailableVariant}
                                className="h-10 w-full cursor-pointer rounded-sm bg-neutral-900 text-[10px] font-semibold text-white uppercase hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
                            >
                                {variants.length === 0
                                    ? '구매 가능한 옵션 없음'
                                    : hasAvailableVariant
                                      ? 'Add to cart'
                                      : 'Sold out'}
                            </button>
                            {variants.length === 0 && (
                                <p className="text-neutral-500">
                                    현재 구매 가능한 옵션이 없습니다.
                                </p>
                            )}
                            <p className="min-h-4" aria-live="polite">
                                {message}
                            </p>
                        </div>
                        <div className="col-start-2">
                            <div className="grid grid-cols-3 text-[10px]">
                                {/*
                                onClick= "클릭하면"
                                () =>	"이 일을 해라" (화살표 함수, 클릭할 때 실행됨)
                                setActiveTab('detail')	열린 탭을 'detail'로 바꿔라

                                삼항 연산자(조건 ? 참일 때 : 거짓일 때)
                                activeTab === 'detail'	지금 열린 탭이 detail인가?
                                ? '...'	맞으면 굵고 진한 글자
                                : '...'	아니면 연한 회색 글자
                                */}
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('detail')}
                                    className={
                                        activeTab === 'detail'
                                            ? 'cursor-pointer border-b-2 border-neutral-900 py-3 text-neutral-900 uppercase'
                                            : 'cursor-pointer border-b-2 border-neutral-200 py-3 text-neutral-400 uppercase hover:text-neutral-900'
                                    }
                                >
                                    Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('productCare')}
                                    className={
                                        activeTab === 'productCare'
                                            ? 'cursor-pointer border-b-2 border-neutral-900 py-3 text-neutral-900 uppercase'
                                            : 'cursor-pointer border-b-2 border-neutral-200 py-3 text-neutral-400 uppercase hover:text-neutral-900'
                                    }
                                >
                                    Product Care
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('shipping')}
                                    className={
                                        activeTab === 'shipping'
                                            ? 'cursor-pointer border-b-2 border-neutral-900 py-3 text-neutral-900 uppercase'
                                            : 'cursor-pointer border-b-2 border-neutral-200 py-3 text-neutral-400 uppercase hover:text-neutral-900'
                                    }
                                >
                                    Shipping & Returns
                                </button>
                                {/*  2행: col-span-3를 적용하여 3칸을 모두 차지함  */}
                                <div className="col-span-3 py-4">
                                    {/*
                                    조건 && 값	조건이 참일 때만 값을 화면에 그림 (거짓이면 아무것도 안 그림)
                                    → 세 줄 중 열린 탭과 이름이 같은 한 줄만 참이라 그 내용만 보임
                                    */}
                                    <p className="leading-[1.9] whitespace-pre-line">
                                        {activeTab === 'detail' &&
                                            product.detail}
                                        {activeTab === 'productCare' &&
                                            product.productCare}
                                        {activeTab === 'shipping' &&
                                            product.shipping}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/*  하단 영역  */}
            {/*
            모델 착용 사진: main의 px-5 안에서 한 줄 전체 폭(좌우 20px)을 3칸으로 똑같이 나눔
            상단 왼쪽 이미지와 같은 ZoomableImage → 클릭하면 확대, 확대 상태에서 드래그로 이동
            */}
            {modelImages.length > 0 && (
                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
                    {modelImages.map((image) => (
                        <ZoomableImage
                            key={image.id}
                            src={image.url ?? ''}
                            alt={image.alt}
                            fill
                            className="aspect-[3/4]"
                        />
                    ))}
                </div>
            )}

            {/* 추천 상품 줄: 같은 분류 상품을 먼저 보여 줌 */}
            <ProductRail
                title="You may also like"
                products={recommendedProducts}
            />

            {/* 최근 본 상품 줄: 처음 방문이면 아무것도 안 나옴 */}
            <RecentlyViewedProducts
                currentProductId={product.id}
                products={catalogProducts}
            />
        </main>
    );
}
