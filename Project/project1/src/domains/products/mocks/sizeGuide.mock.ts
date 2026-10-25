/*
 * 사이즈 가이드 표 데이터 (화면 확인용 예시 수치, 단위 cm)
 *
 * 실제 상품 실측값이 아니므로, 상품별 실측이 정해지면 이 값을 교체합니다.
 * 사이즈 이름(1~4)은 상세 페이지의 사이즈 버튼 1~4와 맞춥니다.
 *
 * columns: 표 맨 위 제목 줄 (가슴단면, 어깨너비 등)
 * rows: 사이즈별 한 줄씩. values의 순서는 columns 순서와 같습니다.
 */
export interface SizeGuideTable {
    columns: string[];
    rows: { size: string; values: number[] }[];
}

// 상의·재킷: 가슴단면, 어깨너비, 소매길이, 총장
const TOP_SIZE_GUIDE: SizeGuideTable = {
    columns: ['Chest', 'Shoulder', 'Sleeve', 'Length'],
    rows: [
        { size: '1', values: [49, 46, 57, 64.5] },
        { size: '2', values: [51.5, 48.5, 59, 67] },
        { size: '3', values: [54, 51, 61, 69.5] },
        { size: '4', values: [56.5, 53.5, 63, 72] },
    ],
};

// 코트: 상의와 같은 항목이지만 총장이 김
const COAT_SIZE_GUIDE: SizeGuideTable = {
    columns: ['Chest', 'Shoulder', 'Sleeve', 'Length'],
    rows: [
        { size: '1', values: [58, 47, 60, 110] },
        { size: '2', values: [60.5, 49, 61.5, 112] },
        { size: '3', values: [63, 51, 63, 114] },
        { size: '4', values: [65.5, 53, 64.5, 116] },
    ],
};

// 하의: 허리단면, 엉덩이단면, 허벅지단면, 밑단단면, 총장
const BOTTOM_SIZE_GUIDE: SizeGuideTable = {
    columns: ['Waist', 'Hip', 'Thigh', 'Hem', 'Length'],
    rows: [
        { size: '1', values: [38, 50, 31, 20, 100] },
        { size: '2', values: [40.5, 52.5, 32.5, 21, 102] },
        { size: '3', values: [43, 55, 34, 22, 104] },
        { size: '4', values: [45.5, 57.5, 35.5, 23, 106] },
    ],
};

/*
 * 상품의 소분류 ID(categoryId)로 사이즈 가이드 표를 찾는 목록
 *
 * 11 JACKET, 13 PADDING, 21 T-SHIRT, 22 KNIT, 23 HOODIE → 상의 표
 * 12 COAT → 코트 표
 * 31 PANTS, 32 DENIM, 33 SHORTS → 하의 표
 * 신발(41)·가방(42)·액세서리(43)는 표가 없으므로 SIZE GUIDE 버튼을 표시하지 않습니다.
 * Partial: 모든 분류에 표가 있지는 않다는 뜻 → 꺼낸 값이 undefined일 수 있음을 TypeScript가 알게 함
 */
export const SIZE_GUIDE_BY_CATEGORY_ID: Partial<
    Record<string, SizeGuideTable>
> = {
    '11': TOP_SIZE_GUIDE,
    '13': TOP_SIZE_GUIDE,
    '21': TOP_SIZE_GUIDE,
    '22': TOP_SIZE_GUIDE,
    '23': TOP_SIZE_GUIDE,
    '12': COAT_SIZE_GUIDE,
    '31': BOTTOM_SIZE_GUIDE,
    '32': BOTTOM_SIZE_GUIDE,
    '33': BOTTOM_SIZE_GUIDE,
};
