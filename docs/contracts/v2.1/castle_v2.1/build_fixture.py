#!/usr/bin/env python3
"""Read local historical drafts and compose a non-authoritative contract fixture.
No GitHub mutations, deployment or official evaluations.
"""
from __future__ import annotations
import json
from pathlib import Path

OUT=Path(__file__).resolve().parent
BASE=(OUT/'source_drafts') if (OUT/'source_drafts').exists() else Path('/mnt/data')
def read(name): return json.loads((BASE/name).read_text(encoding='utf-8'))
def write(name,obj): (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

pilot=read('castle_pilot_evidence_v1.1_DRAFT.json')
anchors=read('castle_anchor_crosscalibration_v1.3_DRAFT.json')
testimony=read('castle_inuniverse_testimony_audit_v1.7_DRAFT.json')
people=read('castle_person_master_evidence_v1.8_v1.9_DRAFT.json')

canonical_ids=[f'char-{i:03d}' for i in range(1,110)] # Confirmed in live main on 2026-10-23
canonical_names={
    'char-001':'김신','char-003':'표영','char-026':'크리사','char-027':'크로트',
    'char-028':'라텔','char-030':'그롤라','char-033':'아킬라',
    'char-036':'콘','char-037':'헤론','char-038':'오울',
    'char-042':'구스타프','char-043':'블랙맘바',
    'char-055':'최달천','char-071':'류지학','char-087':'리천',
}
group_ids=['baekui','iskra','seonjin-trading','mori-investment-trust','gold-capital',
           'castle-holdings','hotel-castle','haseong','ds-security','hwajin',
           'yamaguchi-gumi','dongcheon-bang','anti-yamaguchi-alliance',
           'hong-kong-factions','pacheon','daeguk','other']
source_map=[]
for tag,items in [('pilot',pilot['sources']),('testimony',{s['id']:s for s in testimony['citations']}),('people',people['sources'])]:
    for key,entry in items.items():
        source_map.append({
            'id': f'{tag}:{key}',
            'title': entry.get('title') or entry.get('name') or key,
            'kind': entry.get('kind') or entry.get('type') or 'undetermined',
            'url':entry.get('url'),
            'provenance':f'prior-draft-{tag}',
            'sceneCanonVerified':False,
            'accessNote':entry.get('verification') or entry.get('verifiedAccess') or 'recorded-in-prior-draft'
        })

person_names={p['displayName']:p['candidateId'] for p in people['candidatePeople']}
name_to_ref={v:k for k,v in canonical_names.items()}
name_to_ref.update(person_names)
# Draft alias, explicitly sourced from the previous person master. Not canon-confirmed.
name_to_ref['이와시로']=person_names['이와시로 신스케']
# Alias resolved only as a displayed annotation, not as a new master person.

candidate_people=[]
for p in people['candidatePeople']:
    candidate_people.append({
       'id':p['candidateId'],
       'displayName':p['displayName'],
       'roles':p['roles'],
       'registrationStatus':'proposed',
       'evaluationIntent':p['evaluationIntent'],
       'profileSummary':p['summary'],
       'overviewVerification':'secondary-only',
       'groupLinks':[{ 'groupId':g['existingGroupId'], 'label':g['name'], 'status':'unverified'} for g in p['groupLinks']],
       'timeline':[{'periodCandidate':e['period'],'summary':e['summary'],'sourceIds':[f'people:{z}' for z in e['sourceIds']], 'verification':'secondary-only'} for e in p['events']],
       'sourceIds':[f'people:{z}' for z in p['sources']],
       'aliasesToVerify':p['aliases'],
       'reviewFlags':p['flags'],
    })

battle_other_ids={'pilot-A':['char-042'], 'pilot-L':['char-028','char-003','char-026'], 'pilot-R':['char-055']}
battles=[]
for b in pilot['battles']:
    resolved_names=set(canonical_names[c] for c in battle_other_ids[b['id']])
    unresolved=[n for n in b['others'] if n not in resolved_names]
    battles.append({
      'id':b['id'],'title':b['label'],'subjectCharacterId':b['subjectCharacterId'],
      'participantCandidateCharacterIds':[b['subjectCharacterId']]+battle_other_ids[b['id']],
      'unresolvedActorLabels':unresolved,
      'episodeCandidate':b['episodeCandidate'],
      'episodeVerification':'candidate-only',
      'phaseRecords':[],
      'phaseStatus':'awaiting-original-scene-review',
      'warning':b['battleModelWarning'],
      'sourceDraft':'v1.1'
    })

evidence=[]
for e in pilot['evidenceCandidates']:
    evidence.append({
     'id':e['id'], 'kind':'battle-observation-candidate',
     'battleId':e['battleId'],'summary':e['observationCandidate'],
     'sourceIds':[f'pilot:{x}' for x in e['candidateSourceRefs']],
     'sourceVerification':'secondary-only','sceneCanonVerified':False,
     'sourceTextForm':'secondary-paraphrase',
     'phaseId':None, 'linkedEvaluationItemIds':[],
     'status':'candidate','primaryRoleCandidate':e['evidenceRoleProposal'],
     'doubleCountRisk':e['doubleCountRisk'],
     'reviewQuestion':e['userCanonReview'],
     'scoreImpact':'none'
    })

cases=[{'id':c['id'],'title':c['title'],'parentCaseId':c['parentCaseId'],
        'linkedOutcomeIds':c['outcomeIds'],'sharedCausalityNote':c['independenceRule'],
        'status':'draft'} for c in testimony['decisionCases']]
outcomes=[{'id':o['id'],'decisionCaseId':o['caseId'],'summary':o['summary'],
           'sourceIds':[f'testimony:{z}' for z in o['sources']],
           'status':o['outcomeStatus'], 'sceneCanonVerified':False,
           'causalLimit':o['causalNote']} for o in testimony['outcomes']]
statements=[]
for s in testimony['statements']:
    speaker_ref=name_to_ref.get(s['speakerName'])
    statements.append({
       'id':s['id'], 'kind':'in-universe-judgment-candidate',
       'speakerRef':speaker_ref,'speakerName':s['speakerName'],
       'speakerRefResolution':'draft-alias' if s['speakerName']=='이와시로' else 'exact-name',
       'targetCharacterIds':s['targetCharacterIds'],
       'subjectNamesForReview':s['subjectNames'],
       'claimDomain':s['claimDomain'], 'claimKind':s['claimKind'],
       'summary':s['paraphrase'], 'isExactQuote':False,
       'sourceIds':[f'testimony:{z}' for z in s['sourceIds']],
       'sourceVerification':'secondary-or-recollection-only',
       'sceneCanonVerified':False,
       'contextBoundary':s['contextBoundary'],
       'speakerPerspective':s['speakerPerspective'],
       'decisionCaseId':s['caseId'],
       'linkedOutcomeIds':s['outcomeRefs'],
       'assessment':s['assessment'],
       'limitations':s['assessmentWhy'],
       'pendingReview':s['missing'],
       'scoreImpact':'none'
    })
trial_anchors=[]
for x in anchors['anchors']:
    trial_anchors.append({
        'characterId':x['characterId'],
        'axis':x['axis'],
        'trialValue':x['v12TrialAnchor'],
        'rangeHypothesis':x['v12Range'],
        'origin':'v1.2-v1.3-provisional-hypothesis',
        'v13Status':x['v13Status'],
        'evidenceCandidateIds':x['v12EvidenceIds'],
        'evaluationScore':None, 'approved':False
    })

fixture={
 'schemaVersion':'2.1-draft',
 'meta':{
    'project':'캐슬 전투력 분석',
    'artifactStatus':'local-design-fixture',
    'draftOnly':True,
    'originalCanonScenesVerified':0,
    'formalEvaluations':0,
    'githubChanged':False,
    'websiteImplemented':False,
    'note':'Local contract fixture, not canonical database or original-scene verification.'},
 'rosterReference':{
    'url':'https://github.com/pchjesus/castle-combat-analysis/blob/main/data/roster.v0.1.json',
    'schemaVersion':'0.1','characterCount':109,'organizationCount':17,
    'originalCharacterIds':canonical_ids,
    'originalGroupIds':group_ids,
    'confirmedNameById':canonical_names,
    'status':'read-only-original-preserved',
    'completeness':'ID index + group index + selected verified names; not a full roster copy'
 },
 'newPersonCandidates':candidate_people,
 'sourceCatalog':source_map,
 'pilot':{
    'characterIds':['char-033','char-087','char-071'],
    'battles':battles,
    'battleEvidenceCandidates':evidence,
    'evaluationStates':[],
    'combatProfiles':[],
    'evaluations':[],
    'calculationResults':[],
    'rankings':[],
    'trialAnchors':trial_anchors,
 },
 'testimonies':{'statements':statements,'decisionCases':cases,'outcomes':outcomes},
 'uiContract':{
    'tabs':['overview','combat','evidence','review'],
    'emptyEvaluation':'평가 자료 없음 — 0점 아님',
    'evidenceOrder':['one-line-summary','source-and-context','support-and-rebuttal','evaluation-trace'],
    'defaultStatePolicy':'no-fabricated-default',
    'spoilerPolicy':'not-finalized',
    'allQuotesUnverified':True,
    'noProvisionalAutomaticRanking':True,
    'reviewApprovalExplicit':True
 },
 'openIssues':[
    {'code':'ID_ALIAS_KIMSEONGYU','severity':'review','note':'김선규 candidateId person-draft-kimseongyu의 로마자 표기 불일치 가능성; 신규 공식 ID 확정 전 검수'},
    {'code':'LISA_KRISA_SUBSTRING','severity':'validation','note':'리사는 크리사의 부분문자열; exact name+alias matching, not substring matching'},
    {'code':'BATTLE_PHASE_PENDING','severity':'blocker','note':'원작 컷 미대조로 Phase 0건, 참가자별 세부 시점 미확정'},
    {'code':'SCORING_GATE_PENDING','severity':'blocker','note':'M1/M2 수치 산정 및 정규 순위 불가'},
    {'code':'SPOILER_POLICY_PENDING','severity':'ux','note':'1부/2부 스포일러 표시 정책 미승인'},
    {'code':'REVIEW_PERMISSION_PENDING','severity':'ux','note':'검수 기록과 사용자 평가 승인 단계의 권한·저장 정책 미승인'}
 ]
}
write('castle_contract_fixture_v2.1_DRAFT.json',fixture)
print('Generated',len(candidate_people),'people',len(battles),'battles',len(evidence),'evidence',len(statements),'statements',len(cases),'cases',len(outcomes),'outcomes',len(trial_anchors),'anchors')
