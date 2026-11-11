const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline=value=>escape(value).replace(/`([^`]+)`/g,'<code>$1</code>');
export function validateLearn(learn){
 const text=(value,label,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`Learn ${label} must be nonempty text under ${max} characters.`);};
 const list=(value,label,min,max)=>{if(!Array.isArray(value)||value.length<min||value.length>max)throw Error(`Learn ${label} needs ${min}–${max} items.`);};
 if(!learn||typeof learn!=='object')throw Error('Lesson needs a structured Learn explanation.');
 if(learn.format!==undefined&&learn.format!=='narrative')throw Error('Unknown Learn format.');
 text(learn.overview,'overview',320);list(learn.goals,'goals',2,4);learn.goals.forEach(x=>text(x,'goal',140));
 list(learn.sections,'sections',2,5);
 for(const section of learn.sections){text(section.heading,'section heading',80);list(section.points,'section points',2,4);section.points.forEach(x=>text(x,'point',240));if(section.code!==undefined)text(section.code,'code example',600);}
 const diagram=learn.diagram;if(!diagram)throw Error('Learn needs a visual model.');
 text(diagram.title,'diagram title',80);list(diagram.steps,'diagram steps',2,6);
 for(const step of diagram.steps){text(step.label,'diagram label',70);text(step.detail,'diagram detail',160);}
 if(learn.walkthrough!==undefined){const w=learn.walkthrough;text(w.title,'walkthrough title',100);list(w.steps,'walkthrough steps',2,8);for(const step of w.steps){if(step.code!==undefined)text(step.code,'walkthrough code',140);text(step.says,'walkthrough step',280);}}
 if(learn.deeper!==undefined){list(learn.deeper,'go-deeper topics',1,6);for(const topic of learn.deeper){text(topic.heading,'go-deeper heading',90);list(topic.points,'go-deeper paragraphs',1,4);topic.points.forEach(x=>text(x,'go-deeper paragraph',420));if(topic.code!==undefined)text(topic.code,'go-deeper code',600);}}
 text(learn.misconception,'misconception',260);text(learn.takeaway,'takeaway',200);text(learn.tryIt,'try-it instruction',220);
 return learn;
}
export function renderStructuredLearn(learn){
 validateLearn(learn);
 return `<div class="learn-overview"><span class="learn-kicker">THE BIG IDEA</span><p>${inline(learn.overview)}</p></div>
 <section class="learn-section"><h3>What you’ll be able to do</h3><ul class="learn-goals">${learn.goals.map(goal=>`<li>${inline(goal)}</li>`).join('')}</ul></section>
 <figure class="learn-diagram"><figcaption>${escape(learn.diagram.title)}</figcaption><ol>${learn.diagram.steps.map(step=>`<li><strong>${inline(step.label)}</strong><span>${inline(step.detail)}</span></li>`).join('')}</ol></figure>
 ${learn.sections.map((section,index)=>`<section class="learn-section learn-card"><span class="learn-kicker">${String(index+1).padStart(2,'0')}</span><h3>${escape(section.heading)}</h3>${learn.format==='narrative'?section.points.map(point=>`<p>${inline(point)}</p>`).join(''):`<ul class="learn-points">${section.points.map(point=>`<li>${inline(point)}</li>`).join('')}</ul>`}${section.code?`<pre class="learn-snippet"><code>${escape(section.code)}</code></pre>`:''}</section>`).join('')}
 ${learn.walkthrough?`<section class="learn-walkthrough"><span class="learn-kicker">STEP BY STEP</span><h3>${inline(learn.walkthrough.title)}</h3><ol>${learn.walkthrough.steps.map(step=>`<li>${step.code?`<code class="walk-code">${escape(step.code)}</code>`:''}<p>${inline(step.says)}</p></li>`).join('')}</ol></section>`:''}
 <aside class="learn-caution"><span>COMMON MIX-UP</span><p>${inline(learn.misconception)}</p></aside>
 <aside class="learn-takeaway"><span>KEEP THIS IN MIND</span><p>${inline(learn.takeaway)}</p></aside>
 ${learn.deeper?`<details class="learn-deeper"><summary><span>Go deeper</span><small>Optional · ${learn.deeper.length} topics · read when you want more</small></summary>${learn.deeper.map(topic=>`<section><h4>${inline(topic.heading)}</h4>${topic.points.map(point=>`<p>${inline(point)}</p>`).join('')}${topic.code?`<pre class="learn-snippet"><code>${escape(topic.code)}</code></pre>`:''}</section>`).join('')}</details>`:''}`;
}
