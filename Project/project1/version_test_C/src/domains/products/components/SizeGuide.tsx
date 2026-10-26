/*
 * SIZE GUIDE 버튼 + 사이즈 표 팝업
 *
 * 버튼을 누르면 팀 공용 Dialog(팝업)가 열리고, 사이즈별 실측 표를 보여 줍니다.
 * Esc, 바깥 클릭, X 버튼으로 닫힙니다. (Dialog가 대신 처리)
 *
 * 'use client': 팝업 열기/닫기는 클릭과 상태가 필요해서 브라우저에서 실행되어야 함
 */
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/shared/components/ui/dialog';
import type { SizeGuideTable } from '@/domains/products/mocks/sizeGuide.mock';

// table: 보여 줄 사이즈 표 (상의·코트·하의 중 상품에 맞는 것)
type SizeGuideProps = {
    table: SizeGuideTable;
};

export default function SizeGuide({ table }: SizeGuideProps) {
    return (
        <Dialog>
            {/* 팝업을 여는 버튼. 상세 정보 글자처럼 작고 연하게, 밑줄로 눌러지는 글자임을 표시 */}
            <DialogTrigger
                type="button"
                className="cursor-pointer text-[10px] whitespace-nowrap text-neutral-400 uppercase underline underline-offset-2 hover:text-neutral-900"
            >
                Size guide
            </DialogTrigger>

            {/* rounded-none: 상세 페이지의 각진 모양에 맞춤 / sm:max-w-md: 넓은 화면에서 최대 448px */}
            <DialogContent className="rounded-none bg-white p-6 sm:max-w-md">
                <DialogTitle className="text-[11px] font-semibold uppercase">
                    Size guide
                </DialogTitle>
                <DialogDescription className="text-[10px] text-neutral-400">
                    단위: cm · 측정 위치에 따라 1~3cm 오차가 있을 수 있습니다.
                </DialogDescription>

                {/*
                 * 표(table) 구조
                 * thead: 제목 줄 / tbody: 사이즈별 줄
                 * th scope="col": 세로줄 제목, th scope="row": 가로줄 제목(사이즈 이름)
                 */}
                <table className="w-full text-center text-[11px]">
                    <thead>
                        <tr className="border-b border-neutral-900">
                            <th
                                scope="col"
                                className="py-2 text-left font-semibold"
                            >
                                SIZE
                            </th>
                            {table.columns.map((column) => (
                                <th
                                    key={column}
                                    scope="col"
                                    className="py-2 font-semibold uppercase"
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {table.rows.map((row) => (
                            <tr
                                key={row.size}
                                className="border-b border-neutral-200"
                            >
                                <th
                                    scope="row"
                                    className="py-2 text-left font-normal"
                                >
                                    {row.size}
                                </th>
                                {/* values와 columns는 순서가 같으므로 같은 칸 번호(index)의 제목을 key로 사용 */}
                                {row.values.map((value, index) => (
                                    <td
                                        key={table.columns[index]}
                                        className="py-2"
                                    >
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </DialogContent>
        </Dialog>
    );
}
