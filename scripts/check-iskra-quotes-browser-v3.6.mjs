import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const six=[
 ['char-026','크리사','어떻게 그럴 수 있나, 티그로.'],
 ['char-027','크로트','너같이 강한 놈들…'],
 ['char-035','프리깃','됐다, 선택했으니 난 자유인 거야.'],
 ['char-034','샤모','아킬라가 어떻게 지켜볼라고'],
 ['char-043','블랙맘바','너, 영 소질없다.'],
 ['char-030','그롤라','이딴식으로...'],
 ['char-025','메드베디',"그래도… 홀드.. 완료했다."],
 ['char-028','라텔',"메드베디가 찍은 후임은"],
 ['char-033','아킬라',"자신의 자유 의지를"],
 ['char-042','구스타프',"끝내주는군."],
 ['char-029','샤이어',"혹독한 훈련 속에서도 언제나 꿈꿔 왔습니다. '아무르' 티그로와 함께 싸우는 꿈을."],
 ['char-032','바이슨',"좀 이따 보자고."],
 ['char-041','잭슨',"아무르 티그로. 네가 이스크라를 먹어라. 그리고 극동의 패자가 돼라."],
 ['char-031','판테라',"어이, 걱정 마. 그쪽까진 갈 일도 없어."],
 ['char-036','콘',"상대는 이 업계 '최고'다. 그에 맞는 예우가 필요하지. 틈도 주지 말고 질식시켜 죽여버린다."],
 ['char-037','헤론',"이런... 바로 날개를 꺾긴 힘든가..."],
 ['char-038','오울',"아니 - 잡았다."],
 ['char-039','스내퍼',"뭐긴 뭐야, '재앙' 이지"],
 ['char-040','코모도',"오늘부터 이 분이... 내가 받들 '신'이다!"],
 ['char-088','사사키 신겐',"맹수의 기분이 곧.."],
 ["char-006","김대건","하지만... 쓰러질 수 없다. 이런 신뢰를 받은 적은 태어나 처음이니까."],
 ["char-003","표영","다시. 어깨는 무겁게, 팔은 가볍게."],
 ["char-005","한태철","쉬어라, 이제 피는 우리가 보마."],
 ["char-007","여민수","괜찮아. 사는 데 지장없다, 이 녀석아."],
 ["char-009","구일화","우리 형님 가시는 길에 겐세이 따윈 용납할 수 없다."],
 ["char-008","이슬","근데 어쩌냐 니들 따윈 모르는 게 있다."],
 ["char-010","박정배","형님들이 그러셨지, 내 성급함만 줄인다면..."],
 ["char-011","정선오","너 태어나서 누구한테 고맙다는 말 해본 적 없지?"],
 ["char-012","정승영","근데.. 바로 옆방에 영이가 한참 목 걸고 싸우고 있거든요?"],
 ["char-013","서정치","너희가 가는 그 길에 힘을 보태도록 하지."],
 ["char-080","유우성","감당할 수 없을 만큼 큰 파도에 자신을 던진다."],
 ["char-081","링링","저주한다, 김신."],
 ["char-082","도우첸","나 같은 거지 하나 없이도.. 너라면 충분히 해낼 거다. 멈추지 마라."],
 ["char-083","앤디청","오늘 너의 쇼는 우리의 호기심을 자극하기에 충분했다."],
 ["char-084","주천명","따라와라, 백의. 대륙의 수준이 얼마나 높은지 알려주마."],
 ["char-085","은보","얍실한 놈.. 그 와중에도 피를 빠는구나."],
 ["char-086","양사","잘 지냈냐, 말총 대가리."],
 ["char-056","최민욱","나의 성에도 겨울이 오겠습니까."],
 ["char-057","마학영","저는 끝까지 남아"],
 ["char-058","마준영","형의 방식으로."],
 ["char-059","이정화","공무원 새끼들이 X발 고함은.."],
 ["char-060","정단","현 시간부로. 내 뒤로 선 자는 캐슬 경호대가 아니다."],
 ["char-061","사인진","태훈아, 이 동생은 참 실망했다."],
 ["char-062","마크","밥값 못하면 폐기처분이 순리라서."],
 ["char-045","남궁혁","다시 돌아간 기분이야. 오직 살기위해 인간을 물고 뜯었던.. 그 시절로."],
 ["char-046","바리스타","실은 내가 '벌레 새×'였다."],
 ["char-048","스케일 단장","네가 뿌렸을 수 많은 복수의 씨앗들이... 반드시 네 숨을 끊으러 쫓아올 테니까."],
 ["char-049","기명균","야, 오부장 이 X신X새끼야. 일처리 똑바로 안 할래?"],
 ["char-050","오규동","하.. 새끼, 고것 참. 완전히 쇠심줄 같이 질긴 놈일세."],
 ["char-051","임무열","아무리 내가 이빨 다 빠져서 틀니를 박을지언정.. 잊었나? 나 임무열이야."],
 ["char-053","마사","잇테키마스.(行って来ます。)"],
 ["char-054","모승규","기어이 벌주를 마시겠다라.. 우리 꼬마 독기 좀 빼줘야겠군. 문 잠가."],
 ["char-055","최달천","나그의 팔뚝을 뚫을라믄... 기관포라도 들고 와야 쇼당이 붙제!!!"],
 ["char-063","주원","서 있어, 이 싸가지없는 새끼야."],
 ["char-064","이필도","휴- 살았나. 명절 떡값은 따따불이여, 영감님."],
 ["char-066","엄지","자유...? 그 놈의 죽음에서... 도망이라도 치고 싶은 거냐, 주로."],
 ["char-067","검지","어차피 시체 아냐? 왜 이렇게 예민하게 굴어? 시작부터 분위기 좆같아지게."],
 ["char-068","현석","짱구 더 굴릴 필요도 없다. 본능이 말한다. 하성의 자랑, 류지학이 피 냄새가 네놈한테서 난다."],
 ["char-069","오지인","맹세코 당신의 승리를 의심하지 않습니다. 김태훈 회장님. 그 자리는 오직 당신의 것. 그리고 내가 그렇게 만들 거니까."],
 ["char-072","조석중","뼈야 까짓 다시 붙는 거. 팔이 다 으스러져도... 니 놈을 꼭 눕혀주마!"],
 ["char-073","조명식","살다 보니 이사님께서 격려를 하시는 날도 오네요. 귀한 거 받았는데 몇 초만 더 버티겠습니다."],
 ["char-074","이경욱","꼭... 사십시오.."],
 ["char-075","황보민철","그대로 시마이!"],
 ["char-076","윤덕수","다 필요 없어. 내가 직접 처리한다."],
 ["char-077","강창석","회암시에 악귀가 돌아왔다! 덜덜 떨어라, 이 회암시 것들아!!"],
 ["char-078","김혁주","내 구역도 아닌데 나라고 이러고 싶겠습니까."],
 ["char-079","강만재","하, 이 쥐방울 같은 새X. 잘 걸렸다, 씨X놈아."],
 ["char-089","하야부사","그렇다면, 젊음의 패기 같은 한심한 거 말고 보여줄 게 더 남아있단 거냐?"],
 ["char-090","토이시","..정말 갈 데까지 갔구나, 이놈.. 가네무라 히데아키."],
 ["char-091","고로","이와시로.. '회장님'."],
 ["char-092","모자준","부지런히 처리해 봤자 이름도 없는 놈이라 일한 티가 안 나니, 원. 그래도 할 건 해야겠지."],
 ["char-094","천쿤","잔말 말고 길이나 뚫어! 누군 그만큼 못 죽여서 안 나대냐!?"],
 ["char-093","우강","지금 불붙은 놈들은 그 기류가 사뭇 다르다. 특히나 뺀질한... 이놈!"],
 ["char-095","히데","그럼에도 한 치의 부끄러움조차 느끼지 않고… 기어이 뻘밭을 기어나가 쟁취하는 것이 이 가네무라 히데아키의 방식이다."],
 ["char-096","쿄지","나오쇼. 오야로 모신 정이 있으니 한 번은 뚫어 주겠수. 난 하루일지라도 붙어 먹기로 했으면 적어도 당일까진 의리는 지키자는 주의라."],
 ["char-097","후지타","최 상도 캐슬을 뺏긴 마당에, 이와시로라고 천년만년 변고가 없을까...!"],
 ["char-098","토니 진","글쎄다. 오늘 니놈들의 머리통을 싸그리 회수한다면.. 돈줄 끊긴 화진의 유기견들이 너희 동천방으로 좌표를 찍지 않을까?"]
 ["char-099","강민성","민욱아, 우린 이미 많은 것을 이뤘어. 이 이상 피를 흘린다면 명분 없는 헛된 욕망이다. 이 야욕이... 언젠가 너를 통째로 집어 삼킬 거다."],
 ["char-100","도지웅","전국의 남자들이 뜻을 하나로 모으니 '백의(百意)'고, 약하지만 뭉치면 성을 무너뜨리니 '백의(白蟻)'다."],
 ["char-101","차일국","이 차일국의 대접이 왜 이리 비루한가! 제대로 된 걸 보내라, 대국 놈들아!"],
 ["char-102","권수찬","짜식들이 남의 집 칼을 훔쳐 써-"],
 ["char-103","표성","어깨너머 보기만 해도 한 십 년을 그 짓만 한 사람처럼 기술을 써버리는걸요."],
 ["char-104","위길성","넌 깜 안 돼, 똥개 새끼야."],
 ["char-105","백강회","꿈도 야무지지, 회암시 깡촌 달건이가 어딜 감히 대한민국 조폭 일번지에 기웃댑니까. 안 그래, 차일국 씨?"],
 ["char-106","쌍개","나가 대국 3석, 인천 쌍개여. 반갑소. 이름은 들었네, 차일국이."],
 ["char-107","바실리","다브로 빠좔로바치, 라씨야!"],
 ["char-108","드미트리","아뿔싸.. 계산 착오다. 애초에 내 수준을 훨씬 상회하는 자였다.."],
 ["char-109","훌리안 카스티요","거 새끼들 좀 참지, 격조 떨어지게 비명은."],
 ["char-015","남일호","우린 불휘다."],
 ["char-016","어광득","제기랄 거! 엔간치 하고 고마 좀 자빠져 있어라!! 설마하니 우리가 피우진 당신을 직이겠나!!"],
 ["char-017","도학수","복수도 하고! X바 한몫도 단단히 챙겨서 간 사람들 남은 식구들도 챙겨줘야 할 거 아닙니까?"],
 ["char-018","최혁진","어쩌시겠습니까. 전 어느 쪽이든 따르겠습니다. 우진 형님."],
 ["char-019","김성준","대건이가 원하는 건 당신이 흔들리지 않고 앞으로 나아가는 겁니다. 원하는 바를 꼭 이루십시오. 저도 돕겠습니다."],
 ["char-020","신원일","어이구.. 수민아, 수민아... 그놈이 우리랑 무슨 대단한 인연이라고 나선단 말이니."],
 ["char-021","장호","씨X, 그래도.. 고생만 죽도록 한 우리 대건이 형님 출세하는 건 보고 뒤지나 싶었는데.. 그땐 내가.. 양복 한 벌 끝장나는 걸로 해드리려고 했는데.."],
 ["char-022","인수","회장, 회장은 여기서 제일 큰형입니다. 형이면 형답게 해요."],
 ["char-023","원용","난 솔직히 서운한데. 요즘 회장은 너무 북구 일에만 신경을 써."],
 ["char-024","남용","윤덕수한테 숨 한번 못 쉬던 그런 한심한 쉐끼들을..! 우리 형님이 얼마나 뒤에서 챙겨줬었는데, 그런 니가 우리 이슬 형님을 팔아치워?"],
];
const server=createServer(async (req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const path=resolve(root,'.'+pathname);
  if(path!==root&&!path.startsWith(root+sep))throw Error('Unsafe request');
  const data=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream'});
  res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const host='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||undefined});
 for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(host)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
  for(const [id,name,word] of six){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   await page.locator('.quote-note-preview blockquote').waitFor();
   assert.equal((await page.locator('.hero-title').innerText()).trim(),name);
   assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'quote must render inside shared profile card');
   assert.equal(await page.locator('#current-panel > .quote-note').count(),0,'no duplicate quote below profile');
   assert.equal(await page.locator('.hero-quote-more').count(),0,'one quote only: no premature expansion toggle');
   assert.ok((await page.locator('.quote-note-preview blockquote').innerText()).includes(word),'quote text missing '+name);
   assert.match(await page.locator('.quote-note-preview figcaption').innerText(),/사용자.*(제공|선정)/);
   assert.match(await page.locator('.quote-note-preview figcaption').innerText(),/원작 대조 대기/);
  }
  await page.goto(host+'/#character=char-047&view=overview',{waitUntil:'networkidle'});
  assert.equal((await page.locator('.hero-title').innerText()).trim(),'몽키');
  assert.equal(await page.locator('.identity-hero .hero-quote').count(),0,'Monkey intentionally has no selected quote');
  await page.goto(host+'/#character=char-033&view=overview',{waitUntil:'networkidle'});
  await page.locator('.quote-note-preview blockquote').waitFor();
  assert.match(await page.locator('.quote-note-preview blockquote').innerText(),/자신의 자유 의지를/);
  await page.goto(host+'/#character=char-040&view=overview',{waitUntil:'networkidle'});
  assert.equal((await page.locator('.hero-title').innerText()).trim(),'코모도');
  assert.ok((await page.locator('.quote-note-preview blockquote').innerText()).includes('받들'), 'selected Komodo quote must display');
  await page.goto(host+'/#character=char-071&view=overview',{waitUntil:'networkidle'});
  await page.locator('.quote-note-preview blockquote').waitFor();
  assert.match(await page.locator('.quote-note-preview blockquote').innerText(),/아직 밤이 아니다/);
  assert.deepEqual(errors,[],'No local 404 or page errors at width '+viewport.width);
  await page.close();
  if(viewport.width===1365){
   const injected=await browser.newPage({viewport});
   const json=JSON.parse(await readFile(resolve(root,'data/character-quotes.v3.4.DRAFT.json'),'utf8'));
   const original=json.quotes.find(q=>q.characterId==='char-033');
   const testOnly='TEST ONLY: expansion control, not an original comic quotation';
   json.quotes.push({...original,id:'TEST-ONLY-EXTRA',exactText:testOnly,representativePriority:null});
   json.counts.userProvided=json.quotes.length;
   await injected.route('**/data/character-quotes.v3.4.DRAFT.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(json)}));
   await injected.goto(host+'/#character=char-033&view=overview',{waitUntil:'networkidle'});
   await injected.locator('.hero-quote-more summary').waitFor();
   assert.match(await injected.locator('.hero-quote .hero-quote-text').innerText(),/부동.*마음/);
   assert.match(await injected.locator('.hero-quote-more summary').innerText(),/다른 명대사 1개 보기/);
   assert.equal(await injected.locator('.hero-quote-more').getAttribute('open'),null);
   await injected.locator('.hero-quote-more summary').click();
   assert.equal(await injected.locator('.hero-quote-more').getAttribute('open'),'');
   assert.equal((await injected.locator('.hero-quote-extra blockquote').innerText()).trim(),testOnly);
   await injected.locator('.hero-quote-more summary').click();
   assert.equal(await injected.locator('.hero-quote-more').getAttribute('open'),null);
   await injected.close();
   console.log('PASS: expandable extra quotation tested with synthetic browser-only fixture');
  }
  console.log('PASS browser viewport '+viewport.width+'x'+viewport.height+': 19 Iskra, 20 Baekui, 8 Hwajin, 7 Holdings, 5 Seonjin, 3 Mori, 5 Gold/Hotel, 6 Haseong, 4 DS, 10 faction/Tony and 21 closeout quote cards, Aquila, Ryu, Komodo');
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
