import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const roster=read('data/roster.v0.1.json');
const source=read('data/pilot-evidence.v2.1.json');
const originalQueue=read('data/pilot-review-queue.v2.2.json');
const eras=read('data/temporal-evaluation-candidates.v0.1.json');
const research=read('data/research/observation-discriminators.v2.5.DRAFT.json');
assert.equal(research.schemaVersion,'v2.5-research-draft');
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.equal(source.evidence.length,12);
assert.equal(source.statements.length,7);
assert.equal(originalQueue.records.length,19);
assert.deepEqual(Object.values(research.preservation),[12,7,109,17,0,0,0,0]);
assert.equal(research.protocol.primarySecondaryIsNumericMultiplier,false);
assert.deepEqual(research.evidenceDiscriminators.map(e=>e.recordId),source.evidence.map(e=>e.id));
assert.deepEqual(research.statementDiscriminators.map(e=>e.recordId),source.statements.map(s=>s.id));
assert.deepEqual(research.temporalCandidates.map(e=>e.characterId),eras.candidates.map(x=>x.characterId));
for(const e of research.evidenceDiscriminators) {
 const original=source.evidence.find(x=>x.id===e.recordId);
 assert.ok(original,'preserve Evidence IDs');
 assert.equal(e.battleId,original.battleId);
 assert.deepEqual(e.sourceIds,original.sourceIds);
 assert.equal(e.originalVerification,'not-checked');
 assert.equal(e.scoreImpact,'none');
 assert.equal(e.reviewApproval,'none');
 assert.equal(e.readiness,'unassigned');
 assert.equal(e.phaseId,null);
 assert.ok(e.claimToTest && e.alternativeInterpretation && e.observationsToCapture.length>=3 && e.forbiddenInference.length>=1);
 assert.equal(e.existingPrimaryStat,original.primaryRoleCandidate.primary);
}
for(const s of research.statementDiscriminators){
 const original=source.statements.find(x=>x.id===s.recordId);
 assert.deepEqual(s.sourceIds,original.sourceIds);
 assert.equal(s.exactQuoteVerified,false);
 assert.equal(s.assertionTruth,'not-established');
 assert.equal(s.originalVerification,'not-checked');
 assert.equal(s.scoreImpact,'none');
}
for(const e of research.temporalCandidates){
 const original=eras.candidates.find(x=>x.characterId===e.characterId);
 assert.ok(original);
 assert.equal(original.name,e.name);
 assert.deepEqual(e.evaluationStates,[]);
 assert.equal(e.splitDecision,'undecided');
 assert.equal(e.originalVerification,'not-checked');
 assert.equal(e.scoreImpact,'none');
 assert.ok(e.discriminator && e.confounders.length>=2);
}
assert.equal(research.temporalCandidates.find(e=>e.name==='강민성').hypotheses.some(x=>x.includes('현재')),false,'No invalid current state for deceased character');
const json=JSON.stringify(research);
assert.ok(!json.includes('manga-checked') && !json.includes('canon-direct'),'no invented canonical verification');
console.log('PASS: v2.5 12+7+5 candidate-only discriminators; original ID/provenance/state invariants intact');
