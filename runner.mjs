import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,mkdir,rm,realpath} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {runtimePaths} from './runtimes.mjs';
const {go:GO,python:PYTHON,node:NODE,sync:SYNC}=runtimePaths();
export const languages=['go','python','javascript'];
const quote=s=>JSON.stringify(s);
export class Runner{
 constructor(directory){this.directory=directory;this.active=0;}
 async run({language,code,testCode='',race=false}){
  if(!languages.includes(language))throw Error('Executable lessons currently support Go, Python, and JavaScript.');
  if(typeof code!=='string'||code.length>40000||typeof testCode!=='string'||testCode.length>40000)throw Error('Code is missing or too large.');
  if((language==='go'&&!GO)||(language==='python'&&!PYTHON))throw Error(`Missing ${language} runtime. Run npm run doctor for setup instructions.`);
  if(process.platform!=='darwin')throw Error('The sandboxed runner currently requires macOS.');
  if(this.active>=2)throw Error('Two programs are already running. Wait and try again.');
  this.active++;
  let temp;
  try{
   await mkdir(this.directory,{recursive:true,mode:0o700});temp=await mkdtemp(path.join(this.directory,'run-'));temp=await realpath(temp);
   const cache=path.join(this.directory,'cache');await mkdir(cache,{recursive:true,mode:0o700});const realCache=await realpath(cache);
   const work=path.join(temp,'work');await mkdir(work);for(const d of ['home','tmp','gopath'])await mkdir(path.join(temp,d));await writeFile(path.join(work,'package.json'),'{"type":"module"}');
   const files=language==='go'?['main.go','main_test.go']:language==='python'?['main.py','checks.py']:['main.mjs','checks.mjs'];
   await writeFile(path.join(work,files[0]),code);
   if(testCode)await writeFile(path.join(work,files[1]),testCode);
   if(language==='go')await writeFile(path.join(work,'go.mod'),`module exercise\n\ngo 1.22\n\nrequire golang.org/x/sync v0.10.0\nreplace golang.org/x/sync => ${JSON.stringify(SYNC)}\n`);
   // Deny access to personal files, credentials, networking, and writes outside this run/cache.
   const profile=`(version 1) (deny default)
(allow file-read-metadata) (allow process*) (allow sysctl-read) (allow mach-lookup) (allow signal)
(allow file-read* (subpath "/usr") (subpath "/System") (subpath "/Library/Apple") (subpath "/Library/Developer") (subpath "/Applications/Xcode.app") (subpath "/opt") (subpath ${quote(path.dirname(NODE))}) ${PYTHON?`(subpath ${quote(path.dirname(path.dirname(PYTHON)))})`:""} ${GO?`(subpath ${quote(path.dirname(path.dirname(GO)))})`:""} (subpath ${quote(SYNC)}) (subpath "/dev") (subpath "/private/var/db") (literal "/")  (subpath ${quote(temp)}) (subpath ${quote(realCache)}))
(allow file-write* (subpath ${quote(temp)}) (subpath ${quote(realCache)}) (literal "/dev/null"))`;
   const tool=language==='go'?GO:language==='python'?PYTHON:NODE;
   const args=language==='go'?(testCode?['test','-count=1','-timeout=5s',...(race?['-race']:[]),'./...']:['run','.']):[testCode?files[1]:files[0]];
   const env={PATH:'/usr/bin:/bin:/opt/homebrew/bin',HOME:path.join(temp,'home'),TMPDIR:path.join(temp,'tmp'),GOCACHE:realCache,GOPATH:path.join(temp,'gopath'),GOMODCACHE:path.join(temp,'modules'),GOTOOLCHAIN:'local',GOPROXY:'off',GOSUMDB:'off',GOTELEMETRY:'off',GOMAXPROCS:'2',CGO_ENABLED:race?'1':'0',PYTHONDONTWRITEBYTECODE:'1',PYTHONIOENCODING:'utf-8',LANG:'en_US.UTF-8'};
   const result=await new Promise(resolve=>{
    const child=spawn('/usr/bin/sandbox-exec',['-p',profile,tool,...args],{cwd:work,env,detached:true,stdio:['ignore','pipe','pipe']});
    let stdout='',stderr='',timedOut=false,limited=false;
    const kill=()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}};
    const timer=setTimeout(()=>{timedOut=true;kill();},language==='go'?25000:8000);
    const capture=key=>chunk=>{if(key==='out')stdout+=chunk.toString();else stderr+=chunk.toString();if(stdout.length+stderr.length>64000){limited=true;kill();}};
    child.stdout.on('data',capture('out'));child.stderr.on('data',capture('err'));
    child.on('error',()=>{clearTimeout(timer);resolve({ok:false,stdout:'',stderr:'Could not start the local sandboxed runtime.',exitCode:-1});});
    child.on('close',exitCode=>{clearTimeout(timer);kill();resolve({ok:exitCode===0&&!timedOut&&!limited,stdout:stdout.slice(0,48000),stderr:stderr.slice(0,16000),exitCode,timedOut,limited});});
   });
   if(result.timedOut)result.stderr+='\nProgram exceeded its time limit. Check for an infinite loop or goroutine that never finishes.';
   if(result.limited)result.stderr+='\nOutput limit exceeded. Check for runaway printing.';
   return result;
  }finally{if(temp)await rm(temp,{recursive:true,force:true});this.active--;}
 }
}
