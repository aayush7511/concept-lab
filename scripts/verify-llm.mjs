import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Runner} from '../runner.mjs';
import {validateLesson} from '../library.mjs';
import {llmCourse,llmLessons,llmBuilds} from '../courses/llm/index.mjs';
const dir=await mkdtemp(path.join(os.tmpdir(),'llm-verification-'));
const runner=new Runner(dir);const lessons=Object.values(llmLessons).filter(l=>l.mode!=='conceptual');
const py=value=>JSON.stringify(JSON.stringify(value));
const start=Number(process.argv[2]||0);
let checked=start;
try{
 for(const lesson of lessons)validateLesson(lesson,'python',{requireStructured:true,requireProblems:true});
 // Run isolated main modules in small batches to avoid paying PyTorch startup for every fixture.
 for(let i=start;i<lessons.length;i+=2){
  const batch=lessons.slice(i,i+2);
  const code=`import json,types,sys,contextlib,io\nlessons=json.loads(${py(batch)})\nfor lesson in lessons:\n    for label in ['example','prediction']:\n        buffer=io.StringIO()\n        with contextlib.redirect_stdout(buffer): exec(lesson[label]['code'],{})\n        if label=='prediction': assert buffer.getvalue()==lesson['prediction']['expected'],lesson['id']+': prediction mismatch'\n    for stage in ['guided','practice']:\n        task=lesson[stage]\n        for kind in ['reference','starter']:\n            module=types.ModuleType('main')\n            sys.modules['main']=module\n            compile(task[kind],'<'+kind+'>','exec')\n            failed=False\n            try:\n                with contextlib.redirect_stdout(io.StringIO()):\n                    exec(task[kind],module.__dict__)\n                    exec(task['tests'],{})\n            except (AssertionError,NotImplementedError,TypeError,AttributeError) as error:\n                failed=True\n                if kind=='reference': raise AssertionError(lesson['id']+': '+stage+': '+str(error)) from error\n            assert failed==(kind=='starter'),lesson['id']+': '+stage+': starter passed unexpectedly'\n    print(lesson['id']+': examples, prediction, both references and failing starters verified')\n`;
  // Same 40k code bound as learner execution: reduce groups if lessons expand.
  if(code.length>40000)throw Error('Verification batch too large. Reduce batch size.');
  const result=await runner.run({language:'python',runtime:'llm',code});
  assert.ok(result.ok,`${batch[0].id}: ${result.stdout}\n${result.stderr}`);checked+=batch.length;console.log(`Lessons ${checked}/${lessons.length} checked.`);
 }
 const passed={};
 for(const b of llmBuilds){
  const extraFiles=Object.fromEntries(b.requires.map(id=>{const dependency=llmBuilds.find(b=>b.id===id);return [dependency.file,dependency.reference];}));
  const result=await runner.run({language:'python',runtime:'llm',code:b.reference,testCode:b.tests,extraFiles});
  assert.ok(result.ok,`${b.id}: ${result.stdout}\n${result.stderr}`);
  const starter=await runner.run({language:'python',runtime:'llm',code:b.starter,testCode:b.tests,extraFiles});assert.equal(starter.ok,false,`${b.id}: starter should fail`);
  passed[b.file]=b.reference;console.log(`${b.title}: reference passes; starter fails.`);
 }
 const isolation=await runner.run({language:'python',runtime:'llm',code:'import socket\ntry:\n    open("/Users/Shared/forbidden-course-file").read()\nexcept (PermissionError,FileNotFoundError):\n    print("file denied")\ntry:\n    socket.socket().connect(("127.0.0.1",4318))\nexcept PermissionError:\n    print("network denied")'});
 assert.ok(isolation.ok,isolation.stderr);assert.match(isolation.stdout,/network denied/);
 console.log(`Verified ${checked} lessons, ${llmBuilds.length} cumulative builds, and network isolation. Course: ${llmCourse.title}.`);
}finally{await rm(dir,{recursive:true,force:true});}
