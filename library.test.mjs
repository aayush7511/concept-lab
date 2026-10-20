import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {Library} from './library.mjs';
test('drafts, predictions, hints and progress survive a restart without revealing reference answers',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'concept-progress-'));const runner={async run(){return {ok:true,stdout:'',stderr:'',exitCode:0};}};try{let l=new Library({directory:dir,ai:null,runner});await l.init();await l.saveDraft('minifhir','functions','guided','edited code');let grade=await l.grade({project:'minifhir',id:'functions',stage:'predict',prediction:'6\n0\n'});assert.equal(grade.ok,true);await l.hint('minifhir','functions','guided');await l.grade({project:'minifhir',id:'functions',stage:'guided',code:'edited code'});await l.solution('minifhir','functions','practice');l=new Library({directory:dir,ai:null,runner});await l.init();const p=l.progress('minifhir','functions');assert.equal(p.drafts.guided,'edited code');assert.equal(p.hints.guided,1);assert.equal(p.passes.guided,true);assert.equal(p.prediction.correct,true);assert.equal(p.revealed.practice,true);}finally{await rm(dir,{recursive:true,force:true});}});

test('prediction run is gated by a current attempt and executes its own code',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'concept-predict-'));let executed;const runner={async run({code}){executed=code;return {ok:true,stdout:'6\n0\n',stderr:'',exitCode:0};}};try{const l=new Library({directory:dir,ai:null,runner});await l.init();await assert.rejects(l.grade({project:'minifhir',id:'functions',stage:'example'}),/Submit your prediction/);await l.update('minifhir','functions',{prediction:{attempted:true,value:'8',version:1}});await assert.rejects(l.grade({project:'minifhir',id:'functions',stage:'example'}),/Submit your prediction/);const grade=await l.grade({project:'minifhir',id:'functions',stage:'predict',prediction:'6\n0\n'});assert.equal(grade.ok,true);assert.equal(l.progress('minifhir','functions').predictionHistory[0].value,'8');const result=await l.grade({project:'minifhir',id:'functions',stage:'example'});assert.equal(result.ok,true);assert.equal(executed,l.get('minifhir','functions').prediction.code);assert.notEqual(executed,l.get('minifhir','functions').example.code);}finally{await rm(dir,{recursive:true,force:true});}});

test('prediction validation rejects reused programs, reused output and wrong answers',async()=>{const library=new Library({directory:'unused',ai:null,runner:{async run(){return {ok:true,stdout:'actual\n',stderr:''};}}});const l={language:'go',example:{code:'learn code'}};assert.equal((await library.checkPrediction(l,{code:'learn  code',expected:'actual'},'learn output')).ok,false);assert.equal((await library.checkPrediction(l,{code:'new code',expected:'actual'},'actual\n')).ok,false);assert.equal((await library.checkPrediction(l,{code:'new code',expected:'wrong'},'learn output')).ok,false);assert.equal((await library.checkPrediction(l,{code:'new code',expected:'actual\n'},'learn output')).ok,true);});

test('old cached lessons receive one checked prediction without losing exercise progress',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'concept-predict-cache-'));let calls=0;const ai={async complete(){calls++;return {text:JSON.stringify({code:'new prediction code',question:'What prints?',expected:'new\n',explanation:'The new program prints a different value.'})};}};const runner={async run({code}){return {ok:true,stdout:code==='new prediction code'?'new\n':'learn\n',stderr:''};}};try{const l=new Library({directory:dir,ai,runner});await l.init();l.data.lessons['minifhir:loops']={language:'go',title:'Loops',explanation:['Learn loops.'],example:{code:'old learn code'},prediction:{question:'Old question',expected:'learn\n'}};await l.update('minifhir','loops',{drafts:{guided:'my work'},passes:{guided:true},prediction:{attempted:true,value:'learn'}});await l.ensurePrediction('minifhir','loops');await l.ensurePrediction('minifhir','loops');assert.equal(calls,1);assert.equal(l.get('minifhir','loops').prediction.code,'new prediction code');assert.equal(l.progress('minifhir','loops').drafts.guided,'my work');assert.equal(l.progress('minifhir','loops').passes.guided,true);}finally{await rm(dir,{recursive:true,force:true});}});

test('acknowledged progress survives SIGKILL of the writer',async()=>{
 const {spawn}=await import('node:child_process');
 const dir=await mkdtemp(path.join(os.tmpdir(),'concept-kill-'));
 let child;
 try{
  const script=`import {Library} from ${JSON.stringify(new URL('./library.mjs',import.meta.url).href)};const l=new Library({directory:process.argv[1],ai:null,runner:null});await l.init();await l.saveDraft('minifhir','functions','practice','work saved before a crash');process.stdout.write('saved\\n');setInterval(()=>{},1000);`;
  child=spawn(process.execPath,['--input-type=module','-e',script,dir],{stdio:['ignore','pipe','pipe']});
  const exited=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Writer never acknowledged its save')),10000);
   child.stdout.once('data',()=>{clearTimeout(timer);resolve();});
   child.once('error',e=>{clearTimeout(timer);reject(e);});
   child.once('exit',()=>{clearTimeout(timer);reject(Error('Writer exited before acknowledgement'));});
  });
  child.kill('SIGKILL');assert.equal((await exited).signal,'SIGKILL');
  const restored=new Library({directory:dir,ai:null,runner:null});await restored.init();
  assert.equal(restored.progress('minifhir','functions').drafts.practice,'work saved before a crash');
 }finally{child?.kill('SIGKILL');await rm(dir,{recursive:true,force:true});}
});

test('a corrupt or missing primary file recovers the previous complete snapshot',async()=>{
 const {writeFile,unlink}=await import('node:fs/promises');
 const dir=await mkdtemp(path.join(os.tmpdir(),'concept-recovery-'));
 try{
  let l=new Library({directory:dir,ai:null,runner:null});await l.init();
  await l.saveDraft('minifhir','functions','guided','recover this draft');
  await l.hint('minifhir','functions','guided');
  await writeFile(path.join(dir,'library.json'),'{interrupted');
  l=new Library({directory:dir,ai:null,runner:null});await l.init();
  assert.equal(l.progress('minifhir','functions').drafts.guided,'recover this draft');
  await unlink(path.join(dir,'library.json'));
  l=new Library({directory:dir,ai:null,runner:null});await l.init();
  assert.equal(l.progress('minifhir','functions').drafts.guided,'recover this draft');
 }finally{await rm(dir,{recursive:true,force:true});}
});
