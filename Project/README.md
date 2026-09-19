# Project Index

`Blast-Forge-Lab`에서 보존하는 검증된 프로젝트의 버전, 상태와 진입점을 관리합니다. agent 운영 문서와 프로젝트 산출물은 분리하며, 각 프로젝트 폴더의 README와 CHANGELOG를 기준으로 현재 범위를 확인합니다.

## Projects

| 프로젝트 | 버전 | 상태 | 설명 | 링크 |
|---|---:|---|---|---|
| ORDO AI | v1.0.0 | Submission candidate | 패션 커머스 리오더 의사결정 AI MD 프로토타입 | [README](./Ordo-AI/README.md) · [CHANGELOG](./Ordo-AI/CHANGELOG.md) · [Demo](https://ordo-ai-decision-os-jihyu.jihyunkims495.chatgpt.site) |

## Versioning

- `v1.0.0`: 평가와 시연이 가능한 첫 기준본
- 기능이나 데이터 계약이 달라지면 CHANGELOG에 범위와 검증 결과를 먼저 기록합니다.
- 데모 fixture, 로컬 검증, 실제 외부 연동을 구분해 기록합니다.
- 외부 서비스 연동은 직접 검증되기 전까지 계획 또는 미연동으로 표시합니다.

## Directory Convention

```text
Project/
├─ README.md
└─ <Project-Name>/
   ├─ README.md
   ├─ CHANGELOG.md
   ├─ app-or-src/
   ├─ docs/
   └─ tools/
```
