# 《캐슬》 v2.1 원본 데이터 계약 — 보존본

> **DRAFT / 원작 직접 검수 미완료 / 프로젝트 평가 확정 아님**

이 디렉터리는 2026-10-23에 작성된 로컬 설계 번들을 **원본 보존 목적으로** GitHub에 등록한 자료이다. 원래 번들을 구성한 텍스트 파일을 원래 상대 경로 그대로 보존한다. 인물 109명 및 기존 서비스 코드는 변경하지 않았다.

- [원본 ZIP 다운로드](./castle_v2.1_data_contract_review_bundle.zip) (`SHA-256`: `d2909b9fb5c3b6b4765f74ac683adc8f5742e4bd9f46c4e972124004f78acee9`)
- [계약 및 준비도 검토 문서](./castle_v2.1/CASTLE_DATA_CONTRACT_READINESS_v2.1_DRAFT.md)
- [3인 파일럿 계약 fixture](./castle_v2.1/castle_contract_fixture_v2.1_DRAFT.json)
- [근거 12개 후보의 출처 초안](./castle_v2.1/source_drafts/castle_pilot_evidence_v1.1_DRAFT.json)
- [발언·DecisionCase·Outcome 초안](./castle_v2.1/source_drafts/castle_inuniverse_testimony_audit_v1.7_DRAFT.json)
- [화면용 읽기 모델](./castle_v2.1/view_models_preview_v2.1_DRAFT.json)
- [재현용 계약 검증 스크립트](./castle_v2.1/verify_contract.py)
- [번들 사용 안내](./castle_v2.1/README.md)

## 상태 및 사용 제한

- 로컬 검증 `python verify_contract.py` 결과 **32/32 PASS** (계약 및 참조 정적검사, 악성 입력 거부 테스트). 이번 업로드 전에 재실행하여 확인했다.
- 기존 109명·17조직 로스터와 **서로 다른 초안 데이터**이며, 기존 인물 데이터로 자동 병합하지 않았다.
- 3개 Battle 후보, 12개 Evidence 후보, 7개 발언 후보, 4 DecisionCase·4 Outcome 후보, 확장 인물 5명 후보, 9개 과거 점수 가설은 **검토용이며 미승인**이다.
- `local_validation_result_v2.1.json`은 계약 초안을 검증한 기록이다. **원작 장면 대조·실제 브라우저·프로덕션 마이그레이션·공개 배포 검증은 포함되지 않는다.**
- 웹 UI는 현재 이 파일을 읽지 않는다. Evidence를 라이브 사이트에 표시하려면 별도 리뷰 및 코드 연결이 필요하다.

## 검증 방법

```bash
cd docs/contracts/v2.1/castle_v2.1
python -m pip install jsonschema
python verify_contract.py
```

출처: 사용자가 제공한 `castle_v2.1_data_contract_review_bundle(2).zip` 보존본. ZIP 콘텐츠 및 위 보존 디렉터리의 스크립트·자료는 AI 작성 DRAFT로 원작 내용의 정확성은 사용자가 최종 검수해야 한다.
