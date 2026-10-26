# 목데이터와 상품 이미지 올리기

대상 프로젝트: `cbzjsghbgkpwswtoyqia`.

원본은 `src/shared/mocks/mockData.ts`와 `public/products/`입니다.
카테고리 16개, 상품 19개, PNG 27개(합계 약 43.8 MB)를 확인했습니다.
파일 하나의 최대 크기는 약 3.6 MB입니다. 아래 파일은 준비만 했으며 원격 DB나 Storage에 실행하지 않았습니다.

| 대상                            | 넣을 내용                                      | 방법                     |
| ------------------------------- | ---------------------------------------------- | ------------------------ |
| `public.categories`             | 분류·상위 분류·표시 순서                       | `seed-catalog.sql`       |
| `public.products`               | 상품명·설명·가격·신상품 여부                   | `seed-catalog.sql`       |
| `public.product_images`         | 상품 연결·파일명·Storage 경로·실제 바이트 크기 | `seed-catalog.sql`       |
| Storage의 `product-images` 버킷 | PNG 파일 27개                                  | Dashboard의 Upload files |

`depth`, `categoryName`은 DB에 중복 저장하지 않습니다. 각각 부모 관계와 카테고리 조인으로 구합니다.
상품 ID 1~19는 현재 상세 페이지 주소와 맞춥니다. 이미지 ID는 DB가 자동 생성합니다.
이미지 역할은 대표 `main`, 모델 착용 `model`, 나머지 상세 `detail`로 저장합니다.
모델 사진도 기존 화면 타입으로 바꿀 때는 `product_desc`에 대응합니다.

## 1. SQL 실행

1. [Supabase SQL Editor](https://supabase.com/dashboard/project/cbzjsghbgkpwswtoyqia/sql)를 엽니다.
2. 새 쿼리를 만듭니다.
3. 이 폴더의 최신 `seed-catalog.sql` **전체 내용**을 붙여 넣습니다. 이전 쿼리에 이어 붙이지 말고 내용을 교체하세요.
4. 대상 프로젝트를 확인하고 **Run**을 누릅니다.
5. 마지막 결과가 `seeded_categories = 16`, `seeded_products = 19`, `seeded_images = 27`인지 확인합니다.

이 SQL은 기존 테이블을 삭제하지 않습니다. 같은 ID/경로로 재실행하면 해당 목데이터의 내용을 갱신합니다.
기존 동일 ID가 다른 이름·분류에 쓰이고 있으면 예외를 내고 중단합니다.
기존 회원·장바구니·주문·결제와 RLS 정책은 수정하지 않습니다.
입력은 하나의 `DO $catalog_seed$ ... $catalog_seed$;` 블록으로 실행되며 임시 테이블을 사용하지 않습니다.
일부만 드래그 선택하지 말고 선택을 해제한 상태에서 전체를 실행하세요.
블록 실행 중 오류가 나면 블록의 데이터 변경은 취소됩니다. 원인을 해결한 다음 전체 SQL을 다시 실행하세요.
이전 버전에서 `seed_categories does not exist`가 나왔다면 새 쿼리에서 최신 파일 전체로 다시 실행하세요.
`current transaction is aborted`가 계속 표시되면 `ROLLBACK;`을 먼저 실행하세요.

목데이터에는 확정된 사이즈별 재고가 없어 `product_variants`는 생성하지 않습니다.
상품 조회에는 필요 없지만, 장바구니·주문 테스트에는 별도로 사이즈·SKU·재고를 입력해야 합니다.
화면에 보이는 사이즈 1~4를 그대로 실제 옵션으로 사용할지는 팀에서 정해야 합니다.

## 2. 이미지 업로드

1. [Supabase Storage](https://supabase.com/dashboard/project/cbzjsghbgkpwswtoyqia/storage/files)를 엽니다.
2. `product-images` 버킷이 있으면 그대로 사용합니다. 없으면 **New bucket**에서 이름을 정확히 `product-images`로 입력합니다.
3. 새 버킷은 **Public bucket을 끈 비공개 상태**로 만듭니다. 파일 크기 제한을 지정한다면 5 MB 이상, 허용 MIME을 지정한다면 `image/png`를 허용합니다.
4. 버킷의 **최상위 위치**에서 **Upload files**를 누릅니다.
5. 로컬 `public/products/` 폴더 안의 PNG **27개 파일을 모두 선택**하여 업로드합니다.
6. 완료될 때까지 기다리고 실패한 파일이 없는지 확인합니다.

폴더 전체를 드래그해서 `products/` 하위 폴더가 생기지 않도록 **파일만 선택**하세요.
이미 같은 이름의 파일이 있다면 기존 파일의 업로드 상태를 먼저 확인하세요.

```text
버킷: product-images
경로: outerCoatIvory.png
경로: outerCoatIvoryFront.png
경로: topKnitIvory.png
...
```

DB의 `storage_path`에도 위처럼 **파일명만** 들어갑니다.
`public/products/outerCoatIvory.png`, `products/outerCoatIvory.png`, 버킷 이름, 전체 URL을 저장하지 않습니다.
SQL은 이미지 파일 자체를 업로드하지 않으며 `storage.objects`에 직접 INSERT해서 파일을 대신 만들 수도 없습니다.
기존 상품 이미지 읽기 정책 `onepiece_product_images_read`는 등록된 공개 상품 이미지에 접근하도록 이미 설정되어 있습니다.
비공개 버킷에는 아래의 서명 URL 방식으로 접근합니다. Public 설정을 바꿀 필요가 없습니다.

## 3. 업로드 확인

SQL Editor에서 `verify-catalog.sql` 전체를 실행합니다.

- 초기 카탈로그가 비어 있었다면 전체 건수는 16 / 19 / 27입니다.
- `product-images` 버킷이 조회되어야 합니다.
- `missing_file` 조회 결과는 **0행**이어야 합니다. 파일이 나오면 해당 이름/경로로 아직 업로드되지 않은 것입니다.
- 마지막 비로그인 조회에는 상품 19개와 각 상품의 이미지 개수가 나와야 합니다.

이 확인 파일은 데이터를 추가·삭제하지 않습니다.

## 4. 코드에서 조회하기

상품 목록 `/products`는 Supabase 조회로 연결되어 있습니다. 아래 환경 변수를 `.env.local`에 설정하고 개발 서버를 실행하세요.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://cbzjsghbgkpwswtoyqia.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=대시보드에서_복사한_publishable_key
```

- `src/app/(shop)/products/page.tsx`는 `ProductCatalog`를 표시합니다.
- `src/domains/products/components/ProductCatalog.tsx`는 최초 조회, 로딩, 실패 시 재시도, 30분마다 URL 갱신을 처리합니다.
- `src/domains/products/api/getProductCatalog.ts`는 활성 카테고리·상품·이미지 메타데이터를 조회하고 카드용 타입으로 변환합니다.
- `ProductList`는 DB에서 조회한 카테고리로 대분류·소분류 필터를 표시합니다.
- `next.config.ts`에는 해당 Supabase 프로젝트의 이미지 서명 경로가 허용되어 있습니다.

비공개 `product-images` 버킷의 경로로 1시간 유효한 서명 URL을 발급합니다. URL은 DB에 저장하지 않습니다.
이미지가 누락되거나 Storage 조회에 실패하면 상품 정보는 표시하고 이미지 안내와 재시도 버튼을 제공합니다.
상품 상세도 Supabase 상품·이미지·활성 옵션을 조회합니다. 사이즈는 DB의 `size_label`을 그대로 표시하며, 없는 옵션 ID를 만들거나 숫자를 S/M/L에 대응시키지 않습니다.
현재 DB에서 읽을 수 있는 옵션은 자켓 M(1), 티셔츠 L(2), 코트 L(3)입니다. 옵션이 없는 상품은 조회할 수 있으나 담기는 비활성입니다. 전체 상품의 구매 가능 여부와 결제·주문 저장 완료는 구분해서 확인해야 합니다.
장바구니·주문서에는 이미지 파일 경로를 보관하고 조회 시 서명 URL을 발급하며, 30분 간격과 탭 복귀·온라인 복귀 때 갱신합니다. 이전에 저장된 같은 프로젝트의 서명 URL에서도 경로를 복구합니다.
이 수정에는 DB·RLS·Storage 설정 변경이나 옵션 추가 SQL 실행이 필요하지 않습니다. 위 1~3절은 기존 초기 구축 안내이며 이번 수정의 실행 단계가 아닙니다.
메인 배너의 `public/campaign/` 파일은 상품 카탈로그에 포함되지 않아 이번 업로드 대상에서 제외했습니다.

## 목데이터를 수정했다면

목데이터를 바꾸면 `seed-catalog.sql`의 해당 입력 데이터도 함께 수정하세요.
이미지를 추가하거나 교체하면 Storage 파일과 SQL의 이미지 경로·파일 크기도 맞춰야 합니다.

`product-image-manifest.json`에서 상품 ID, 파일명, 역할, 실제 파일 크기를 확인할 수 있습니다.
`reference/`에는 앞선 구조 비교에서 저장한 ERD·DB 메타데이터가 있으며 데이터 백업이나 실행용 SQL이 아닙니다.

공식 참고: [버킷 생성](https://supabase.com/docs/guides/storage/buckets/creating-buckets),
[Storage 파일 제공·서명 URL](https://supabase.com/docs/guides/storage/serving/downloads),
[파일 업로드](https://supabase.com/docs/guides/storage/uploads/standard-uploads),
[Next.js Image 설정](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns).
