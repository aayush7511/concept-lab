import {accessSync,constants,readFileSync,realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
function executable(candidate){if(!candidate)return null;try{accessSync(candidate,constants.X_OK);return realpathSync(candidate);}catch{return null;}}
function find(name){const result=spawnSync('/usr/bin/which',[name],{encoding:'utf8'});return result.status===0?executable(result.stdout.trim()):null;}
export function runtimePaths(){
 let local={};try{local=JSON.parse(readFileSync(path.join(root,'.local/runtimes.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('Invalid .local/runtimes.json configuration.');}
 const python=executable(process.env.CONCEPT_LAB_PYTHON||local.python)||find('python3');
 return {node:process.execPath,go:executable(process.env.CONCEPT_LAB_GO||local.go)||find('go'),
  // Avoid invoking Apple's system shim, which can trigger an unsolicited tools installer.
  python:python?.startsWith('/usr/bin/')?null:python,sync:path.join(root,'runtime/sync')};
}
