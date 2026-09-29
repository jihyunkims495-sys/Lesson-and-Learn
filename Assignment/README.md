# Assignment

수업 파트별 과제와 실습 결과를 한곳에서 확인할 수 있도록 정리한 모음입니다. 각 폴더는 원본 프로젝트의 파일 구조와 내용을 유지합니다.

## 과제 목록

| 수업 파트 | 폴더 | 주요 내용 |
|---|---|---|
| Python | [`02_PYTHON`](./02_PYTHON/) | 개발 환경 설정부터 자료형, 자료구조, 제어문, 함수, 모듈, 예외 처리, 객체지향, 표준 라이브러리까지의 수업·실습과 최종 과제 |
| Machine Learning | [`machine learning final project_김지현`](<./machine learning final project_김지현/>) | 당뇨 데이터 EDA·전처리, 로지스틱 회귀 모델 평가·튜닝, Gemma Few-shot 뉴스 분류 실험 설계 |

## 1. Python

`02_PYTHON`에는 Chapter 01~09의 수업 노트와 실습 노트북이 들어 있습니다.

- 개발 환경: `uv`, 가상환경, VS Code, Jupyter Notebook
- Python 기초: 변수, 자료형, 연산자, 문자열, 자료구조
- 프로그램 구성: 조건문, 반복문, 함수, 모듈, 패키지, 의존성 관리
- 안정성과 설계: 예외 처리, 디버깅, 클래스, 상속, 캡슐화, 표준 라이브러리
- 최종 과제: 객체지향 도서 관리 CLI 시스템

Python 최종 과제는 [`python_final_project_김지현`](./02_PYTHON/python_final_project_김지현/)에서 확인할 수 있습니다. 도서 등록·조회·검색·대여·반납·통계 기능을 구현하고, `Book`을 부모 클래스로 둔 `PrintedBook`과 `Ebook` 상속 구조, 입력 검증과 예외 처리를 적용했습니다. 자세한 실행 방법과 구현 항목은 [프로젝트 README](./02_PYTHON/python_final_project_김지현/README.md)에 정리되어 있습니다.

## 2. Machine Learning

머신러닝 최종 과제는 Pima Indians Diabetes 데이터로 당뇨 여부를 예측하는 이진 분류 과정을 정리한 Jupyter Notebook입니다.

- 탐색적 데이터 분석과 생리학적으로 타당하지 않은 0값 점검
- 결측값 중앙값 대체와 `StandardScaler`를 포함한 전처리 파이프라인
- 로지스틱 회귀의 Accuracy, Precision, Recall, F1-score, ROC-AUC 평가
- `StratifiedKFold`와 `GridSearchCV`를 사용한 규제 방식·강도·class weight 비교
- Gemma 기반 뉴스 기사 Few-shot 분류 프롬프트와 실험 조건 설계

노트북에는 튜닝 후 Recall과 F1-score가 개선된 결과가 기록되어 있습니다. Gemma 실험은 기본값이 `RUN_GEMMA=False`이므로, 모델 이용 동의와 실행 자원이 준비된 환경에서 별도로 활성화해야 합니다.

- [분석 노트북](<./machine learning final project_김지현/머신러닝_최종과제_김지현.ipynb>)
- [데이터셋](<./machine learning final project_김지현/diabetes.csv>)

## 폴더 구조

```text
Assignment/
├── 02_PYTHON/
│   ├── chapter01 Setting/
│   ├── chapter02 변수 연산자 자료형/
│   ├── ...
│   ├── chapter09 파이썬 내장함수와 표준 라이브러리 활용/
│   └── python_final_project_김지현/
├── machine learning final project_김지현/
│   ├── diabetes.csv
│   └── 머신러닝_최종과제_김지현.ipynb
└── README.md
```
