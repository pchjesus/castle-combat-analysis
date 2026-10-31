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
assert.equal(a.profiles.length,37);
assert.equal(a.scope.userSelectedAppellationPeople,8);
assert.equal(a.scope.iskraCodenameAnimalMeanings,19);
assert.equal(a.scope.uniqueCharacterCount,37);
assert.equal(a.scope.originalComicDirectChecks,0);
assert.equal(new Set(a.profiles.map(x=>x.characterId)).size,37);
assert.equal(a.profiles.filter(x=>x.primary).length,16);
assert.equal(a.profiles.filter(x=>x.codenameMeaning).length,22);
assert.equal(a.profiles.filter(x=>x.alternates.length).length,5);
assert.equal(a.profiles.reduce((n,x)=>n+x.alternates.length,0),7);
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

const sourced=[
 ['char-080','유우성','롱터우','epithet',['페이룽','토룡']],
 ['char-082','도우첸','투견','epithet',['거지']],
 ['char-087','리천','대륙 제일의 살수','epithet',['김신의 대항마']],
 ['char-057','마학영','마운틴','codename',['인간 마지노선','캐슬의 수문장']],
 ['char-058','마준영','봄버','codename',[]],
 ['char-060','정단','콜트','codename',[]],
 ['char-061','사인진','마귀','epithet',[]]
];
assert.equal(a.scope.secondaryResearchedAppellationPeople,7);
assert.equal(a.scope.hwajinAliasesAdded,3);
assert.equal(a.scope.castleHoldingsAliasesAdded,4);
assert.equal(a.scope.totalAppellationPeople,a.profiles.filter(p=>p.primary).length,'all primary appellations are counted');
for(const [id,name,value,kind,alts] of sourced){
 const p=a.profiles.find(x=>x.characterId===id);
 assert.equal(p?.displayName,name);
 assert.equal(p?.primary.value,value);
 assert.equal(p?.primary.kind,kind);
 assert.deepEqual(p?.alternates.map(x=>x.value),alts);
 assert.equal(p?.primary.sourceType,'fan-wiki-secondary');
 assert.equal(p?.primary.originalChecked,false);
 assert.equal(p?.review.originalChecked,false);
}
for(const id of ['char-081','char-083','char-084','char-085','char-086','char-056','char-059','char-062']){
 assert.ok(!a.profiles.some(p=>p.characterId===id),'unverified/shared title should not create an epithet '+id);
}
assert.equal(a.scope.originalComicDirectChecks,0);

const moriNames=[
 ['char-051','임무열','타케바야시 이사오','武林 烈'],
 ['char-052','오도화','우노 토우시로우','烏野 刀士郎']
];
assert.equal(a.scope.moriJapaneseNamesAdded,2);
for(const [id,name,value,kanji] of moriNames){
 const p=a.profiles.find(x=>x.characterId===id);
 assert.equal(p?.displayName,name);
 assert.equal(p.primary,null,'Japanese names are not epithets');
 assert.deepEqual(p.alternates,[]);
 assert.equal(p.japaneseName?.value,value);
 assert.equal(p.japaneseName?.kanji,kanji);
 assert.equal(p.japaneseName?.sourceType,'fan-wiki-secondary');
 assert.equal(p.japaneseName?.originalChecked,false);
 assert.equal(p.review?.originalChecked,false);
}
assert.equal(a.profiles.filter(x=>x.japaneseName).length,2);
assert.ok(index.includes('h(p.japaneseName.value)'));
assert.ok(index.includes('hero-appellation-japanese'));

const yoon=a.profiles.find(p=>p.characterId==='char-076');
assert.equal(yoon?.displayName,'윤덕수');
assert.equal(yoon.primary.value,'하이에나');
assert.equal(yoon.primary.kind,'epithet');
assert.equal(yoon.primary.sourceType,'fan-wiki-secondary');
assert.equal(yoon.primary.originalChecked,false);
assert.equal(yoon.review.originalChecked,false);
assert.equal(a.scope.dsSecurityAliasesAdded,1);
assert.equal(a.scope.totalAppellationPeople,16);
for(const id of ['char-077','char-078','char-079'])assert.ok(!a.profiles.some(p=>p.characterId===id),'do not invent DS epithets');
assert.ok(!a.profiles.some(p=>p.primary?.value==='이스크라 무의 상징'));
assert.equal(a.profiles.find(x=>x.displayName==='구스타프').primary,null);
assert.ok(!a.profiles.some(x=>['킹신','홍콩 최악의 악마','최달천의 대항마'].includes(x.primary?.value)));
assert.ok(index.includes('data/character-appellations.v1.0.DRAFT.json'));
assert.ok(index.includes("x.profiles.length>=27"));
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
console.log('PASS: 16 appellations (including DS Yoon), 2 Japanese names, 19 Iskra animal names, 37 profiles ('+q.quotes.length+' quotes)');
