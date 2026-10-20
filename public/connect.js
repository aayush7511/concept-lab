let csrf='';
const status=document.querySelector('#status'),connect=document.querySelector('#connect'),disconnect=document.querySelector('#disconnect');
async function api(url,method='GET'){const r=await fetch(url,{method,headers:method==='POST'?{'X-CSRF-Token':csrf}:{}});const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d;}
async function refresh(){try{const s=await api('/api/status');csrf=s.csrf;status.textContent=s.message||(s.signedIn?`Connected${s.email?' as '+s.email:''}. ${s.planPermission?'ChatGPT plan permission enabled.':'Plan permission not enabled.'}`:'Ready. Sign in on OpenAI’s page to connect.');disconnect.hidden=!s.signedIn;connect.firstChild.textContent=s.signedIn?'Reconnect with ChatGPT ':'Continue with ChatGPT ';}catch(e){status.textContent=e.message;}}
connect.addEventListener('click',async()=>{connect.disabled=true;status.textContent='Opening OpenAI sign-in…';try{const {url}=await api('/api/auth/start','POST');window.location.assign(url);}catch(e){status.textContent=e.message;connect.disabled=false;}});
disconnect.addEventListener('click',async()=>{disconnect.disabled=true;try{await api('/api/auth/disconnect','POST');await refresh();}catch(e){status.textContent=e.message;}finally{disconnect.disabled=false;}});
refresh();
