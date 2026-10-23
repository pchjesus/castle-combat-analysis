# 캐슬 전투력 분석

웹툰 《캐슬》 1·2부 등장인물의 전투 능력을 원작 사실과 전투 맥락에 근거해 분석하기 위한 비공식 팬 프로젝트다.

## 분석 원칙

- 원작에서 확인된 사실, 전투 조건과 맥락, 해석, 평가, 계산을 서로 구분한다.
- 평가는 가능한 한 원작 근거(Evidence)와 연결해 추적 가능하게 설계한다.
- 사용자 제공 초기 조직 분류는 등록 편의를 위한 후보 분류이며, 원작 검증 완료나 모든 시점의 소속 확정을 뜻하지 않는다.
- 현재 능력치 축과 계산식은 미확정이다. 이 저장소는 공식 전투력이나 원작의 공식 서열을 표방하지 않는다.

## 원피스 분석기와의 관계

[원피스 전투력 분석기](https://github.com/pchjesus/onepiece-saikyo-analysis)의 설계 자료를 장기 개발 참고자료로 삼는다. 특히 Character, Group, Membership, Battle, Evidence, Evaluation, CalculationModel, Matchup의 역할 분리와 근거 추적 방식을 참고한다. 이는 구조 설계의 참고이며, 원피스 저장소의 코드나 데이터를 복제하지 않는다. 원피스의 7축 모델, 패기 계산식 및 캐릭터 점수는 이 프로젝트에 적용하지 않는다.

## 현재 단계

**사전 설계 및 초기 인물 등록** 단계다. 사용자 제공 로스터 후보 109명과 17개 조직·분류를 등록했다. 능력치, 계산식, 점수, 근거 충분도, 원작 검증 완료 여부는 입력하지 않았다.

- 초기 로스터: [data/roster.v0.1.json](data/roster.v0.1.json)
- 인물은 모두 `candidate` 상태다.
- 조직은 현재의 초기 분류를 담는다. 데이터 구조는 향후 복수 소속과 시점별 소속 변경을 Membership 기록으로 확장할 수 있다.

## 향후 개발 방향

1. 캐슬에 적합한 평가 모델 실험
2. 원작 장면과 전투 맥락을 추적하는 근거 데이터 구축
3. 범위를 제한한 소규모 MVP
4. 검증 절차를 거치며 분석 인물 확장

## 안내

이 프로젝트는 비공식 팬 프로젝트이며, 원작의 공식 전투력·공식 평가와 무관하다. 등록된 이름과 분류는 초기 입력 자료로, 원작 검증 완료 자료로 간주하지 않는다.


## 읽기 전용 공개 MVP (2026-10-23)

- [웹 시안 바로가기](https://pchjesus.github.io/castle-combat-analysis/) — GitHub Pages 활성화·배포 성공 이후 이용 가능
- `index.html`: 109명 후보 로스터를 기반으로 탐색하는 정적 웹 시안. 아킬라·리천·류지학 중심으로 네 영역(도감/전투력/근거·작중 평가/검수 대장)을 구성한다.
- `scripts/check-mvp.mjs`: 109명/17조직·ID·참조와 미평가·비영리 안내·이미지 미게시 검증. `node scripts/check-mvp.mjs` 실행.
- `docs/MVP_NEXT_PHASE.md`: v2.1 계약 원문 확보 후 실데이터 연결 순서 및 검증 기준.
- `.github/workflows/pages.yml`: `main` 수정 시 검증 후 Pages 배포. Pages가 비활성이라면 GitHub Settings → Pages → Source = GitHub Actions 활성화가 별도로 필요하다.

**주의:** 기존 v2.1 계약 본문과 근거 데이터는 현재 저장소에 연결되지 않았다. 이 공개 시안의 0건은 '미연결'이지 원작에서 근거가 없음을 뜻하지 않는다. 점수·정식 서열·승률·원작 컷 이미지는 게시하지 않았다. 원작 직접 대조, 평가 승인, 실제 공개 페이지 검증은 별도 단계다.

## 후속 개발 브랜치: v2.1 검수 후보 자료 연계 (미배포)

브랜치: [work/v2.1-evidence-readonly](https://github.com/pchjesus/castle-combat-analysis/tree/work/v2.1-evidence-readonly) · 기존 공개 `main`에 미반영.

- 사용자 제공 v2.1 데이터 계약 번들에서 **원작 미검증** 후보 3 Battle / 12 Evidence / 7 Statement / 4 DecisionCase / 4 Outcome을 읽기 전용 UI에 연계했다. 파일의 `schemaVersion=2.1-ui-projection-draft`는 **운영 데이터 정식 스키마가 아닌 화면용 투영물**이다.
- 인물 도감·근거·검수의 ID 참조 및 모바일 대응을 검토했다. 현재도 원작 직접 대조 0건, 정식 평가 0건, Phase 0건, M0 점수 미입력이다.
- 시점별 평가 조사 후보 5명(오도화·현석·임무열·최민욱·강민성)은 동일 Character ID를 유지한다. 시점별 점수/이원화 적용은 미정.
- 명대사는 `data/quotation-review.v0.1.json`에 독립 연구 목록만 구성했다. **인용 대사 0건**, 원문·권리 확인 전에는 인물 화면에 표시하지 않는다. 인물 평가용 Statement와 별개다.
- 이미지 레지스트리 초안은 비공개/미승인 이미지의 공개 표시를 막는 구조 검증만 포함하며 실제 이미지 0장이다.
- [후속 조사 기준](docs/TEMPORAL_AND_QUOTES_RESEARCH_DRAFT.md), [기존 계약 원문 보존본](docs/contracts/v2.1/ARCHIVED_DATA_CONTRACT_READINESS_DRAFT.md), [이미지 관리 초안](docs/CHARACTER_IMAGE_REGISTRY_DRAFT.md)을 참고한다.
- 브랜치 검증: `node scripts/check-mvp.mjs`, `node scripts/check-pilot-v2.1.mjs`; 별도 CI의 Chromium 데스크톱·모바일 smoke 검사. 실제 공개 Pages 사이트로의 새 배포 및 사용자 원작 검수는 하지 않았다.

**주의:** 앞부분의 '사전 설계', '근거 미연결' 안내는 과거 `main` 단계의 기록이다. 이 개발 브랜치에서만 위 데이터 연결이 이뤄졌다.
