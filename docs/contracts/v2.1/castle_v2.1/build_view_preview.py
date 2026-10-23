"""Derive UI read-model examples from the local fixture; no React/site generation."""
import json
from pathlib import Path
P=Path(__file__).resolve().parent
f=json.loads((P/'castle_contract_fixture_v2.1_DRAFT.json').read_text(encoding='utf-8'))
battle_map={x['id']:x for x in f['pilot']['battles']}
source_map={x['id']:x for x in f['sourceCatalog']}
name_map=f['rosterReference']['confirmedNameById']

def character_page(cid):
 battles=[b for b in f['pilot']['battles'] if cid in b['participantCandidateCharacterIds']]
 evidence=[e for e in f['pilot']['battleEvidenceCandidates'] if e['battleId'] in {b['id'] for b in battles}]
 testimony=[s for s in f['testimonies']['statements'] if cid in s['targetCharacterIds'] or cid==s['speakerRef']]
 return {'id':cid,'name':name_map[cid],'viewType':'combat-candidate',
         'canOpenProfile':True,'defaultTab':'overview','combat':{
            'status':'unrated','message':'아직 전투력 평가가 없습니다. 0점이 아닙니다.',
            'score':None,'overallRank':None,'defaultProfileId':None},
         'battles':[{'id':b['id'],'title':b['title'],'sceneVerified':False,'phaseCount':len(b['phaseRecords'])} for b in battles],
         'evidenceCards':[{'id':e['id'],'summary':e['summary'],'verification':e['sourceVerification'],
                            'sourceTitles':[source_map[s]['title'] for s in e['sourceIds']],
                            'evaluatedScoreImpact':'none','counterargument':e['doubleCountRisk']} for e in evidence],
         'statementCards':[{'id':s['id'],'summary':s['summary'],'speakerName':s['speakerName'],
                            'isExactQuote':False} for s in testimony]}

def person_page(p):
 stmts=[s for s in f['testimonies']['statements'] if s['speakerRef']==p['id']]
 return {'id':p['id'],'name':p['displayName'],'viewType':'narrative-candidate',
         'canOpenProfile':True,'defaultTab':'overview','registrationStatus':'proposed',
         'overview':p['profileSummary'],
         'timeline':[{'period':e['periodCandidate'],'summary':e['summary'],'verification':e['verification']} for e in p['timeline']],
         'combat':{'status':'not-planned','message':'현재 전투력 평가 대상이 아닙니다.','score':None,'overallRank':None},
         'statementCards':[{'id':s['id'],'summary':s['summary'],'claimDomain':s['claimDomain'],
                            'contextBoundary':s['contextBoundary'],'isExactQuote':False} for s in stmts]}

out={'schemaVersion':'2.1-preview','notice':'UI projection fixture; no website or implemented UI',
     'legacyUniqueRosterCount':109,'potentialMasterIfApproved':114,
     'fighterPages':[character_page(cid) for cid in f['pilot']['characterIds']],
     'narrativePages':[person_page(p) for p in f['newPersonCandidates']],
     'linkedCaseExample':{
       'parentCaseId':'DC01','childCaseId':'DC02',
       'statementId':'ST05','crossCaseOutcomeId':'O02',
       'rule':'A statement from a parent decision case may cite an outcome in a descendant case; independent-error count must not increment automatically.'
     }}
(P/'view_models_preview_v2.1_DRAFT.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('created view models:',len(out['fighterPages']),len(out['narrativePages']))
