# 머신러닝 — 당뇨 예측 분석

Pima Indians Diabetes 데이터를 활용한 이진 분류 과제입니다. 분석 과정과 실행 결과는 [Jupyter Notebook](머신러닝_최종과제_김지현.ipynb), 입력 데이터는 [diabetes.csv](diabetes.csv)에서 확인할 수 있습니다.

## 분석 내용

- 탐색적 데이터 분석과 생리학적으로 타당하지 않은 0값 점검
- 결측값 중앙값 대체와 StandardScaler 전처리 파이프라인
- 로지스틱 회귀의 Accuracy·Precision·Recall·F1-score·ROC-AUC 평가
- StratifiedKFold와 GridSearchCV를 이용한 규제 방식·강도·class weight 비교
- Gemma 기반 뉴스 기사 Few-shot 분류 프롬프트와 실험 조건 설계

노트북과 CSV를 같은 폴더에 두고 Jupyter에서 노트북을 엽니다. 노트북에는 튜닝 후 Recall과 F1-score가 개선된 결과가 기록되어 있습니다. Gemma 실험은 기본값이 `RUN_GEMMA=False`이며, 모델 이용 동의와 실행 자원이 준비된 환경에서 별도로 활성화합니다.

[레벨별 과제 목록](../README.md) · [전체 과제 목록](../../README.md)
