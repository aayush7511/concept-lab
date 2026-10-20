import { randomBytes, randomUUID, createHash, createPublicKey, verify, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, chmod, unlink } from 'node:fs/promises';
import path from 'node:path';

const ISSUER = 'https://auth.openai.com';
const RESOURCE = 'https://api.openai.com/v1';
const PLAN_SCOPE = 'chatgpt.tokens.use.direct';
const SCOPES = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
const random = () => randomBytes(32).toString('base64url');
export function equalState(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function atomicJSON(file, value) {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
  await rename(temp, file);
  await chmod(file, 0o600);
}
export async function readJSON(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

// Verify before trusting identity, nonce, or account details. Tokens never reach the UI.
export function validateIDToken(token, { keys, clientID, nonce, now = Date.now() }) {
  if (typeof token !== 'string') throw new Error('Missing identity token.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid identity token.');
  const [h, p, signature] = parts;
  let header, claims;
  try { header = JSON.parse(Buffer.from(h, 'base64url')); claims = JSON.parse(Buffer.from(p, 'base64url')); }
  catch { throw new Error('Invalid identity token.'); }
  if (header.alg !== 'RS256' || header.crit) throw new Error('Unsupported identity signature.');
  const jwk = keys.find(k => k.kid === header.kid && k.kty === 'RSA' && (!k.use || k.use === 'sig') && (!k.alg || k.alg === 'RS256'));
  if (!jwk || !verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(signature, 'base64url'))) throw new Error('Identity signature verification failed.');
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== ISSUER || !aud.includes(clientID) || (aud.length > 1 && claims.azp !== clientID) || (claims.azp && claims.azp !== clientID)) throw new Error('Identity issuer or audience mismatch.');
  const seconds = now / 1000;
  if (typeof claims.exp !== 'number' || claims.exp <= seconds || (claims.nbf && claims.nbf > seconds + 30) || !equalState(claims.nonce, nonce) || typeof claims.sub !== 'string' || !claims.sub) throw new Error('Expired or mismatched identity token.');
  return claims;
}

export class ChatGPTAuth {
  constructor({ directory, callback, fetcher = fetch }) {
    this.directory = directory;
    this.callback = callback;
    this.fetcher = fetcher;
    this.pending = new Map();
    this.refreshing = null;
    this.lastMessage = '';
  }
  async init() {
    this.host = await readJSON(path.join(this.directory, 'host.json'));
    if (!this.host) { this.host = { id: `urn:uuid:${randomUUID()}` }; await atomicJSON(path.join(this.directory, 'host.json'), this.host); }
    this.session = await readJSON(path.join(this.directory, 'credentials.json'));
  }
  async request(url, options = {}) {
    try { return await this.fetcher(url, { ...options, signal: AbortSignal.timeout(25000) }); }
    catch { throw new Error('Could not reach OpenAI. Check your internet connection and try again.'); }
  }
  async discovery() {
    if (this.metadata) return this.metadata;
    const response = await this.request(`${ISSUER}/.well-known/openid-configuration`);
    if (!response.ok) throw new Error('OpenAI sign-in discovery is unavailable.');
    const m = await response.json();
    if (m.issuer !== ISSUER || !['authorization_endpoint','token_endpoint','jwks_uri','revocation_endpoint'].every(k => typeof m[k] === 'string' && m[k].startsWith(`${ISSUER}/`))) throw new Error('Invalid OpenAI authorization configuration.');
    this.metadata = m;
    return m;
  }
  async begin() {
    const metadata = await this.discovery();
    for (const [k,v] of this.pending) if (Date.now() - v.at > 10 * 60_000) this.pending.delete(k);
    if (this.pending.size >= 5) throw new Error('Too many pending sign-ins. Finish one or wait ten minutes.');
    const state = random(), nonce = random(), verifier = random();
    const clientID = this.session?.client_id || 'dynamic_agent_client';
    this.pending.set(state, { nonce, verifier, at: Date.now(), clientID, subject: this.session?.subject });
    const url = new URL(metadata.authorization_endpoint);
    const params = { client_id: clientID, ext_agent_host_id: this.host.id, response_type: 'code', redirect_uri: this.callback, scope: SCOPES, resource: RESOURCE, state, nonce, code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') };
    if (clientID === 'dynamic_agent_client') params.agent_name_hint = 'Concept Lab';
    // Avoid placing retained ID tokens in URLs or logs; returning users can choose an account.
    for (const [k,v] of Object.entries(params)) url.searchParams.set(k,v);
    this.lastMessage = '';
    return url.href;
  }
  async complete(params) {
    const state = params.get('state');
    const pending = this.pending.get(state);
    if (!pending || !equalState(state, [...this.pending.keys()].find(k => equalState(k, state))) || Date.now() - pending.at > 10 * 60_000) throw new Error('Sign-in expired or state did not match. Start again from Concept Lab.');
    this.pending.delete(state);
    if (params.has('error')) throw new Error(params.get('error') === 'access_denied' ? 'Sign-in or plan permission was declined. You can try again.' : 'OpenAI could not complete authorization. Try signing in again.');
    const code = params.get('code');
    let clientID = params.get('client_id') || pending.clientID;
    if (!code || !clientID || clientID === 'dynamic_agent_client' || (pending.clientID !== 'dynamic_agent_client' && clientID !== pending.clientID)) throw new Error('Registration was incomplete or the client did not match. Start sign-in again.');
    const metadata = await this.discovery();
    const response = await this.request(metadata.token_endpoint, { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams({grant_type:'authorization_code',client_id:clientID,code,code_verifier:pending.verifier,redirect_uri:this.callback,resource:RESOURCE}) });
    if (!response.ok) throw new Error(`OpenAI token exchange failed (HTTP ${response.status}). Start a fresh sign-in.`);
    const tokens = await response.json();
    const keyResponse = await this.request(metadata.jwks_uri);
    if (!keyResponse.ok) throw new Error('OpenAI identity keys are unavailable. Start again later.');
    const { keys } = await keyResponse.json();
    const identity = validateIDToken(tokens.id_token, {keys,clientID,nonce:pending.nonce});
    if (pending.subject && identity.sub !== pending.subject) throw new Error('You signed into a different account. Disconnect the existing account first.');
    if (!tokens.access_token || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0 || String(tokens.token_type).toLowerCase() !== 'bearer') throw new Error('OpenAI did not return a valid access token.');
    const record = { ...tokens, client_id: clientID, subject: identity.sub, email: identity.email || '', ext_agent_host_id: this.host.id, scopes: String(tokens.scope || '').split(/\s+/).filter(Boolean), expires_at: Date.now() + tokens.expires_in * 1000 };
    await atomicJSON(path.join(this.directory, 'credentials.json'), record);
    this.session = record;
    this.lastMessage = record.scopes.includes(PLAN_SCOPE) ? 'Connected. ChatGPT plan permission is enabled; an AI request will verify model access.' : 'Signed in, but ChatGPT plan permission was not granted. Authorize plan access before using AI.';
    return this.status();
  }
  status() { return { signedIn: !!this.session, email: this.session?.email || '', planPermission: this.session?.scopes?.includes(PLAN_SCOPE) || false, message: this.lastMessage }; }
  async accessToken() {
    if (!this.session?.scopes?.includes(PLAN_SCOPE)) throw new Error('Continue with ChatGPT and allow ChatGPT plan usage first.');
    if (Date.now() + 60_000 < this.session.expires_at) return this.session.access_token;
    if (!this.refreshing) this.refreshing = this.refresh().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }
  async refresh() {
    const previous = this.session;
    if (!previous?.refresh_token) throw new Error('Your sign-in expired. Continue with ChatGPT again.');
    const metadata = await this.discovery();
    const response = await this.request(metadata.token_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:previous.client_id,refresh_token:previous.refresh_token,resource:RESOURCE})});
    if (!response.ok) throw new Error(`ChatGPT session renewal failed (HTTP ${response.status}). Sign in again.`);
    const t = await response.json();
    if (!t.access_token || !Number.isFinite(t.expires_in) || t.expires_in <= 0) throw new Error('OpenAI returned an invalid renewed session.');
    const next = {...previous,...t,refresh_token:t.refresh_token||previous.refresh_token,scopes:t.scope?String(t.scope).split(/\s+/):previous.scopes,expires_at:Date.now()+t.expires_in*1000};
    if (this.session !== previous) throw new Error('The account changed while renewing. Retry the request.');
    await atomicJSON(path.join(this.directory,'credentials.json'),next); this.session=next;
    return next.access_token;
  }
  async disconnect() {
    if (this.refreshing) { try { await this.refreshing; } catch {} }
    const session = this.session;
    let revoked = !session?.refresh_token;
    if (session?.refresh_token) {
      try { const m=await this.discovery();const r=await this.request(m.revocation_endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:session.refresh_token,token_type_hint:'refresh_token',client_id:session.client_id})}); revoked=r.ok; } catch {}
    }
    this.session=null;this.pending.clear();
    try { await unlink(path.join(this.directory,'credentials.json')); } catch(e) { if(e.code!=='ENOENT')throw e; }
    this.lastMessage=revoked?'Disconnected.':'Disconnected locally. Remote revocation was not confirmed; disconnect Concept Lab in ChatGPT Settings too.';
    return this.status();
  }
}
