import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base=process.cwd();
const root=resolve(base);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const server=createServer(async (req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
    const path=resolve(root,'.'+pathname);
    if(path!==root&&!path.startsWith(root+sep))throw Error('unsafe');
    const bytes=await readFile(path);
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(bytes);
  } catch {res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
let browser;
async function inspect(viewport){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().includes('127.0.0.1')&&r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'networkidle'});
  assert.match(await page.title(),/캐슬/);
  assert.equal(await page.locator('.pilot-timeline-item').count(),1,'pilot timeline should connect');
  if(viewport.width>=761){
    const before=await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(before>=200,'desktop navigation should begin expanded');
    await page.locator('[data-sidebar-toggle]').click();
    assert.equal(await page.locator('[data-sidebar-toggle]').getAttribute('aria-expanded'),'false');
    const compact=await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(compact>=64 && compact<=85,'compact rail should be narrow');
    assert.equal(await page.locator('#character-search').isVisible(),false,'collapsed search hidden');
    await page.locator('.rail-character[data-character="char-071"]').click();
    assert.match(await page.locator('.hero-title').innerText(),/류지학/);
    await page.locator('[data-sidebar-search]').click();
    assert.equal(await page.locator('[data-sidebar-toggle]').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#character-search').isVisible(),true);
    assert.equal(await page.locator('#character-search').evaluate(el=>el===document.activeElement),true);
    await page.locator('#character-search').fill('아킬라');
    await page.locator('.character-btn[data-character="char-033"]').click();
  }else{
    assert.equal(await page.locator('[data-sidebar-toggle]').isVisible(),false,'mobile remains drawer-only');
    assert.equal(await page.locator('.rail-character').first().isVisible(),false);
  }
  await page.locator('#tab-evidence').click();
  await page.locator('#record-A01').waitFor();
  assert.equal(await page.locator('.pilot-record').count(),8,'Akila 4 evidence + 2 statements + 2 linked cases');
  await page.locator('#record-A01 summary').click();
  assert.match(await page.locator('#record-A01').innerText(),/원작 미대조/);
  if(viewport.width<760)await page.locator('#mobile-menu').click();
  await page.locator('.pilot-btn[data-character="char-087"]').click();
  await page.locator('#record-L01').waitFor();
  assert.equal(await page.locator('#record-A01').count(),0,'changing character must not leak prior character records');
  await page.locator('#tab-review').click();
  assert.ok(await page.getByText('ST07',{exact:false}).count()>=1,'review register should list ST07');
  assert.equal(await page.locator('.pilot-review-row').count(),19,'audit queue must list 19 records');
  assert.ok(await page.locator('.audit-questions').count()>=19,'review questions must load');
  await page.locator('[data-review-open="A01"]').click();
  await page.locator('#record-A01').waitFor();
  assert.equal(await page.locator('#record-A01').getAttribute('open'),'','review ID should open correct detail');
  assert.match(await page.locator('.hero-title').innerText(),/아킬라/);
  await page.locator('#tab-stats').click();
  assert.equal(await page.getByText('M1 보류',{exact:false}).count()>=1,true);
  if(viewport.width<760)await page.locator('#mobile-menu').click();
  await page.locator('#character-search').fill('오도화');
  await page.locator('.character-btn[data-character="char-052"]').click();
  await page.locator('.era-note').waitFor();
  assert.match(await page.locator('.era-note').innerText(),/이원화 결정 보류/);
  await page.locator('#tab-overview').click();
  assert.equal(await page.locator('.quote-note').count(),0,'pending/unreviewed quotes must remain hidden');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'horizontal page overflow at '+viewport.width+'px: '+overflow);
  assert.deepEqual(errors,[],'browser errors');
  await page.close();
  console.log('PASS: Chromium '+viewport.width+'x'+viewport.height+' / collapsible rail, search, tabs, evidence, review links, era, quote');
}
try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
  await inspect({width:1440,height:900});
  await inspect({width:1024,height:768});
  await inspect({width:390,height:844});
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
