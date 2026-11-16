# 프론트엔드 심화 — TypeScript

전자상거래 회원·상품을 모델링하고, 타입 안전한 집계 함수와 제네릭 저장소를 구현했습니다. 두 노트북은 각각 독립 실행할 수 있습니다. 모든 샘플 이름·이메일·상품은 실습용 가상 데이터입니다.

## 현재 검증 상태

- **정적 검사 통과:** TypeScript 7.0.2, `strict: true`, 명시적 입출력 타입, `any` 사용 없음.
- **실제 Jupyter 실행 통과:** Jupyter client 8.9.1과 tslab 1.0.22로 두 노트북의 코드 셀 총 6개를 실행했습니다. 각 노트북의 실행 번호 1~3과 실제 출력이 저장되어 있습니다.
- **VS Code 실행 통과:** TypeScript 커널을 선택하여 두 노트북에서 각각 **Run All → 전체 코드 셀 완료 확인 → 저장**을 수행했습니다. 총 6개 코드 셀에 실행 번호 1~3과 오류 없는 출력이 저장되어 있습니다.

## 평가기준 대응

| 기준 | 구현 근거 | 확인 결과 |
|---|---|---|
| 인터페이스·타입 별칭 | `UserRole`, `Category`, `User`, `Product`; 공통 `Identifiable` 상속 | 모든 필수 필드와 선택적 `discountRate` 포함 |
| 기본 타입·오류 수정 | 인수와 반환값 타입, strict 정적 검사, `unknown` 예외 처리 | `tsc --noEmit` 통과. 의도적 타입 위반 4건도 검증 |
| 타입 가드·유니언 | `if ('email' in item)`으로 User/Product 분기 | 회원 3종과 상품 3종 모두 정상 출력 |
| 제네릭 클래스·재사용 | `InMemoryStorage<T extends Identifiable>`, private 배열, User/Product 인스턴스 | 추가·단건조회·전체조회·수정·삭제 및 실패 조건 통과 |

제네릭 제약은 `<T extends Identifiable>`로 선언하여 저장 항목에 공통 `id`가 있도록 보장합니다.

## 파일 안내

| 파일 | 역할 |
|---|---|
| [01_data_modeling.ipynb](01_data_modeling.ipynb) | 모델, 역할별 필터, 할인 총액과 경계값 검증 |
| [02_generics_typeguard.ipynb](02_generics_typeguard.ipynb) | 타입 가드, 제네릭 저장소와 캡슐화 검증 |
| [verify.ts](verify.ts) | 두 노트북의 실행 로직을 정적 검사하는 합본 |
| [type-errors.ts](type-errors.ts) | 금지 타입이 실제 컴파일 오류인지 검증하는 fixture. 실행하지 않음 |
| [execute_notebooks.py](execute_notebooks.py) | 실제 Jupyter/tslab 커널로 각 노트북을 실행·저장 |
| [execute_tslab_engine.cjs](execute_tslab_engine.cjs) | tslab 엔진을 직접 호출하는 실행 도구 |
| [finish-local.ps1](finish-local.ps1) | 로컬 설치 → 타입 검사 → Jupyter 실행 → 제출 ZIP 생성 |

## 코드의 핵심 결정

`UserRole`과 `Category`는 허용하는 문자열 집합이므로 유니언 타입으로 선언합니다. 객체는 `interface`로 필드 구조를 정의하고, 두 모델에 공통인 `id`만 `Identifiable`로 분리합니다.

`calculateTotalPrice`는 각 상품 한 개씩의 결제 금액을 합산합니다. `stock`은 재고 수량이며 결제 수량이 아닙니다. 할인율은 0~1 비율이고 생략하면 `?? 0`을 통해 정가를 적용합니다. 상품별 금액을 원 단위로 반올림합니다. 예제는 40,000×0.9 + 20,000 + 50,000 = **106,000원**입니다.

`renderItemSummary`는 회원에만 있는 `email`을 검사합니다. 참 분기에서 User 필드에 접근하고 거짓 분기에서 Product 필드에 접근하므로 강제 타입 단언 없이 안전하게 처리합니다.

저장소는 추가·조회 때 객체를 복사하여 외부 변경이 내부 배열에 바로 반영되지 않도록 합니다. 현재 모델은 원시값만 가지므로 얕은 복사가 충분합니다. 중첩 객체를 추가할 때는 깊은 복사 정책을 별도로 정해야 합니다. 중복 ID와 없는 ID 수정은 예외를 발생시키며, 없는 ID 조회는 `undefined`, 삭제는 성공 여부를 반환합니다.

## 로컬에서 마무리

Node.js, uv, VS Code와 Jupyter 확장을 준비한 뒤 프로젝트 폴더에서 실행합니다. `finish-local.ps1`은 고정된 의존성을 `npm ci`로 설치하고 Jupyter client·IPython·tslab 커널 준비, 타입 검사, 노트북 실행, ZIP 생성을 수행합니다.

```powershell
.\finish-local.ps1
```

VS Code에서 재현하려면 두 `.ipynb`를 열어 해당 프로젝트의 **TypeScript(tslab) → Run All → 저장**을 수행하세요. 두 파일 모두 코드 셀 아래 결과가 있고 빨간 오류가 없는지 확인한 뒤 `python package_submission.py`로 저장된 출력을 포함한 ZIP을 다시 만듭니다.

생성한 `typescript-assignment.zip`의 루트에 두 노트북과 재현 코드 등 프로젝트 파일 13개가 포함됩니다. 패키지 생성기는 실행 번호와 오류 없는 출력을 확인한 코드·출력 스냅샷을 압축합니다. 이 과제는 웹 배포가 필요하지 않고 ZIP 파일로 제출합니다. AI 보조 작성 코드이므로 내용을 직접 검토하고 설명할 수 있는 상태에서 제출해야 합니다.
