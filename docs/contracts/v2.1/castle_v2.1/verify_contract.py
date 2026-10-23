#!/usr/bin/env python3
"""Local, read-only validation of v2.1 design fixture. Not a web app test or canon check."""
from __future__ import annotations
import copy, json
from pathlib import Path
from jsonschema import Draft202012Validator

HERE=Path(__file__).resolve().parent
FIXTURE=HERE/'castle_contract_fixture_v2.1_DRAFT.json'
SCHEMA=HERE/'castle_fixture_schema_v2.1_DRAFT.json'
DATA=json.loads(FIXTURE.read_text(encoding='utf-8'))
SC=json.loads(SCHEMA.read_text(encoding='utf-8'))


def unique_ids(rows,label):
    ids=[x['id'] for x in rows]
    if len(ids)!=len(set(ids)):
        raise ValueError(f'{label}: duplicate IDs')
    return set(ids)


def semantic_validate(f):
    r=f['rosterReference']; p=f['pilot']; t=f['testimonies']; persons=f['newPersonCandidates']
    rid=set(r['originalCharacterIds']); groups=set(r['originalGroupIds'])
    if len(rid)!=109 or r['originalCharacterIds']!=[f'char-{i:03d}' for i in range(1,110)]:
        raise ValueError('canonical roster IDs altered')
    candidates=unique_ids(persons,'candidate people')
    if rid & candidates: raise ValueError('person ID collision')
    if len({v['displayName'] for v in persons})!=len(persons): raise ValueError('duplicate candidate name')
    if set(v['displayName'] for v in persons)&set(r['confirmedNameById'].values()):raise ValueError('draft person collides with known original name')
    character_refs=rid|candidates
    sources=unique_ids(f['sourceCatalog'],'sources')
    def ensure_source_refs(used,where):
        if set(used)-sources: raise ValueError(f'{where}: unregistered source refs: {set(used)-sources}')
    for v in persons:
        ensure_source_refs(v['sourceIds'],v['id'])
        for rel in v['groupLinks']:
            if rel['groupId'] is not None and rel['groupId'] not in groups: raise ValueError(f'{v["id"]}: invalid group link')
        for e in v['timeline']:ensure_source_refs(e['sourceIds'],v['id']+' timeline')
    if len(p['characterIds'])!=3 or len(set(p['characterIds']))!=3 or not set(p['characterIds'])<=rid:
        raise ValueError('invalid pilot characters')
    battles=unique_ids(p['battles'],'battles')
    if len(battles)!=3: raise ValueError('pilot battles must be 3')
    for b in p['battles']:
        if b['subjectCharacterId'] not in p['characterIds'] or not set(b['participantCandidateCharacterIds'])<=rid:
            raise ValueError(f'battle {b["id"]}: unresolved canonical reference')
        if b['subjectCharacterId'] not in b['participantCandidateCharacterIds']:
            raise ValueError('battle missing subject participant')
        if b['phaseRecords']: raise ValueError('phase prematurely canon-confirmed')
    evidences=unique_ids(p['battleEvidenceCandidates'],'evidence')
    if len(evidences)!=12: raise ValueError('expected 12 provisional evidence candidates')
    for e in p['battleEvidenceCandidates']:
        if e['battleId'] not in battles:raise ValueError('evidence: invalid battle')
        ensure_source_refs(e['sourceIds'],e['id'])
        if e['sceneCanonVerified'] or e['scoreImpact']!='none' or e['linkedEvaluationItemIds']:
            raise ValueError('unverified evidence incorrectly promoted to scored evidence')
    cases=unique_ids(t['decisionCases'],'decision cases')
    outcomes=unique_ids(t['outcomes'],'outcomes')
    statements=unique_ids(t['statements'],'statements')
    if (len(cases),len(outcomes),len(statements))!=(4,4,7):raise ValueError('v1.7 reference counts changed')
    case_of={o['id']:o['decisionCaseId'] for o in t['outcomes']}
    for o in t['outcomes']:
        if o['decisionCaseId'] not in cases:raise ValueError('outcome orphan case')
        ensure_source_refs(o['sourceIds'],o['id'])
    for c in t['decisionCases']:
        if c['parentCaseId'] is not None and c['parentCaseId'] not in cases:raise ValueError('orphan parent case')
        if c['parentCaseId']==c['id']:raise ValueError('self cycle')
        for oid in c['linkedOutcomeIds']:
            if oid not in outcomes or case_of[oid]!=c['id']:raise ValueError('case references foreign outcome')
        path=set(); node=c['id']; case_map={x['id']:x['parentCaseId'] for x in t['decisionCases']}
        while node is not None:
            if node in path:raise ValueError('parent DecisionCase cycle')
            path.add(node);node=case_map.get(node)
    case_parents={x['id']:x['parentCaseId'] for x in t['decisionCases']}
    def outcome_in_case_or_descendant(outcome_case,statement_case):
        cursor=outcome_case
        while cursor is not None:
            if cursor==statement_case:return True
            cursor=case_parents[cursor]
        return False
    for s in t['statements']:
        if s['speakerRef'] not in character_refs:raise ValueError('unresolved speaker')
        if not set(s['targetCharacterIds'])<=rid:raise ValueError('unregistered statement target')
        if s['decisionCaseId'] not in cases:raise ValueError('unregistered decision case')
        for oid in s['linkedOutcomeIds']:
            if oid not in outcomes or not outcome_in_case_or_descendant(case_of[oid],s['decisionCaseId']):
                raise ValueError('statement outcome/case mismatch')
        ensure_source_refs(s['sourceIds'],s['id'])
        if s['isExactQuote'] or s['sceneCanonVerified'] or s['scoreImpact']!='none':
            raise ValueError('unverified quote improperly promoted')
    if p['evaluations'] or p['rankings'] or p['calculationResults'] or p['combatProfiles'] or p['evaluationStates']:
        raise ValueError('fabricated evaluations, profiles or rankings')
    if len(p['trialAnchors'])!=9:raise ValueError('trial anchor history lost')
    for a in p['trialAnchors']:
        if a['characterId'] not in p['characterIds'] or not set(a['evidenceCandidateIds'])<=evidences:
            raise ValueError('anchor orphan reference')
        if a['evaluationScore'] is not None or a['approved']:raise ValueError('provisional anchor published as score')
    if any(s['sceneCanonVerified'] for s in f['sourceCatalog']):raise ValueError('source promoted without canon check')
    if f['meta']['githubChanged'] or f['meta']['websiteImplemented']:raise ValueError('false completion claim')
    return True


def validate(f):
    errs=list(Draft202012Validator(SC).iter_errors(f))
    if errs:raise ValueError('schema: '+str(errs[0].message))
    semantic_validate(f)
    return True


def run():
    Draft202012Validator.check_schema(SC)
    results=[]
    def test(title,fn):
        try:fn();results.append((title,True,''))
        except Exception as e:results.append((title,False,str(e)))
    def eq(a,b):
        if a!=b:raise AssertionError(f'{a} != {b}')
    def mutate_reject(label,mutator):
        def f():
            x=copy.deepcopy(DATA);mutator(x)
            try:validate(x)
            except Exception:return
            raise AssertionError('invalid fixture unexpectedly passed validation')
        test(label,f)
    test('JSON Schema v2.1 is valid',lambda:Draft202012Validator.check_schema(SC))
    test('fixture satisfies JSON Schema and all semantic constraints',lambda:validate(DATA))
    test('legacy roster: 109 stable IDs',lambda:eq(len(DATA['rosterReference']['originalCharacterIds']),109))
    test('legacy groups: 17 stable IDs',lambda:eq(len(DATA['rosterReference']['originalGroupIds']),17))
    test('pilot: 3 distinct characters and battles',lambda:eq((len(DATA['pilot']['characterIds']),len(DATA['pilot']['battles'])),(3,3)))
    test('pilot: 12 observation candidates',lambda:eq(len(DATA['pilot']['battleEvidenceCandidates']),12))
    test('5 proposed-only people',lambda:eq(len(DATA['newPersonCandidates']),5))
    test('all non-fighter profiles carry sources and a timeline',lambda:all(x['sourceIds'] and x['timeline'] for x in DATA['newPersonCandidates']) or (_ for _ in ()).throw(ValueError('empty profile source or timeline')))
    test('7 statements resolve to canon or candidate person IDs',lambda:eq(len(DATA['testimonies']['statements']),7))
    test('4 decision cases / 4 outcomes remain linked',lambda:eq((len(DATA['testimonies']['decisionCases']),len(DATA['testimonies']['outcomes'])),(4,4)))
    test('9 historical trial anchors remain unapproved',lambda:eq(len(DATA['pilot']['trialAnchors']),9))
    test('all evaluation and ranking outputs remain empty',lambda: eq([len(DATA['pilot'][x]) for x in ['evaluations','calculationResults','rankings']],[0,0,0]))
    test('unknown phases have not been fabricated',lambda: eq([len(x['phaseRecords']) for x in DATA['pilot']['battles']],[0,0,0]))
    test('quotes all paraphrases and not canon verified',lambda: eq(sum(not x['isExactQuote'] and not x['sceneCanonVerified'] for x in DATA['testimonies']['statements']),7))
    test('exact-name collision guard for 리사 / 크리사',lambda:eq([x['id'] for x in DATA['newPersonCandidates'] if x['displayName']=='리사'],['person-draft-lisa']))
    view=json.loads((HERE/'view_models_preview_v2.1_DRAFT.json').read_text(encoding='utf-8'))
    test('UI view models cover all 3 pilot people',lambda:eq(len(view['fighterPages']),3))
    test('UI view models cover all 5 narrative people',lambda:eq(len(view['narrativePages']),5))
    test('UI fighter pages contain no misleading zero scores',lambda:eq([p['combat']['score'] for p in view['fighterPages']],[None,None,None]))
    test('UI narrative profiles show no combat score',lambda:eq([p['combat']['score'] for p in view['narrativePages']],[None]*5))
    test('UI shows source-status for all 12 observation cards',lambda:eq(sum(len(p['evidenceCards']) for p in view['fighterPages']),12))
    # deliberately break one or more constraints to verify the checker rejects them
    mutate_reject('reject duplicate draft-person IDs',lambda x:x['newPersonCandidates'][1].update(id=x['newPersonCandidates'][0]['id']))
    mutate_reject('reject invalid speaker ref',lambda x:x['testimonies']['statements'][0].update(speakerRef='missing-speaker'))
    mutate_reject('reject orphan evidence battle ref',lambda x:x['pilot']['battleEvidenceCandidates'][0].update(battleId='missing-battle'))
    mutate_reject('reject unknown source ref',lambda x:x['pilot']['battleEvidenceCandidates'][0].update(sourceIds=['not-registered']))
    mutate_reject('reject unsourced canon verification',lambda x:x['testimonies']['statements'][0].update(sceneCanonVerified=True))
    mutate_reject('reject fabricated exact quote',lambda x:x['testimonies']['statements'][0].update(isExactQuote=True))
    mutate_reject('reject official score in trial anchor',lambda x:x['pilot']['trialAnchors'][0].update(evaluationScore=100))
    mutate_reject('reject fake matchup/ranking entry',lambda x:x['pilot']['rankings'].append({'characterId':'char-033','rank':1}))
    mutate_reject('reject invalid 2.5-point precision',lambda x:x['pilot']['trialAnchors'][0].update(trialValue=96.2))
    mutate_reject('reject case-parent cycle',lambda x:x['testimonies']['decisionCases'][0].update(parentCaseId='DC02'))
    mutate_reject('reject outcome attached to another case',lambda x:x['testimonies']['statements'][0].update(linkedOutcomeIds=['O03']))
    mutate_reject('reject unsupported battle phase',lambda x:x['pilot']['battles'][0]['phaseRecords'].append({'phase':1}))
    out={
      'artifact':'v2.1 local design fixture',
      'status':'PASS' if all(s for _,s,_ in results) else 'FAIL',
      'testsRun':len(results),'passed':sum(s for _,s,_ in results),'failed':sum(not s for _,s,_ in results),
      'scope':'schema/refs/preservation/negative cases ONLY',
      'notChecked':['original webtoon scenes','original quotes','real website/browser','deploy','production migration','remote repo file checksum match'],
      'cases':[{'name':a,'pass':ok,'detail':msg} for a,ok,msg in results]
    }
    (HERE/'local_validation_result_v2.1.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f"{out['status']}: {out['passed']}/{out['testsRun']} checks passed")
    for a,ok,msg in results:
        print((' PASS ' if ok else ' FAIL ')+a + ((' -- '+msg) if msg else ''))
    if out['failed']:raise SystemExit(1)

if __name__=='__main__':run()
