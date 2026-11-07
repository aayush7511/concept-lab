const compact=value=>String(value||'').replace(/\s+/g,' ').trim().toLowerCase();
const body=code=>String(code||'').replace(/^\s*#.*$/gm,'').replace(/\s+/g,'').trim();
export function auditExercises(lessons){
 const findings=[],rows=[];
 for(const l of Object.values(lessons)){
  const fail=message=>findings.push({id:l.id,message});
  const conceptual=l.mode==='conceptual';
  const predict=conceptual?l.prediction.question:l.prediction.question+'\n'+l.prediction.code;
  const stages=[predict,l.guided.prompt,l.practice.prompt].map(compact);
  if(new Set(stages).size!==3)fail('Repeated stage question or task.');
  if(conceptual){
   if(!/change|modification|revise|revision/i.test(l.guided.prompt))fail('Modify has no intervention.');
  }else{
   if(body(l.guided.reference)===body(l.practice.reference))fail('Modify and Practice have identical reference programs.');
   if(/def one\(/.test(l.practice.reference)&&/for args in items/.test(l.practice.reference))fail('Practice is a generic list wrapper of the taught operation.');
   if(/^Process each independent argument tuple/.test(l.practice.prompt))fail('Practice still has the generic wrapper requirement.');
   const match=l.prediction.code.match(/print\(solve\(([\s\S]*)\)\)\s*$/);
   if(match){const call=compact('solve('+match[1]+')');if(l.guided.problem.examples.some(e=>compact(e.input)===call))fail('Predict input reused verbatim as a Modify example.');}
   if(!l.exerciseRoles||l.practiceRevision!==2)fail('Independent task review metadata missing.');
   if((l.practice.tests.match(/same\(solve\(/g)||[]).length<3)fail('Practice needs three specified behavioral cases.');
  }
  rows.push({id:l.id,title:l.title,type:conceptual?'Conceptual':'Coding',predict:conceptual?l.prediction.question:'Trace working code on a separate input.',modify:l.guided.prompt,practice:l.practice.prompt});
 }
 return {lessons:rows.length,coding:rows.filter(r=>r.type==='Coding').length,conceptual:rows.filter(r=>r.type==='Conceptual').length,findings,rows};
}
