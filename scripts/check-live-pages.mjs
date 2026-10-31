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
    if (publicQuotes.quotes?.length !== 76 || publicQuotes.counts?.userProvided !== 76 || publicQuotes.counts?.originalDirectlyVerified !== 0 ||
        new Set(publicQuotes.quotes.map(q=>q.id)).size !== 76 ||
        publicQuotes.quotes.find(q=>q.characterId==='char-033')?.representativePriority !== 'first' || publicQuotes.iskraInitialRosterStatus?.userSelected !== 19 || publicQuotes.iskraInitialRosterStatus?.pending !== 0) throw Error('Missing/mismatched published 76-character quotes');
    if (!html.includes('x.quotes.length>=36') || !html.includes('new Set(x.quotes.map(q=>q.id)).size===x.quotes.length') ||
        !html.includes('hero-quote-more') || !html.includes('<details class="hero-quote-more">') || !html.includes('"name":"코모도"')) throw Error('Stale HTML quotation or Komodo data');
    for(const [id,name] of [["char-006","김대건"],["char-003","표영"],["char-005","한태철"],["char-007","여민수"],["char-009","구일화"]]){
      if(!publicQuotes.quotes.some(q=>q.characterId===id&&q.characterName===name))throw Error('Missing public Baekui quote for '+name);
    }
    for(const [id,name] of [["char-008","이슬"],["char-010","박정배"],["char-011","정선오"],["char-012","정승영"],["char-013","서정치"]]){
      if(!publicQuotes.quotes.some(q=>q.characterId===id&&q.characterName===name))throw Error('Missing next five Baekui '+name);
    }
    const appellations=content['data/character-appellations.v1.0.DRAFT.json'];
    if(appellations.schemaVersion!=='v1.0-draft'||appellations.profiles?.length!==37||
       new Set(appellations.profiles.map(p=>p.characterId)).size!==37||
       appellations.profiles.filter(p=>p.primary).length!==16||
       appellations.profiles.filter(p=>p.codenameMeaning&&p.codenameMeaning.originalChecked===false).length!==22||
       appellations.profiles.find(p=>p.characterId==='char-004')?.alternates?.[0]?.value!=='볼크'||
       appellations.profiles.find(p=>p.characterId==='char-042')?.primary!==null||
       appellations.scope.originalComicDirectChecks!==0)throw Error('Missing/mismatched public user-selected appellations');
    for(const [id,value] of [["char-080","롱터우"],["char-082","투견"],["char-087","대륙 제일의 살수"],["char-057","마운틴"],["char-058","봄버"],["char-060","콜트"],["char-061","마귀"]]){
      const p=appellations.profiles.find(p=>p.characterId===id);
      if(p?.primary?.value!==value||p.primary.originalChecked!==false||p.review?.originalChecked!==false)
        throw Error('Missing sourced alias '+id);
    }
    for(const id of ['char-081','char-083','char-084','char-085','char-086','char-056','char-059','char-062']){
      if(appellations.profiles.some(p=>p.characterId===id))throw Error('Invented epithet for '+id);
    }
    if(appellations.scope.secondaryResearchedAppellationPeople!==7||
       appellations.scope.hwajinAliasesAdded!==3||appellations.scope.castleHoldingsAliasesAdded!==4||
       appellations.scope.originalComicDirectChecks!==0)throw Error('Sourced alias scope mismatch');
    if(!html.includes('data/character-appellations.v1.0.DRAFT.json')||
       !html.includes('${characterAppellations(c)}')||
       !html.includes('hero-appellation-animal')||
       !html.includes('호칭·어원은 2차 자료 참고'))throw Error('Stale public hero appellation markup');
    if(publicQuotes.hwajinInitialRosterStatus?.nowSelected!==8||
       publicQuotes.hwajinInitialRosterStatus?.canonDirectVerification!==0||
       publicQuotes.quotes.find(q=>q.characterId==='char-087')?.exactText!=='네가 나무라면, 난 태산(泰山)이다.')throw Error('Hwajin 8/8 not preserved');
    for(const [id,name] of [["char-080","유우성"],["char-081","링링"],["char-082","도우첸"],["char-083","앤디청"],["char-084","주천명"],["char-085","은보"],["char-086","양사"]]){
      if(!publicQuotes.quotes.some(q=>q.characterId===id&&q.characterName===name&&q.display?.isCanonChecked===false))
         throw Error('Missing Hwajin selected quote '+name);
    }
    if(publicQuotes.castleHoldingsInitialRosterStatus?.nowSelected!==7||
       publicQuotes.castleHoldingsInitialRosterStatus?.canonDirectVerification!==0||
       publicQuotes.castleHoldingsInitialRosterStatus?.representativeReplacements!==1)
       throw Error('Castle Holdings 7/7 selection and unverified provenance mismatch');
    for(const [id,name,verbatim] of [["char-056","최민욱","나의 성에도 겨울이 오겠습니까"],["char-057","마학영","저는 끝까지 남아 내가 존경하던 그때의 최민욱의 명예를 지키겠습니다."],["char-058","마준영","형의 방식으로.\n우리 형제의 가치를 보여드리겠습니다, 회장님."],["char-059","이정화","공무원 새끼들이 X발 고함은.. 대장님 일 보시는데 방해되게."],["char-060","정단","현 시간부로. 내 뒤로 선 자는 캐슬 경호대가 아니다."],["char-061","사인진","태훈아, 이 동생은 참 실망했다. 짜치는 줄은 알았지만 자기 여자 시체를 놔두고 그길로 줄행랑을 칠 줄이야. 니가 그러고도 사람 새끼냐?"],["char-062","마크","밥값 못하면 폐기처분이 순리라서."]]){
      const q=publicQuotes.quotes.find(q=>q.characterId===id);
      if(!q||q.characterName!==name||q.exactText!==verbatim||q.provenance?.scoringImpact!=='none'||q.display?.isCanonChecked!==false)
        throw Error('Published Castle Holdings quote mismatch: '+name);
    }
    if(publicQuotes.seonjinTradingInitialRosterStatus?.nowSelected!==6||
       publicQuotes.seonjinTradingInitialRosterStatus?.canonDirectVerification!==0||
       !publicQuotes.seonjinTradingInitialRosterStatus?.withheldByUser.includes('char-047')||
       publicQuotes.quotes.some(q=>q.characterId==='char-047'))throw Error('Seonjin 6/7 and Monkey hold mismatch');
    for(const [id,name,verbatim] of [["char-045","남궁혁","다시 돌아간 기분이야. 오직 살기위해 인간을 물고 뜯었던.. 그 시절로."],["char-046","바리스타","실은 내가 '벌레 새×'였다."],["char-048","스케일 단장","네가 뿌렸을 수 많은 복수의 씨앗들이... 반드시 네 숨을 끊으러 쫓아올 테니까."],["char-049","기명균","야, 오부장 이 X신X새끼야. 일처리 똑바로 안 할래?"],["char-050","오규동","하.. 새끼, 고것 참. 완전히 쇠심줄 같이 질긴 놈일세."]]){
      const q=publicQuotes.quotes.find(q=>q.characterId===id);
      if(!q||q.characterName!==name||q.exactText!==verbatim||
         q.provenance?.scoringImpact!=='none'||q.display?.isCanonChecked!==false)
        throw Error('Published Seonjin quote mismatch '+name);
    }

    if(publicQuotes.moriInvestmentTrustRosterStatus?.nowSelected!==4||publicQuotes.moriInvestmentTrustRosterStatus?.canonDirectVerification!==0)
      throw Error('Mori 4/4 not verified');
    for(const [id,name,verbatim] of [["char-051","임무열","아무리 내가 이빨 다 빠져서 틀니를 박을지언정.. 잊었나? 나 임무열이야."],["char-053","마사","잇테키마스.(行って来ます。)"],["char-054","모승규","기어이 벌주를 마시겠다라.. 우리 꼬마 독기 좀 빼줘야겠군. 문 잠가."]]){
      const q=publicQuotes.quotes.find(q=>q.characterId===id);
      if(!q||q.characterName!==name||q.exactText!==verbatim||q.provenance.scoringImpact!=='none'||q.display.isCanonChecked!==false)
        throw Error('Mori quote mismatch '+name);
    }
    if(publicQuotes.quotes.find(q=>q.characterId==='char-052')?.exactText!=="기왕에 멍석 깔린거.. 이번 기회에 싸그리 정리하지. 과거에 남겨진 얼룩들... 자.. 어느것부터 지워볼까?")
      throw Error('Previously selected O Dohwa quotation changed');
    for(const [id,value] of [['char-051','타케바야시 이사오'],['char-052','우노 토우시로우']]){
       const p=appellations.profiles.find(p=>p.characterId===id);
       if(p?.japaneseName?.value!==value||p.japaneseName.originalChecked!==false||p.primary!==null)
         throw Error('Japanese name incorrectly displayed '+id);
    }
    if(!html.includes('hero-appellation-japanese')||!html.includes('h(p.japaneseName.value)'))
      throw Error('Public Japanese-name panel missing');
    if(publicQuotes.goldCapitalRosterStatus?.nowSelected!==1||publicQuotes.hotelCastleRosterStatus?.nowSelected!==5||
       publicQuotes.goldCapitalRosterStatus?.canonDirectVerification!==0||publicQuotes.hotelCastleRosterStatus?.canonDirectVerification!==0)
        throw Error('Gold/Hotel quote scope mismatch');
    for(const [id,name,verbatim] of [["char-055","최달천","나그의 팔뚝을 뚫을라믄... 기관포라도 들고 와야 쇼당이 붙제!!!"],["char-063","주원","서 있어, 이 싸가지없는 새끼야."],["char-064","이필도","휴- 살았나. 명절 떡값은 따따불이여, 영감님."],["char-066","엄지","자유...? 그 놈의 죽음에서... 도망이라도 치고 싶은 거냐, 주로."],["char-067","검지","어차피 시체 아냐? 왜 이렇게 예민하게 굴어? 시작부터 분위기 좆같아지게."]]){
      const q=publicQuotes.quotes.find(q=>q.characterId===id);
      if(!q||q.characterName!==name||q.exactText!==verbatim||q.display?.isCanonChecked!==false||q.provenance.scoringImpact!=='none')
        throw Error('Published Gold/Hotel quote mismatch '+name);
    }
    if(publicQuotes.quotes.find(q=>q.characterId==='char-065')?.exactText!=='그런 식으론... 그런 식으론 회장님은 평생 최민욱의 그늘에서 벗어날 수 없습니다.')
      throw Error('Juro legacy quote changed');

    if(publicQuotes.haseongRosterStatus?.nowSelected!==8||publicQuotes.haseongRosterStatus?.canonDirectVerification!==0)
      throw Error('Haseong 8/8 missing');
    for(const [id,name,verbatim] of [["char-068","현석","짱구 더 굴릴 필요도 없다. 본능이 말한다. 하성의 자랑, 류지학이 피 냄새가 네놈한테서 난다."],["char-069","오지인","맹세코 당신의 승리를 의심하지 않습니다. 김태훈 회장님. 그 자리는 오직 당신의 것. 그리고 내가 그렇게 만들 거니까."],["char-072","조석중","뼈야 까짓 다시 붙는 거. 팔이 다 으스러져도... 니 놈을 꼭 눕혀주마!"],["char-073","조명식","살다 보니 이사님께서 격려를 하시는 날도 오네요. 귀한 거 받았는데 몇 초만 더 버티겠습니다."],["char-074","이경욱","꼭... 사십시오.."],["char-075","황보민철","그대로 시마이!"]]){
      const q=publicQuotes.quotes.find(q=>q.characterId===id);
      if(!q||q.characterName!==name||q.exactText!==verbatim||q.display?.isCanonChecked!==false||q.provenance?.scoringImpact!=='none')
        throw Error('Published Haseong quote mismatch '+name);
    }
    if(publicQuotes.quotes.find(q=>q.characterId==='char-070')?.exactText!=='오늘 두 악인이 죽어 세상에 득이 되게 하소서.'||
       publicQuotes.quotes.find(q=>q.characterId==='char-071')?.exactText!=='일어나라. 주변이 어두워 앞이 안 보이는 것 같아도, 아직 밤이 아니다.')
      throw Error('Existing Haseong quote changed');

    if(publicQuotes.dsSecurityRosterStatus?.nowSelected!==4||publicQuotes.dsSecurityRosterStatus?.originalDirectlyVerified!==0)
       throw Error('Missing DS 4/4 coverage');
    for(const [id,name,text] of [["char-076","윤덕수","다 필요 없어. 내가 직접 처리한다."],["char-077","강창석","회암시에 악귀가 돌아왔다! 덜덜 떨어라, 이 회암시 것들아!!"],["char-078","김혁주","내 구역도 아닌데 나라고 이러고 싶겠습니까."],["char-079","강만재","하, 이 쥐방울 같은 새X. 잘 걸렸다, 씨X놈아."]]){
      const q=publicQuotes.quotes.find(q=>q.characterId===id);
      if(!q||q.characterName!==name||q.exactText!==text||q.provenance.scoringImpact!=='none'||q.display.isCanonChecked!==false)
        throw Error('Published DS quote mismatch '+name);
    }
    const yoon=appellations.profiles.find(p=>p.characterId==='char-076');
    if(yoon?.primary?.value!=='하이에나'||yoon.primary.originalChecked!==false||appellations.scope.dsSecurityAliasesAdded!==1)
       throw Error('DS Yoon epithet unverified/missing');
    for(const id of ['char-077','char-078','char-079'])if(appellations.profiles.some(p=>p.characterId===id))
       throw Error('Unexpected DS epithet '+id);
    console.log('PASS: public HTTPS / + 6 dependent assets, 76 displayed user quotes, 16 user-and-sourced labels, 19 Iskra animal meanings, corrected Komodo, original v2.4 UI and unscored drafts');
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.warn('Public smoke attempt ' + attempt + '/12: ' + error.message);
    if (attempt < 12) await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
throw new Error('Public smoke verification failed: ' + (lastError?.message ?? 'unknown'));
