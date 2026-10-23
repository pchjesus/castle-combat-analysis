import json
from pathlib import Path
P=Path(__file__).resolve().parent

def obj(required, props, add=False):
 return {'type':'object','required':required,'properties':props,'additionalProperties':add}
def arr(what): return {'type':'array','items':what}
def string():return {'type':'string','minLength':1}
def enum(*x):return {'enum':list(x)}
refs={'type':'string','minLength':1}
nullable={'anyOf':[string(),{'type':'null'}]}
source=obj(['id','title','kind','url','sceneCanonVerified'],{'id':string(),'title':string(),'kind':string(),'url':nullable,'sceneCanonVerified':{'const':False}},True)
person=obj(['id','displayName','roles','registrationStatus','evaluationIntent','profileSummary','overviewVerification','groupLinks','timeline','sourceIds'],{
'id':{'type':'string','pattern':'^person-draft-'},'displayName':string(),'roles':arr(string()),
'registrationStatus':{'const':'proposed'},'evaluationIntent':enum('planned','not-planned','undecided'),
'profileSummary':string(),'overviewVerification':{'const':'secondary-only'},
'groupLinks':arr(obj(['groupId','label','status'],{'groupId':{'anyOf':[string(),{'type':'null'}]},'label':string(),'status':string()})),
'timeline':arr(obj(['summary','sourceIds','verification'],{'summary':string(),'sourceIds':arr(string()),'verification':{'const':'secondary-only'}},True)),
'sourceIds':arr(string()),'aliasesToVerify':arr(string()),'reviewFlags':arr(string())}, True)
battle=obj(['id','title','subjectCharacterId','participantCandidateCharacterIds','unresolvedActorLabels','episodeVerification','phaseRecords','phaseStatus'],{
'id':string(),'title':string(),'subjectCharacterId':string(),'participantCandidateCharacterIds':arr(string()),
'unresolvedActorLabels':arr(string()),'episodeVerification':{'const':'candidate-only'},
'phaseRecords':{'type':'array','maxItems':0},'phaseStatus':{'const':'awaiting-original-scene-review'}},True)
evidence=obj(['id','kind','battleId','sourceIds','sourceVerification','sceneCanonVerified','sourceTextForm','phaseId','linkedEvaluationItemIds','scoreImpact'],{
'id':string(),'kind':{'const':'battle-observation-candidate'},'battleId':string(),
'sourceIds':arr(string()),'sourceVerification':{'const':'secondary-only'},'sceneCanonVerified':{'const':False},
'sourceTextForm':{'const':'secondary-paraphrase'},'phaseId':{'type':'null'},
'linkedEvaluationItemIds':{'type':'array','maxItems':0},'scoreImpact':{'const':'none'}},True)
statement=obj(['id','speakerRef','speakerName','targetCharacterIds','sourceIds','decisionCaseId','linkedOutcomeIds','summary','isExactQuote','sceneCanonVerified','scoreImpact'],{
'id':string(),'speakerRef':string(),'speakerName':string(),'targetCharacterIds':arr(string()),
'sourceIds':arr(string()),'decisionCaseId':string(),'linkedOutcomeIds':arr(string()),
'summary':string(),'isExactQuote':{'const':False},'sceneCanonVerified':{'const':False},'scoreImpact':{'const':'none'}},True)
case=obj(['id','title','parentCaseId','linkedOutcomeIds'],{'id':string(),'title':string(),'parentCaseId':nullable,'linkedOutcomeIds':arr(string())},True)
outcome=obj(['id','decisionCaseId','sourceIds','sceneCanonVerified'],{'id':string(),'decisionCaseId':string(),'sourceIds':arr(string()),'sceneCanonVerified':{'const':False}},True)
trial=obj(['characterId','axis','trialValue','rangeHypothesis','evaluationScore','approved','evidenceCandidateIds'],{
'characterId':string(),'axis':string(),'trialValue':{'type':'number','minimum':0,'maximum':100,'multipleOf':2.5},
'rangeHypothesis':{'type':'array','items':{'type':'number','minimum':0,'maximum':100},'minItems':2,'maxItems':2},
'evaluationScore':{'type':'null'},'approved':{'const':False},'evidenceCandidateIds':arr(string())},True)
root=obj(['schemaVersion','meta','rosterReference','newPersonCandidates','sourceCatalog','pilot','testimonies','uiContract','openIssues'],{
'schemaVersion':{'const':'2.1-draft'},
'meta':obj(['draftOnly','originalCanonScenesVerified','formalEvaluations','githubChanged','websiteImplemented'],{
 'draftOnly':{'const':True},'originalCanonScenesVerified':{'const':0},'formalEvaluations':{'const':0},'githubChanged':{'const':False},'websiteImplemented':{'const':False}},True),
'rosterReference':obj(['schemaVersion','characterCount','organizationCount','originalCharacterIds','originalGroupIds','status'],{
 'schemaVersion':{'const':'0.1'},'characterCount':{'const':109},'organizationCount':{'const':17},
 'originalCharacterIds':{'type':'array','minItems':109,'maxItems':109,'uniqueItems':True,'items':{'type':'string','pattern':'^char-[0-9]{3}$'}},
 'originalGroupIds':{'type':'array','minItems':17,'maxItems':17,'uniqueItems':True,'items':string()},
 'status':{'const':'read-only-original-preserved'}},True),
'newPersonCandidates':arr(person),'sourceCatalog':arr(source),
'pilot':obj(['characterIds','battles','battleEvidenceCandidates','evaluationStates','combatProfiles','evaluations','calculationResults','rankings','trialAnchors'],{
 'characterIds':arr(string()),'battles':arr(battle),'battleEvidenceCandidates':arr(evidence),
 'evaluationStates':{'type':'array','maxItems':0},'combatProfiles':{'type':'array','maxItems':0},
 'evaluations':{'type':'array','maxItems':0},'calculationResults':{'type':'array','maxItems':0},
 'rankings':{'type':'array','maxItems':0},'trialAnchors':arr(trial)},False),
'testimonies':obj(['statements','decisionCases','outcomes'],{'statements':arr(statement),'decisionCases':arr(case),'outcomes':arr(outcome)},False),
'uiContract':obj(['tabs','emptyEvaluation','noProvisionalAutomaticRanking','allQuotesUnverified'],{
 'tabs':{'const':['overview','combat','evidence','review']},'emptyEvaluation':string(),
 'noProvisionalAutomaticRanking':{'const':True},'allQuotesUnverified':{'const':True}},True),
'openIssues':arr(obj(['code','severity','note'],{'code':string(),'severity':string(),'note':string()},True))},False)
root['$schema']='https://json-schema.org/draft/2020-12/schema'
root['$id']='https://example.invalid/castle/v2.1-draft-local-fixture.schema.json'
root['title']='CASTLE v2.1 local non-authoritative contract fixture (NOT production contract)'
(P/'castle_fixture_schema_v2.1_DRAFT.json').write_text(json.dumps(root,ensure_ascii=False,indent=2)+'\n')
print('schema generated')
