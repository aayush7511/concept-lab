// Decode UTF-8 only after collecting bytes, including split multibyte characters.
// JSON escaping can expand a million-character specification to six million bytes.
export const MAX_REQUEST_BYTES=8*1024*1024;
export async function readRequestJSON(request,{maxBytes=MAX_REQUEST_BYTES}={}){
 const chunks=[];let bytes=0;
 for await(const chunk of request){
  const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
  bytes+=buffer.length;
  if(bytes>maxBytes)throw Error(`Request exceeds the ${maxBytes.toLocaleString('en-US')}-byte limit.`);
  chunks.push(buffer);
 }
 try{const text=Buffer.concat(chunks).toString('utf8');return text?JSON.parse(text):{};}
 catch{throw Error('Invalid JSON request.');}
}
