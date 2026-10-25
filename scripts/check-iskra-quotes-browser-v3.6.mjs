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
 ['char-030','그롤라','이딴식으로...']
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
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1365,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(host)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
  for(const [id,name,word] of six){
   await page.goto(host+'/#character='+id+'&view=overview',{waitUntil:'networkidle'});
   await page.locator('.quote-note-preview blockquote').waitFor();
   assert.equal((await page.locator('.hero-title').innerText()).trim(),name);
   assert.ok((await page.locator('.quote-note-preview blockquote').innerText()).includes(word));
   assert.match(await page.locator('.quote-note-preview figcaption').innerText(),/사용자 제공/);
   assert.match(await page.locator('.quote-note-preview figcaption').innerText(),/원작 대조 대기/);
  }
  await page.goto(host+'/#character=char-033&view=overview',{waitUntil:'networkidle'});
  await page.locator('.quote-note-preview blockquote').waitFor();
  assert.match(await page.locator('.quote-note-preview blockquote').innerText(),/자신의 자유 의지를/);
  await page.goto(host+'/#character=char-040&view=overview',{waitUntil:'networkidle'});
  assert.equal((await page.locator('.hero-title').innerText()).trim(),'코모도');
  assert.equal(await page.locator('.quote-note-preview').count(),0,'do not fabricate a quote for Komodo');
  await page.goto(host+'/#character=char-071&view=overview',{waitUntil:'networkidle'});
  await page.locator('.quote-note-preview blockquote').waitFor();
  assert.match(await page.locator('.quote-note-preview blockquote').innerText(),/아직 밤이 아니다/);
  assert.deepEqual(errors,[],'No local 404 or page errors at width '+viewport.width);
  await page.close();
  console.log('PASS browser viewport '+viewport.width+'x'+viewport.height+': six Iskra quotes, Aquila, Ryu, corrected Komodo');
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
