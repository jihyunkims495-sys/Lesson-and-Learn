/**
 * 상품 상세 화면 개발과 카탈로그 초기 입력에 사용하는 상품 목(mock) 데이터입니다.
 * MOCK은 실제 API 응답을 대신하는 샘플이라는 뜻입니다.
 * 상수 이름은 대문자와 밑줄로, 함수·상품 필드는 camelCase로 작성했습니다.
 * FileInfo의 snake_case 필드는 기존 공용 타입과 동일하게 유지합니다.
 * 가격·소재·제조 정보·배송 정책은 화면 확인용이며 실제 판매 정보로 확정된 값이 아닙니다.
 */
// import type: 데이터 형태를 검사하는 타입만 가져오며 실행 시의 값은 가져오지 않습니다.
// FileInfo는 파일, Product는 상품 객체의 필드와 타입을 정의합니다.
import type { FileInfo } from '@/domains/files/types/file.types';

import type { Product } from '@/domains/products/types/product.types';

/**
 * createMockProductImage: 상품 이미지의 공용 파일 정보 객체를 만드는 함수입니다.
 * create(생성) + Mock(샘플) + ProductImage(상품 이미지)라는 의미로 이름을 지었습니다.
 * 반복되는 FileInfo 필드를 한곳에서 생성해 상품마다 같은 구조를 유지합니다.
 * 실제 이미지를 생성·업로드하거나 파일을 읽는 함수는 아닙니다.
 * public/products에 이미 존재하는 파일의 정보와 접근 주소를 반환합니다.
 *
 * @param id 이미지 파일의 고유 번호. 상품 id와 별개이며 전체 이미지에서 중복되면 안 됩니다.
 * @param filename 확장자를 포함한 실제 파일명. 대소문자까지 public/products의 파일과 일치해야 합니다.
 * @param fileSize 실제 파일 크기(바이트). file_size 메타데이터에 기록하며 화면 크기를 뜻하지 않습니다.
 * @param location 이미지 용도. 생략하면 product_main(대표), 상세 이미지는 product_desc를 전달합니다.
 * @param seq sequence(순서)의 약자. 상품 안에서 1부터 부여하며 생략하면 1입니다.
 * @returns 공용 FileInfo 타입을 따르는 이미지 정보 객체입니다.
 *
 * 호출 예: createMockProductImage(1, 'outerCoatIvory.png', 1670384)
 * → 대표 이미지, seq: 1로 생성합니다.
 * 호출 예: createMockProductImage(101, 'outerCoatIvoryFront.png', 1384449, 'product_desc', 2)
 * → 상세 이미지, seq: 2로 생성합니다.
 * 파일명은 outer(대분류) + Coat(종류) + Ivory(색상) + Front(촬영 방향)처럼 구성했습니다.
 * Model은 착용 사진, Detail은 부분 확대 사진을 뜻하며, 파일명 자체가 용도를 자동 판별하지는 않습니다.
 */
function createMockProductImage(
    id: number,
    filename: string,
    fileSize: number,
    // 공용 FileInfo에 정의된 location 값만 허용하도록 타입을 재사용합니다.
    location: FileInfo['location'] = 'product_main',
    seq: number = 1,
): FileInfo {
    return {
        // id는 id: id의 축약 표기입니다. location과 seq도 같은 방식입니다.
        id,
        // gid는 공용 파일 타입의 문자열 식별자입니다. 여기서는 이미지 id로 목 값을 만듭니다.
        gid: `mock-product-${id}`,
        // location은 저장 경로가 아니라 대표/상세 등 파일의 사용 목적입니다.
        location,
        // 원본 파일명과 MIME 타입, 확장자, 바이트 크기입니다. 현재 목 이미지는 모두 PNG입니다.
        original_name: filename,
        content_type: 'image/png',
        extension: 'png',
        file_size: fileSize,
        // 파일 준비가 완료된 목 상태입니다. 이 값이 실제 업로드를 수행하지는 않습니다.
        done: true,
        // 정렬에 사용할 순서 값입니다. 이 함수를 호출하는 것만으로 배열이 정렬되지는 않습니다.
        seq,
        // 생성일을 나타내는 고정 샘플 값(UTC)으로 실제 파일의 생성 시각은 아닙니다.
        created_at: '2026-09-01T00:00:00.000Z',
        // Next.js는 public을 웹 주소의 루트(/)로 제공합니다. 주소에 /public은 붙이지 않습니다.
        // 예: public/products/outerCoatIvory.png → /products/outerCoatIvory.png
        // 백틱 문자열의 ${filename} 자리에 전달받은 파일명을 넣습니다.
        url: `/products/${filename}`,
    };
}

/**
 * COMMON_PRODUCT_INFO: 여러 상품이 공유(COMMON)하는 상품 정보(PRODUCT_INFO)입니다.
 * 상품마다 같은 안내 문구를 반복하지 않도록 묶었습니다.
 * 각 상품의 ...COMMON_PRODUCT_INFO가 아래 필드들을 해당 상품 객체에 복사합니다.
 * 같은 필드를 펼친 뒤에 다시 선언하면 뒤에 쓴 상품별 값으로 덮어쓸 수 있습니다.
 * Pick으로 Product의 공통 필드 타입을 가져오고 satisfies로 구조를 검사합니다.
 */
const COMMON_PRODUCT_INFO = {
    // 현재 Product 타입에서 사용하는 숫자형 목 사이즈입니다. 실제 의류·신발 치수는 아닙니다.
    size: 1,
    // productCare: 제조·보증·관리 안내. 백틱 문자열은 줄바꿈을 그대로 보존합니다.
    productCare: `Manufactured : Sep 2026
Quality warranty : in accordance with applicable laws and consumer dispute resolution regulations

제조년월 : 2026년 9월
품질 보증 기준 : 관련법 및 소비자 분쟁해결 규정에 따름
공식채널 구매만 A/S 가능

Made in China
*세탁 및 관리 시 제품에 부착된 케어라벨의 취급 주의사항을 확인해 주시기 바랍니다.`,
    // shipping: 배송 및 반품 안내를 함께 담은 공통 샘플 문구입니다.
    shipping: `Shipping
배송 지역: 전국 (일부 지역 제외)
택배사 : CJ대한통운 (1588-1255)
배송비 : 조건부 무료 (주문금액 70,000원 미만 시 3,000원 부과)
배송 기간: 영업일 기준 1–3일 소요
*퀵 서비스 및 매장 픽업 서비스 미제공
*제주 및 도서·산간 지역 배송 시 추가 배송비 3,500원 부과

Returns
신청 기간: 수령일로부터 7일 이내 (마이페이지 → 주문내역)
처리 방식: 접수 후 영업일 내로 순차 진행 (지정 택배사 자동 수거)
*반품 시 6,000원 차감 후 환불 처리 (오배송·불량은 해당 없음)
*제주 및 도서·산간 지역 반품·교환 시 왕복 배송비 13,000원 부과`,
} satisfies Pick<Product, 'size' | 'productCare' | 'shipping'>;

/**
 * MOCK_PRODUCTS: 여러 상품(PRODUCTS)을 담은 샘플 상수입니다.
 * export로 다른 파일에서 가져올 수 있으며 Product[]는 Product 객체의 배열이라는 뜻입니다.
 * 상품을 추가할 때는 아래 객체 구조를 복사하고 고유 id와 카테고리·이미지·가격을 지정합니다.
 * 기존 상품 id는 상세 페이지 주소(/products/1 등)에도 사용되므로 임의로 재번호를 매기지 않습니다.
 *
 * images는 문자열 주소 목록이 아니라 FileInfo 객체 목록입니다.
 * 배열 안의 createMockProductImage(...)는 즉시 실행되고, 반환한 객체가 배열의 한 칸에 들어갑니다.
 * 읽기 쉽도록 대표 이미지를 먼저 두지만, ProductCard는 배열 위치 대신 product_main으로 선택합니다.
 * 대표 이미지에 URL이 없으면 상세 컷으로 대체하지 않고 이미지 준비 중 상태를 표시합니다.
 * seq는 상품 내 표시 순서입니다. 표시 순서를 변경하려면 seq를 변경합니다.
 * 상세 화면은 location으로 이미지를 구분하고 필요하면 seq로 정렬해 표시하도록 구현할 수 있습니다.
 * 이미지를 교체하면 filename과 fileSize를 갱신하고, 추가하면 중복되지 않는 이미지 id를 사용합니다.
 */
export const MOCK_PRODUCTS: Product[] = [
    {
        // 공통 size·productCare·shipping을 현재 상품에 복사하는 펼침(spread) 문법입니다.
        ...COMMON_PRODUCT_INFO,
        // 상품 고유 번호입니다. images 안에 전달하는 이미지 파일 id와는 다른 식별자입니다.
        id: 1,
        // 카테고리 연결용 번호입니다. 카탈로그 초기 데이터의 COAT(id: '12')를 참조합니다.
        categoryId: '12',
        // 카드에 표시할 분류명으로 연결한 카테고리의 name과 일치시킵니다.
        categoryName: 'COAT',
        // 고객에게 보여 줄 상품명입니다. 이미지 파일명과는 별개입니다.
        name: '아이보리 싱글 코트',
        // detail은 상품의 텍스트 설명입니다. 상세 이미지(product_desc)와 구분합니다.
        detail: `Shell : Cotton 65%, Polyester 35%
Lining : Polyester 100%

- Relaxed fit with a clean silhouette
- Single-breasted button closure
- Side pockets for everyday essentials

겉감: 면 65%, 폴리에스터 35%
안감: 폴리에스터 100%

- 여유로운 핏과 깔끔한 실루엣
- 싱글 버튼 여밈
- 실용적인 양쪽 사이드 포켓
- 밝은 색상으로 다양한 스타일에 활용하기 좋은 코트

*제품 색상은 제품컷과 가장 유사합니다.`,
        // 아래는 코트 하나의 이미지 9장입니다. 상세 컷을 별도 상품으로 등록하지 않습니다.
        images: [
            // 대표 1장: 목록 카드에 표시합니다. location과 seq는 기본값을 사용합니다.
            createMockProductImage(1, 'outerCoatIvory.png', 1670384),
            // 상세 2번: 상품 정면. 101~108은 대표 이미지 id와 중복되지 않도록 정한 파일 번호입니다.
            createMockProductImage(
                101,
                'outerCoatIvoryFront.png',
                1384449,
                'product_desc',
                2,
            ),
            // 상세 3번: 상품 뒷면.
            createMockProductImage(
                102,
                'outerCoatIvoryBack.png',
                1390721,
                'product_desc',
                3,
            ),
            // 상세 4번: 모델 착용 정면.
            createMockProductImage(
                103,
                'outerCoatIvoryModelFront.png',
                1618322,
                'product_desc',
                4,
            ),
            // 상세 5번: 모델 착용 측면.
            createMockProductImage(
                104,
                'outerCoatIvoryModelSide.png',
                1264801,
                'product_desc',
                5,
            ),
            // 상세 6번: 모델 착용 뒷면.
            createMockProductImage(
                105,
                'outerCoatIvoryModelBack.png',
                1535901,
                'product_desc',
                6,
            ),
            // 상세 7번: 칼라(목깃) 확대.
            createMockProductImage(
                106,
                'outerCoatIvoryDetailCollar.png',
                3573195,
                'product_desc',
                7,
            ),
            // 상세 8번: 커프스(소맷단) 확대.
            createMockProductImage(
                107,
                'outerCoatIvoryDetailCuff.png',
                2821359,
                'product_desc',
                8,
            ),
            // 상세 9번: 버튼과 밑단 확대.
            createMockProductImage(
                108,
                'outerCoatIvoryDetailButtonHem.png',
                2791551,
                'product_desc',
                9,
            ),
        ],
        // listPrice: 할인 전 정가(원). salePrice보다 클 때 카드에서 취소선 가격으로 표시합니다.
        listPrice: 158000,
        // salePrice: 실제 표시할 판매가(원). 할인하지 않는 상품은 listPrice와 같은 값을 둡니다.
        salePrice: 153260,
        // new: 신상품 여부. true이면 카드에 NEW 표시를 붙이며 등록일로 자동 계산하지 않습니다.
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 2,
        categoryId: '22',
        categoryName: 'KNIT',
        name: '아이보리 크루넥 니트',
        detail: `Body : Cotton 60%, Acrylic 40%

- Soft knit texture
- Classic crew neckline
- Ribbed cuffs and hem

본체: 면 60%, 아크릴 40%

- 부드러운 촉감의 니트 조직
- 기본 크루넥 디자인
- 소매와 밑단의 리브 마감
- 단독 착용과 레이어드에 모두 활용하기 좋은 스웨터

*제품 색상은 제품컷과 가장 유사합니다.`,
        // 대표 이미지 하나만 있는 상품입니다. 상세 컷이 생기면 첫 상품과 같은 방식으로 뒤에 추가합니다.
        images: [createMockProductImage(2, 'topKnitIvory.png', 2183822)],
        listPrice: 78000,
        salePrice: 75660,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 3,
        categoryId: '31',
        categoryName: 'PANTS',
        name: '카키 카고 팬츠',
        detail: `카키 컬러의 카고 팬츠입니다.
측면 카고 포켓과 여유로운 실루엣이 특징입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(3, 'bottomPantsKhaki.png', 2122710)],
        listPrice: 68000,
        salePrice: 65960,
        new: false,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 4,
        categoryId: '21',
        categoryName: 'T-SHIRT',
        name: '블랙 반팔 티셔츠',
        detail: `블랙 컬러의 반팔 티셔츠입니다.
라운드 넥과 기본 실루엣으로 다양한 하의와 매치할 수 있습니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(4, 'topTShirtBlack.png', 1860241)],
        listPrice: 58000,
        salePrice: 56260,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 5,
        categoryId: '11',
        categoryName: 'JACKET',
        name: '블랙 집업 자켓',
        detail: `블랙 컬러의 집업 자켓입니다.
칼라와 전면 지퍼 여밈이 있는 디자인입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(5, 'outerJacketBlack.png', 1803092)],
        listPrice: 118000,
        salePrice: 114460,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 6,
        categoryId: '12',
        categoryName: 'COAT',
        name: '차콜 싱글 코트',
        detail: `차콜 컬러의 싱글 코트입니다.
칼라와 전면 버튼 여밈이 있는 긴 기장의 디자인입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(6, 'outerCoatCharcoal.png', 2190744)],
        listPrice: 178000,
        salePrice: 172660,
        new: false,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 7,
        categoryId: '31',
        categoryName: 'PANTS',
        name: '블랙 와이드 팬츠',
        detail: `블랙 컬러의 와이드 팬츠입니다.
허리 주름과 여유롭게 떨어지는 실루엣이 특징입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(7, 'bottomPantsBlack.png', 1780930)],
        listPrice: 72000,
        salePrice: 69840,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 8,
        categoryId: '23',
        categoryName: 'HOODIE',
        name: '그레이 풀오버 후디',
        detail: `그레이 컬러의 풀오버 후디입니다.
전면 캥거루 포켓과 소매 및 밑단 리브 마감이 특징입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(8, 'topHoodieGray.png', 2473720)],
        listPrice: 89000,
        salePrice: 86330,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 9,
        categoryId: '22',
        categoryName: 'KNIT',
        name: '차콜 크루넥 니트',
        detail: `차콜 컬러의 크루넥 니트입니다.
목둘레, 소매와 밑단의 리브 마감이 특징입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(9, 'topKnitCharcoal.png', 2469728)],
        listPrice: 88000,
        salePrice: 85360,
        new: false,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 10,
        categoryId: '32',
        categoryName: 'DENIM',
        name: '그레이 스트레이트 데님 팬츠',
        detail: `그레이 컬러의 스트레이트 데님 팬츠입니다.
워싱 디테일과 기본 포켓 구성이 특징입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(10, 'bottomDenimGray.png', 2203207)],
        listPrice: 82000,
        salePrice: 79540,
        new: true,
    },
    // 신규 상품의 가격과 공통 상품 정보는 화면 확인용 목 데이터입니다.
    {
        ...COMMON_PRODUCT_INFO,
        id: 11,
        categoryId: '41',
        categoryName: 'SHOES',
        name: '블랙 더비 슈즈',
        detail: `블랙 컬러의 레이스업 더비 슈즈입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(11, 'etcShoesDerbyBlack.png', 1799274)],
        listPrice: 128000,
        salePrice: 128000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 12,
        categoryId: '41',
        categoryName: 'SHOES',
        name: '아이보리 뮬',
        detail: `아이보리 컬러의 뮬입니다.
뒤가 트인 슬립온 디자인입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(12, 'etcShoesMulesIvory.png', 1819220)],
        listPrice: 79000,
        salePrice: 79000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 13,
        categoryId: '41',
        categoryName: 'SHOES',
        name: '블랙 스니커즈',
        detail: `블랙 컬러의 레이스업 스니커즈입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [
            createMockProductImage(13, 'etcShoesSneakersBlack.png', 2064583),
        ],
        listPrice: 99000,
        salePrice: 99000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 14,
        categoryId: '42',
        categoryName: 'BAGS',
        name: '차콜 크로스바디 백',
        detail: `차콜 컬러의 크로스바디 백입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [
            createMockProductImage(14, 'etcBagsCrossbodyCharcoal.png', 1855919),
        ],
        listPrice: 69000,
        salePrice: 69000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 15,
        categoryId: '42',
        categoryName: 'BAGS',
        name: '블랙 숄더백',
        detail: `블랙 컬러의 숄더백입니다.
곡선형 실루엣과 어깨끈이 특징입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [
            createMockProductImage(15, 'etcBagsShoulderBlack.png', 1939576),
        ],
        listPrice: 89000,
        salePrice: 89000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 16,
        categoryId: '42',
        categoryName: 'BAGS',
        name: '베이지 토트백',
        detail: `베이지 컬러의 토트백입니다.
긴 손잡이로 어깨에도 멜 수 있는 디자인입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [createMockProductImage(16, 'etcBagsToteBeige.png', 2013349)],
        listPrice: 49000,
        salePrice: 49000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 17,
        categoryId: '43',
        categoryName: 'ACCESSORIES',
        name: '블랙 벨트',
        detail: `블랙 컬러의 버클 벨트입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [
            createMockProductImage(17, 'etcAccessoriesBeltBlack.png', 1907925),
        ],
        listPrice: 39000,
        salePrice: 39000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 18,
        categoryId: '43',
        categoryName: 'ACCESSORIES',
        name: '실버 체인 목걸이',
        detail: `실버 컬러의 체인 목걸이입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [
            createMockProductImage(
                18,
                'etcAccessoriesNecklaceSilver.png',
                2064784,
            ),
        ],
        listPrice: 29000,
        salePrice: 29000,
        new: true,
    },
    {
        ...COMMON_PRODUCT_INFO,
        id: 19,
        categoryId: '43',
        categoryName: 'ACCESSORIES',
        name: '블랙 선글라스',
        detail: `블랙 프레임과 어두운 렌즈의 선글라스입니다.

*제품 색상은 제품컷과 가장 유사합니다.`,
        images: [
            createMockProductImage(
                19,
                'etcAccessoriesSunglassesBlack.png',
                1649981,
            ),
        ],
        listPrice: 49000,
        salePrice: 49000,
        new: true,
    },
];
