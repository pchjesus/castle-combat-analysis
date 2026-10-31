import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const get=p=>JSON.parse(readFileSync(p,'utf8'));
const roster=get('data/roster.v0.1.json');
const q=get('data/character-quotes.v3.4.DRAFT.json');
const a=get('data/character-appellations.v1.0.DRAFT.json');
const index=readFileSync('index.html','utf8');
const wiki='https://namu.moe/w/이스크라(캐슬)';
const selected=[
 ['char-001','김신','아무르 티그로','codename-title',[], '흑룡강 호랑이'],
 ['char-002','서진태','사로카','codename',[],'까치'],
 ['char-004','피우진','싸움귀신','epithet',['볼크'],'늑대'],
 ['char-003','표영','부산 꼬마','nickname',[],null],
 ['char-008','이슬','릴라','nickname',[],null],
 ['char-009','구일화','충남 스타','epithet',[],null],
 ['char-010','박정배','똘배','nickname',[],null],
 ['char-022','인수','상계동 쓰나미','epithet',[],null]
];
const iskra={
 메드베디:'곰',크리사:'쥐',크로트:'두더지',라텔:'벌꿀오소리',샤이어:'거대한 말',
 그롤라:'북극곰·그리즐리 교잡종',판테라:'설표',바이슨:'들소',
 아킬라:'독수리',샤모:'투계',프리깃:'군함조',
 콘:'콘도르',헤론:'왜가리',오울:'수리부엉이',
 스내퍼:'늑대거북',코모도:'도마뱀',잭슨:'카멜레온',구스타프:'식인악어',블랙맘바:'검은 뱀'
};
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.ok(q.quotes.length>=41,'existing gallery must not shrink');
assert.equal(q.quotes.length,q.counts.userProvided,'appellations regression must not hardcode the quote gallery size');
assert.equal(q.iskraInitialRosterStatus.userSelected,19);
assert.equal(a.schemaVersion,'v1.0-draft');
assert.equal(a.profiles.length,27);
assert.equal(a.scope.userSelectedAppellationPeople,8);
assert.equal(a.scope.iskraCodenameAnimalMeanings,19);
assert.equal(a.scope.uniqueCharacterCount,27);
assert.equal(a.scope.originalComicDirectChecks,0);
assert.equal(new Set(a.profiles.map(x=>x.characterId)).size,27);
assert.equal(a.profiles.filter(x=>x.primary).length,8);
assert.equal(a.profiles.filter(x=>x.codenameMeaning).length,22);
assert.equal(a.profiles.filter(x=>x.alternates.length).length,1);
assert.equal(a.profiles.reduce((n,x)=>n+x.alternates.length,0),1);
for(const [id,name,value,kind,alternates,animal] of selected){
 const c=roster.characters.find(x=>x.id===id);
 const p=a.profiles.find(x=>x.characterId===id);
 assert.equal(c?.name,name);
 assert.equal(p?.displayName,name);
 assert.equal(p.primary.value,value);
 assert.equal(p.primary.kind,kind);
 assert.deepEqual(p.alternates.map(x=>x.value),alternates);
 assert.equal(p.codenameMeaning?.animal??null,animal);
}
const iskraRoster=roster.characters.filter(c=>c.initialOrganizationId==='iskra');
assert.equal(iskraRoster.length,19);
assert.equal(Object.keys(iskra).length,19);
for(const c of iskraRoster){
 const p=a.profiles.find(x=>x.characterId===c.id);
 assert.ok(p,'missing Iskra '+c.name);
 assert.equal(p.displayName,c.name);
 assert.equal(p.primary,null,'avoid treating identical codename as a separate nickname');
 assert.deepEqual(p.alternates,[]);
 assert.equal(p.codenameMeaning.codename,c.name);
 assert.equal(p.codenameMeaning.animal,iskra[c.name]);
}
for(const p of a.profiles){
 assert.ok(roster.characters.some(c=>c.id===p.characterId&&c.name===p.displayName));
 if(p.codenameMeaning){
  assert.equal(p.codenameMeaning.sourceUrl,wiki);
  assert.equal(p.codenameMeaning.sourceType,'fan-wiki-secondary');
  assert.equal(p.codenameMeaning.originalChecked,false);
 }
}
assert.ok(!a.profiles.some(p=>p.primary?.value==='이스크라 무의 상징'));
assert.equal(a.profiles.find(x=>x.displayName==='구스타프').primary,null);
assert.ok(!a.profiles.some(x=>['킹신','홍콩 최악의 악마','최달천의 대항마'].includes(x.primary?.value)));
assert.ok(index.includes('data/character-appellations.v1.0.DRAFT.json'));
assert.ok(index.includes("x.profiles.length===27"));
assert.ok(index.includes('appellationData=x'));
assert.ok(index.includes('${characterAppellations(c)}'));
assert.ok(index.includes('function characterAppellations(c)'));
assert.ok(index.includes("h(p.primary.value)"),'all display strings escaped');
assert.ok(index.includes("h(p.codenameMeaning.animal)"),'all animal meanings escaped');
assert.ok(index.indexOf('${characterAppellations(c)}')<index.indexOf('class="hero-meta"'),'appellations must display before badges');
assert.ok(index.includes('hero-quote-more'),'existing quote expandable intact');
const start=index.indexOf('/* CASTLE — read-only'),end=index.indexOf('</script>',start);
assert.ok(start>=0&&end>start);
new vm.Script(index.slice(start,end),{filename:'index.html'});
console.log('PASS: 8 appellations + 1 alternate, 19 Iskra animals, 27 profiles; independent quote gallery retained ('+q.quotes.length+' quotes)');
