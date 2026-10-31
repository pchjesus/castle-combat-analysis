import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const roster=read('data/roster.v0.1.json');
const quotes=read('data/character-quotes.v3.4.DRAFT.json');
const old=read('data/quotation-review.v0.1.json');
const pilot=read('data/pilot-evidence.v2.1.json');
const html=readFileSync('index.html','utf8');
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.equal(roster.characters.find(c=>c.id==='char-040')?.name,'코모도');
assert.equal(roster.characters.find(c=>c.id==='char-088')?.name,'사사키 신겐');
assert.equal(quotes.quotes.find(q=>q.characterId==='char-088')?.characterName,'사사키 신겐');
assert.ok(!html.includes('사사키신겐'),'old Sasaki name must not appear in embedded roster');
const marker='<script type="application/json" id="roster-payload">';
const start=html.indexOf(marker);
const end=html.indexOf('</script>',start+marker.length);
assert.ok(start>=0&&end>start,'missing embedded roster');
const payload=html.slice(start+marker.length,end);
assert.deepEqual(JSON.parse(payload),roster,'canonical and embedded roster must match');
assert.deepEqual(old.quotationCandidates,[],'canonical-only quote registry must remain unchanged');
assert.equal(pilot.evidence.length,12);
assert.equal(pilot.statements.length,7);
assert.equal(quotes.schemaVersion,'v3.4-character-quotes-preview');
assert.equal(quotes.counts.userProvided,72);
assert.equal(quotes.counts.originalDirectlyVerified,0);
assert.deepEqual(quotes.iskraInitialRosterStatus,{total:19,userSelected:19,pending:0,canonDirectVerification:0});
assert.equal(quotes.counts.approvedCanon,0);
assert.equal(quotes.quotes.length,72);
assert.equal(new Set(quotes.quotes.map(q=>q.id)).size,72);
assert.equal(new Set(quotes.quotes.map(q=>q.characterId)).size,72);
for(const q of quotes.quotes){
 assert.ok(roster.characters.some(c=>c.id===q.characterId&&c.name===q.characterName));
 assert.equal(q.verificationStatus,'user-transcribed-secondary');
 assert.equal(q.publicationStatus,'branch-preview-requested');
 assert.equal(q.provenance.sceneVerified,false);
 assert.equal(q.provenance.scoringImpact,'none');
 assert.equal(q.display.enabledInPreview,true);
 assert.equal(q.display.isCanonChecked,false);
 assert.ok(q.display.verificationLabel.includes('원작 대조 대기'));
 assert.ok(typeof q.exactText==='string'&&q.exactText.trim().length>=5);
}
assert.equal(quotes.quotes.filter(q=>q.representativePriority==='first').length,1);
assert.equal(quotes.quotes.find(q=>q.representativePriority==='first').characterId,'char-033');
assert.deepEqual(quotes.previousIskraUserSelections.map(q=>q.characterId),['char-026','char-027','char-035','char-034','char-043','char-030']);
assert.deepEqual(quotes.latestUserSelections.map(q=>q.characterId),["char-029","char-032","char-041","char-031","char-036","char-037","char-038","char-039","char-040"]);
assert.deepEqual(quotes.latestUserSelections.map(q=>q.quoteId),["CQ-027","CQ-028","CQ-029","CQ-030","CQ-031","CQ-032","CQ-033","CQ-034","CQ-035"]);
for(const record of [{"characterId":"char-029","text":"혹독한 훈련 속에서도 언제나 꿈꿔 왔습니다. '아무르' 티그로와 함께 싸우는 꿈을."},{"characterId":"char-032","text":"좀 이따 보자고."},{"characterId":"char-041","text":"아무르 티그로. 네가 이스크라를 먹어라. 그리고 극동의 패자가 돼라."},{"characterId":"char-031","text":"어이, 걱정 마. 그쪽까진 갈 일도 없어."},{"characterId":"char-036","text":"상대는 이 업계 '최고'다. 그에 맞는 예우가 필요하지. 틈도 주지 말고 질식시켜 죽여버린다."},{"characterId":"char-037","text":"이런... 바로 날개를 꺾긴 힘든가..."},{"characterId":"char-038","text":"아니 - 잡았다."},{"characterId":"char-039","text":"뭐긴 뭐야, '재앙' 이지"},{"characterId":"char-040","text":"오늘부터 이 분이... 내가 받들 '신'이다!"}]) assert.equal(quotes.quotes.find(x=>x.characterId===record.characterId)?.exactText,record.text);
assert.ok(html.includes('x.quotes.length>=36'));
assert.ok(html.includes('new Set(x.quotes.map(q=>q.id)).size===x.quotes.length'));
assert.ok(html.includes('h(primary.exactText)'),'escape visible quote');
const baekui=[["char-006","김대건","하지만... 쓰러질 수 없다. 이런 신뢰를 받은 적은 태어나 처음이니까."],["char-003","표영","다시. 어깨는 무겁게, 팔은 가볍게."],["char-005","한태철","쉬어라, 이제 피는 우리가 보마."],["char-007","여민수","괜찮아. 사는 데 지장없다, 이 녀석아."],["char-009","구일화","우리 형님 가시는 길에 겐세이 따윈 용납할 수 없다."]];
for(const [id,name,verbatim] of baekui){
 const q=quotes.quotes.find(q=>q.characterId===id);
 assert.ok(q,'Baekui quote missing: '+name);
 assert.equal(q.characterName,name);
 assert.equal(q.exactText,verbatim);
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.display.isCanonChecked,false);
}
assert.deepEqual(quotes.priorBaekuiSelections.map(q=>q.characterId),baekui.map(q=>q[0]));

const newBaekui=[["char-008","이슬","근데 어쩌냐 니들 따윈 모르는 게 있다. 김신, 그놈은 쓰러지지 않을 거거든 그놈은 끝까지 해낼거야. 왜냐하면.. 내가 배 터지게 한 상 차려 먹였거든. 그게 뜨끈해서 웬만한 건 다 버텨낼거다."],["char-010","박정배","형님들이 그러셨지, 내 성급함만 줄인다면... 나도 위를 꿈꿀 수 있다고!"],["char-011","정선오","너 태어나서 누구한테 고맙다는 말 해본 적 없지? 그냥, 친구잖아."],["char-012","정승영","근데.. 바로 옆방에 영이가 한참 목 걸고 싸우고 있거든요? 거기도 한 발만 쏴주십쇼."],["char-013","서정치","너희가 가는 그 길에 힘을 보태도록 하지."]];
for(const [id,name,verbatim] of newBaekui){
 const quote=quotes.quotes.find(x=>x.characterId===id);
 assert.ok(quote,'new Baekui quote missing '+name);
 assert.equal(quote.characterName,name);
 assert.equal(quote.exactText,verbatim);
 assert.equal(quote.provenance.originalVerifiedByAssistant,false);
 assert.equal(quote.display.isCanonChecked,false);
 assert.equal(quote.provenance.scoringImpact,'none');
}
assert.deepEqual(quotes.latestBaekuiSelections.map(q=>q.characterId),newBaekui.map(x=>x[0]));
assert.deepEqual(quotes.latestBaekuiSelections.map(q=>q.quoteId),['CQ-041','CQ-042','CQ-043','CQ-044','CQ-045']);

const hwajin=[["char-080","유우성","감당할 수 없을 만큼 큰 파도에 자신을 던진다. 그리고 어떤 수를 써서라도 살아남는다. 타성에 젖기 전에 또다시 자신을 던진다. 이게 유우성의 방식이다, 김신."],["char-081","링링","저주한다, 김신."],["char-082","도우첸","나 같은 거지 하나 없이도.. 너라면 충분히 해낼 거다. 멈추지 마라."],["char-083","앤디청","오늘 너의 쇼는 우리의 호기심을 자극하기에 충분했다."],["char-084","주천명","따라와라, 백의. 대륙의 수준이 얼마나 높은지 알려주마."],["char-085","은보","얍실한 놈.. 그 와중에도 피를 빠는구나."],["char-086","양사","잘 지냈냐, 말총 대가리."]];
assert.deepEqual(quotes.hwajinInitialRosterStatus,{total:8,previouslySelected:1,newlySelected:7,nowSelected:8,canonDirectVerification:0});
assert.deepEqual(quotes.latestHwajinSelections.map(q=>q.characterId),hwajin.map(q=>q[0]));
assert.deepEqual(quotes.latestHwajinSelections.map(q=>q.quoteId),['CQ-046','CQ-047','CQ-048','CQ-049','CQ-050','CQ-051','CQ-052']);
assert.equal(quotes.quotes.filter(q=>q.characterId==='char-087').length,1,'existing Ri Cheon quote preserved');
for(const [id,name,verbatim] of hwajin){
 const q=quotes.quotes.find(x=>x.characterId===id);
 assert.ok(q,'Hwajin quote missing '+name);
 assert.equal(q.characterName,name);
 assert.equal(q.exactText,verbatim);
 assert.equal(q.verificationStatus,'user-transcribed-secondary');
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.sceneVerified,false);
 assert.equal(q.provenance.scoringImpact,'none');
 assert.equal(q.display.isCanonChecked,false);
}
assert.equal(quotes.quotes.find(q=>q.characterId==='char-080').provenance.sourceUrl,'https://namu.moe/w/유우성(캐슬)');
assert.equal(quotes.quotes.find(q=>q.characterId==='char-081').provenance.sourceUrl,'https://namu.moe/w/링링(캐슬)');

assert.deepEqual(quotes.castleHoldingsInitialRosterStatus,{total:7,previouslySelected:2,newlySelected:5,representativeReplacements:1,nowSelected:7,canonDirectVerification:0});
assert.deepEqual(quotes.latestCastleHoldingsSelections.map(x=>x.characterId),['char-056',...["char-058","char-059","char-060","char-061","char-062"]]);
assert.deepEqual(quotes.latestCastleHoldingsSelections.map(x=>x.quoteId),['CQ-011','CQ-053','CQ-054','CQ-055','CQ-056','CQ-057']);
assert.deepEqual(quotes.latestCastleHoldingsSelections.map(x=>x.action),['replace','add','add','add','add','add']);
const choi=quotes.quotes.find(q=>q.characterId==='char-056');
assert.equal(choi.id,'CQ-011','preserve old quote ID when replacing representative text');
assert.equal(choi.exactText,'나의 성에도 겨울이 오겠습니까');
assert.equal(choi.provenance.sourceUrl,'https://gall.dcinside.com/mgallery/board/view/?id=castlewebtoon&no=241323');
assert.equal(choi.provenance.originalVerifiedByAssistant,false);
assert.equal(choi.provenance.sceneVerified,false);
assert.equal(quotes.choiMinukQuoteRevision.previousExactText,'난 오직 나의 기준으로 진짜와 가짜를 가려낸다. 너 같은 남자에게 진짜 명예가 있는거야.');
assert.equal(quotes.choiMinukQuoteRevision.replacementExactText,choi.exactText);
assert.equal(quotes.quotes.filter(x=>x.characterId==='char-057').length,1);
assert.equal(quotes.quotes.find(q=>q.characterId==='char-057').exactText,'저는 끝까지 남아 내가 존경하던 그때의 최민욱의 명예를 지키겠습니다.');
for(const [id,name,verbatim] of [["char-058","마준영","형의 방식으로.\n우리 형제의 가치를 보여드리겠습니다, 회장님."],["char-059","이정화","공무원 새끼들이 X발 고함은.. 대장님 일 보시는데 방해되게."],["char-060","정단","현 시간부로. 내 뒤로 선 자는 캐슬 경호대가 아니다."],["char-061","사인진","태훈아, 이 동생은 참 실망했다. 짜치는 줄은 알았지만 자기 여자 시체를 놔두고 그길로 줄행랑을 칠 줄이야. 니가 그러고도 사람 새끼냐?"],["char-062","마크","밥값 못하면 폐기처분이 순리라서."]]){
 const q=quotes.quotes.find(x=>x.characterId===id);
 assert.ok(q,'Missing Castle Holdings quote for '+name);
 assert.equal(q.characterName,name);
 assert.equal(q.exactText,verbatim,'exact user-supplied text, including line breaks and redaction');
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.sceneVerified,false);
 assert.equal(q.provenance.scoringImpact,'none');
 assert.equal(q.display.isCanonChecked,false);
}
assert.equal(quotes.quotes.filter(q=>roster.characters.some(c=>c.id===q.characterId&&c.initialOrganizationId==='castle-holdings')).length,7);

const seonjin=[["char-045","남궁혁","다시 돌아간 기분이야. 오직 살기위해 인간을 물고 뜯었던.. 그 시절로."],["char-046","바리스타","실은 내가 '벌레 새×'였다."],["char-048","스케일 단장","네가 뿌렸을 수 많은 복수의 씨앗들이... 반드시 네 숨을 끊으러 쫓아올 테니까."],["char-049","기명균","야, 오부장 이 X신X새끼야. 일처리 똑바로 안 할래?"],["char-050","오규동","하.. 새끼, 고것 참. 완전히 쇠심줄 같이 질긴 놈일세."]];
assert.deepEqual(quotes.seonjinTradingInitialRosterStatus,{total:7,previouslySelected:1,newlySelected:5,nowSelected:6,withheldByUser:['char-047'],canonDirectVerification:0});
assert.deepEqual(quotes.latestSeonjinSelections.map(q=>q.characterId),seonjin.map(q=>q[0]));
assert.deepEqual(quotes.latestSeonjinSelections.map(q=>q.quoteId),['CQ-058','CQ-059','CQ-060','CQ-061','CQ-062']);
assert.equal(quotes.quotes.filter(q=>q.characterId==='char-044').length,1,'previous Baek Dochan quote preserved');
assert.equal(quotes.quotes.find(q=>q.characterId==='char-044').exactText,"하나같이 전부.. 내게 '패배'한 놈들의 기술이 아닌가?");
assert.equal(quotes.quotes.some(q=>q.characterId==='char-047'),false,'Monkey must remain unselected');
for(const [id,name,text] of seonjin){
 const q=quotes.quotes.find(q=>q.characterId===id);
 assert.ok(q,'missing Seonjin quote: '+name);
 assert.equal(q.characterName,name);
 assert.equal(q.exactText,text,'keep user exact transcription incl. redaction and ellipsis');
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.sceneVerified,false);
 assert.equal(q.provenance.scoringImpact,'none');
 assert.equal(q.display.isCanonChecked,false);
}
assert.equal(quotes.quotes.filter(q=>roster.characters.some(c=>c.id===q.characterId&&c.initialOrganizationId==='seonjin-trading')).length,6);

const mori=[["char-051","임무열","아무리 내가 이빨 다 빠져서 틀니를 박을지언정.. 잊었나? 나 임무열이야."],["char-053","마사","잇테키마스.(行って来ます。)"],["char-054","모승규","기어이 벌주를 마시겠다라.. 우리 꼬마 독기 좀 빼줘야겠군. 문 잠가."]];
assert.deepEqual(quotes.moriInvestmentTrustRosterStatus,{total:4,previouslySelected:1,newlySelected:3,nowSelected:4,representativeReplacements:0,canonDirectVerification:0});
assert.deepEqual(quotes.latestMoriSelections.map(q=>q.characterId),mori.map(q=>q[0]));
assert.deepEqual(quotes.latestMoriSelections.map(q=>q.quoteId),['CQ-063','CQ-064','CQ-065']);
assert.equal(quotes.quotes.filter(q=>q.characterId==='char-052').length,1);
assert.equal(quotes.quotes.find(q=>q.characterId==='char-052').exactText,"기왕에 멍석 깔린거.. 이번 기회에 싸그리 정리하지. 과거에 남겨진 얼룩들... 자.. 어느것부터 지워볼까?");
for(const [id,name,verbatim] of mori){
 const q=quotes.quotes.find(q=>q.characterId===id);
 assert.ok(q,'mori quote missing '+name);
 assert.equal(q.characterName,name);
 assert.equal(q.exactText,verbatim);
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.scoringImpact,'none');
 assert.equal(q.display.isCanonChecked,false);
}

const goldHotel=[["char-055","최달천","나그의 팔뚝을 뚫을라믄... 기관포라도 들고 와야 쇼당이 붙제!!!"],["char-063","주원","서 있어, 이 싸가지없는 새끼야."],["char-064","이필도","휴- 살았나. 명절 떡값은 따따불이여, 영감님."],["char-066","엄지","자유...? 그 놈의 죽음에서... 도망이라도 치고 싶은 거냐, 주로."],["char-067","검지","어차피 시체 아냐? 왜 이렇게 예민하게 굴어? 시작부터 분위기 좆같아지게."]];
assert.deepEqual(quotes.goldCapitalRosterStatus,{total:1,newlySelected:1,nowSelected:1,canonDirectVerification:0});
assert.deepEqual(quotes.hotelCastleRosterStatus,{total:5,previouslySelected:1,newlySelected:4,nowSelected:5,canonDirectVerification:0});
assert.deepEqual(quotes.latestGoldHotelSelections.map(q=>q.characterId),goldHotel.map(q=>q[0]));
assert.deepEqual(quotes.latestGoldHotelSelections.map(q=>q.quoteId),['CQ-066','CQ-067','CQ-068','CQ-069','CQ-070']);
assert.equal(quotes.quotes.find(q=>q.characterId==='char-065').exactText,'그런 식으론... 그런 식으론 회장님은 평생 최민욱의 그늘에서 벗어날 수 없습니다.');
for(const [id,name,verbatim] of goldHotel){
 const q=quotes.quotes.find(x=>x.characterId===id);
 assert.ok(q,'missing Hotel/Gold '+name);assert.equal(q.characterName,name);assert.equal(q.exactText,verbatim);
 assert.equal(q.provenance.originalVerifiedByAssistant,false);
 assert.equal(q.provenance.sceneVerified,false);assert.equal(q.provenance.scoringImpact,'none');
 assert.equal(q.display.isCanonChecked,false);
}
assert.equal(quotes.quotes.filter(q=>roster.characters.some(c=>c.id===q.characterId&&c.initialOrganizationId==='hotel-castle')).length,5);
assert.equal(quotes.quotes.filter(q=>roster.characters.some(c=>c.id===q.characterId&&c.initialOrganizationId==='gold-capital')).length,1);

const haseong=[["char-068","현석","짱구 더 굴릴 필요도 없다. 본능이 말한다. 하성의 자랑, 류지학이 피 냄새가 네놈한테서 난다."],["char-069","오지인","맹세코 당신의 승리를 의심하지 않습니다. 김태훈 회장님. 그 자리는 오직 당신의 것. 그리고 내가 그렇게 만들 거니까."],["char-072","조석중","뼈야 까짓 다시 붙는 거. 팔이 다 으스러져도... 니 놈을 꼭 눕혀주마!"],["char-073","조명식","살다 보니 이사님께서 격려를 하시는 날도 오네요. 귀한 거 받았는데 몇 초만 더 버티겠습니다."],["char-074","이경욱","꼭... 사십시오.."],["char-075","황보민철","그대로 시마이!"]];
assert.deepEqual(quotes.haseongRosterStatus,{total:8,previouslySelected:2,newlySelected:6,nowSelected:8,canonDirectVerification:0});
assert.deepEqual(quotes.latestHaseongSelections.map(x=>x.characterId),haseong.map(x=>x[0]));
assert.deepEqual(quotes.latestHaseongSelections.map(x=>x.quoteId),['CQ-071','CQ-072','CQ-073','CQ-074','CQ-075','CQ-076']);
for(const [id,name,verbatim] of haseong){
 const q=quotes.quotes.find(q=>q.characterId===id);
 assert.ok(q,'missing Haseong quote '+name);
 assert.equal(q.characterName,name);assert.equal(q.exactText,verbatim);
 assert.equal(q.provenance.originalVerifiedByAssistant,false);assert.equal(q.provenance.sceneVerified,false);
 assert.equal(q.provenance.scoringImpact,'none');assert.equal(q.display.isCanonChecked,false);
}
assert.equal(quotes.quotes.find(q=>q.characterId==='char-070')?.exactText,'오늘 두 악인이 죽어 세상에 득이 되게 하소서.');
assert.equal(quotes.quotes.find(q=>q.characterId==='char-071')?.exactText,'일어나라. 주변이 어두워 앞이 안 보이는 것 같아도, 아직 밤이 아니다.');
assert.equal(quotes.quotes.filter(q=>roster.characters.some(c=>c.id===q.characterId&&c.initialOrganizationId==='haseong')).length,8);
assert.equal(quotes.characterQuoteDisplayContract.futureExtraQuotesAllowed,true);
assert.ok(html.includes('${quotationPanel()}'),'quote appears inside shared character hero');
assert.ok(!html.includes('overviewBase()+quotationPanel()'),'quote must not repeat after overview');
assert.ok(html.includes('hero-quote-more')&&html.includes('<details class="hero-quote-more">'),'future multi-quote accordion');
assert.ok(html.includes('x.counts?.userProvided===x.quotes.length'));
const jsStart=html.indexOf('/* CASTLE — read-only'),jsEnd=html.indexOf('</script>',jsStart);
assert.ok(jsStart>=0&&jsEnd>jsStart);
new vm.Script(html.slice(jsStart,jsEnd));
console.log('PASS: 72 quotes, Haseong 8/8, Gold Capital 1/1 and Hotel Castle 5/5, Iskra/Seonjin preserved');
