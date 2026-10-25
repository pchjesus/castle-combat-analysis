/** Public HTTP smoke test. Executes ONLY after successful Pages deployment. */
const base = String(process.env.PAGES_URL || 'https://pchjesus.github.io/castle-combat-analysis/').replace(/\/*$/, '/');
if (!base.startsWith('https://')) throw Error('Expected HTTPS Pages URL');
const read = async (path) => {
  const url = new URL(path, base).href;
  const response = await fetch(url, {signal: AbortSignal.timeout(12000), headers: {'Cache-Control':'no-cache'}});
  if (!response.ok) throw Error(path + ' HTTP ' + response.status);
  return response.text();
};
const requests = [
  ['index.html', 'text'],
  ['scripts/pilot-v2.1-view.js', 'text'],
  ['data/pilot-evidence.v2.1.json', 'json'],
  ['data/pilot-review-queue.v2.2.json', 'json'],
  ['data/temporal-evaluation-candidates.v0.1.json', 'json'],
  ['data/quotation-review.v0.1.json', 'json'],
  ['data/character-quotes.v3.4.DRAFT.json', 'json'],
  ['data/character-appellations.v1.0.DRAFT.json', 'json'],
];
let lastError;
for (let attempt = 1; attempt <= 12; attempt++) {
  try {
    const content = {};
    for (const [path, kind] of requests) {
      const body = await read(path);
      content[path] = kind === 'json' ? JSON.parse(body) : body;
    }
    const html = content['index.html'];
    if (!html.includes('sidebar-collapsed') || !html.includes('data-sidebar-toggle') ||
        !html.includes('data/pilot-review-queue.v2.2.json') || !html.includes('v2.4: slate navigation') || html.includes("?'› 펼치기':'‹ 접기'")) throw Error('Unexpected stale public HTML');
    if (!content['scripts/pilot-v2.1-view.js'].includes('출처 유형 · 자료 위치')) throw Error('Missing public renderer');
    const evidence = content['data/pilot-evidence.v2.1.json'];
    if (evidence.schemaVersion !== '2.1-ui-projection-draft' ||
        evidence.evidence.length !== 12 || evidence.statements.length !== 7 ||
        evidence.meta.formalEvaluations !== 0 || evidence.meta.originalCanonScenesVerified !== 0) throw Error('Unsafe published evidence');
    const queue = content['data/pilot-review-queue.v2.2.json'];
    if (queue.records.length !== 19 || queue.summary.directCanonVerified !== 0) throw Error('Published review queue mismatch');
    const era = content['data/temporal-evaluation-candidates.v0.1.json'];
    if (era.candidates.length !== 5 || era.candidates.some(x => x.evaluationStates.length !== 0)) throw Error('Published era state mismatch');
    const quotes = content['data/quotation-review.v0.1.json'];
    if (quotes.quotationCandidates.length !== 0) throw Error('Unapproved published quotation');
    const publicQuotes = content['data/character-quotes.v3.4.DRAFT.json'];
    if (publicQuotes.quotes?.length !== 41 || publicQuotes.counts?.userProvided !== 41 || publicQuotes.counts?.originalDirectlyVerified !== 0 ||
        new Set(publicQuotes.quotes.map(q=>q.id)).size !== 41 ||
        publicQuotes.quotes.find(q=>q.characterId==='char-033')?.representativePriority !== 'first' || publicQuotes.iskraInitialRosterStatus?.userSelected !== 19 || publicQuotes.iskraInitialRosterStatus?.pending !== 0) throw Error('Missing/mismatched published 41-character quotes');
    if (!html.includes('x.quotes.length>=36') || !html.includes('new Set(x.quotes.map(q=>q.id)).size===x.quotes.length') ||
        !html.includes('hero-quote-more') || !html.includes('<details class="hero-quote-more">') || !html.includes('"name":"코모도"')) throw Error('Stale HTML quotation or Komodo data');
    for(const [id,name] of [["char-006","김대건"],["char-003","표영"],["char-005","한태철"],["char-007","여민수"],["char-009","구일화"]]){
      if(!publicQuotes.quotes.some(q=>q.characterId===id&&q.characterName===name))throw Error('Missing public Baekui quote for '+name);
    }
    for(const [id,name] of [["char-008","이슬"],["char-010","박정배"],["char-011","정선오"],["char-012","정승영"],["char-013","서정치"]]){
      if(!publicQuotes.quotes.some(q=>q.characterId===id&&q.characterName===name))throw Error('Missing next five Baekui '+name);
    }
    const appellations=content['data/character-appellations.v1.0.DRAFT.json'];
    if(appellations.schemaVersion!=='v1.0-draft'||appellations.profiles?.length!==27||
       new Set(appellations.profiles.map(p=>p.characterId)).size!==27||
       appellations.profiles.filter(p=>p.primary).length!==8||
       appellations.profiles.filter(p=>p.codenameMeaning&&p.codenameMeaning.originalChecked===false).length!==22||
       appellations.profiles.find(p=>p.characterId==='char-004')?.alternates?.[0]?.value!=='볼크'||
       appellations.profiles.find(p=>p.characterId==='char-042')?.primary!==null||
       appellations.scope.originalComicDirectChecks!==0)throw Error('Missing/mismatched public user-selected appellations');
    if(!html.includes('data/character-appellations.v1.0.DRAFT.json')||
       !html.includes('${characterAppellations(c)}')||
       !html.includes('hero-appellation-animal')||
       !html.includes('호칭·어원은 2차 자료 참고'))throw Error('Stale public hero appellation markup');
    console.log('PASS: public HTTPS / + 6 dependent assets, 41 displayed user quotes, 8 user labels, 19 Iskra animal meanings, corrected Komodo, original v2.4 UI and unscored drafts');
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn('Public smoke attempt ' + attempt + '/12: ' + error.message);
    if (attempt < 12) await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
throw new Error('Public smoke verification failed: ' + (lastError?.message ?? 'unknown'));
