import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="w-full border-t bg-white px-6 py-4 text-xs">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                {/* 왼쪽: 회사 정보 */}
                <div className="min-w-0">
                    <p className="mb-4">© 2026 ONEPIECE</p>{' '}
                    {/* 아래 방향 마진 부여 */}
                    {/*
                     * flex : 항목 가로로 나열
                     * flex-wrap : 한 줄에 정보 전부 안들어가면 다음 줄로 이동
                     * items-center : 같은 줄 항목 세로 중앙 정렬
                     * gap-x-3 : 가로 항목 사이 12px
                     * gap-y-1 : 세로 항목 사이 4px
                     */}
                    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {/*
                         * after:ml-3 : li 태그 다음 왼쪽 마진 12px 부여
                         * after:content['|'] : li 태그 다음 | 기호 삽입
                         */}
                        <li className="after:ml-3 after:content-['|']">
                            CEO : Joe Deok Pal
                        </li>
                        <li className="after:ml-3 after:content-['|']">
                            contact : 010-1111-2222
                        </li>
                        <li className="after:ml-3 after:content-['|']">
                            Online Register : 2026-서울구로-1014호
                        </li>
                        <li>Business License : 123-45-67890</li>
                    </ul>
                    <p className="mt-1">
                        (08377) 48, Digital-ro 33-gil, Guro-gu, Seoul
                    </p>
                </div>

                {/* 가운데 메뉴 */}
                <nav aria-label="푸터 메뉴" className="mr-20">
                    {/*  그리드 3개로 나눔 , 사이 간격 32px */}
                    <ul className="grid grid-cols-3 gap-8">
                        <li>
                            {/*  마우스 호버 시에 밑줄 노출 */}
                            <Link href="/" className="hover:underline">
                                HELP
                            </Link>
                        </li>
                        <li>
                            <Link href="/" className="hover:underline">
                                LEGAL
                            </Link>
                        </li>
                        <li>
                            <Link href="/" className="hover:underline">
                                CONTACT
                            </Link>
                        </li>
                    </ul>
                </nav>

                {/* 오른쪽 메뉴 */}
                <nav aria-label="소셜 및 언어 변경 메뉴">
                    {/*  그리드 2개로 나눔, 사이 간격 32px */}
                    <ul className="grid grid-cols-2 gap-8">
                        <li>
                            <Link href="/" className="hover:underline">
                                @ONEPIECE
                            </Link>
                        </li>
                        <li>
                            <Link href="/" className="hover:underline">
                                ENGLISH
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
