/* Read-only v2.1 draft adapter. Data is a projection of the supplied contract bundle.
 * All candidate descriptions remain SECONDARY and UNVERIFIED; no scoring.
 */
(function (global) {
  'use strict';
  const has = (a, x) => Array.isArray(a) && a.includes(x);
  const safe = (v, escapeHtml) => escapeHtml(String(v == null ? '' : v));
  const statusLabel = v => v === false ? '원작 직접 대조 전' : '검수 상태 재확인 필요';
  const sourceTag = v => /official-series-index/.test(v) ? '공식 작품 목록' :
    /secondary|community/.test(v) ? '2차 정리 자료' : '기타 출처';
  function check(data, roster) {
    if (data?.schemaVersion !== '2.1-ui-projection-draft' || !data.meta?.draftOnly) throw Error('Unexpected pilot contract');
    if (data.meta.originalCanonScenesVerified !== 0 || data.meta.formalEvaluations !== 0) throw Error('Unexpected approval state');
    const exact = { battles: 3, evidence: 12, statements: 7, decisionCases: 4, outcomes: 4 };
    for (const [key, count] of Object.entries(exact)) if (!Array.isArray(data[key]) || data[key].length !== count) throw Error('Missing draft records: ' + key);
    const chars = new Set(roster.characters.map(c => c.id));
    const battle = new Map(data.battles.map(b => [b.id, b]));
    const cases = new Map(data.decisionCases.map(c => [c.id, c]));
    const outcomes = new Map(data.outcomes.map(o => [o.id, o]));
    const sources = new Set(data.sourceCatalog.map(s => s.id));
    const unique = new Set();
    for (const set of [data.battles, data.evidence, data.statements, data.decisionCases, data.outcomes, data.sourceCatalog]) for (const o of set) {
      if (unique.has(o.id)) throw Error('Duplicate record ID: ' + o.id);
      unique.add(o.id);
    }
    for (const b of data.battles) {
      if (!chars.has(b.subjectCharacterId) || !Array.isArray(b.phaseRecords) || b.phaseRecords.length) throw Error('Invalid pilot battle: ' + b.id);
      for (const id of b.participantCandidateCharacterIds || []) if (!chars.has(id)) throw Error('Unknown candidate participant: ' + id);
    }
    for (const e of data.evidence) {
      if (!battle.has(e.battleId) || e.sceneCanonVerified !== false || e.sourceVerification !== 'secondary-only' ||
          e.scoreImpact !== 'none' || e.phaseId !== null || (e.linkedEvaluationItemIds || []).length) throw Error('Invalid evidence: ' + e.id);
      for (const id of e.sourceIds || []) if (!sources.has(id)) throw Error('Invalid source: ' + id);
    }
    for (const s of data.statements) {
      if (s.sceneCanonVerified !== false || s.isExactQuote !== false || s.scoreImpact !== 'none' || !cases.has(s.decisionCaseId)) throw Error('Unsafe draft statement: ' + s.id);
      for (const id of s.targetCharacterIds || []) if (!chars.has(id)) throw Error('Unknown statement target: ' + id);
      for (const id of s.linkedOutcomeIds || []) if (!outcomes.has(id)) throw Error('Broken outcome reference: ' + id);
      for (const id of s.sourceIds || []) if (!sources.has(id)) throw Error('Broken statement source: ' + id);
    }
    for (const o of data.outcomes) if (!cases.has(o.decisionCaseId) || o.sceneCanonVerified !== false) throw Error('Invalid draft outcome: ' + o.id);
    for (const c of data.decisionCases) {
      if (c.parentCaseId && !cases.has(c.parentCaseId)) throw Error('Broken parent case: ' + c.id);
      for (const id of c.linkedOutcomeIds || []) if (outcomes.get(id)?.decisionCaseId !== c.id) throw Error('Wrong outcome case: ' + id);
    }
    return data;
  }
  function forCharacter(data, characterId) {
    const battles = data.battles.filter(b => b.subjectCharacterId === characterId);
    const battleIds = new Set(battles.map(b => b.id));
    const evidence = data.evidence.filter(e => battleIds.has(e.battleId));
    const statements = data.statements.filter(s => has(s.targetCharacterIds, characterId) || s.speakerRef === characterId);
    const caseIds = new Set(statements.map(s => s.decisionCaseId));
    const cases = data.decisionCases.filter(c => caseIds.has(c.id));
    const outcomes = data.outcomes.filter(o => cases.some(c => c.id === o.decisionCaseId));
    return { battles, evidence, statements, cases, outcomes };
  }
  function badge(txt, h) { return '<span class="pilot-tag">' + safe(txt, h) + '</span>'; }
  function sources(data, ids, h) {
    if (!ids?.length) return '<span>출처 연결 없음</span>';
    return ids.map(id => {
      const item = data.sourceCatalog.find(s => s.id === id);
      if (!item) return '<span>참조 오류: ' + safe(id,h) + '</span>';
      const label = safe(item.title || id, h);
      const link = /^https:\/\/[a-z0-9.-]+\//i.test(item.url || '') ?
        '<a href="' + safe(item.url,h) + '" target="_blank" rel="noopener noreferrer">' + label + ' ↗</a>' : label;
      return '<div class="pilot-source">' + badge(sourceTag(item.kind),h) + ' ' + link +
        '<small>' + safe(item.accessNote || '원작 장면 검수 전',h) + '</small></div>';
    }).join('');
  }
  function battleCard(data, record, h, opened) {
    const b = data.battles.find(x => x.id === record.battleId);
    return '<details class="pilot-record" id="record-' + safe(record.id,h) + '"' + (opened ? ' open' : '') + '>' +
      '<summary><span class="pilot-record-title"><small class="pilot-code">' + safe(record.id,h) + ' · 전투 관찰 후보</small>' +
      '<strong>' + safe(record.summary,h) + '</strong></span>' + badge('원작 미대조',h) + '</summary>' +
      '<div class="pilot-record-detail">' +
      '<div class="pilot-detail-row"><strong>원작 사실 후보</strong><p>2차 자료의 설명을 옮긴 검토 후보. 원작에서 직접 확인된 사실이 아님.</p></div>' +
      '<div class="pilot-detail-row"><strong>전투 맥락 / Phase</strong><p>' + safe(b?.title || '전투 참조 미확인',h) +
      ' · Phase 미등록 / 실제 교전 시점·무장·개입 여부 미확인</p></div>' +
      '<div class="pilot-detail-row"><strong>해석 · 능력치 연결 가설</strong><p>주요: ' +
      safe(record.primaryRoleCandidate?.primary || '미지정',h) + ' / 중복 검토: ' +
      safe(record.primaryRoleCandidate?.secondaryReview || '미지정',h) + ' (가산·평가 없음)</p></div>' +
      '<div class="pilot-detail-row"><strong>반론·과대해석 위험</strong><p>' + safe(record.doubleCountRisk || '검토 중',h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>원작 검수 질문</strong><p>' + safe(record.reviewQuestion || '검수 대기',h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>출처 유형 · 자료 위치</strong>' + sources(data,record.sourceIds,h) + '</div>' +
      '<p class="pilot-meta"><strong>원작 직접 확인:</strong> 미완료<br><strong>평가 상태:</strong> 영향 없음 · 충분도 미판정 · 승인 없음</p>' +
      '</div></details>';
  }
  function statementCard(data, record, h, opened) {
    const c = data.decisionCases.find(x => x.id === record.decisionCaseId);
    const linked = (record.linkedOutcomeIds || []).map(id => data.outcomes.find(o => o.id === id)).filter(Boolean);
    return '<details class="pilot-record" id="record-' + safe(record.id,h) + '"' + (opened ? ' open' : '') + '>' +
      '<summary><span class="pilot-record-title"><small class="pilot-code">' + safe(record.id,h) + ' · 작중 판단·발언 후보</small>' +
      '<strong>' + safe(record.speakerName || '발언자 미확인',h) + ': ' + safe(record.summary,h) + '</strong></span>' + badge('원문·진위 미확인',h) + '</summary>' +
      '<div class="pilot-record-detail">' +
      '<div class="pilot-detail-row"><strong>발언 사실과 원문</strong><p>2차 자료·기억에 따른 요약. 원작 대사로 인용할 수 없음.</p></div>' +
      '<div class="pilot-detail-row"><strong>발언 조건</strong><p>' + safe(record.contextBoundary || '조건 미확정',h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>발언자 관점 / 정보</strong><p>' + safe(record.speakerPerspective || '미확인',h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>주장에 대한 검토</strong><p>임시 판정: ' + safe(record.assessment || '미판정',h) + ' · ' + safe(record.limitations || '추가 자료 필요',h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>사건 연결</strong><p>' + safe(c?.id || '사건 미연결',h) + ' · ' + safe(c?.title || '',h) + '</p>' +
      linked.map(o => '<p class="pilot-linked">' + safe(o.id,h) + ' 결과 후보: ' + safe(o.summary,h) +
      ' / 한계: ' + safe(o.causalLimit,h) + '</p>').join('') + '</div>' +
      '<div class="pilot-detail-row"><strong>출처 유형 · 자료 위치</strong>' + sources(data,record.sourceIds,h) + '</div>' +
      '<div class="pilot-detail-row"><strong>검수 항목</strong><p>' + safe((record.pendingReview || []).join(' · ') || '미등록',h) + '</p></div>' +
      '<p class="pilot-meta"><strong>원작 직접 확인:</strong> 발언 존재·원문 미검수<br><strong>평가 상태:</strong> 주장 진위 미확정 · 점수 영향 없음</p>' +
      '</div></details>';
  }
  function caseCard(data, record, h, opened) {
    const parent = data.decisionCases.find(c => c.id === record.parentCaseId);
    const outs = data.outcomes.filter(o => o.decisionCaseId === record.id);
    return '<details class="pilot-record" id="record-' + safe(record.id,h) + '"' + (opened ? ' open' : '') + '>' +
      '<summary><span class="pilot-record-title"><small class="pilot-code">' + safe(record.id,h) + ' · DecisionCase 후보</small>' +
      '<strong>' + safe(record.title,h) + '</strong></span>' + badge('원작 미대조',h) + '</summary>' +
      '<div class="pilot-record-detail"><div class="pilot-detail-row"><strong>사건 계보</strong><p>' +
      safe(parent ? parent.id + '의 자식 사건' : '부모 사건 없음',h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>중복 집계 경고</strong><p>' + safe(record.sharedCausalityNote,h) + '</p></div>' +
      '<div class="pilot-detail-row"><strong>Outcome 후보</strong>' +
      outs.map(o => '<p>' + safe(o.id,h) + ' · ' + safe(o.summary,h) +
        '<br>제약: ' + safe(o.causalLimit,h) + '</p>' + sources(data,o.sourceIds,h)).join('') +
      '</div><p class="pilot-meta">인과와 결과는 직접 검수 전 · 평가 점수 반영 없음</p></div></details>';
  }
  function cardList(data, records, h, openedId) {
    return records.map(({ type, item }) => type === 'battle' ? battleCard(data,item,h,openedId===item.id) :
      type === 'statement' ? statementCard(data,item,h,openedId===item.id) : caseCard(data,item,h,openedId===item.id)).join('');
  }
  function evidencePanel(data, character, filter, openedId, h) {
    const linked = forCharacter(data,character.id);
    const records = [
      ...linked.evidence.map(item => ({type:'battle',item})),
      ...linked.statements.map(item => ({type:'statement',item})),
      ...linked.cases.map(item => ({type:'case',item}))
    ].filter(r => filter === 'all' || r.type === filter);
    const tabs = [{id:'all',label:'전체',count:linked.evidence.length+linked.statements.length+linked.cases.length},
      {id:'battle',label:'전투',count:linked.evidence.length},
      {id:'statement',label:'발언',count:linked.statements.length},
      {id:'case',label:'사건',count:linked.cases.length}];
    return '<div class="pilot-evidence-layout"><section class="panel pilot-reading">' +
      '<div class="panel-header"><div><h2>근거·작중 평가 후보</h2><p class="panel-sub">원본 Record ID 기준 조회 · 공개 읽기 전용</p></div>' +
      '<span class="section-tag">v2.1 DRAFT</span></div>' +
      '<div class="pilot-filters" role="group" aria-label="근거 종류별 필터">' +
      tabs.map(x=>'<button class="filter-btn ' + (filter===x.id?'active':'') + '" type="button" data-filter="' + x.id +
        '" aria-pressed="' + (filter===x.id) + '">' + x.label + ' <small>' + x.count + '</small></button>').join('') + '</div>' +
      (records.length ? '<div class="pilot-record-list">' + cardList(data,records,h,openedId) + '</div>' :
      '<div class="empty"><strong>이 인물에게 직접 연결된 후보 기록 없음</strong><span>없다는 사실이 전투력 부족이나 원작의 근거 부재를 의미하지 않아.</span></div>') +
      '</section><aside class="panel pilot-aside"><h2>읽기 전 확인</h2>' +
      '<p>표시된 기록은 기존 v2.1 계약의 2차 자료 기반 후보야. 원작 대사나 컷을 직접 검수한 결과가 아니야.</p>' +
      '<div class="pilot-key"><b>① 출처</b><span>자료 유형과 해당 장면의 실제 확인 상태는 별개</span></div>' +
      '<div class="pilot-key"><b>② 해석</b><span>상황·반론·다른 설명을 함께 확인</span></div>' +
      '<div class="pilot-key"><b>③ 평가</b><span>E1/E2/E3 미판정, M0 점수 미입력</span></div>' +
      '<div class="pilot-key"><b>④ 검수</b><span>실제 컷 확인 전에는 승인 불가</span></div>' +
      '<p class="pilot-aside-note">Battle 후보 ' + linked.battles.length + '개 · 실제 Phase 0건</p></aside></div>';
  }
  function timeline(data, characterId, h) {
    const records = forCharacter(data,characterId);
    if (!records.battles.length) return '<div class="empty"><strong>이 인물의 연결된 전투 후보 없음</strong><span>자료 미연결은 전투 기량 부족을 의미하지 않아.</span></div>';
    return records.battles.map(b => '<div class="pilot-timeline-item">' +
      '<span class="pilot-code">' + safe(b.id,h) + ' / Phase 0건 / 원작 미검수</span>' +
      '<strong>' + safe(b.title,h) + '</strong>' +
      '<p>' + safe(b.warning,h) + '</p>' +
      '<button class="pilot-text-button" data-view="evidence" type="button">근거 후보 ' + records.evidence.length + '건 보기 →</button>' +
      '</div>').join('');
  }
  function reviewPanel(data,h,queue) {
    const reviewMap = new Map((queue?.records || []).map(r=>[r.recordId,r]));
    const rows = [...data.evidence.map(r=>({id:r.id,type:'전투 관찰',prompt:r.reviewQuestion,source:r.sourceVerification})),
      ...data.statements.map(r=>({id:r.id,type:'발언',prompt:(r.pendingReview||[]).join(' · '),source:r.sourceVerification}))];
    function linkToPilot(id) {
      for(const characterId of ['char-033','char-087','char-071']) {
        const linked=forCharacter(data,characterId);
        if(linked.evidence.some(e=>e.id===id)||linked.statements.some(s=>s.id===id))return characterId;
      }
      return null;
    }
    const priorityHint = '<p class="panel-sub">P1은 시간 순서·참가자·발언 진위를 먼저 대조할 필요가 있는 질문이야. P2도 원작 검수 전이며 점수 가중치는 아니야.</p>';
    return '<div class="summary-metrics pilot-metrics"><div class="metric"><span class="big">12</span><small>전투 Evidence 후보</small></div>' +
      '<div class="metric"><span class="big">7</span><small>발언 후보</small></div>' +
      '<div class="metric"><span class="big">4</span><small>DecisionCase·Outcome 각 4건</small></div>' +
      '<div class="metric"><span class="big">0</span><small>원작 직접 대조 / 정식 점수</small></div></div>' +
      '<div class="pilot-evidence-layout"><section class="panel pilot-reading"><h2>검수 대장 · 원본 ID 추적</h2>' +
      '<p class="panel-sub">아래 19건은 원작 사실이 아닌 후보 기록 및 검수 질문이야. 시점·회차도 원문 직접 확인 전까지 후보로만 표시해.</p>' + priorityHint +
      '<div class="pilot-review-list">' + rows.map(r=>{
        const q=reviewMap.get(r.id);
        const target=linkToPilot(r.id);
        const label=q?.chapterCandidate ? ' · 회차 후보: '+q.chapterCandidate+' (2차 자료)' : '';
        const questions=q?.questions?.length ? '<ul class="audit-questions">'+q.questions.map(item=>'<li>'+safe(item,h)+'</li>').join('')+'</ul>' : '';
        const action=target?'<button type="button" class="pilot-text-button" data-review-open="'+safe(r.id,h)+'" data-review-character="'+safe(target,h)+'">근거 화면에서 '+safe(r.id,h)+' 펼치기 ↗</button>' : '<span class="pilot-unlinked">3인 파일럿 상세와 직접 연결되지 않은 발언 후보</span>';
        return '<div class="pilot-review-row"><span class="pilot-code">'+safe(r.id,h)+' · '+safe(r.type,h)+(q?' · '+safe(q.priority,h):'')+safe(label,h)+'</span>'+
          '<strong>'+safe(r.prompt || '원작 직접 검수 필요',h)+'</strong>'+questions+
          (q?.duplicateRisk?'<p class="audit-risk"><strong>반론·중복 위험:</strong> '+safe(q.duplicateRisk,h)+'</p>':'')+
          '<span>원작 대조: 미완료 · 출처: '+safe(r.source,h)+' · 평가 승인: 없음</span>'+action+'</div>';
      }).join('') +
      '</div></section><aside class="panel pilot-aside"><h2>사건·결과 연계 검수</h2><p>부모·자식 사건과 후속 결과를 독립 표본으로 중복 집계하지 않아.</p>' +
      cardList(data,data.decisionCases.map(item=>({type:'case',item})),h,null) +
      '<p class="pilot-aside-note">출처 유형 / 원작 확인 / E1·E2·E3 / 평가 승인 상태는 서로 독립적이며 현재 모두 미확정.</p>' +
      '</aside></div>';
  }
  global.CastlePilotView = { check, forCharacter, evidencePanel, timeline, reviewPanel, sources };
  if (typeof module === 'object' && module.exports) module.exports = global.CastlePilotView;
})(typeof window !== 'undefined' ? window : globalThis);
