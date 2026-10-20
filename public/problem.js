const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=value=>esc(value).replace(/`([^`]+)`/g,'<code>$1</code>');
export function validateProblem(p){
 const text=(value,label,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`Exercise ${label} must be nonempty text under ${max} characters.`);};
 const strings=(items,label,min,max,length)=>{if(!Array.isArray(items)||items.length<min||items.length>max)throw Error(`Exercise ${label} needs ${min}–${max} items.`);items.forEach(x=>text(x,label,length));};
 if(!p||typeof p!=='object')throw Error('Exercise needs a structured problem statement.');
 text(p.title,'title',120);text(p.signature,'signature',600);
 strings(p.description,'description',1,3,400);strings(p.requirements,'requirements',1,6,300);strings(p.constraints,'constraints',1,6,240);
 if(!Array.isArray(p.examples)||p.examples.length<2||p.examples.length>3)throw Error('Exercise needs 2–3 examples.');
 for(const e of p.examples){text(e.input,'example input',500);text(e.output,'example output',500);if(e.explanation!==undefined)text(e.explanation,'example explanation',300);}
 return p;
}
const builtinExamples={
 'program:guided':{title:'Change the greeting',examples:[{input:'Run main(); no input',output:'Hello, Go!\n',explanation:'Print exactly one greeting followed by a newline.'}]},
 'program:practice':{title:'Print two messages',examples:[{input:'Run main(); no input',output:'Ready to build\nOne step at a time\n',explanation:'Each message goes on its own line.'}]},
 'variables:guided':{title:'Assign the visit count',examples:[{input:'name = "Maya", visits = 3',output:'Maya 3\n',explanation:'Print the unchanged name and updated count.'}]},
 'variables:practice':{title:'Create a parcel label and weight',examples:[{input:'Run main(); no input',output:'BOX-7 250\n',explanation:'Separate the two values with one space.'}]},
 'functions:guided':{title:'Double a number',examples:[{input:'Double(4)',output:'return 8'},{input:'Double(0)',output:'return 0'}]},
 'functions:practice':{title:'Calculate the total price',examples:[{input:'Total(7, 3)',output:'return 21'},{input:'Total(7, 0)',output:'return 0',explanation:'A zero quantity produces a zero total.'}]},
 'structs:guided':{title:'Update a named field',examples:[{input:'reader has Name: "Maya", BooksRead: 3',output:'Maya\n3\n',explanation:'Print the name and count on separate lines.'}]},
 'structs:practice':{title:'Read the parcel label',examples:[{input:'LabelOf(Parcel{Label: "BOX-7", WeightGrams: 250})',output:'return "BOX-7"'},{input:'LabelOf(Parcel{Label: "", WeightGrams: 0})',output:'return ""',explanation:'Return the actual label, including an empty string.'}]}
};
export function legacyProblem(exercise,language,{builtin=false,id,stage}={}){
 // Restructure only the supplied public text: never infer requirements from hidden tests.
 const sentences=exercise.prompt.split(/(?<=[.!?])\s+(?=[A-Z])/u).filter(Boolean);
 const requirements=[],constraints=[],exampleNotes=[],details=[],examples=[];
 for(const sentence of sentences){
  if(/^(?:Examples?:|Required cases|Required behaviors|In particular,)/i.test(sentence)){
   const cases=sentence.replace(/^Examples?:\s*/i,'').replace(/\.$/,'').split(/;\s*/);
   const parsed=cases.map(value=>value.match(/^(.+?) returns (-?\d+|None|null|true|false|"[^"\n]*"|\[[^\n]*\])$/));
   if(/^Examples?:/i.test(sentence)&&parsed.every(Boolean))for(const match of parsed)examples.push({input:match[1],output:`return ${match[2]}`});
   else exampleNotes.push(sentence);
  }
  else if(/(?:Function scaffold:|^The tests|^In the test file|^A Test function|^Save the starter|^Put the program|^Put the tests|^The \* here|^The int after|^The \+ symbol|^Calls such as|^To try it|^The import command|^You may try)/i.test(sentence))details.push(sentence);
  else if(/^(?:Assume |Do not |Never |Keep |Use |Edit only|Printing is optional|Comparisons are|Always |Return None if)/i.test(sentence))constraints.push(sentence);
  else requirements.push(sentence);
 }
 const code=exercise.starter||'';
 const signatures=language==='go'?[...code.matchAll(/func\s+(?:\([^)]*\)\s*)?\w+\([^)]*\)[^{\n]*/g)].map(m=>m[0].trim()):language==='python'?[...code.matchAll(/^\s*def\s+[^\n]+:/gm)].map(m=>m[0].trim()):[...code.matchAll(/(?:export\s+)?(?:async\s+)?function\s+\w+\([^)]*\)/g)].map(m=>m[0]);
 const signature=signatures.find(s=>!/^func main\(/.test(s))||signatures[0];
 const name=signature?.match(/(?:func|def|function)\s+(\w+)/)?.[1];
 return {title:name?`Implement ${name}`:'Your task',description:requirements.length?[requirements.shift()]:[],requirements,constraints,exampleNotes,examples,details,signature,...(builtin?builtinExamples[`${id}:${stage}`]:{})};
}
export function renderProblem(problem,stage){
 const points=(items,cls='')=>items?.length?`<ul class="problem-points ${cls}">${items.map(item=>`<li>${inline(item)}</li>`).join('')}</ul>`:'';
 return `<div class="problem-meta"><span>${stage==='guided'?'GUIDED MODIFICATION':'INDEPENDENT PRACTICE'}</span><span>TESTED LOCALLY</span></div>
 <h3 class="problem-title">${esc(problem.title)}</h3>
 ${(problem.description||[]).map(p=>`<p class="problem-description">${inline(p)}</p>`).join('')}
 ${problem.signature?`<section class="problem-section"><h3>Function signature</h3><pre class="problem-signature"><code>${esc(problem.signature)}</code></pre></section>`:''}
 ${problem.requirements?.length?`<section class="problem-section"><h3>${stage==='guided'?'What to change':'Requirements'}</h3>${points(problem.requirements)}</section>`:''}
 ${(problem.examples||[]).map((e,i)=>`<section class="problem-example"><h3>Example ${i+1}</h3><dl><dt>Input</dt><dd><pre>${esc(e.input)}</pre></dd><dt>Output</dt><dd><pre>${esc(e.output)}</pre></dd></dl>${e.explanation?`<p><b>Explanation:</b> ${inline(e.explanation)}</p>`:''}</section>`).join('')}
 ${problem.exampleNotes?.length?`<section class="problem-example"><h3>Examples</h3>${points(problem.exampleNotes)}</section>`:''}
 ${problem.constraints?.length?`<section class="problem-section"><h3>Constraints &amp; rules</h3>${points(problem.constraints)}</section>`:''}
 ${problem.details?.length?`<details class="learn-details"><summary>Scaffold &amp; testing notes</summary>${points(problem.details)}</details>`:''}
 <aside class="problem-help"><b>${stage==='guided'?'Make the smallest change that meets the task.':'Implement the behavior for different inputs.'}</b><p>Run tests for feedback. Open Hint for a nudge; stronger hints appear only when you request them.</p></aside>`;
}
