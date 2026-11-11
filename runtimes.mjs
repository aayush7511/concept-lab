import {accessSync,constants,readFileSync,realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
function executable(candidate){if(!candidate)return null;try{accessSync(candidate,constants.X_OK);return realpathSync(candidate);}catch{return null;}}
function find(name){const result=spawnSync('/usr/bin/which',[name],{encoding:'utf8'});return result.status===0?executable(result.stdout.trim()):null;}
// /usr/bin/java is a launcher stub; resolve a real JDK home so the sandbox can allow exactly that tree.
function javaHome(local){
 const configured=process.env.CONCEPT_LAB_JAVA_HOME||local.javaHome;
 let home=configured;
 if(!home){const r=spawnSync('/usr/libexec/java_home',['-v','17+'],{encoding:'utf8'});home=r.status===0?r.stdout.trim():null;}
 if(!home)return null;
 try{home=realpathSync(home);}catch{return null;}
 const javac=executable(path.join(home,'bin/javac')),java=executable(path.join(home,'bin/java'));
 return javac&&java?{home,java,javac}:null;
}
export function runtimePaths(){
 let local={};try{local=JSON.parse(readFileSync(path.join(root,'.local/runtimes.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('Invalid .local/runtimes.json configuration.');}
 const python=executable(process.env.CONCEPT_LAB_PYTHON||local.python)||find('python3');
 return {node:process.execPath,go:executable(process.env.CONCEPT_LAB_GO||local.go)||find('go'),
  llmPython:(()=>{const p=path.join(root,'.local/llm-venv/bin/python');try{accessSync(p,constants.X_OK);return p;}catch{return null;}})(),
  llmEnvironment:path.join(root,'.local/llm-venv'),llmAssets:path.join(root,'.local/llm-assets'),
  llmBase:(()=>{try{return path.dirname(path.dirname(realpathSync(path.join(root,'.local/llm-venv/bin/python'))));}catch{return null;}})(),
  // Avoid invoking Apple's system shim, which can trigger an unsolicited tools installer.
  java:javaHome(local),
  python:python?.startsWith('/usr/bin/')?null:python,sync:path.join(root,'runtime/sync')};
}
