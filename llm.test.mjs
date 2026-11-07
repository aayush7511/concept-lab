import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Library,validateLesson,publicLesson} from './library.mjs';
import {llmCourse,llmLessons,llmBuilds,BuildJobs,publicBuild,courseState} from './courses/llm/index.mjs';

test('supplied course has ordered prerequisites, structured lessons and independent practice interfaces',()=>{
 const seen=new Set();
 for(const c of llmCourse.concepts){assert.ok(!seen.has(c.id));assert.ok(c.prerequisites.every(id=>seen.has(id)));seen.add(c.id);const l=llmLessons[c.id];validateLesson(l,'python',{requireStructured:true,requireProblems:true});if(l.mode!=='conceptual'){assert.match(l.practice.starter,/def solve\(/);assert.notEqual(l.practice.starter,l.guided.starter);assert.notEqual(l.practice.prompt,l.guided.prompt);assert.ok(!l.practice.reference.includes('def one('),'Practice must not wrap the Modify solution');}else assert.match(l.practice.reference,/^[ABC]$/);const safe=publicLesson(l);assert.equal(safe.practice.tests,undefined);assert.equal(safe.prediction.expected,undefined);}
 for(const b of llmBuilds){assert.ok(seen.has(b.after));assert.equal(publicBuild(b).reference,undefined);assert.equal(publicBuild(b).tests,undefined);assert.ok(b.requires.every(id=>llmBuilds.some(x=>x.id===id)));}
});

test('every LLM Learn lesson has distinct background, rationale and worked reasoning without repeated scaffold text',async()=>{
 const {renderStructuredLearn}=await import('./public/learn.js');
 const backgrounds=new Set(),reasons=new Set(),walkthroughs=new Set();
 for(const lesson of Object.values(llmLessons)){
  assert.equal(lesson.learnRevision,2,lesson.id);
  const [background,purpose,walkthrough]=lesson.learn.sections;
  for(const [seen,text] of [[backgrounds,background.points[0]],[reasons,purpose.points[1]],[walkthroughs,walkthrough.points[0]]]){
   assert.ok(text.length>=90,`${lesson.id}: explanation needs developed reasoning`);
   assert.ok(!seen.has(text),`${lesson.id}: repeated teaching paragraph`);seen.add(text);
  }
  const html=renderStructuredLearn(lesson.learn);
  assert.ok(html.includes('<p>'),lesson.id);
  assert.ok(!html.includes('class="learn-points"'),`${lesson.id}: narrative should read as paragraphs`);
  assert.doesNotMatch(html,/Use the small example to inspect|The supplied imports are setup|Use the scenario to decide/);
  assert.deepEqual(lesson.example.notes,[],'do not repeat the syntax below the walkthrough');
 }
 assert.match(llmLessons['next-target'].learn.sections[2].points[0],/one pair containing two lists/);
 assert.match(llmLessons.keepdim.learn.sections[1].points[1],/aligns from the right/);
 assert.match(llmLessons['cross-entropy'].learn.sections[1].points[1],/expects logits/);
});

test('a Learn-only course update preserves every saved exercise and tutor progress field',async()=>{
 const {seedLLM}=await import('./courses/llm/index.mjs');
 const lesson=structuredClone(llmLessons['next-target']);lesson.courseVersion=4;lesson.learn={overview:'old teaching notes'};
 const key='llm-scratch:next-target';
 const progress={drafts:{learn:'custom example',guided:'repair code',practice:'my answer'},passes:{learn:true,guided:true,practice:false},prediction:{attempted:true,value:'my prediction'},hints:{practice:1},revealed:{guided:true},lastResult:{stage:'practice',ok:false},tutorHistory:[{role:'user',content:'Explain the return structure'}],practiceHistory:[{draft:'earlier work'}]};
 const data={projects:[{...structuredClone(llmCourse),courseVersion:4}],lessons:{[key]:lesson},progress:{[key]:structuredClone(progress)}};
 seedLLM(data);assert.deepEqual(data.progress[key],progress);assert.deepEqual(data.lessons[key].learn,llmLessons['next-target'].learn);
 seedLLM(data);assert.deepEqual(data.progress[key],progress);
});

test('LLM seeding survives restart without replacing learner drafts or existing project progress',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'llm-seed-'));
 try{let library=new Library({directory,ai:null,runner:null});await library.init();await library.saveDraft('llm-scratch','tensor','practice','my tensor code');await library.saveDraft('minifhir','functions','guided','my Go code');library=new Library({directory,ai:null,runner:null});await library.init();assert.equal(library.project('llm-scratch').concepts.length,llmCourse.concepts.length);assert.equal(library.progress('llm-scratch','tensor').drafts.practice,'my tensor code');assert.equal(library.progress('minifhir','functions').drafts.guided,'my Go code');}finally{await rm(directory,{recursive:true,force:true});}
});

test('build jobs save drafts, require passed dependencies, and persist passed modules',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'llm-build-'));let received;
 const runner={async run(request){received=request;return {ok:true,stdout:'passed',stderr:''};}};
 try{const library=new Library({directory,ai:null,runner});await library.init();let jobs=new BuildJobs(library,runner);
 await assert.rejects(jobs.start('gpt','code'),/Pass/);
 const started=await jobs.start('tokenizer','my tokenizer');
 while(jobs.status(started.id).state==='running')await new Promise(r=>setTimeout(r,5));
 assert.equal(jobs.status(started.id).state,'passed');assert.equal(received.runtime,'llm');assert.equal(jobs.export().files['tokenizer.py'],'my tokenizer');
 await jobs.reveal('tokenizer');assert.ok(courseState(library).builds[0].progress.revealed);
 const reopened=new Library({directory,ai:null,runner});await reopened.init();jobs=new BuildJobs(reopened,runner);assert.equal(jobs.export().files['tokenizer.py'],'my tokenizer');
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('cancelling a running build never records it as passed',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'llm-cancel-'));
 const runner={run:({signal})=>new Promise(resolve=>signal.addEventListener('abort',()=>resolve({ok:false,cancelled:true,stderr:'cancelled'}),{once:true}))};
 try{const library=new Library({directory,ai:null,runner});await library.init();const jobs=new BuildJobs(library,runner);const job=await jobs.start('tokenizer','draft');jobs.cancel(job.id);while(jobs.status(job.id).state==='running')await new Promise(r=>setTimeout(r,5));assert.equal(jobs.status(job.id).state,'cancelled');assert.equal(library.data.courseBuilds.tokenizer.passedCode,undefined);assert.equal(library.data.courseBuilds.tokenizer.draft,'draft');}finally{await rm(directory,{recursive:true,force:true});}
});

test('changing a passed dependency invalidates downstream build status and export',async()=>{
 const {createHash}=await import('node:crypto');const {buildCurrent}=await import('./courses/llm/index.mjs');
 const hash=value=>createHash('sha256').update(value).digest('hex');
 const saved={attention:{passedCode:'version one'},gpt:{passedCode:'gpt implementation',dependencyHashes:{attention:hash('version one')}}};
 assert.equal(buildCurrent('gpt',saved),true);saved.attention.passedCode='version two';assert.equal(buildCurrent('gpt',saved),false);
 const jobs=new BuildJobs({data:{courseBuilds:saved}},null);assert.equal(jobs.export().files['model.py'],undefined);assert.equal(jobs.export().files['attention.py'],'version two');
});

test('project archive has valid tar headers and excludes path traversal names',async()=>{
 const {projectArchive}=await import('./public/archive.js');const bytes=new Uint8Array(await projectArchive({'model.py':'print("hi")\n'}).arrayBuffer());
 assert.equal(new TextDecoder().decode(bytes.slice(0,8)),'model.py');assert.equal(new TextDecoder().decode(bytes.slice(257,262)),'ustar');
 const header=bytes.slice(0,512);const checksum=parseInt(new TextDecoder().decode(header.slice(148,154)),8);header.fill(32,148,156);assert.equal(header.reduce((a,b)=>a+b,0),checksum);
 assert.throws(()=>projectArchive({'../bad.py':'bad'}),/Invalid exported file name/);
});

test('concept checkpoints grade answers without executing learner text and schedule reconstruction',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'llm-theory-'));
 const runner={async run(){throw Error('Concept answers must never execute');}};
 try{const library=new Library({directory,ai:null,runner});await library.init();
 const l=llmLessons['train-infer'];assert.equal((await library.grade({project:'llm-scratch',id:l.id,stage:'practice',code:'not a choice'})).ok,false);
 assert.equal((await library.grade({project:'llm-scratch',id:l.id,stage:'practice',code:l.practice.reference.toLowerCase()})).ok,true);
 assert.ok(library.progress('llm-scratch',l.id).nextReviewAt);
 await library.update('llm-scratch',l.id,{reviewHistory:[{},{}]});
 await library.grade({project:'llm-scratch',id:l.id,stage:'practice',code:l.practice.reference});
 const days=(Date.parse(library.progress('llm-scratch',l.id).nextReviewAt)-Date.now())/86400000;assert.ok(days>6.99&&days<=7);
 assert.equal((await library.grade({project:'llm-scratch',id:l.id,stage:'learn',code:'arbitrary text'})).ok,true);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('Predict, Modify and Practice use distinct scenarios, with Modify asking for a change',()=>{
 for(const lesson of Object.values(llmLessons)){
  if(lesson.mode!=='conceptual')continue;
  const prompts=[lesson.prediction.question,lesson.guided.prompt,lesson.practice.prompt].map(s=>s.trim().toLowerCase());
  assert.equal(new Set(prompts).size,3,`${lesson.id}: stages must not reuse a question`);
  assert.match(lesson.guided.prompt,/change|modification|revise|revision/i,`${lesson.id}: Modify must ask for an intervention`);
  assert.match(lesson.guided.reference,/^[ABC]$/);
 }
});

test('replacing a duplicated Modify scenario archives its attempt and retains Predict and Practice',async()=>{
 const {seedLLM}=await import('./courses/llm/index.mjs');
 const key='llm-scratch:train-infer',oldLesson=structuredClone(llmLessons['train-infer']);
 oldLesson.courseVersion=2;oldLesson.guided.prompt=oldLesson.prediction.question;
 const oldPrediction={attempted:true,correct:true,value:'B',version:oldLesson.prediction.version};
 const data={projects:[{...structuredClone(llmCourse),courseVersion:2}],lessons:{[key]:oldLesson},progress:{[key]:{drafts:{guided:'B',practice:'C'},passes:{guided:true,practice:true},prediction:oldPrediction,hints:{guided:1,practice:2},revealed:{guided:true},lastResult:{stage:'guided',ok:true}}}};
 seedLLM(data);const p=data.progress[key];
 assert.notEqual(data.lessons[key].guided.prompt,oldLesson.guided.prompt);
 assert.equal(p.guidedHistory[0].prompt,oldLesson.guided.prompt);assert.equal(p.guidedHistory[0].draft,'B');assert.equal(p.guidedHistory[0].passed,true);
 assert.equal(p.drafts.guided,'');assert.equal(p.passes.guided,false);assert.equal(p.hints.guided,0);assert.equal(p.revealed.guided,false);assert.equal(p.lastResult,null);
 assert.deepEqual(p.prediction,oldPrediction);assert.equal(p.drafts.practice,'C');assert.equal(p.passes.practice,true);
 seedLLM(data);assert.equal(p.guidedHistory.length,1,'migration must not repeat on restart');
});

test('tutor conversations survive restart without changing exercise progress',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'tutor-history-'));
 try{let library=new Library({directory,ai:null,runner:null});await library.init();await library.saveDraft('llm-scratch','decoder','practice','B');
 const messages=[{role:'user',content:'Explain causal attention'},{role:'assistant',content:'Only current and earlier positions are visible.'}];
 await library.saveTutorHistory('llm-scratch','decoder',messages);
 library=new Library({directory,ai:null,runner:null});await library.init();assert.deepEqual(library.progress('llm-scratch','decoder').tutorHistory,messages);assert.equal(library.progress('llm-scratch','decoder').drafts.practice,'B');
 await assert.rejects(library.saveTutorHistory('llm-scratch','decoder',[{role:'system',content:'Invalid role'}]),/Invalid tutor/);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('all 366 stage assignments pass the separation audit; copied tasks are rejected',async()=>{
 const {auditExercises}=await import('./courses/llm/audit.mjs');
 assert.deepEqual(auditExercises(llmLessons).findings,[]);
 const copied=structuredClone(llmLessons.tensor);copied.practice.prompt=copied.guided.prompt;copied.practice.reference=copied.guided.reference;
 const findings=auditExercises({tensor:copied}).findings;assert.ok(findings.some(f=>f.message.includes('Repeated')));assert.ok(findings.some(f=>f.message.includes('identical reference')));
});

test('replacing wrapper Practice archives the old attempt while retaining other learning stages and tutor history',async()=>{
 const {seedLLM}=await import('./courses/llm/index.mjs');const key='llm-scratch:tensor';
 const previous=structuredClone(llmLessons.tensor);previous.courseVersion=3;previous.practice.prompt='Process each independent argument tuple in items: old wrapper task';
 const prediction={attempted:true,value:'[9,1]',version:previous.prediction.version};const history=[{role:'assistant',content:'Keep the tensor separate from the list.'}];
 const data={projects:[{...structuredClone(llmCourse),courseVersion:3}],lessons:{[key]:previous},progress:{[key]:{drafts:{guided:'guided work',practice:'old wrapper answer'},passes:{guided:true,practice:true},prediction,tutorHistory:history,nextReviewAt:'2026-11-01T00:00:00Z',hints:{practice:2},revealed:{practice:true}}}};
 seedLLM(data);const p=data.progress[key];assert.equal(p.practiceHistory[0].draft,'old wrapper answer');assert.equal(p.practiceHistory[0].passed,true);assert.equal(p.practiceHistory[0].prompt,previous.practice.prompt);assert.equal(p.passes.practice,false);assert.equal(p.drafts.practice,llmLessons.tensor.practice.starter);assert.equal(p.hints.practice,0);assert.equal(p.revealed.practice,false);assert.equal(p.nextReviewAt,null);
 assert.equal(p.passes.guided,true);assert.equal(p.drafts.guided,'guided work');assert.deepEqual(p.prediction,prediction);assert.deepEqual(p.tutorHistory,history);
 seedLLM(data);assert.equal(p.practiceHistory.length,1);
});
