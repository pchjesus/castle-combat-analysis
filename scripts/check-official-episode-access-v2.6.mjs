import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p => JSON.parse(readFileSync(p,'utf8'));
const audit=read('data/research/official-episode-access.v2.6.DRAFT.json');
const contract=read('data/pilot-evidence.v2.1.json');
const roster=read('data/roster.v0.1.json');
assert.equal(audit.schemaVersion,'v2.6-official-episode-access-draft');
assert.equal(audit.strictSeparation.actualCanonPanelsReviewed,0);
assert.equal(audit.strictSeparation.canonicalCombatClaimsVerified,0);
assert.equal(audit.strictSeparation.phaseRecordsApproved,0);
assert.equal(audit.strictSeparation.scoreApprovals,0);
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.equal(contract.battles.length,3);
assert.equal(contract.evidence.length,12);
assert.equal(contract.statements.length,7);
assert.ok(contract.battles.every(b=>b.phaseRecords.length===0));
assert.deepEqual(audit.officialEpisodes.map(x=>x.episode),[27,28,29,44,45,46,47,48,49,50,51,52,53]);
assert.equal(audit.officialEpisodes.length,13);
for(const ep of audit.officialEpisodes){
 assert.equal(ep.workId,'castle-2');
 assert.equal(ep.officialEpisodeListingVerified,true);
 assert.equal(ep.listedAsPaid,true);
 assert.equal(ep.chapterSceneDirectlyReviewed,false);
 assert.equal(ep.sceneAssertionsVerified,0);
 assert.ok(audit.officialIndexes.some(s=>s.id===ep.sourceIndexId && s.workId===ep.workId && s.verificationType==='official-listing-only'));
 assert.match(ep.publicationDate,/^20\d\d-\d\d-\d\d$/);
}
const targets=new Map(audit.pilotReviewTargets.map(t=>[t.battleId,t]));
assert.equal(targets.size,3);
for(const b of contract.battles){
 const t=targets.get(b.id);
 assert.ok(t && t.characterId===b.subjectCharacterId);
 assert.equal(t.sceneClaimsCanonVerified,false);
 assert.deepEqual(t.directlyReviewedEpisodes,[]);
 assert.ok(t.recordIds.length===4);
 assert.deepEqual(t.recordIds,contract.evidence.filter(x=>x.battleId===b.id).map(x=>x.id));
 assert.match(t.rangeBasis,/secondary/);
}
assert.deepEqual([targets.get('pilot-L').candidateEpisodeRange.from,targets.get('pilot-L').candidateEpisodeRange.to],[27,29]);
assert.deepEqual([targets.get('pilot-A').candidateEpisodeRange.from,targets.get('pilot-A').candidateEpisodeRange.to],[44,53]);
assert.deepEqual([targets.get('pilot-R').candidateEpisodeRange.from,targets.get('pilot-R').candidateEpisodeRange.to],[99,100]);
assert.equal(contract.battles.find(x=>x.id==='pilot-A').episodeCandidate,null,'Do not backfill chapter based on secondary metadata');
assert.equal(audit.verificationWorksheet.initialRecordExample.originalDirectlyChecked,false);
assert.equal(audit.verificationWorksheet.initialRecordExample.episode,null);
assert.equal(audit.verificationWorksheet.initialRecordExample.publicationPermission,'not-reviewed');
assert.equal(audit.verificationWorksheet.notASourceOrCanonFact,true);
console.log('PASS: 13 official paid chapter-list metadata entries, 3 candidate ranges; zero direct scene/score/phase promotions');
