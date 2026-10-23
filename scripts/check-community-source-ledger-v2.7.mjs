import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const roster = read('data/roster.v0.1.json');
const src = read('data/pilot-evidence.v2.1.json');
const queue = read('data/pilot-review-queue.v2.2.json');
const research = read('data/research/community-source-ledger.v2.7.DRAFT.json');

assert.equal(research.schemaVersion, 'v2.7-community-review-draft');
assert.equal(research.status, 'research-unapproved');
assert.equal(research.baselineMainSha, '4766cad4ea61be7727ee0949e4c65bc228dc36c9');
assert.equal(roster.characters.length, 109);
assert.equal(roster.organizations.length, 17);
assert.deepEqual([src.battles.length,src.evidence.length,src.statements.length,queue.records.length],[3,12,7,19]);
assert.ok(src.battles.every(b => Array.isArray(b.phaseRecords) && b.phaseRecords.length === 0));
assert.equal(research.verification.originalPanelsDirectlyVerified, 0);
assert.equal(research.verification.officialQuotesDirectlyVerified, 0);
assert.equal(research.verification.formalEvaluations, 0);
assert.equal(research.verification.phaseRecordsApproved, 0);
assert.equal(research.issues.length, 7);
assert.equal(research.sources.length, 17);

const sourceIds = new Set(research.sources.map(s=>s.id));
const issueIds = new Set(research.issues.map(i=>i.id));
const characterIds = new Set(roster.characters.map(c=>c.id));
const evidenceIds = new Set(src.evidence.map(e=>e.id));
assert.equal(sourceIds.size, research.sources.length);
assert.equal(issueIds.size, research.issues.length);
assert.deepEqual(new Set(research.sources.map(s=>s.platform)),new Set(['dcinside','reddit']));
assert.deepEqual(new Set(research.sources.map(s=>s.accessMode)),new Set(['full-text-read','search-excerpt-read']));

for(const item of research.sources){
  assert.ok(/^https:\/\/(gall\.dcinside\.com|m\.dcinside\.com|www\.reddit\.com)\//.test(item.url));
  assert.equal(item.sourceType, 'community');
  assert.equal(item.originalSceneVerification, 'not-checked');
  assert.equal(item.independentCanonCorroboration, false);
  assert.equal(item.scoreImpact, 'none');
  assert.equal(item.quoteRights, 'not-reviewed');
  assert.ok(item.communityClaims.length > 0 && item.limitations.length > 0);
  assert.ok(item.independenceGroup && item.accessMode && item.role);
  for(const id of item.characterIds) assert.ok(characterIds.has(id), 'unknown character '+id);
  for(const id of item.linkedEvidenceIds) assert.ok(evidenceIds.has(id), 'unknown Evidence '+id);
}
const sourceMap = new Map(research.sources.map(s=>[s.id,s]));
assert.equal(sourceMap.get('C01').independenceGroup,sourceMap.get('C02').independenceGroup,
  'Odoha serialized posts cannot be counted as two independent observations');
assert.equal(sourceMap.get('C06').independenceGroup,'wiki-derived-287144','copied wiki ranking is not independent corroboration');
assert.notEqual(sourceMap.get('C10').independenceGroup,sourceMap.get('C11').independenceGroup,
  'opposing independent author posts must not be deduplicated');
const allGroups = new Set(research.sources.map(s=>s.independenceGroup));
assert.ok(allGroups.size < research.sources.length,'must de-duplicate author series');
for(const issue of research.issues){
  assert.ok(issue.question && issue.alternatives.length>=2 && issue.requiredCanonObservations.length>=2);
  assert.ok(issue.doNotInfer.length>0 && issue.sourceIds.length>0);
  for(const id of issue.sourceIds) assert.ok(sourceIds.has(id));
  for(const id of issue.subjectIds) assert.ok(characterIds.has(id));
  for(const id of issue.linkedEvidenceIds) assert.ok(evidenceIds.has(id));
}
assert.ok(research.issues.find(i=>i.id==='L04-sequence').sourceIds.includes('C06'));
assert.ok(research.issues.find(i=>i.id==='OD-axe-tech').sourceIds.includes('C01'));
assert.ok(research.issues.find(i=>i.id==='OD-axe-tech').sourceIds.includes('C02'));
assert.equal(research.methodology.identicalAuthorSerialIsSingleIndependentGroup,true);
assert.equal(research.methodology.communityAgreementDoesNotVerifyCanon,true);
assert.equal(research.methodology.wikiCopiedPerformanceTablesNotIndependent,true);
assert.equal(research.methodology.tierPercentNumbersAreNotEvaluation,true);
assert.equal(research.methodology.imageRedistributionAllowed,false);
assert.ok(research.methodology.preferredDiscoveryOrder[3].includes('Korean'));
assert.ok(research.methodology.overseasDiscussionRole.includes('supplementary'));
assert.ok(research.methodology.caveat.includes('not blanket'));
const tactics = read('data/research/aquila-gustav-tactical-hypotheses.v2.7.DRAFT.json');
assert.equal(tactics.schemaVersion, 'v2.7-aquila-cognitive-tactics-addendum');
assert.equal(tactics.characterId, 'char-033');
assert.equal(tactics.opponentCharacterId, 'char-042');
assert.equal(roster.characters.find(c=>c.id===tactics.opponentCharacterId)?.name, '구스타프');
assert.equal(tactics.battleId, 'pilot-A');
assert.deepEqual(tactics.linkedEvidenceIds, ['A01','A02','A03','A04']);
for (const id of tactics.linkedEvidenceIds) assert.ok(evidenceIds.has(id));
for (const id of tactics.linkedCommunityIssueIds) assert.ok(issueIds.has(id));
assert.equal(tactics.originalCanonVerified, false);
assert.equal(tactics.originalSceneDirectlyReviewed, false);
assert.equal(tactics.scoresApproved, false);
assert.equal(tactics.approval, 'none');
assert.equal(tactics.userHypothesis.origin, 'user-analysis-2026-10-23');
assert.equal(tactics.userHypothesis.epistemicClass, 'user-interpretation-plus-counterfactual');
assert.ok(tactics.userHypothesis.components.every(c=>c.verified===false));
assert.deepEqual(tactics.competingModels.map(m=>m.id), ['H1','H2','H3','H4']);
for(const model of tactics.competingModels) {
  assert.ok(model.predicts.length>=2 && model.falsifiers.length>=2);
  assert.ok(['possible-intended-strategy','user-original-reported-intended-strategy-awaiting-panel-location','counterfactual-not-observed','alternative-causal-motive','counter-interpretation'].includes(model.classification));
}
assert.equal(tactics.competingModels.find(x=>x.id==='H2').classification,'counterfactual-not-observed');
assert.equal(tactics.competingModels.find(x=>x.id==='H1').classification,'user-original-reported-intended-strategy-awaiting-panel-location');
assert.equal(tactics.userReportedOriginalDetails.sourceType,'user-firsthand-original-reading-report');
assert.equal(tactics.userReportedOriginalDetails.originalDirectlyCheckedByUser,true);
assert.equal(tactics.userReportedOriginalDetails.originalDirectlyCheckedByAssistant,false);
assert.equal(tactics.userReportedOriginalDetails.episodeAndPanelLocatorVerified,false);
assert.equal(tactics.userReportedOriginalDetails.formalProjectApproval,false);
assert.equal(tactics.userReportedOriginalDetails.reports.length,2);
assert.deepEqual(tactics.userReportedOriginalDetails.reports[0].literalStatusMarkers,['0발','사거리 미달','8/10발']);
assert.equal(tactics.userReportedOriginalDetails.reports[0].markerToSpecificOpponentMapping,'not-explicitly-mapped-in-user-message');
assert.equal(tactics.userReportedOriginalDetails.reports[1].shortPhraseAsUserReported,'구스타프가 흔들린다');
assert.equal(tactics.userReportedOriginalDetails.reports[1].verbatimQuotePrimaryVerified,false);
assert.equal(tactics.sourcePreferencePolicy.priorityOrder[0],'original-panels-directly-verified');
assert.equal(tactics.sourcePreferencePolicy.priorityOrder.at(-1),'overseas-translated-discussion');
assert.ok(tactics.sourceLeads.some(s=>s.id==='SL6'&&s.url.includes('castlewebtoon&no=341783')));
assert.ok(tactics.canonChecklist.some(s=>s.key==='T07'));
assert.ok(tactics.canonChecklist.some(s=>s.key==='T06'));
assert.equal(tactics.sourceLeads.length, 6);
assert.ok(tactics.sourceLeads.some(x=>x.communityLedgerId==='C12'));
for(const ref of tactics.sourceLeads) {
  assert.equal(ref.verification.endsWith('not-canon'), true);
  assert.ok(/^https:\/\//.test(ref.url));
  if (ref.communityLedgerId) assert.ok(sourceIds.has(ref.communityLedgerId));
}
assert.equal(tactics.abilityAssignments.length, 5);
assert.ok(tactics.abilityAssignments.every(a=>a.score==='unassigned'));
assert.ok(tactics.matchupScenarios.every(s=>s.verified===false));
assert.ok(tactics.prohibitions.some(x=>x.includes('반복')));

console.log('PASS: 17 community posts, 7 debates, Akila tactical alternatives and 0 canon/score promotions');
