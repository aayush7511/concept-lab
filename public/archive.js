// A small uncompressed POSIX tar writer; paths are fixed server-produced module names.
export function projectArchive(files){
 const encoder=new TextEncoder(),chunks=[];
 for(const [name,contents] of Object.entries(files)){
  if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw Error('Invalid exported file name.');
  const data=encoder.encode(contents),header=new Uint8Array(512);
  const field=(offset,length,value)=>header.set(encoder.encode(value).slice(0,length),offset);
  field(0,100,name);field(100,8,'0000644\0');field(108,8,'0000000\0');field(116,8,'0000000\0');
  field(124,12,data.length.toString(8).padStart(11,'0')+'\0');field(136,12,'00000000000\0');
  header.fill(32,148,156);header[156]=48;field(257,6,'ustar\0');field(263,2,'00');
  const sum=header.reduce((total,byte)=>total+byte,0);field(148,8,sum.toString(8).padStart(6,'0')+'\0 ');
  chunks.push(header,data,new Uint8Array((512-data.length%512)%512));
 }
 chunks.push(new Uint8Array(1024));return new Blob(chunks,{type:'application/x-tar'});
}
