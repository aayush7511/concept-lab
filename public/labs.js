const attentionIDs=new Set(['all-scores','softmax','weighted-sum','self-attention','scaled-scores','triangle','masked-fill','causal-context','temperature']);
export function renderLab(id){
 if(!attentionIDs.has(id))return '';
 const causal=['triangle','masked-fill','causal-context'].includes(id);
 return `<section class="attention-lab"><span class="learn-kicker">EXPLORE THE NUMBERS</span><h3>Where does this query look?</h3><p>Three candidate values: <b>2, 6, 10</b>. Change the middle key’s score and inspect how its contribution changes.</p><label for="lab-score">Middle key score <output id="lab-score-value">1.0</output></label><input id="lab-score" type="range" min="-4" max="4" step="0.5" value="1">${causal?'<label class="lab-toggle"><input id="lab-causal" type="checkbox" checked> Query is at position 1: hide the future key at position 2</label>':''}<div id="lab-values" class="attention-values" aria-live="polite"></div><p id="lab-context"></p><small>Scores start at [0, middle, 0]. Softmax normalizes across keys; context is the weighted sum of their values.</small></section>`;
}
export function wireLab(){
 const slider=document.querySelector('#lab-score');if(!slider)return;
 const update=()=>{
  const middle=Number(slider.value),masked=!!document.querySelector('#lab-causal')?.checked;
  const scores=[0,middle,masked?-Infinity:0],maximum=Math.max(...scores);
  const exponentials=scores.map(s=>Math.exp(s-maximum)),total=exponentials.reduce((a,b)=>a+b,0),weights=exponentials.map(x=>x/total);
  document.querySelector('#lab-score-value').textContent=middle.toFixed(1);
  document.querySelector('#lab-values').innerHTML=weights.map((weight,index)=>`<div><b>Key ${index}</b><meter class="attention-meter" min="0" max="1" value="${weight}">${weight.toFixed(3)}</meter><span>${(100*weight).toFixed(1)}%</span><small>${weight.toFixed(3)} × ${[2,6,10][index]}</small></div>`).join('');
  document.querySelector('#lab-context').textContent=`Context = ${weights.reduce((sum,w,i)=>sum+w*[2,6,10][i],0).toFixed(3)}`;
 };
 slider.oninput=update;const checkbox=document.querySelector('#lab-causal');if(checkbox)checkbox.onchange=update;update();
}
