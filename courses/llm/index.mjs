import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bundle=JSON.parse(readFileSync(new URL('./lessons.json',import.meta.url),'utf8'));
export const llmCourse=bundle.project;
export const llmLessons=Object.fromEntries(bundle.lessons.map(l=>[l.id,l]));
export const llmBuilds=JSON.parse(readFileSync(new URL('./builds.json',import.meta.url),'utf8'));
export const llmVersion=5;
const digest=code=>createHash('sha256').update(code).digest('hex');
export function buildCurrent(id,saved){
 const b=llmBuilds.find(b=>b.id===id),p=saved[id];
 return !!(b&&p?.passedCode&&b.requires.every(dependency=>buildCurrent(dependency,saved)&&p.dependencyHashes?.[dependency]===digest(saved[dependency].passedCode)));
}
export function publicBuild(b){const {reference,tests,...safe}=b;return safe;}
export function seedLLM(data){
 const old=data.projects.find(p=>p.id===llmCourse.id);
 if(!old)data.projects.unshift(structuredClone(llmCourse));
 else if(old.courseVersion!==llmVersion)Object.assign(old,structuredClone(llmCourse));
 for(const [id,lesson] of Object.entries(llmLessons)){
  const key=`${llmCourse.id}:${id}`;
  const previous=data.lessons[key];
  if(!previous||previous.courseVersion!==llmVersion){
   const progress=data.progress[key];
   for(const stage of ['guided','practice'])if(previous&&progress&&previous[stage].prompt!==lesson[stage].prompt){
    // A saved answer belongs to its original exercise, not to a replacement task.
    const historyKey=stage+'History';
    progress[historyKey]=[...(progress[historyKey]||[]),{prompt:previous[stage].prompt,draft:progress.drafts?.[stage],passed:progress.passes?.[stage],hints:progress.hints?.[stage],revealed:progress.revealed?.[stage],at:new Date().toISOString()}];
    progress.drafts={...progress.drafts,[stage]:lesson.mode==='conceptual'?'':lesson[stage].starter};
    progress.passes={...progress.passes,[stage]:false};
    progress.hints={...progress.hints,[stage]:0};
    progress.revealed={...progress.revealed,[stage]:false};
    if(progress.lastResult?.stage===stage)progress.lastResult=null;
    if(stage==='practice')progress.nextReviewAt=null;
   }
   data.lessons[key]={...structuredClone(lesson),courseVersion:llmVersion};
  }
 }
}
export function courseState(library){
 const saved=library.data.courseBuilds||{};
 const reviews=llmCourse.concepts.filter(c=>{
  const p=library.progress(llmCourse.id,c.id);
  return p.nextReviewAt&&Date.parse(p.nextReviewAt)<=Date.now();
 }).map(c=>({id:c.id,title:c.title}));
 return {course:llmCourse,builds:llmBuilds.map(b=>({...publicBuild(b),progress:{...saved[b.id],current:buildCurrent(b.id,saved),stale:!!saved[b.id]?.passedCode&&!buildCurrent(b.id,saved)}})),reviews};
}
export class BuildJobs{
 constructor(library,runner){this.library=library;this.runner=runner;this.jobs=new Map();}
 build(id){const b=llmBuilds.find(b=>b.id===id);if(!b)throw Error('Build not found.');return b;}
 async draft(id,code){this.build(id);if(typeof code!=='string'||code.length>40000)throw Error('Build code must be under 40,000 characters.');const data=this.library.data;data.courseBuilds??={};data.courseBuilds[id]={...data.courseBuilds[id],draft:code,updatedAt:new Date().toISOString()};await this.library.save();return data.courseBuilds[id];}
 status(id){const job=this.jobs.get(id);if(!job)throw Error('Job not found. A server restart ends active runs; your draft is saved.');const {controller,...safe}=job;return safe;}
 async start(id,code){
  const b=this.build(id);
  if([...this.jobs.values()].some(j=>j.state==='running'))throw Error('A build is already running. Wait or cancel it.');
  const saved=this.library.data.courseBuilds||{},files={},dependencyHashes={};
  for(const needed of b.requires){const dependency=this.build(needed);if(!buildCurrent(needed,saved))throw Error(`Pass ${dependency.title} first; its current module is needed here.`);files[dependency.file]=saved[needed].passedCode;dependencyHashes[needed]=digest(saved[needed].passedCode);}
  await this.draft(id,code);
  const key=crypto.randomUUID(),controller=new AbortController();
  const job={id:key,build:id,state:'running',startedAt:new Date().toISOString(),controller};this.jobs.set(key,job);
  // Bounded memory: retain the latest 20 completed receipts, never evict running work.
  for(const [key,value] of this.jobs)if(this.jobs.size>20&&value.state!=='running')this.jobs.delete(key);
  this.execute(job,b,code,files,dependencyHashes).catch(e=>{job.state='failed';job.result={ok:false,stderr:e.message};});
  return this.status(key);
 }
 async execute(job,b,code,files,dependencyHashes){
  try{
   const result=await this.runner.run({language:'python',runtime:'llm',code,testCode:b.tests,extraFiles:files,signal:job.controller.signal});
   job.result=result;job.state=result.cancelled?'cancelled':result.ok?'passed':'failed';job.finishedAt=new Date().toISOString();
   const previous=this.library.data.courseBuilds[b.id]||{};
   this.library.data.courseBuilds[b.id]={...previous,lastResult:result,lastRunAt:job.finishedAt,...(result.ok?{passedCode:code,passedAt:job.finishedAt,dependencyHashes}:{}),...(result.ok&&previous.revealed?{reviewed:true}:{})};
   await this.library.save();
  }catch(e){job.state='failed';job.result={ok:false,stderr:e.message};}
 }
 cancel(id){const job=this.jobs.get(id);if(!job)throw Error('Job not found.');if(job.state==='running')job.controller.abort();return this.status(id);}
 async reveal(id){const b=this.build(id);this.library.data.courseBuilds??={};const p=this.library.data.courseBuilds[id]||{};this.library.data.courseBuilds[id]={...p,revealed:true};await this.library.save();return {code:b.reference};}
 export(){
  const files={};for(const b of llmBuilds){const p=this.library.data.courseBuilds?.[b.id];if(buildCurrent(b.id,this.library.data.courseBuilds||{}))files[b.file]=p.passedCode;}
  files['requirements.txt']=readFileSync(new URL('./requirements.txt',import.meta.url),'utf8');
  files['README.md']='Your passed Concept Lab modules. Install the course requirements, then import these modules in a local Python project. Tiny training demonstrates the learning mechanism; these are not pretrained language weights.\n';
  return {files};
 }
}
