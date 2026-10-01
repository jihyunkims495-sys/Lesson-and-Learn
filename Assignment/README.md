# Assignment

수업 파트별 최종 과제와 3분 브리프 자료를 한곳에서 확인할 수 있도록 정리한 모음입니다. 최종 과제 폴더명은 `강좌명_final_project_김지현` 형식으로 통일했습니다.

## 과제 및 자료 목록

| 구분 | 폴더 | 주요 내용 |
|---|---|---|
| Python 최종 과제 | [`python_final_project_김지현/`](./python_final_project_김지현/) | 객체지향 도서 관리 CLI 시스템 |
| Machine Learning 최종 과제 | [`machine_learning_final_project_김지현/`](./machine_learning_final_project_김지현/) | 당뇨 데이터 EDA·전처리, 로지스틱 회귀 모델 평가·튜닝, Gemma Few-shot 뉴스 분류 실험 설계 |
| Frontend Basic 최종 과제 | [`frontend_basic_final_project_김지현/`](./frontend_basic_final_project_김지현/) | HTML·CSS·JavaScript로 구현한 Todo 체크리스트 |
| 3분 브리프 | [`3min_brief/`](./3min_brief/) | 데이터베이스와 머신러닝 발표 자료 링크 |

## 1. Python

파이썬 최종 과제는 객체지향 도서 관리 CLI 시스템입니다. 도서 등록·조회·검색·대여·반납·통계 기능을 구현하고, `Book`을 부모 클래스로 둔 `PrintedBook`과 `Ebook` 상속 구조, 입력 검증과 예외 처리를 적용했습니다.

- [프로젝트 README](./python_final_project_김지현/README.md)

## 2. Machine Learning

머신러닝 최종 과제는 Pima Indians Diabetes 데이터로 당뇨 여부를 예측하는 이진 분류 과정을 정리한 Jupyter Notebook입니다.

- 탐색적 데이터 분석과 생리학적으로 타당하지 않은 0값 점검
- 결측값 중앙값 대체와 `StandardScaler`를 포함한 전처리 파이프라인
- 로지스틱 회귀의 Accuracy, Precision, Recall, F1-score, ROC-AUC 평가
- `StratifiedKFold`와 `GridSearchCV`를 사용한 규제 방식·강도·class weight 비교
- Gemma 기반 뉴스 기사 Few-shot 분류 프롬프트와 실험 조건 설계

노트북에는 튜닝 후 Recall과 F1-score가 개선된 결과가 기록되어 있습니다. Gemma 실험은 기본값이 `RUN_GEMMA=False`이므로, 모델 이용 동의와 실행 자원이 준비된 환경에서 별도로 활성화해야 합니다.

- [분석 노트북](./machine_learning_final_project_김지현/머신러닝_최종과제_김지현.ipynb)
- [데이터셋](./machine_learning_final_project_김지현/diabetes.csv)

## 3. Frontend Basic

프론트엔드 기초 과제는 HTML로 화면 구조와 입력 폼을 만들고, CSS로 체크리스트를 디자인한 뒤, JavaScript DOM 조작으로 Todo 기능을 구현한 프로젝트입니다.

- 일정 추가·수정·삭제
- 체크박스를 이용한 완료 상태 변경
- 전체·할 일·완료 목록 조회
- 시맨틱 HTML, Flexbox, `hover`·`focus` 스타일 적용
- 배열과 반복 렌더링 없이 DOM 요소를 직접 추가하는 간단한 JavaScript 구성

과제 코드와 교안 내용의 연결은 [Frontend Basic README](./frontend_basic_final_project_김지현/README.md)에서 확인할 수 있습니다.

## 4. 3분 브리프

[`3min_brief`](./3min_brief/) 폴더에는 다음 웹 발표 자료의 링크와 핵심 주제를 정리했습니다.

- [데이터베이스 구조 · 스키마부터 정규화까지](https://database-keys-integrity-jihyu.jihyunkims495.chatgpt.site/)
- [머신러닝 발표자료 · 회귀부터 K-Fold까지](https://machine-learning-presentation-jihyu.jihyunkims495.chatgpt.site/)

## 폴더 구조

```text
Assignment/
├── 3min_brief/
│   └── README.md
├── frontend_basic_final_project_김지현/
│   ├── README.md
│   └── todo-checklist/
│       ├── README.md
│       ├── css/
│       ├── docs/
│       ├── index.html
│       └── js/
├── machine_learning_final_project_김지현/
│   ├── diabetes.csv
│   └── 머신러닝_최종과제_김지현.ipynb
├── python_final_project_김지현/
│   ├── README.md
│   ├── main.py
│   ├── models/
│   ├── screenshots/
│   └── utils/
└── README.md
```
