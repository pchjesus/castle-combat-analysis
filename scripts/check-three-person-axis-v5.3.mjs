import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const pilot=read('data/pilot-evidence.v2.1.json'),r=read('data/research/three-person-axis-attribution.v5.3.DRAFT.json'),q=read('data/character-quotes.v3.4.DRAFT.json');
assert.equal(r.records.length,12);
assert.equal(r.meta.canonDirectChecks,0);
assert.equal(r.meta.approvedScores,0);
assert.deepEqual(r.records.map(x=>x.recordId),pilot.evidence.map(x=>x.id));
for(const x of r.records){const p=pilot.evidence.find(y=>y.id===x.recordId);assert.deepEqual(x.source.ids,p.sourceIds);assert.equal(x.secondaryDescription,p.summary);assert.equal(x.evaluation.primaryAxisCandidate,p.primaryRoleCandidate.primary);assert.equal(x.evaluation.secondaryAxisCandidate,p.primaryRoleCandidate.secondaryReview);assert.equal(x.canonFact.factText,null);assert.equal(x.canonFact.episode,null);assert.equal(x.combatContext.verified,false);assert.equal(x.evaluation.score,null);assert.equal(x.evaluation.scoringImpact,'none');}
assert.equal(q.quotes.length,107);
assert.equal(q.quotes.find(x=>x.id==='CQ-105').exactText,"머리털 끝까지 신경들 곤두세워라. 경호대를 카바칠 수 있는 건 우리 선진 출신밖에 없다.");
assert.equal(q.choiHyeokjinQuoteRevision.originalDirectChecked,false);
console.log('PASS: 12 unverified pilot records, 107 character quotes, CQ-105 replacement');
