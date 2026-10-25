/*
 * 가로 상품 줄 (제목 + 상품을 가로 한 줄로 나열)
 *
 * 사용하는 곳: 상품 상세 하단의 YOU MAY ALSO LIKE, RECENTLY VIEWED
 * 두 영역의 모양이 같아서 하나로 만들고, 제목과 상품 목록만 바꿔서 넘깁니다.
 * 상품이 화면보다 많으면 좌우로 스크롤(모바일은 손가락으로 밀어서)해서 봅니다.
 */

import Image from 'next/image';
import Link from 'next/link';
import type { ProductListItem } from '@/domains/products/types/product.types';
import { formatPrice } from '@/shared/utils/formatPrice';

// title: 줄 위에 표시할 제목 / products: 가로로 나열할 상품 목록 (Supabase 상품 목록과 같은 카드용 타입)
type ProductRailProps = {
    title: string;
    products: ProductListItem[];
};

export default function ProductRail({ title, products }: ProductRailProps) {
    // 보여 줄 상품이 없으면 제목까지 통째로 그리지 않음 (null = 아무것도 안 그림)
    if (products.length === 0) {
        return null;
    }

    return (
        // mt-24: 위 영역과 96px 간격
        <section aria-label={title} className="mt-24">
            {/* 제목 앞의 작은 검정 사각형은 꾸밈 요소라 aria-hidden으로 화면 낭독기에서 제외 */}
            <h2 className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase">
                <span aria-hidden className="size-1 bg-neutral-900" />
                {title}
            </h2>

            {/*
             * flex: 상품을 가로로 나란히 / gap-5: 상품 사이 20px
             * overflow-x-auto: 화면보다 넘치면 가로 스크롤
             * snap-x / snap-start: 스크롤을 멈추면 상품 왼쪽 끝에 딱 맞춰 멈춤
             */}
            <ul className="flex snap-x gap-5 overflow-x-auto pb-2">
                {products.map((product) => {
                    // 대표 이미지(product_main) 주소. 없으면 undefined
                    const imageUrl = product.images.find(
                        (image) =>
                            image.location === 'product_main' && image.url,
                    )?.url;

                    return (
                        // w-40: 모바일 160px / md:w-55: 768px 이상 220px / shrink-0: 칸이 줄어들지 않음
                        <li
                            key={product.id}
                            className="w-40 shrink-0 snap-start md:w-55"
                        >
                            <Link
                                href={`/products/${product.id}`}
                                prefetch={false}
                                className="group block"
                            >
                                {/* 목록 카드(ProductCard)와 같은 4:5 비율, 이미지 전체가 보이게 object-contain */}
                                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                                    {imageUrl ? (
                                        <Image
                                            src={imageUrl}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 767px) 160px, 220px"
                                            className="object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[10px] text-neutral-400">
                                            이미지 준비 중
                                        </div>
                                    )}
                                </div>
                                <p className="mt-3 text-[11px] font-semibold uppercase group-hover:underline">
                                    {product.name}
                                </p>
                                <p className="mt-1 text-[11px]">
                                    {formatPrice(product.salePrice)}
                                </p>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
