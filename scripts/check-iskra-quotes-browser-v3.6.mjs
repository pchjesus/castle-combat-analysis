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
 ["char-006","김대건","하지만... 쓰러질 수 없다. 이런 신뢰를 받은 적은 태어나 처음이니까."],
 ["char-003","표영","다시. 어깨는 무겁게, 팔은 가볍게."],
 ["char-005","한태철","쉬어라, 이제 피는 우리가 보마."],
 ["char-007","여민수","괜찮아. 사는 데 지장없다, 이 녀석아."],
 ["char-009","구일화","우리 형님 가시는 길에 겐세이 따윈 용납할 수 없다."]
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
   assert.match(await page.locator('.quote-note-preview figcaption').innerText(),/사용자 (제공|선정)/);
   assert.match(await page.locator('.quote-note-preview figcaption').innerText(),/원작 대조 대기/);
  }
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
  console.log('PASS browser viewport '+viewport.width+'x'+viewport.height+': all 19 Iskra and 5 Baekui quote cards, Aquila, Ryu, Komodo');
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
