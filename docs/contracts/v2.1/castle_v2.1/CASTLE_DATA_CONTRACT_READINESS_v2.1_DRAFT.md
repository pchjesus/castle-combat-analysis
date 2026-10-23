# 《캐슬》 전투력 분석 — 3인 MVP 데이터 계약 및 개발 준비 검증 v2.1 DRAFT

- 작성일: 2026-10-23 (KST)
- 기준: GitHub `pchjesus/castle-combat-analysis`의 `main` 및 사용자 프로젝트 지침, Light 개발 가이드
- 대상: 기존 109명·17조직 + 후보 5명, 3인 파일럿, 3 Battle 후보, 12 Evidence 후보, 7 발언 후보, 4 DecisionCase·4 Outcome 후보, 9개 과거 점수 가설
- 상태: **설계·로컬 fixture 검증 완료 / 프로젝트 승인 전 / 원작 컷 검증 0건 / 정식 점수 0건 / 웹앱 미구현 / GitHub 쓰기 0건**
- 파일 성격: 이 문서 및 JSON 파일은 **미승인 로컬 설계 자료**이며 실제 제품 데이터베이스나 원작 검수 결과가 아니다.

## 1. 핵심 결정 제안

1. **기존 로스터 유지:** `data/roster.v0.1.json`의 109 Character ID(`char-001`~`char-109`)와 17 Group ID 및 `candidate` 의미를 그대로 보존한다. 직접 조회한 현행 GitHub `main`에서는 ID·이름 중복, 조직 누락, 조직별 인원 불일치가 없었다.
2. **확장 후보 별도 관리:** 리사·이와시로 신스케·김황·김태훈·김선규는 인물 마스터 추가 **후보**다. 현재 정식 등록 인원은 계속 109명이며, 별도 승인 후에만 증가한다.
3. **Person과 Evaluation 분리:** 사람의 이름·행적·발언자·관계자 역할만으로도 카드가 완성된다. 전투력 평가가 없으면 `null/미평가`, 정규 순위에서도 제외. 비전투 인물은 `evaluationIntent=not-planned`를 사용할 수 있으나 약함이나 0점을 의미하지 않는다.
4. **발언자와 원작 주장의 독립성:** 발언 `StatementEvidence`는 누가 어떤 **판단을 내렸는지**를 기록한다. 발언의 사실 확인과 판단 내용의 타당성은 다른 상태다. 확인되지 않은 원문은 `isExactQuote=false`인 요약으로만 취급한다.
5. **전투 Phase 잠정 보류:** 교전 참여 **후보**와 실제 참가 시점·Phase는 분리한다. 컷 대조 전에 순차 교전을 동시 다수전으로 확정하지 않는다. 미등록 경호원/TF팀 같은 표기는 임의 ID 없이 `unresolvedActorLabels`로 보존한다.
6. **동일 원인 중복 방지:** DecisionCase 부모–자식 연결과 Outcome을 통해 조직 개편 → 아킬라 제거 시도처럼 파생 사건을 추적한다. 부모 사건 관련 발언은 자식 사건 Outcome을 참조할 수 있지만, 무관한 사건으로의 연결은 거부한다.
7. **숫자 분리:** 기존 9개 85~100점 점수 가설은 `trialAnchors`에 보존하며 `Evaluation.score`가 아니다. M0만 부분 평가용 구조를 검토하고 M1/M2 계산·정규 순위는 미허용. 5점 기본, 2.5점 세분화는 조건부 실험 가설.

## 2. 로컬 데이터 계약 (구조 제안)

```text
roster.v0.1.json  (원본 보존 · GitHub 읽기 전용)
  ├─ Character (109) ──────┬─ battle candidate (3) ── evidence candidate (12)
  │                        ├─ statements (speaker / target)
  │                        └─ EvaluationState / CombatProfile / Evaluation (현재 0)
  └─ Group (17)            

newPersonCandidates (5) ──┬─ character overview / timeline / source
                          └─ statements (speaker / subject)

statements (7) ── DecisionCase (4, 부모-자식) ── Outcome (4)
             └─ evidence links / source and verification

trialAnchors (9, 별도 실험)    calculationResults (0) / rankings (0)
```

**ID 계약:** 원래 109명의 `char-*` ID는 재발급하지 않는다. 새로운 인물의 임시 ID는 `person-draft-*`를 사용하며, 정식 ID 정책은 별도 승인한다. `rosterReference`에 저장된 109 ID 목록과 17 Group 목록은 실시간 DB 복제본이 아닌 *로컬 인덱스*다. 기존 로스터의 전체 필드/체크섬을 재검증하는 마이그레이션 테스트를 대신하지 않는다.

**참조 계약:** 평가/발언/근거는 인물의 한글 표기가 아니라 안정적인 ID를 참조한다. 다만 직접 대조하지 않은 별칭은 확정된 identity 매핑으로 자동 승격하지 않는다. 리사의 경우 `크리사`의 부분문자열이므로 `includes()` 등 부분문자열 매칭을 인물 식별에 사용하지 않는다.

**인물 추가 계약:** 후보 단계에서는 등록을 승인하지 않는다. `registrationStatus=proposed`, 역할은 복수 선택, 사건·특징·관계에는 출처 검증 상태를 남긴다. 행적 요약은 직접 확인되지 않았다면 `secondary-only`다. 하나의 인물이 작중 발언자이고 전투원일 수도 있으므로 전투원·발언자 역할을 서로 배타적인 타입으로 분리하지 않는다.

## 3. 근거 계약: 주장 종류와 출처 품질

| 차원 | 입력 예시 | 반드시 지킬 조건 |
|---|---|---|
| 출처 유형 | 원작 작품 목록, 커뮤니티 2차 정리, 사용자 기억 | 출처 유형 ≠ 직접 검증 상태 |
| 장면 확인 | 원작 직접 대조 / 간접 확인 / 미확인 | 목록에서 회차가 확인돼도 **컷 내용 검증**이 아님 |
| 관찰 유형 | 전투 행동 후보 / 작중 발언 후보 / 후속 결과 후보 | 발언을 객관적 사실이나 능력 점수로 자동 환산하지 않음 |
| 관찰 조건 | 상대·거리·무장·부상·정보·목표·심리 | 모르면 공란/미확인, 가정과 실제 장면 구분 |
| 근거 역할 | primary / secondary / context | 숫자 배율이 아니며 동시에 출처 분류도 아님 |
| 주장 판정 | 지지 / 반론·충돌 / 미해결 | 직접 원작 사실 검증과 구별 |
| 점수 승인 | AI 잠정 / 사용자 검수 / 프로젝트 평가 확정 | E1/E2/E3(근거 충분도)와 독립 |

**StatementEvidence의 최소정보:** `speakerRef`, `targetCharacterIds`, `summary`, `sourceIds`, `sourceVerification`, `contextBoundary`, `decisionCaseId`, `linkedOutcomeIds`, `limitations`, `scoreImpact`. 발언 목적, 정보 접근성, 직접 경험, 이해관계, 시점이 불분명하다면 적절히 검수 질문으로 남긴다.

**부모–자식 사건 예:** `ST05`(이와시로의 리사 통제력 비판)가 `DC01`(이스크라 조직 개편)에 속하고, `O02`(아킬라 제거 작전 결과)는 그 자식인 `DC02`에 속한다. 이것은 관련 있는 결과 추적으로 허용할 수 있지만 **서로 독립된 오류 2회**로 자동 집계하지 않는다.

## 4. 3인 MVP의 현황 (검증한 파일 참조)

| 인물 | 연결 전투 후보 | 관찰 근거 후보 | 현재 UI 상태 |
|---|---|---|---|
| 아킬라 `char-033` | `pilot-A` | A01~A04 | 전투 개요·근거 후보 표시, 수치 평가 없음 |
| 리천 `char-087` | `pilot-L` | L01~L04 | 전투 개요·근거 후보 표시, 수치 평가 없음 |
| 류지학 `char-071` | `pilot-R` | R01~R04 | 전투 개요·근거 후보 표시, 수치 평가 없음 |

- 현재 3개 Battle 모두 Phase 0건이다. 이는 **전투 단계가 없는 작품**이라는 뜻이 아니라 원작 미대조로 아직 입력하지 않았다는 뜻이다.
- 기존 12개 후보는 이전 v1.1에서 가져온 **2차 자료 기반 요약**이며 원작 사실로 승격하지 않는다.
- `pilot-L`에 크리사가 참여 후보로 기록되어 있어도 실제 교전 참가 순간은 미확정이다.
- 기존 9개 점수 가설은 전부 미승인. 아킬라 부동심 100, 류지학 기동 95 등은 특별히 재검토가 필요한 사례다.

## 5. 화면 데이터 흐름 (v2.0 UI 설계와 연동)

**인물 개요:** Character / 후보 인물의 한두 문장 소개 → 시점별 행적 2~3개 → 관계 → 출처. 모든 문장을 원작 사실로 가장하지 않는다.

**전투력:** Evaluation이 없으면 `평가 자료 없음 — 0점 아님`. 있으면 `EvaluationState → CombatProfile → 개별 능력치·충분도 → 계산 허용 여부` 순서. 기본 상태를 최고점으로 자동 선정하지 않는다.

**근거:** 목록에서는 `[종류] + 한 문장 요약 + 검증 상태 + 주요 반론`을 먼저 노출한다. 펼친 상세에서는 `출처와 장면 → 교전/발언 조건 → 지지/반증 → 능력치 연결` 순서로 보여준다. 하나의 `Evidence`를 여러 능력치에 연결하더라도 중복 가산하지 않는다.

**검수:** 미확인 원문, 참가자·Phase, 출처 간 충돌, 미검증 별칭, 데이터 참조 오류 등을 별도 대장으로 제공한다. 리뷰 체크 하나로 자동 승인하거나 원작 검증 완료로 전이시키지 않는다.

**UI 미리보기 데이터:** `view_models_preview_v2.1_DRAFT.json`에 전투 후보 3명과 서사 인물 후보 5명의 페이지용 읽기 모델을 포함했다. 이는 React 컴포넌트나 웹사이트가 아니며 실제 화면 검증을 의미하지 않는다.

## 6. 실제 검증과 한계

**로컬 검사 명령:**

```bash
python build_fixture.py
python write_schema.py
python build_view_preview.py
python verify_contract.py
```

검증 범위: JSON Schema 구조, 고유 ID·참조 관계, 109/17 인덱스 및 3/12/7/4/4/9 후보 보존, 부모–자식 DecisionCase의 결과 연결, 미검증 대사의 원문 인용 방지, 평가 점수/정규 순위/허위 Phase 방지, 고의로 만든 위반 입력 거부, 인물 도감 읽기 모델의 null 점수 표시.

**로컬 설계 fixture 검사: 32/32 PASS.** 반대로, 다음 항목은 수행하지 않았다.

- 원작 웹툰 컷·대사 직접 대조
- 원피스 웹앱의 브라우저/반응형 회귀검증
- 캐슬 웹사이트 구현·브라우저 확인·배포
- 원래 109명 전체의 데이터 직렬화/역직렬화 또는 실제 저장소 마이그레이션
- GitHub main 로스터와 로컬 인덱스의 파일 체크섬 비교
- 실제 승인 워크플로와 사용자 권한 테스트

검증 도구는 **의도적으로 v2.1 설계 fixture의 미평가/미검증 상태만 허용**하도록 작성했다. 따라서 이 JSON Schema를 그대로 운영용 전체 데이터 스키마로 오해하거나 확장 없이 사용하면 안 된다.

## 7. 구현 전 결정 사항

| 항목 | 현재 판단 | 이후 승인 또는 원작 검수 필요 |
|---|---|---|
| 109명 ID 보존·인물/Evaluation 분리 | 설계상 강하게 권고 | 프로젝트 승인 후 도입 |
| 추가 5명 후보 등록 | 초안만 | 원작/별칭/조직 검수 뒤 등록 |
| 김선규 임시 ID(`person-draft-kimseongyu`) | 표기 불일치 가능성 | 공식 ID 확정 전 정정 여부 판단 |
| 3인 Battle Phase | 미확정 | 원작 컷 및 전투 연속성 확인 |
| DecisionCase 부모-자식 링크 | 계약 시험 통과 | 정확한 사건 인과관계 원작 검수 |
| 2.5점 단위 | 가설 유지 | 신뢰 가능한 근접 비교 사례 확보 |
| M1/M2·기본 프로필·순위 | 보류 | 파일럿 근거 충족 후 결정 |
| 스포일러 노출·모바일 상세 방식 | UI 시안 후보 | 사용자 UX 승인 |
| 검수 저장·승인 권한 | 설계 필요 | 구현 전에 정의 |

## 8. 다음 게이트 제안

1. **v2.2 원작 검수 대장 정비:** 근거 12개와 발언 7개를 우선 원작 대조 가능한 질문·시점으로 정리한다. 그 과정에서 확인된 Phase와 발언자 identity를 확정한다.
2. **v2.3 최소 MVP 구현 승인 게이트:** 인물 도감·근거 조회·검수 상태의 읽기 전용 앱으로 제한해 개발한다. 계산 엔진·정규 순위는 후순위.
3. **v2.4 실제 브라우저 검수:** 109명 누락 없음, 5명 후보 취급, 모바일 근거 상세의 가독성, 데이터 링크 및 미평가 표기를 확인한다.

GitHub 반영·정식 데이터 승격·웹앱 구현은 각각 명시적인 요청 뒤 수행한다.

## 참고 자료 (APA 7판)

- pchjesus. (n.d.). *Castle-combat-analysis* [GitHub repository]. GitHub. https://github.com/pchjesus/castle-combat-analysis
- pchjesus. (n.d.). *Roster v0.1* [JSON dataset]. GitHub. https://github.com/pchjesus/castle-combat-analysis/blob/main/data/roster.v0.1.json
- pchjesus. (n.d.). *Onepiece-saikyo-analysis* [GitHub repository]. GitHub. https://github.com/pchjesus/onepiece-saikyo-analysis
- pchjesus. (n.d.). *EvaluationTrace.tsx* [TypeScript source code]. GitHub. https://github.com/pchjesus/onepiece-saikyo-analysis/blob/main/src/ui/components/EvaluationTrace.tsx

이 문서에서 과거 작품 행적·발언의 근거 후보는 앞선 로컬 DRAFT 데이터에서 가져왔다. 현재 턴에서 원작 대사, 유료 컷 또는 커뮤니티 페이지의 최신 원문을 직접 재검증하지 않았다.
