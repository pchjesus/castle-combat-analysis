import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=p=>JSON.parse(readFileSync(p,'utf8'));
const roster=read('data/roster.v0.1.json');
const gallery=read('data/character-quotes.v3.4.DRAFT.json');
const iskra=read('data/research/iskra-quote-selection-status.v3.6.DRAFT.json');
const pilot=read('data/pilot-evidence.v2.1.json');
const review=read('data/pilot-review-queue.v2.2.json');
const html=readFileSync('index.html','utf8');
const expected=new Map([
['char-026',{name:'크리사',id:'CQ-021',text:'어떻게 그럴 수 있나, 티그로. 너도 나를 형제로 여긴다면, 네 입으로 함께 목숨 걸어달라고 해야지.'}],
['char-027',{name:'크로트',id:'CQ-022',text:'너같이 강한 놈들… 이미 숱하게 붙어봤지. 그러나 자, 봐라. 내가 죽었나, 살아있나.'}],
['char-035',{name:'프리깃',id:'CQ-023',text:'됐다, 선택했으니 난 자유인 거야.'}],
['char-034',{name:'샤모',id:'CQ-024',text:'아킬라가 어떻게 지켜볼라고 한 건데... 그게 너무 꼴 받아서 눈이 안 감겨'}],
['char-043',{name:'블랙맘바',id:'CQ-025',text:'너, 영 소질없다. 돌아가서 메드베디 품에나 안기렴, 애송아.'}],
['char-030',{name:'그롤라',id:'CQ-026',text:'이딴식으로... 잘도 이 좁은 땅덩어리에서 해 처먹었군, 그래..'}]
]);
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.deepEqual(roster.characters.map(x=>x.id),Array.from({length:109},(_,i)=>'char-'+String(i+1).padStart(3,'0')));
assert.equal(roster.characters.find(x=>x.id==='char-040').name,'코모도');
assert.equal(roster.characters.some(x=>x.name==='코도모'),false);
const embedded=html.match(/<script type="application\/json" id="roster-payload">([\s\S]*?)<\/script>/);
assert.ok(embedded);
assert.deepEqual(JSON.parse(embedded[1]),roster,'inline roster and canonical registry must match');
assert.equal(gallery.counts.userProvided,22);
assert.equal(gallery.quotes.length,22);
assert.equal(new Set(gallery.quotes.map(x=>x.characterId)).size,22);
assert.equal(new Set(gallery.quotes.map(x=>x.id)).size,22);
assert.equal(gallery.latestUserSelections.length,6);
assert.deepEqual(gallery.latestUserSelections.map(x=>x.characterId),[...expected.keys()]);
assert.deepEqual(gallery.latestUserSelections.map(x=>x.quoteId),[...expected.values()].map(x=>x.id));
assert.equal(gallery.newlyAddedUserSelections.length,7,'prior seven are unchanged');
for(const [id,e] of expected){
 const actual=gallery.quotes.find(q=>q.characterId===id);
 assert.ok(actual);
 assert.equal(actual.id,e.id);
 assert.equal(actual.characterName,e.name);
 assert.equal(actual.exactText,e.text,'verbatim user text must not be reformatted');
 assert.equal(actual.verificationStatus,'user-transcribed-secondary');
 assert.equal(actual.publicationStatus,'branch-preview-requested');
 assert.equal(actual.display.enabledInPreview,true);
 assert.equal(actual.display.isCanonChecked,false);
 assert.equal(actual.provenance.originalVerifiedByAssistant,false);
 assert.equal(actual.provenance.originalVerifiedByUserInThisTurn,false);
 assert.equal(actual.provenance.rightsReview,'not-established');
 assert.equal(actual.provenance.scoringImpact,'none');
}
assert.equal(gallery.quotes.filter(q=>q.representativePriority==='first').length,1);
assert.equal(gallery.quotes.find(q=>q.representativePriority==='first').characterId,'char-033');
assert.equal(gallery.counts.originalDirectlyVerified,0);
assert.equal(gallery.counts.approvedCanon,0);
assert.ok(html.includes('x.quotes.length===22'));
assert.ok(html.includes('new Set(x.quotes.map(q=>q.characterId)).size===22'),'loader must accept 22 distinct character IDs; caught by browser regression');
assert.ok(html.includes('quotationPreviewData?.quotes?.find'));
assert.ok(html.includes('h(preview.exactText)'),'quote HTML must escape text');
assert.equal(iskra.schemaVersion,'v3.6-iskra-quote-selection-status-draft');
assert.equal(iskra.correction.characterId,'char-040');
assert.equal(iskra.correction.oldName,'코도모');
assert.equal(iskra.correction.correctedName,'코모도');
assert.equal(iskra.correction.verification,'user-explicit-correction');
assert.equal(iskra.scope.initialIskraRosterCount,19);
assert.equal(iskra.scope.userSelectedInitialIskraQuoteCount,10);
assert.equal(iskra.scope.remainingInitialIskra,9);
assert.equal(iskra.scope.wholeGallerySelectedQuoteCount,22);
assert.equal(iskra.scope.directCanonTextChecks,0);
assert.equal(iskra.members.length,19);
assert.deepEqual(iskra.members.map(x=>x.characterId),roster.characters.filter(x=>x.initialOrganizationId==='iskra').map(x=>x.id));
for(const m of iskra.members){
 assert.equal(m.name,roster.characters.find(x=>x.id===m.characterId).name);
 assert.equal(m.selectedQuoteId,gallery.quotes.find(x=>x.characterId===m.characterId)?.id??null);
 assert.equal(m.canonSceneVerified,false);
}
assert.equal(iskra.selectedFromThisTurn.length,6);
assert.equal(iskra.nextIskraQuoteCandidates.length,9);
assert.deepEqual(iskra.nextIskraQuoteCandidates.map(x=>x.name),['샤이어','판테라','바이슨','콘','헤론','오울','스내퍼','코모도','잭슨']);
assert.deepEqual(iskra.nextIskraQuoteCandidates.map(x=>x.characterId),['char-029','char-031','char-032','char-036','char-037','char-038','char-039','char-040','char-041']);
assert.equal(pilot.evidence.length,12);
assert.equal(pilot.statements.length,7);
assert.equal(review.records.length,19);
const scriptBegin=html.indexOf('/* CASTLE — read-only');
const scriptEnd=html.indexOf('</script>',scriptBegin);
assert.ok(scriptBegin>=0&&scriptEnd>scriptBegin);
new vm.Script(html.slice(scriptBegin,scriptEnd),{filename:'index.html:script'});
console.log('PASS: six Iskra verbatim quotes, 22 unique gallery entries, corrected char-040 roster and embedded HTML, 10/19 Iskra coverage, nine remaining; no scoring or source promotion');
