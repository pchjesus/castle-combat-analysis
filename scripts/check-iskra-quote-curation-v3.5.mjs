import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const roster=read('data/roster.v0.1.json');
const gallery=read('data/character-quotes.v3.4.DRAFT.json');
const iskra=read('data/research/iskra-quotation-candidates.v3.5.DRAFT.json');
const oldCandidates=read('data/research/additional-quotation-candidates.v3.4.DRAFT.json');
const oldRegistry=read('data/quotation-review.v0.1.json');
const html=readFileSync('index.html','utf8');
const expected=new Map([
 ['char-057','저는 끝까지 남아 내가 존경하던 그때의 최민욱의 명예를 지키겠습니다.'],
 ['char-004','대건이 네가 마지막으로 만들어준 이 자리에서..\n네가 걸어온 그 길이.. 절대로 헛되지 않았다는 걸 내가 증명하마.'],
 ['char-002','범\u00a0가는 길에 까치가 어울리는 게, 상식 아냐?'],
 ['char-025','그래도… 홀드.. 완료했다.'],
 ['char-065','그런 식으론... 그런 식으론 회장님은 평생 최민욱의 그늘에서 벗어날 수 없습니다.'],
 ['char-028','메드베디가 찍은 후임은 납니다. 당신 손으로 넘겨줘요. 리더 자리.'],
 ['char-042','끝내주는군. 너무 절망적이어서 환상적이라니.']
]);
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.equal(gallery.quotes.length,22);
assert.equal(gallery.counts.userProvided,22);
assert.equal(new Set(gallery.quotes.map(x=>x.id)).size,22);
assert.equal(new Set(gallery.quotes.map(x=>x.characterId)).size,22);
const newly=gallery.newlyAddedUserSelections;
assert.equal(newly.length,7);
assert.deepEqual(newly.map(x=>x.quoteId),Array.from({length:7},(_,i)=>'CQ-'+String(i+14).padStart(3,'0')));
for(const x of newly){
 assert.ok(expected.has(x.characterId),'only explicit seven characters');
 const q=gallery.quotes.find(y=>y.id===x.quoteId);
 assert.ok(q);
 assert.equal(q.characterId,x.characterId);
 assert.equal(q.exactText,expected.get(x.characterId),'must preserve user-provided exact wording, whitespace and punctuation');
 assert.equal(q.priorCandidateId,x.priorCandidateId);
 assert.equal(q.selectionStatus,'user-nominated');
 assert.equal(q.publicationStatus,'branch-preview-requested');
 assert.equal(q.verificationStatus,'user-transcribed-secondary');
 assert.equal(q.display.enabledInPreview,true);
 assert.equal(q.display.isCanonChecked,false);
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.originalVerifiedByUserInThisTurn,false);
 assert.equal(q.provenance.scoringImpact,'none');
}
assert.equal(gallery.quotes.filter(x=>x.representativePriority==='first').length,1);
assert.equal(gallery.quotes.find(x=>x.representativePriority==='first')?.characterId,'char-033');
assert.deepEqual(oldRegistry.quotationCandidates,[]);
assert.equal(oldCandidates.candidateCount,7,'retain previous suggestions for change history');
assert.ok(oldCandidates.candidates.every(x=>x.publicSiteDisplay===false));
assert.ok(html.includes('x.quotes.length===22'));
assert.ok(html.includes('h(preview.exactText)'));
assert.equal(iskra.schemaVersion,'v3.5-iskra-quotation-research-draft');
const members=roster.characters.filter(x=>x.initialOrganizationId==='iskra');
assert.equal(members.length,19);
assert.equal(iskra.characters.length,19);
assert.deepEqual(iskra.characters.map(x=>x.characterId),members.map(x=>x.id));
assert.deepEqual(iskra.totals,{roster:19,displayed:4,proposed:6,unresearchedRemainder:9,newApprovedQuotes:0});
assert.equal(iskra.scope.knownNamingConflict.rosterId,'char-040');
assert.equal(iskra.scope.knownNamingConflict.rosterName,'코도모');
assert.equal(iskra.scope.knownNamingConflict.communityReferenceName,'코모도');
assert.equal(iskra.nextSelectionProposals.length,6);
assert.equal(new Set(iskra.nextSelectionProposals.map(x=>x.characterId)).size,6);
for(const q of iskra.nextSelectionProposals){
 assert.ok(members.some(x=>x.id===q.characterId&&x.name===q.rosterName));
 assert.ok(q.source.url.startsWith('https://'));
 assert.equal(q.source.originalComicChecked,false);
 assert.equal(q.exactTextForPublishing,null,'no secondhand long quotes added to gallery');
 assert.equal(q.userOriginalReviewStatus,'not-confirmed');
 assert.equal(q.approvedForQuoteGallery,false);
 assert.equal(q.scoringImpact,'none');
}
assert.equal(iskra.scope.notInRosterLeadership[0].name,'리사');
assert.ok(iskra.scope.pastOrOtherFactionAssociationsOutsideInitialRoster.some(x=>x.characterId==='char-001'));
assert.ok(iskra.scope.pastOrOtherFactionAssociationsOutsideInitialRoster.some(x=>x.characterId==='char-002'));
console.log('PASS: 7 exact user lines + previous 9; 19 Iskra roster IDs, 6 unapproved research leads, no score or canon promotion');
