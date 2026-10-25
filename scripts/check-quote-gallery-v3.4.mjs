import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const roster=read('data/roster.v0.1.json');
const oldQuotes=read('data/quotation-review.v0.1.json');
const quotes=read('data/character-quotes.v3.4.DRAFT.json');
const candidate=read('data/research/additional-quotation-candidates.v3.4.DRAFT.json');
const shortlist=read('data/research/quotation-shortlist.v3.3.DRAFT.json');
const curation=read('data/research/user-quotation-curation.v3.3.DRAFT.json');
const html=readFileSync('index.html','utf8');
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.deepEqual(oldQuotes.quotationCandidates,[],'legacy verified-only registry unchanged');
assert.equal(shortlist.candidates.length,10);
assert.equal(curation.crosswalk.length,9);
assert.equal(quotes.schemaVersion,'v3.4-character-quotes-preview');
assert.equal(quotes.state,'feature-branch-preview-not-canon-verified');
assert.equal(quotes.priorityCharacterId,'char-033');
assert.equal(quotes.counts.userProvided,16);
assert.equal(quotes.counts.originalDirectlyVerified,0);
assert.equal(quotes.counts.approvedCanon,0);
assert.equal(quotes.quotes.length,16);
assert.equal(new Set(quotes.quotes.map(q=>q.characterId)).size,9);
assert.equal(new Set(quotes.quotes.map(q=>q.id)).size,9);
const expected=new Map([
 ['char-071',{name:'류지학',start:'일어나라.'}],
 ['char-056',{name:'최민욱',start:'난 오직 나의 기준으로'}],
 ['char-001',{name:'김신',start:'각오들 해라.'}],
 ['char-087',{name:'리천',start:'네가 나무라면'}],
 ['char-044',{name:'백도찬',start:'하나같이 전부..'}],
 ['char-033',{name:'아킬라',start:'부동(不動)의 마음이라는 함은..'}],
 ['char-070',{name:'신태진',start:'오늘 두 악인이'}],
 ['char-088',{name:'사사키신겐',start:'맹수의 기분이 곧..'}],
 ['char-052',{name:'오도화',start:'기왕에 멍석 깔린거..'}],
 ['char-057',{name:'마학영',start:'저는 끝까지 남아'}],
 ['char-004',{name:'피우진',start:'대건이 네가 마지막으로'}],
 ['char-002',{name:'서진태',start:'범\u00a0가는 길에'}],
 ['char-025',{name:'메드베디',start:'그래도… 홀드.. 완료했다.'}],
 ['char-065',{name:'주로',start:'그런 식으론...'}],
 ['char-028',{name:'라텔',start:'메드베디가 찍은 후임은'}],
 ['char-042',{name:'구스타프',start:'끝내주는군.'}],
]);
for(const q of quotes.quotes){
 const match=expected.get(q.characterId);
 assert.ok(match,'only nine user-provided characters');
 assert.equal(q.characterName,match.name);
 assert.ok(roster.characters.some(c=>c.id===q.characterId&&c.name===q.characterName));
 assert.ok(q.exactText.startsWith(match.start));
 assert.ok(q.exactText.length>12);
 assert.equal(q.verificationStatus,'user-transcribed-secondary');
 assert.equal(q.publicationStatus,'branch-preview-requested');
 assert.equal(q.display.enabledInPreview,true);
 assert.equal(q.display.isCanonChecked,false);
 assert.equal(q.provenance.sourceType,'secondary-fan-wiki-reported-by-user');
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.originalVerifiedByUserInThisTurn,false);
 assert.equal(q.provenance.sceneVerified,false);
 assert.equal(q.provenance.episode,null);
 assert.equal(q.provenance.rightsReview,'not-established');
 assert.equal(q.provenance.scoringImpact,'none');
 assert.ok(curation.crosswalk.some(c=>c.characterId===q.characterId&&c.candidateId===q.id) || quotes.newlyAddedUserSelections?.some(c=>c.characterId===q.characterId&&c.quoteId===q.id));
}
const ak=quotes.quotes.find(q=>q.characterId==='char-033');
assert.equal(ak.representativePriority,'first');
assert.equal(quotes.quotes.filter(x=>x.representativePriority==='first').length,1);
assert.equal(expected.size,16);
assert.ok(ak.exactText.includes('자신의 자유 의지를'));
assert.equal(candidate.candidateCount,7);
assert.equal(candidate.publicDisplayCount,0);
assert.deepEqual(candidate.candidates.map(x=>x.characterId),['char-057','char-004','char-002','char-025','char-065','char-028','char-042']);
assert.equal(new Set(candidate.candidates.map(x=>x.characterId)).size,7);
for(const x of candidate.candidates){
 assert.ok(roster.characters.some(c=>c.id===x.characterId&&c.name===x.characterName));
 assert.ok(x.secondaryTextExcerpt.length>0);
 assert.equal(x.source.comicOriginalChecked,false);
 assert.ok(x.source.url.startsWith('https://'));
 assert.equal(x.verification.quoteExactToOriginal,false);
 assert.equal(x.verification.episode,null);
 assert.equal(x.publicSiteDisplay,false);
 assert.equal(x.userSelection,false);
 assert.equal(x.scoreEffect,'none');
}
assert.ok(html.includes('data/character-quotes.v3.4.DRAFT.json'));
assert.ok(html.includes("x.quotes.length===16"));
assert.ok(html.includes('quotationPreviewData?.quotes?.find'));
assert.ok(html.includes("q.verificationStatus==='user-transcribed-secondary'"));
assert.ok(html.includes("q.display?.enabledInPreview===true"));
assert.ok(html.includes('CHARACTER QUOTE / USER CURATED'));
assert.ok(html.includes('preview.display.verificationLabel'));
assert.ok(quotes.quotes.every(q=>q.display.verificationLabel.includes('원작 대조 대기')));
assert.ok(html.includes('h(preview.exactText)'),'escaped rendering expected');
assert.ok(!html.includes("preview.exactText+'</blockquote>"),'no unescaped user quote injection');
assert.ok(html.includes("data/quotation-review.v0.1.json"),'existing canon-only legacy still loaded');
const scriptBegin=html.indexOf('/* CASTLE — read-only');
const scriptEnd=html.indexOf('</script>',scriptBegin);
assert.ok(scriptBegin>=0&&scriptEnd>scriptBegin);
new vm.Script(html.slice(scriptBegin,scriptEnd),{filename:'index.html:main'});
console.log('PASS: 9 user-supplied quotes, 7 unapproved Namuwiki candidates, roster IDs, source labeling, HTML syntax and legacy quote fallback');
