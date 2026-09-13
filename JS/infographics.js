import { loadState } from './storage.js';

const KEY='calsi_infographics_v1';
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=(p='info')=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const state=()=>loadState();

const neuronSvg=`<svg class="neuron-svg" viewBox="0 0 1000 620" role="img" aria-label="Neuron diagram">
<defs><linearGradient id="axonG" x1="0" x2="1"><stop stop-color="#8d7cff"/><stop offset="1" stop-color="#54b4ff"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="#8d7cff" stroke-width="12" opacity=".9"><path d="M260 310 C175 300 120 235 70 170"/><path d="M250 300 C170 245 135 185 115 90"/><path d="M255 325 C170 345 115 395 70 470"/><path d="M268 338 C190 395 155 455 145 540"/><path d="M250 315 C165 315 110 305 42 300"/></g>
<circle cx="300" cy="320" r="86" fill="#241f46" stroke="#a99cff" stroke-width="7"/><circle cx="300" cy="320" r="30" fill="#8d7cff" opacity=".9"/>
<path d="M385 320 C500 320 610 318 795 315" stroke="url(#axonG)" stroke-width="16" filter="url(#glow)"/>
<g fill="#6ed3ff" stroke="#bfeeff" stroke-width="3"><rect x="430" y="295" width="65" height="48" rx="22"/><rect x="530" y="295" width="65" height="48" rx="22"/><rect x="630" y="295" width="65" height="48" rx="22"/></g>
<g stroke="#54b4ff" stroke-width="10"><path d="M795 315 C850 275 875 235 910 190"/><path d="M800 315 C865 315 900 315 950 315"/><path d="M795 315 C850 350 885 390 920 445"/></g>
<g fill="#54b4ff"><circle cx="915" cy="185" r="18"/><circle cx="955" cy="315" r="18"/><circle cx="925" cy="450" r="18"/></g>
<g fill="#ffcf66" opacity=".9"><circle cx="948" cy="195" r="7"/><circle cx="965" cy="215" r="6"/><circle cx="973" cy="294" r="7"/><circle cx="978" cy="335" r="6"/><circle cx="950" cy="430" r="7"/><circle cx="965" cy="455" r="6"/></g>
<path d="M985 150 C970 220 970 390 985 485" stroke="#ffcf66" stroke-width="4" stroke-dasharray="8 10" opacity=".5"/>
</g><g font-family="Inter,Arial" font-size="20" fill="#cfd5e3" opacity=".75"><text x="250" y="205">Soma</text><text x="535" y="270">Axon + myelin</text><text x="820" y="520">Terminal buttons → synapse</text></g></svg>`;

const module3={
 id:'module3-neural',title:'Module 3 — Neural Communication',className:'Psychology',subtitle:'Tap the numbered points to see how the message moves through a neuron.',visual:'neuron',updatedAt:new Date().toISOString(),
 facts:[
  {id:'f1',n:1,title:'Dendrites — receive',body:'Dendrites receive chemical messages from other neurons. Neurotransmitters bind to receptors here, starting the next neuron’s response.',x:14,y:43},
  {id:'f2',n:2,title:'Soma — process',body:'The soma, or cell body, contains the nucleus and combines incoming excitatory and inhibitory signals. If enough stimulation builds up, the neuron reaches threshold.',x:30,y:52},
  {id:'f3',n:3,title:'Threshold + action potential',body:'At rest a neuron is about −70 mV. Around −55 mV is threshold. Once threshold is reached, a full action potential fires and travels down the axon.',x:40,y:44},
  {id:'f4',n:4,title:'Axon — electrical travel',body:'The axon carries the electrical action potential away from the soma toward the terminal buttons. This is the “electrical within” part of neural communication.',x:54,y:53},
  {id:'f5',n:5,title:'Myelin — speed',body:'Myelin is fatty insulation made with help from glial cells. It makes neural signals travel faster and more reliably. Multiple sclerosis damages myelin and disrupts communication.',x:61,y:48},
  {id:'f6',n:6,title:'Terminal buttons — release',body:'When the action potential reaches the terminal buttons, vesicles release neurotransmitters into the synapse.',x:84,y:49},
  {id:'f7',n:7,title:'Synapse — chemical between',body:'The synapse is the tiny gap between neurons. Neurotransmitters cross it and bind to receptors on the next neuron. This is the “chemical between” part.',x:95,y:54},
  {id:'f8',n:8,title:'Reuptake vs degradation',body:'After the message is sent, the synapse is cleaned up. Reuptake sends neurotransmitters back into the sending neuron to be reused. Degradation breaks them down with enzymes.',x:90,y:29},
  {id:'f9',n:9,title:'Glia + neural networks',body:'Glial cells support, protect, nourish and insulate neurons. Repeated communication strengthens neural networks: “neurons that fire together, wire together.”',x:22,y:72},
  {id:'f10',n:10,title:'Agonists vs antagonists',body:'Agonists increase or mimic neurotransmitter effects. Antagonists block or reduce them. Narcan is an opioid antagonist because it blocks opioid receptors.',x:75,y:72},
  {id:'f11',n:11,title:'Seven major neurotransmitters',body:'ACh: movement, learning, memory. Serotonin: mood and impulse control. Dopamine: reward, motivation, movement. Norepinephrine: alertness. GABA: inhibitory brake. Glutamate: excitatory gas pedal. Endorphins: pain relief and pleasure.',x:50,y:82}
 ]
};

function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)&&v.length?v:[module3];}catch{return[module3];}}
function save(v){localStorage.setItem(KEY,JSON.stringify(v));}
let infos=load();
if(!infos.some(x=>x.id==='module3-neural')){infos.unshift(module3);save(infos);}
let currentId=infos[0]?.id||null, selectedId=null, editing=false, dragging=null;

function speak(text){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=1;u.pitch=1;speechSynthesis.speak(u);}
function current(){return infos.find(x=>x.id===currentId)||infos[0];}
function classOptions(){return state().classes||[];}
function nav(){const d=document.querySelector('#desktopNav');if(d&&!d.querySelector('[data-infographic-open]')){const wrap=document.createElement('div');wrap.className='desktop-infographic-nav';wrap.innerHTML='<button class="nav-item" data-infographic-open><span class="nav-icon">◈</span>Infographics</button>';d.append(wrap);}if(!document.querySelector('.infographic-launch')){const b=document.createElement('button');b.className='infographic-launch';b.title='Interactive infographics';b.textContent='◈';document.body.append(b);b.onclick=open;}document.querySelectorAll('[data-infographic-open]').forEach(b=>b.onclick=open);}

function open(){speechSynthesis?.cancel?.();document.querySelector('#pageTitle').textContent='Infographics';document.querySelector('#pageEyebrow').textContent='COURSEFLOW';document.querySelector('#view').innerHTML='<div id="infographicPage" class="infographic-page"></div>';render();window.scrollTo({top:0,behavior:'smooth'});}

function render(){const root=document.querySelector('#infographicPage');if(!root)return;const info=current();if(!info){root.innerHTML='<div class="card infographic-empty">No infographics yet.</div>';return;}if(!selectedId||!info.facts.some(f=>f.id===selectedId))selectedId=info.facts[0]?.id||null;const selected=info.facts.find(f=>f.id===selectedId);
root.innerHTML=`<section class="card infographic-hero"><div><div class="eyebrow">INTERACTIVE INFOGRAPHICS</div><h2>${esc(info.title)}</h2><p class="muted">${esc(info.subtitle||'Tap a point to explore it. Use Edit layout to move facts around.')}</p></div><div class="flex gap-8 wrap"><button class="ghost-btn" id="newInfo">+ New</button><button class="ghost-btn" id="addFact">+ Fact</button><button class="primary-btn" id="editInfo">${editing?'Done':'Edit layout'}</button></div></section>
<div class="infographic-layout"><div><section class="card infographic-stage-card"><div class="infographic-stage-toolbar"><div><strong>${esc(info.className||'General')}</strong><div class="subtle">${info.facts.length} interactive facts</div></div><div class="infographic-key"><span>Tap = explain</span><span>${editing?'Drag points to move':'Speak = read aloud'}</span></div></div><div id="infoStage" class="infographic-stage">${info.visual==='neuron'?neuronSvg:''}${info.facts.map(f=>`<button class="info-hotspot ${f.id===selectedId?'active':''} ${editing?'editing':''}" data-fact="${f.id}" style="left:${f.x}%;top:${f.y}%">${f.n||'•'}</button><div class="info-label" style="left:${f.x}%;top:calc(${f.y}% + 19px)">${esc(f.title)}</div>`).join('')}</div><div class="infographic-edit-hint">${editing?'Drag any numbered point. Changes save automatically.':'Tap any numbered point to see the explanation.'}</div></section>
<section class="card mt-16"><div class="card-title-row"><div><div class="card-title">Your infographics</div><div class="subtle">Choose a class visual</div></div></div><div class="infographic-list">${infos.map(i=>`<div class="infographic-item ${i.id===info.id?'active':''}" data-info="${i.id}"><strong>${esc(i.title)}</strong><div class="subtle">${esc(i.className||'General')} • ${i.facts.length} facts</div></div>`).join('')}</div></section></div>
<aside class="card infographic-panel"><div class="eyebrow">SELECTED FACT</div>${selected?`<h2>${esc(selected.title)}</h2><div class="infographic-panel-body">${esc(selected.body).replace(/\n/g,'<br>')}</div><div class="infographic-panel-actions"><button class="primary-btn" id="speakFact">🔊 Speak</button><button class="ghost-btn" id="editFact">Edit text</button>${editing?'<button class="danger-btn" id="deleteFact">Delete</button>':''}</div>`:'<div class="subtle">Tap a fact on the infographic.</div>'}</aside></div>`;
root.querySelector('#editInfo').onclick=()=>{editing=!editing;render();};root.querySelector('#newInfo').onclick=newInfo;root.querySelector('#addFact').onclick=addFact;root.querySelectorAll('[data-info]').forEach(x=>x.onclick=()=>{currentId=x.dataset.info;selectedId=null;editing=false;render();});root.querySelectorAll('[data-fact]').forEach(x=>{x.onclick=()=>{selectedId=x.dataset.fact;render();};if(editing)bindDrag(x);});if(selected){root.querySelector('#speakFact').onclick=()=>speak(`${selected.title}. ${selected.body}`);root.querySelector('#editFact').onclick=()=>editFact(selected);const del=root.querySelector('#deleteFact');if(del)del.onclick=()=>deleteFact(selected);}}

function bindDrag(el){el.onpointerdown=e=>{e.preventDefault();dragging={id:el.dataset.fact,rect:document.querySelector('#infoStage').getBoundingClientRect()};el.setPointerCapture(e.pointerId);};el.onpointermove=e=>{if(!dragging||dragging.id!==el.dataset.fact)return;const info=current(),f=info.facts.find(x=>x.id===dragging.id);f.x=Math.max(3,Math.min(97,((e.clientX-dragging.rect.left)/dragging.rect.width)*100));f.y=Math.max(5,Math.min(95,((e.clientY-dragging.rect.top)/dragging.rect.height)*100));el.style.left=f.x+'%';el.style.top=f.y+'%';};el.onpointerup=()=>{if(!dragging)return;dragging=null;save(infos);render();};}
function addFact(){const info=current();const title=prompt('Fact title?');if(!title)return;const body=prompt('What should this point explain?');if(!body)return;const f={id:uid('fact'),n:info.facts.length+1,title,body,x:50,y:50};info.facts.push(f);info.updatedAt=new Date().toISOString();save(infos);selectedId=f.id;editing=true;render();}
function editFact(f){const title=prompt('Fact title',f.title);if(title===null)return;const body=prompt('Explanation',f.body);if(body===null)return;f.title=title.trim()||f.title;f.body=body.trim()||f.body;current().updatedAt=new Date().toISOString();save(infos);render();}
function deleteFact(f){if(!confirm(`Delete “${f.title}”?`))return;const info=current();info.facts=info.facts.filter(x=>x.id!==f.id);info.facts.forEach((x,i)=>x.n=i+1);selectedId=info.facts[0]?.id||null;save(infos);render();}
function newInfo(){const title=prompt('Infographic title?');if(!title)return;const classes=classOptions();const suggested=classes.find(c=>/psych/i.test(c.name))?.name||classes[0]?.name||'General';const className=prompt('Class name?',suggested)||suggested;const info={id:uid('map'),title,className,subtitle:'Tap a point to explore it.',visual:'neuron',facts:[],updatedAt:new Date().toISOString()};infos.push(info);save(infos);currentId=info.id;selectedId=null;editing=true;render();}

const observer=new MutationObserver(nav);observer.observe(document.body,{childList:true,subtree:true});nav();
