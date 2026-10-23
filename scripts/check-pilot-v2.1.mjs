import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const view=require('./pilot-v2.1-view.js');
const get=path=>JSON.parse(readFileSync(path,'utf8'));
const roster=get('data/roster.v0.1.json');
const raw=get('data/pilot-evidence.v2.1.json');
const temporal=get('data/temporal-evaluation-candidates.v0.1.json');
const quotes=get('data/quotation-review.v0.1.json');
const html=readFileSync('index.html','utf8');
assert.equal(view.check(raw,roster),raw,'v2.1 draft view adapter should accept original projection');
assert.equal(roster.characters.length,109);
assert.equal(roster.organizations.length,17);
assert.deepEqual(
  ['char-033','char-087','char-071'].map(id=>view.forCharacter(raw,id).evidence.length),
  [4,4,4], 'four evidence candidates for each pilot');
assert.ok(view.forCharacter(raw,'char-033').statements.some(x=>x.id==='ST03'));
assert.ok(view.forCharacter(raw,'char-033').statements.some(x=>x.id==='ST04'));
assert.equal(raw.statements.every(s=>s.isExactQuote===false && s.sceneCanonVerified===false),true);
assert.ok(raw.evidence.every(e=>e.sceneCanonVerified===false && e.scoreImpact==='none'));
assert.ok(raw.battles.every(b=>b.phaseRecords.length===0));
assert.equal(raw.meta.formalEvaluations,0);
assert.equal(raw.meta.originalCanonScenesVerified,0);
assert.equal(quotes.quotationCandidates.length,0,'No invented quotes');
const candidateNames=new Map(roster.characters.map(c=>[c.id,c.name]));
const requested={'char-052':'오도화','char-068':'현석','char-051':'임무열','char-056':'최민욱','char-099':'강민성'};
assert.equal(temporal.candidates.length,5);
for(const p of temporal.candidates){
  assert.equal(candidateNames.get(p.characterId),requested[p.characterId]);
  assert.equal(p.verificationStatus,'not-started');
  assert.equal(p.splitDecision,'not-decided');
  assert.deepEqual(p.evaluationStates,[]);
}
const passthrough=x=>String(x);
for(const id of ['char-033','char-087','char-071','char-001']){
  const character=roster.characters.find(c=>c.id===id);
  const rendered=view.evidencePanel(raw,character,'all',null,passthrough);
  assert.ok(rendered.includes('원작') && rendered.includes('근거'),id+' disclosure');
}
assert.ok(view.evidencePanel(raw,roster.characters.find(c=>c.id==='char-033'),'battle',null,passthrough).includes('A01'));
assert.ok(!view.evidencePanel(raw,roster.characters.find(c=>c.id==='char-087'),'battle',null,passthrough).includes('A01'));
assert.ok(view.reviewPanel(raw,passthrough).includes('ST07'));
const bad=structuredClone(raw);
bad.evidence[0].sceneCanonVerified=true;
assert.throws(()=>view.check(bad,roster),/Invalid evidence/,'unverified fact cannot be promoted');
const bad2=structuredClone(raw);
bad2.evidence[0].battleId='missing';
assert.throws(()=>view.check(bad2,roster),/Invalid evidence/,'missing battle must fail');
const bad3=structuredClone(raw);
bad3.statements[0].isExactQuote=true;
assert.throws(()=>view.check(bad3,roster),/Unsafe draft statement/);
assert.match(html,/scripts\/pilot-v2\.1-view\.js/);
assert.match(html,/data\/pilot-evidence\.v2\.1\.json/);
assert.match(html,/data\/quotation-review\.v0\.1\.json/);
assert.match(html,/data\/temporal-evaluation-candidates\.v0\.1\.json/);
assert.match(html,/M1 보류/);
assert.match(html,/M2 보류/);
console.log('PASS: pilot records, references, 3 pilots, 5 temporal candidates, quotes deferred, display boundaries');
