# Ordo AI × Daytona — 최종 구현 명세

**기록일: 2026-09-19 / v1.1.0 / 외부 LLM 미사용**

## 1. 제출 링크와 보존 원칙

| 구분 | 경로 | 수명 |
| --- | --- | --- |
| Daytona DEV 시연 | https://3001-qjbnuhh9kvnqqhng.daytonaproxy01.net/#entry | 2026-09-19 18:07 KST까지 |
| 서버 계산 API | 동일 주소의 `POST /api/simulate` | 시연과 동일 |
| 서버 상태 | 동일 주소의 `GET /health` | 시연과 동일 |
| 기존 원티드 제출 웹 | https://ordo-ai-decision-os-jihyu.jihyunkims495.chatgpt.site/#entry | 기존 배포 유지 |

Daytona는 기존 웹을 대체하지 않는 별도 복사본입니다. 원본 호스팅에 파일 수정, 커밋, 푸시, 재배포, DNS 변경을 수행하지 않았습니다. 원본 59개 파일의 SHA-256 지문은 작업 전후 동일했고, 기존 공개 버전은 v12로 유지됐습니다. [보존 확인](./evidence/original-site-preservation.json)

임시 DEV URL을 장기 심사용 대표 주소로 교체하지 않습니다. 링크를 공개하면 해당 포트의 시연 화면에 접근할 수 있으나, 관리 API 키나 샌드박스 전체 접근 토큰은 포함되지 않습니다.

## 2. Daytona를 사용한 부분

1. 전용 샌드박스 `ordo-hackathon-20260919`에서 Node.js 프로세스를 실행했습니다.
2. 기존 정적 앱·폰트·영상·합성 데이터와 계산 엔진을 별도 디렉터리에 업로드했습니다.
3. 포트 **3001**에서 정적 화면과 계산 API를 제공했습니다.
4. 브라우저의 `DAYTONA · 서버 시뮬레이션` 버튼이 같은 출처의 API로 입력을 보냅니다.
5. 샌드박스에서 기존 계산 엔진을 실제 실행해 결과·실행 ID·UTC 시각·결과 해시를 반환합니다.
6. 실제 서버 결과를 동일한 로컬 엔진과 비교해 정확한 일치를 확인했습니다.

단순히 스폰서 이름이나 링크만 추가한 것이 아닙니다. 다만 기존 화면의 모든 계산을 서버로 이전한 것도 아닙니다. 기존 클라이언트 계산은 유지하고, 명시적인 서버 실행 버튼을 추가한 범위입니다.

```text
사용자 브라우저 (독립 Daytona 주소)
  ├─ 기존 Ordo 화면 / 로컬 검토 기록
  └─ DAYTONA 서버 시뮬레이션
       └─ POST /api/simulate
            ├─ 필드·SKU·기준일·수량 검증
            ├─ 공개 snapshot + DEV 보정·일별 데이터 투영
            ├─ workbench-model.js: 3개 시나리오 계산
            └─ 실행 ID / 시각 / SHA-256 / 계산 결과

기존 제출 웹 (chatgpt.site) ─ 독립 유지 / 변경 없음
```

## 3. 코드 역할

| 파일 | 역할 |
| --- | --- |
| [deploy.mjs](../daytona/deploy.mjs) | 공식 Daytona API로 파일 업로드·원격 프로세스 실행·공유 URL 발급 |
| [prepare.mjs](../daytona/prepare.mjs) | `app/`을 무수정 복사해 독립 실행 폴더 준비 |
| [demo-server.mjs](../daytona/demo-server.mjs) | 정적 자산 허용 목록, 상태·계산 API, 만료·입력 제한 |
| [analysis.cjs](../daytona/analysis.cjs) | 기존 엔진을 호출하고 필요한 시나리오 필드 반환 |
| [demo-client.js](../daytona/demo-client.js) | 서버 시뮬레이션 대화상자와 요청·오류 상태 |
| [demo-client.css](../daytona/demo-client.css) | 기존 색상·라운드·타이포 톤에 맞춘 독립 확장 스타일 |
| [demo-launcher.cjs](../daytona/demo-launcher.cjs) | 샌드박스에서 서버 프로세스 시작 |

## 4. 입력과 결과

```json
{
  "sku": "RA26FSH060",
  "horizon": "D+14",
  "asOf": "2026-09-18",
  "manualBaseQty": 40,
  "promotionUnits": [100, 90, 80, 70, 110, 130, 120]
}
```

- `sku`: 스냅샷에 존재하는 상품 코드.
- `horizon`: `D+3`, `D+7`, `D+14`, `D+21`, `ALL`.
- `asOf`: 서버가 준비한 스냅샷 기준일과 일치해야 합니다.
- `manualBaseQty`: 선택적 정수, 0–1,000,000. 생략/null이면 자동 수량. 수동 입력이 MOQ 등 제약에 어긋나면 검토 필요 상태로 반환합니다.
- `promotionUnits`: 선택적 월–일 판매량 7개. OVERVIEW에서 적용한 값이 전달됩니다.
- `weekdayFactors`: 선택적 요일 가중치 7개. 기존 정책 입력을 유지합니다.

반환 값은 `executionId`, `executedAt`, `runtime`, `inference`, `resultHash`, `calculation`, `supplierOrderSent`입니다. `calculation.scenarios`는 보수·균형·수요 확대의 수량, 원가, 예상 매출, 잔여 재고, 결품 손실, 허용 여부와 제약을 포함합니다.

수동 물량을 입력해도 자동 권고 분류는 별도로 표시합니다. 포트폴리오 예산을 배분하기 전의 독립 SKU 결과이며, 공급업체로 보내는 실제 발주 API는 없습니다.

## 5. 검증 결과

- 실제 Daytona 호출: 자동 입력 / 수동 기준 물량 / 수동 주간 판매의 **3회·9개 시나리오 정확히 일치**.
- 로컬 집중 테스트: 정적 화면·영상 범위 응답, 입력 검증, 동일 모델 결과 비교, 한도·만료 등 4개 테스트 통과.
- 브라우저 검증: 메인과 6개 메뉴, 자동 서버 계산, 수동 주간 입력+수동 물량 조합, 180.032초 영상 로딩.
- 원본 파일 보존: 59개 파일 변경 없음; 원본 Git HEAD `f8a6831a4898a22bc3c2c39310d1be161b948d48` 유지.
- [실제 실행 기록](./evidence/daytona-demo-evidence.json) · [서버 계산 캡처](./screenshots/08-daytona-server.jpg).

기록은 해당 시점의 실제 실행 증거입니다. URL 만료 후에도 그 시점의 검증을 설명하지만, 이후의 상시 가용성을 보장하지 않습니다.

## 6. 로컬 재현

Node.js 22 이상이 필요합니다. 외부 라이브러리나 API 키 없이 계산·화면을 로컬에서 점검할 수 있습니다.

```powershell
cd Project\Ordo-AI
node daytona\prepare.mjs
node --test daytona\demo.test.mjs
node daytona\.runtime\demo-server.mjs
```

`http://127.0.0.1:3001/#entry`에 접속합니다. 로컬 실행은 실제 Daytona 실행 증거가 아닙니다. JSON의 `runtime` 표시는 시연 프로토콜의 공급자 이름이며 실행 장소는 배포 환경으로 확인해야 합니다.

## 7. Daytona 배포 재현

전제: 본인이 소유한 시작 상태의 샌드박스, 공식 Daytona API 접근 권한, 사용 가능한 크레딧. `DAYTONA_API_KEY`와 `DAYTONA_SANDBOX_ID`를 비공개 환경 변수로 제공합니다. 키를 코드·README·Git·브라우저에 넣지 않습니다.

```powershell
node daytona\prepare.mjs
node daytona\deploy.mjs
```

이 명령은 선택한 샌드박스의 `/home/daytona/ordo-demo`에 배포하고, 포트 3001용 **3시간 공유 URL**을 생성합니다. 서버가 이미 실행 중이면 런처는 기존 프로세스를 유지하므로, 재배포는 이전 시연 프로세스를 정상 종료한 상태에서 수행합니다. 새 키를 만들거나 새 샌드박스·도메인·유료 플랜을 구매하지 않습니다. 환경 변수 파일은 업로드하지 않습니다.

배포 헬퍼는 공개용으로 경로를 정리한 버전입니다. 구문·로컬 서버 재현은 검증하며, 기존 라이브 시연을 덮어쓰는 재배포는 수행하지 않습니다.

## 8. 보안·운영 한계

- 정적 공개 디렉터리와 두 확장 자산만 제공하며 서버 설정·키 파일은 제공하지 않습니다.
- JSON 요청 4KB 제한, 허용된 필드만 수용, 교차 사이트 브라우저 요청 거부, 실행 횟수 500회 제한.
- 키 없는 계산 서버이며 Nosana·외부 LLM을 호출하지 않습니다. 외부 환율 API는 기존 브라우저 위젯이 별도로 조회합니다.
- 동일 출처 제한과 임시 포트 링크는 정식 로그인·사용자별 인증 체계의 대체물이 아닙니다.
- 18:07 KST에 앱·링크가 만료됩니다. 샌드박스 유휴 자동 중지는 180분이며, 앱 종료 후에도 마지막 활동 시점에 따라 잠시 더 유지될 수 있습니다.
- DNSimple은 계정 확인만 했고, 실제 도메인·DNS 연결에는 사용하지 않았습니다. Nosana 시험 호출은 있었지만 최종 시연 구성에서 제외했습니다.
- 합성 데이터의 재현성을 검증한 것이지 실데이터 예측 정확도나 자동 발주 안전성을 입증한 것은 아닙니다.

## 참고

- [Daytona Sandbox](https://www.daytona.io/docs/en/sandboxes/)
- [프로세스 실행](https://www.daytona.io/docs/en/process-code-execution/)
- [공유 프리뷰 URL](https://www.daytona.io/docs/en/preview/)
- [네트워크 제한](https://www.daytona.io/docs/en/network-limits/)
