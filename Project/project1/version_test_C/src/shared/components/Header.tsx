'use client';
import { Suspense, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

import useAuthUser from '@/domains/auth/hooks/useAuthUser';
import CartDrawer from '@/domains/cart/components/CartDrawer';
import useCounterStore from '@/shared/store/useCounterStore';

const HEADER_HEIGHT = 60;

// 스크롤과 창 크기가 바뀌면 헤더가 영상 위에 있는지 다시 계산하도록 구독함
function subscribeViewport(onChange: () => void) {
    window.addEventListener('scroll', onChange, { passive: true });
    window.addEventListener('resize', onChange);
    return () => {
        window.removeEventListener('scroll', onChange);
        window.removeEventListener('resize', onChange);
    };
}

// 인덱스 히어로는 화면 너비 기준 16:9 영상이므로, 헤더 위치가 영상 높이보다 위에 있으면 영상 위에 겹쳐 있는 상태임
function getIsOverHero() {
    const headerTop = window.scrollY + window.innerHeight - HEADER_HEIGHT;
    return headerTop < (window.innerWidth * 9) / 16;
}

// 서버 렌더링에서는 기본 검정 헤더를 그림
function getServerIsOverHero() {
    return false;
}

function HeaderBackground({ isTransparent = false }) {
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 -z-10 transition-colors duration-300 group-has-[nav.group:hover]/header:bg-black ${isTransparent ? 'bg-transparent' : 'bg-black'}`}
        />
    );
}

// URL을 기다리는 동안에도 헤더 메뉴는 미리 렌더링하고 배경만 기본 검정색으로 표시함
function RouteAwareHeaderBackground() {
    const isHome = usePathname() === '/';
    const isOverHero = useSyncExternalStore(
        subscribeViewport,
        getIsOverHero,
        getServerIsOverHero,
    );
    // 인덱스에서 헤더가 영상 위에 있을 때만 배경을 투명하게 해서 영상 전체가 보이게 함
    const isTransparent = isHome && isOverHero;

    return <HeaderBackground isTransparent={isTransparent} />;
}

export default function Header() {
    useEffect(() => {
        void Promise.resolve(useCounterStore.persist.rehydrate()).finally(
            () => {
                useCounterStore.setState({ hasHydrated: true });
            },
        );
    }, []);
    const totalQuantity = useCounterStore((state) =>
        state.cartItems.reduce((total, item) => total + item.quantity, 0),
    );
    const { user, isLoading, signOut } = useAuthUser();
    const hasHydrated = useCounterStore((state) => state.hasHydrated);
    const syncCartOwner = useCounterStore((state) => state.syncCartOwner);
    const userId = user?.id ?? null;

    // 저장된 장바구니를 불러오고 로그인 상태를 확인한 뒤, 회원이 바뀌었으면 장바구니를 비운다.
    useEffect(() => {
        if (hasHydrated && !isLoading) syncCartOwner(userId);
    }, [hasHydrated, isLoading, userId, syncCartOwner]);

    async function handleSignOut() {
        try {
            await signOut();
        } catch {
            window.alert('로그아웃하지 못했습니다. 다시 시도해 주세요.');
        }
    }

    return (
        /*
         * group/header: 카테고리 드롭다운이 열리면 배경 컴포넌트를 검정으로 바꿔 메뉴와 이어지게 함
         */
        <header className="group/header fixed inset-x-0 bottom-0 isolate z-50 w-full text-white">
            <Suspense fallback={<HeaderBackground />}>
                <RouteAwareHeaderBackground />
            </Suspense>
            <div className="grid h-15 grid-cols-[1fr_auto_1fr] items-center px-5">
                {/*
                 * group: 버튼과 드롭다운 메뉴를 하나의 hover 영역으로 묶음
                 * w-fit: nav 너비를 버튼 너비에 맞추며 그리드의 왼쪽 칸 너비는 유지함
                 * h-full: nav가 높이 60px인 헤더 내부 영역을 채우도록 함
                 * 버튼 위아래 여백과 드롭다운도 hover 영역에 포함됨
                 */}
                <nav className="group flex h-full w-fit items-center text-sm font-semibold">
                    {/*
                     * 카테고리 메뉴를 여는 버튼을 표시함
                     * 기본 상태와 hover 및 그룹 내부 focus 상태에서 흰 배경과 검정 글자를 유지함
                     */}
                    <button
                        type="button"
                        className="flex h-7 w-35 cursor-pointer items-center justify-center rounded-md bg-white text-black group-focus-within:bg-white group-focus-within:text-black group-hover:bg-white group-hover:text-black hover:bg-white hover:text-black"
                    >
                        ONEPIECE
                    </button>

                    {/*
                     * absolute: 본문 공간을 차지하지 않고 메뉴를 겹쳐 표시함
                     * inset-x-0: 위치 기준인 header의 좌우 너비에 맞춰 메뉴를 펼침
                     * bottom-full: 하단 고정 헤더 바로 위에 메뉴를 배치함
                     * invisible opacity-0: 기본 상태에서 메뉴를 숨김
                     * group-hover:visible group-hover:opacity-100: nav 또는 그 안의 메뉴에 마우스를 올리면 메뉴가 표시됨
                     * bg-black text-xs: 검정 배경과 12px 글자 크기를 적용함
                     * border-t shadow-sm: 위쪽 테두리와 그림자로 본문과 구분함
                     */}
                    <div className="invisible absolute inset-x-0 bottom-full border-t bg-black px-6 py-8 text-xs opacity-0 shadow-sm group-hover:visible group-hover:opacity-100">
                        {/*
                         * grid-cols-5: 메뉴를 같은 너비의 5개 열로 나누며 gap-8로 열 사이에 32px 간격을 적용함
                         * ALL PRODUCTS는 /products로, 대분류 제목과 소분류는 /products?category=카테고리ID로 이동함
                         * 카테고리 ID는 카탈로그 초기 데이터와 같음 (예: Outer는 1, Jackets는 11)
                         */}
                        <div className="grid grid-cols-5 gap-8">
                            {/* flex-col: 제목과 링크를 세로로 배치하며 gap-3으로 항목 사이에 12px 간격을 적용함 */}
                            <div className="flex flex-col gap-3">
                                <p className="mb-2 text-neutral-400">SHOP</p>
                                <Link
                                    href="/products"
                                    className="hover:underline"
                                >
                                    ALL PRODUCTS
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/products?category=1"
                                    className="mb-2 text-neutral-400 hover:underline"
                                >
                                    Outer
                                </Link>
                                <Link
                                    href="/products?category=11"
                                    className="hover:underline"
                                >
                                    Jackets
                                </Link>
                                <Link
                                    href="/products?category=13"
                                    className="hover:underline"
                                >
                                    Padding
                                </Link>
                                <Link
                                    href="/products?category=12"
                                    className="hover:underline"
                                >
                                    Coat
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/products?category=2"
                                    className="mb-2 text-neutral-400 hover:underline"
                                >
                                    TOP
                                </Link>
                                <Link
                                    href="/products?category=21"
                                    className="hover:underline"
                                >
                                    T-SHIRTS
                                </Link>
                                <Link
                                    href="/products?category=23"
                                    className="hover:underline"
                                >
                                    HOODIES
                                </Link>
                                <Link
                                    href="/products?category=22"
                                    className="hover:underline"
                                >
                                    Knit
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/products?category=3"
                                    className="mb-2 text-neutral-400 hover:underline"
                                >
                                    BOTTOM
                                </Link>
                                <Link
                                    href="/products?category=31"
                                    className="hover:underline"
                                >
                                    Pants
                                </Link>
                                <Link
                                    href="/products?category=32"
                                    className="hover:underline"
                                >
                                    Denim
                                </Link>
                                <Link
                                    href="/products?category=33"
                                    className="hover:underline"
                                >
                                    Shorts
                                </Link>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/products?category=4"
                                    className="mb-2 text-neutral-400 hover:underline"
                                >
                                    E.T.C
                                </Link>
                                <Link
                                    href="/products?category=41"
                                    className="hover:underline"
                                >
                                    Shoes
                                </Link>
                                <Link
                                    href="/products?category=42"
                                    className="hover:underline"
                                >
                                    Bags
                                </Link>
                                <Link
                                    href="/products?category=43"
                                    className="hover:underline"
                                >
                                    Accessories
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <Link href="/" className="relative block h-15 w-40">
                    {/*
                     * 홈으로 이동하는 중앙 로고 링크를 표시함
                     * relative: fill 이미지의 위치와 크기 기준을 설정함
                     * block h-15 w-40: 로고 영역을 높이 60px, 너비 160px로 지정함
                     */}

                    <Image
                        src="/Logo.png" // public/Logo.png 파일을 불러옴
                        alt="ONEPIECE" // 이미지를 대신해 읽을 수 있는 로고 이름을 제공함
                        fill // 부모 링크 영역을 채우도록 이미지를 배치함
                        sizes="160px" // 이미지 선택용 너비 힌트를 160px로 전달하며 실제 표시 너비를 변경하지 않음
                        loading="eager" // 모든 화면 하단에 바로 보이는 로고라 지연 로딩하지 않음 (LCP 경고 해결)
                        className="object-contain brightness-0 invert" // 이미지 비율을 유지하며 brightness-0 invert로 불투명한 부분을 흰색으로 변환함
                    ></Image>
                </Link>
                <nav
                    aria-label="사용자 메뉴"
                    className="flex items-center justify-end gap-8 pr-3 text-sm"
                >
                    {/*
                     * 검색 아이콘 버튼을 표시하며 현재 검색 동작은 연결되어 있지 않음
                     * type="button": 폼 안에서 사용해도 제출 동작이 발생하지 않도록 함
                     * aria-label="검색": 아이콘 버튼의 용도를 보조 기술에 제공함
                     * h-7 w-7: 클릭 영역을 높이와 너비 각각 28px로 지정함
                     * cursor-pointer: 마우스를 올리면 손가락 모양 포인터가 표시됨
                     * flex items-center justify-center: 아이콘을 버튼의 가로와 세로 중앙에 배치함
                     */}
                    <button
                        type="button"
                        aria-label="검색"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center"
                    >
                        {/*
                         * size={12}: 아이콘의 너비와 높이를 각각 12px로 지정함
                         * strokeWidth={1.5}: 아이콘 선 두께를 1.5로 지정함
                         */}
                        <Search size={12} strokeWidth={1.5} />
                    </button>

                    {/* 로그인 상태면 MY PAGE 링크와 LOGOUT 버튼을, 아니면 JOIN/LOGIN 링크를 표시함 */}
                    {isLoading ? (
                        <span
                            aria-label="로그인 상태 확인 중"
                            className="h-4 w-28 animate-pulse rounded bg-white/15"
                        />
                    ) : user ? (
                        <>
                            <Link
                                href="/mypage"
                                aria-label="마이페이지"
                                className="whitespace-nowrap"
                            >
                                MY PAGE
                            </Link>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                aria-label="로그아웃"
                                title={user.email}
                                className="cursor-pointer whitespace-nowrap"
                            >
                                LOGOUT
                            </button>
                        </>
                    ) : (
                        <>
                            {/* JOIN 문구를 표시하며 href="/signup"으로 회원가입 페이지에 연결됨 */}
                            <Link href="/signup">JOIN</Link>

                            {/* LOGIN 문구를 표시하며 href="/login"으로 로그인 페이지에 연결됨 */}
                            <Link href="/login">LOGIN</Link>
                        </>
                    )}

                    <CartDrawer totalQuantity={totalQuantity} />
                </nav>
            </div>
        </header>
    );
}
