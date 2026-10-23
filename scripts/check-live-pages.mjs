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
        !html.includes('data/pilot-review-queue.v2.2.json')) throw Error('Unexpected stale public HTML');
    if (!content['scripts/pilot-v2.1-view.js'].includes('CastlePilotView')) throw Error('Missing public renderer');
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
    console.log('PASS: public HTTPS / + 5 dependent assets, v2.2 UI markers and read-only draft safety');
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn('Public smoke attempt ' + attempt + '/12: ' + error.message);
    if (attempt < 12) await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
throw new Error('Public smoke verification failed: ' + (lastError?.message ?? 'unknown'));
