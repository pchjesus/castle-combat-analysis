import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const selected=[
 ['char-001','김신','아무르 티그로',null,'흑룡강 호랑이'],
 ['char-002','서진태','사로카',null,'까치'],
 ['char-004','피우진','싸움귀신','볼크','늑대'],
 ['char-003','표영','부산 꼬마',null,null],
 ['char-008','이슬','릴라',null,null],
 ['char-009','구일화','충남 스타',null,null],
 ['char-010','박정배','똘배',null,null],
 ['char-022','인수','상계동 쓰나미',null,null]
];
const newlySourced=[["char-080","유우성","롱터우",["페이룽","토룡"]],["char-082","도우첸","투견",["거지"]],["char-087","리천","대륙 제일의 살수",["김신의 대항마"]],["char-057","마학영","마운틴",["인간 마지노선","캐슬의 수문장"]],["char-058","마준영","봄버",[]],["char-060","정단","콜트",[]],["char-061","사인진","마귀",[]]];
const animals=[
 ['char-025','메드베디','곰'],['char-026','크리사','쥐'],['char-027','크로트','두더지'],
 ['char-028','라텔','벌꿀오소리'],['char-029','샤이어','거대한 말'],
 ['char-030','그롤라','북극곰·그리즐리 교잡종'],['char-031','판테라','설표'],['char-032','바이슨','들소'],
 ['char-033','아킬라','독수리'],['char-034','샤모','투계'],['char-035','프리깃','군함조'],
 ['char-036','콘','콘도르'],['char-037','헤론','왜가리'],['char-038','오울','수리부엉이'],
 ['char-039','스내퍼','늑대거북'],['char-040','코모도','도마뱀'],['char-041','잭슨','카멜레온'],
 ['char-042','구스타프','식인악어'],['char-043','블랙맘바','검은 뱀']
];
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const path=resolve(root,'.'+pathname);
  if(path!==root&&!path.startsWith(root+sep))throw Error('unsafe');
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const host='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||undefined});
 for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(host)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
  for(const [id,name,primary,alternate,animal] of selected){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   await page.locator('.hero-appellations').waitFor();
   assert.equal((await page.locator('.hero-title').innerText()).trim(),name);
   assert.equal((await page.locator('.hero-appellation-main strong').innerText()).trim(),primary);
   assert.equal(await page.locator('.hero-appellation-alt').count(),alternate?1:0,'alternate visibility: '+name);
   if(alternate)assert.equal((await page.locator('.hero-appellation-alt strong').innerText()).trim(),alternate);
   assert.equal(await page.locator('.hero-appellation-animal').count(),animal?1:0,'animal meaning: '+name);
   if(animal)assert.equal((await page.locator('.hero-appellation-animal strong').innerText()).trim(),animal);
   assert.match(await page.locator('.hero-appellation-note').innerText(),/원작 직접 대조 전/);
   if(id!=='char-022')assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'existing quote remains in card');
  }
  for(const [id,name,animal] of animals){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   await page.locator('.hero-appellation-animal strong').waitFor();
   assert.equal((await page.locator('.hero-title').innerText()).trim(),name);
   assert.equal(await page.locator('.hero-appellation-main').count(),0,'codename is already the display name');
   assert.equal((await page.locator('.hero-appellation-animal strong').innerText()).trim(),animal);
   assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'existing Iskra quote remains in hero');
  }
  for(const [id,name,primary,alternates] of newlySourced){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   await page.locator('.hero-appellation-main strong').waitFor();
   assert.equal((await page.locator('.hero-title').innerText()).trim(),name);
   assert.equal((await page.locator('.hero-appellation-main strong').innerText()).trim(),primary);
   assert.deepEqual(await page.locator('.hero-appellation-alt strong').allInnerTexts(),alternates,'alternate sourced appellations: '+name);
   assert.equal(await page.locator('.hero-appellation-animal').count(),0,'no fabricated codename animal');
   assert.match(await page.locator('.hero-appellation-note').innerText(),/원작 직접 대조 전/);
   assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'all sourced characters keep existing quotes');
  }
  for(const id of ['char-081','char-083','char-084','char-085','char-086','char-056','char-059','char-062']){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.hero-appellations').count(),0,'no unverified appellation for '+id);
   assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'quotes unaffected by blank epithet');
  }
  for(const [id,name,expected] of [['char-051','임무열','타케바야시 이사오'],['char-052','오도화','우노 토우시로우']]){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   await page.locator('.hero-appellation-japanese strong').waitFor();
   assert.equal((await page.locator('.hero-title').innerText()).trim(),name);
   assert.equal((await page.locator('.hero-appellation-japanese strong').innerText()).trim(),expected);
   assert.equal(await page.locator('.hero-appellation-main').count(),0,'Japanese name not a primary epithet');
   assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'keep Mori representative quote');
  }
  await page.goto(host+'/#character=char-004&view=evidence',{waitUntil:'networkidle'});
  await page.locator('.hero-appellation-main strong').waitFor();
  assert.equal((await page.locator('.hero-appellation-main strong').innerText()).trim(),'싸움귀신');
  assert.equal(await page.locator('.identity-hero .hero-quote').count(),1,'appellation shown on other tabs without breaking quotes');
  assert.deepEqual(errors,[],'no JS or asset error '+viewport.width);
  await page.close();
  console.log('PASS viewport '+viewport.width+'x'+viewport.height+': 8 curated + 7 sourced labels, 2 Japanese names, 19 Iskra animals, quote and tab regression');
 }
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
