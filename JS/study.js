const esc = (value='') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const id = prefix => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const now = () => new Date().toISOString();

function modal(title, body, onSave, saveLabel='Save'){
  const wrap=document.createElement('div');
  wrap.className='modal-backdrop study-modal-backdrop';
  wrap.innerHTML=`<div class="modal wide"><div class="modal-head"><strong>${esc(title)}</strong><button class="icon-btn" data-close>×</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button class="ghost-btn" data-close>Cancel</button><button class="primary-btn" data-save>${esc(saveLabel)}</button></div></div>`;
  document.body.append(wrap);
  const close=()=>wrap.remove();
  wrap.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
  wrap.onclick=e=>{if(e.target===wrap)close();};
  wrap.querySelector('[data-save]').onclick=()=>onSave?.(wrap,close);
  return wrap;
}

function parsePairs(text){
  return text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).filter(x=>!x.startsWith('@class')).map(line=>{
    let parts;
    if(line.includes('|')) parts=line.split('|');
    else if(line.includes('\t')) parts=line.split('\t');
    else if(line.includes('::')) parts=line.split('::');
    else if(line.includes(' - ')) parts=line.split(' - ');
    else return null;
    const term=(parts.shift()||'').trim();
    const definition=parts.join(' | ').trim();
    return term&&definition?{id:id('term'),term,definition,known:false}:null;
  }).filter(Boolean);
}

function getClass(state,classId){return state.classes.find(c=>c.id===classId)||state.classes[0];}

export function renderStudy(root,state,{persist,toast}){
  state.studySets ||= [];
  const activeId=state.ui.studySetId;
  const set=state.studySets.find(s=>s.id===activeId);
  if(set) return renderSet(root,state,set,{persist,toast});

  const cards=state.studySets.map(s=>{const c=getClass(state,s.classId);return `<article class="card study-set-card hover" data-study-open="${s.id}" style="--class-color:${c.color}"><div class="class-topline"></div><div class="study-set-top"><span class="study-class-pill">${esc(c.icon||'📚')} ${esc(c.name)}</span><span class="subtle">${s.terms?.length||0} terms</span></div><h3>${esc(s.title)}</h3><p class="muted">${esc(s.description||'No description')}</p><div class="study-set-actions"><button class="ghost-btn" data-study-flash="${s.id}">Flashcards</button><button class="primary-btn" data-study-quiz="${s.id}">Quiz</button></div></article>`}).join('');
  root.innerHTML=`<section class="study-hero card"><div><div class="eyebrow">STUDY</div><h2>Study sets</h2><p class="muted">Build a set once, then use the same terms as flashcards or a quiz. Every set can be linked to one of your classes.</p></div><div class="study-hero-actions"><button id="studyBulk" class="ghost-btn">Bulk import</button><button id="studyNew" class="primary-btn">+ New study set</button></div></section><div class="study-grid mt-16">${cards||`<div class="card study-empty"><h3>No study sets yet</h3><p class="muted">Create one manually or bulk paste terms and definitions.</p><button id="studyEmptyNew" class="primary-btn">Create your first set</button></div>`}</div>`;

  const open=id=>{state.ui.studySetId=id;state.ui.studyMode='overview';persist();renderStudy(root,state,{persist,toast});};
  root.querySelectorAll('[data-study-open]').forEach(x=>x.onclick=()=>open(x.dataset.studyOpen));
  root.querySelectorAll('[data-study-flash]').forEach(x=>x.onclick=e=>{e.stopPropagation();state.ui.studySetId=x.dataset.studyFlash;state.ui.studyMode='flashcards';persist(false);renderStudy(root,state,{persist,toast});});
  root.querySelectorAll('[data-study-quiz]').forEach(x=>x.onclick=e=>{e.stopPropagation();state.ui.studySetId=x.dataset.studyQuiz;state.ui.studyMode='quiz';persist(false);renderStudy(root,state,{persist,toast});});
  const newBtn=root.querySelector('#studyNew')||root.querySelector('#studyEmptyNew'); if(newBtn)newBtn.onclick=()=>openSetEditor(state,null,{persist,toast,rerender:()=>renderStudy(root,state,{persist,toast})});
  root.querySelector('#studyBulk').onclick=()=>openBulk(state,{persist,toast,rerender:()=>renderStudy(root,state,{persist,toast})});
}

function renderSet(root,state,set,ctx){
  const c=getClass(state,set.classId),mode=state.ui.studyMode||'overview';
  root.innerHTML=`<div class="study-set-header"><button id="studyBack" class="ghost-btn">← All sets</button><div class="study-set-heading"><span class="study-class-pill" style="--class-color:${c.color}">${esc(c.icon||'📚')} ${esc(c.name)}</span><h2>${esc(set.title)}</h2><span class="subtle">${set.terms.length} terms</span></div><button id="studyEdit" class="ghost-btn">Edit set</button></div><div class="segmented study-tabs"><button data-study-mode="overview" class="${mode==='overview'?'active':''}">Terms</button><button data-study-mode="flashcards" class="${mode==='flashcards'?'active':''}">Flashcards</button><button data-study-mode="quiz" class="${mode==='quiz'?'active':''}">Quiz</button></div><div id="studyModeBody" class="mt-16"></div>`;
  root.querySelector('#studyBack').onclick=()=>{state.ui.studySetId=null;state.ui.studyMode='overview';ctx.persist(false);renderStudy(root,state,ctx);};
  root.querySelector('#studyEdit').onclick=()=>openSetEditor(state,set.id,{...ctx,rerender:()=>renderStudy(root,state,ctx)});
  root.querySelectorAll('[data-study-mode]').forEach(b=>b.onclick=()=>{state.ui.studyMode=b.dataset.studyMode;ctx.persist(false);renderStudy(root,state,ctx);});
  const body=root.querySelector('#studyModeBody');
  if(mode==='flashcards') renderFlashcards(body,state,set,ctx);
  else if(mode==='quiz') renderQuiz(body,state,set,ctx);
  else renderTerms(body,set);
}

function renderTerms(root,set){
  root.innerHTML=`<div class="study-term-list">${set.terms.map((t,i)=>`<article class="card study-term-row"><span class="study-term-number">${i+1}</span><div><div class="study-term-label">TERM</div><strong>${esc(t.term)}</strong></div><div><div class="study-term-label">DEFINITION</div><span>${esc(t.definition)}</span></div></article>`).join('')}</div>`;
}

function renderFlashcards(root,state,set,ctx){
  if(!set.terms.length){root.innerHTML='<div class="card">Add some terms first.</div>';return;}
  let index=0,flipped=false,order=[...set.terms];
  const draw=()=>{const t=order[index];root.innerHTML=`<section class="study-session"><div class="study-progress"><span>${index+1} / ${order.length}</span><div class="progress-track"><div class="progress-bar" style="width:${((index+1)/order.length)*100}%"></div></div></div><button id="flashCard" class="flashcard ${flipped?'flipped':''}"><div class="flashcard-face"><div class="study-term-label">${flipped?'DEFINITION':'TERM'}</div><div class="flashcard-text">${esc(flipped?t.definition:t.term)}</div><div class="subtle">Click to flip</div></div></button><div class="flash-controls"><button id="flashPrev" class="ghost-btn">← Previous</button><button id="flashShuffle" class="ghost-btn">Shuffle</button><button id="flashKnown" class="ghost-btn">${t.known?'✓ Known':'Mark known'}</button><button id="flashNext" class="primary-btn">Next →</button></div></section>`;
    root.querySelector('#flashCard').onclick=()=>{flipped=!flipped;draw();};
    root.querySelector('#flashPrev').onclick=()=>{index=(index-1+order.length)%order.length;flipped=false;draw();};
    root.querySelector('#flashNext').onclick=()=>{index=(index+1)%order.length;flipped=false;draw();};
    root.querySelector('#flashShuffle').onclick=()=>{order=order.sort(()=>Math.random()-.5);index=0;flipped=false;draw();};
    root.querySelector('#flashKnown').onclick=()=>{t.known=!t.known;set.updatedAt=now();ctx.persist();draw();};
  };draw();
}

function renderQuiz(root,state,set,ctx){
  if(set.terms.length<2){root.innerHTML='<div class="card">Add at least 2 terms to start a quiz.</div>';return;}
  let questions=shuffle([...set.terms]),index=0,score=0,answered=false;
  const draw=()=>{
    if(index>=questions.length){const pct=Math.round(score/questions.length*100);root.innerHTML=`<section class="card quiz-results"><div class="eyebrow">QUIZ COMPLETE</div><div class="quiz-score">${pct}%</div><h2>${score} of ${questions.length} correct</h2><button id="quizAgain" class="primary-btn">Study again</button></section>`;root.querySelector('#quizAgain').onclick=()=>{questions=shuffle([...set.terms]);index=0;score=0;answered=false;draw();};return;}
    const q=questions[index]; const choices=shuffle([q,...shuffle(set.terms.filter(t=>t.id!==q.id)).slice(0,3)]);
    root.innerHTML=`<section class="study-session"><div class="study-progress"><span>Question ${index+1} of ${questions.length}</span><span>${score} correct</span></div><article class="card quiz-question"><div class="study-term-label">CHOOSE THE DEFINITION</div><h2>${esc(q.term)}</h2></article><div class="quiz-options">${choices.map(ch=>`<button class="quiz-option" data-answer="${ch.id}">${esc(ch.definition)}</button>`).join('')}</div><div id="quizFeedback"></div></section>`;
    root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(answered)return;answered=true;const correct=b.dataset.answer===q.id;if(correct)score++;root.querySelectorAll('[data-answer]').forEach(x=>{if(x.dataset.answer===q.id)x.classList.add('correct');else if(x===b)x.classList.add('wrong');x.disabled=true;});root.querySelector('#quizFeedback').innerHTML=`<div class="quiz-feedback ${correct?'correct-text':'wrong-text'}"><strong>${correct?'Correct':'Not quite'}</strong><span>${correct?'Nice work.':`Correct answer: ${esc(q.definition)}`}</span><button id="quizContinue" class="primary-btn">Continue</button></div>`;root.querySelector('#quizContinue').onclick=()=>{index++;answered=false;draw();};});
  };draw();
}

function shuffle(a){return a.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}

function classOptions(state,selected){return state.classes.map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)}</option>`).join('');}

function openSetEditor(state,setId,{persist,toast,rerender}){
  const existing=state.studySets.find(s=>s.id===setId); const s=existing||{id:id('set'),title:'',description:'',classId:state.classes[0]?.id||'general',terms:[],createdAt:now(),updatedAt:now()};
  const termText=(s.terms||[]).map(t=>`${t.term} | ${t.definition}`).join('\n');
  modal(existing?'Edit study set':'New study set',`<div class="form-grid"><div class="field span-2"><label>Set title</label><input id="studyTitle" class="input" value="${esc(s.title)}" placeholder="Chapter 3 Vocabulary"></div><div class="field"><label>Class</label><select id="studyClass">${classOptions(state,s.classId)}</select></div><div class="field"><label>Description</label><input id="studyDesc" class="input" value="${esc(s.description||'')}" placeholder="Optional"></div><div class="field span-2"><label>Terms — one per line</label><textarea id="studyTerms" style="min-height:260px" placeholder="Neuron | A nerve cell\nSynapse | Gap between neurons">${esc(termText)}</textarea><div class="subtle">Use <strong>Term | Definition</strong>. Tabs, ::, and “ - ” also work.</div></div></div>`,(wrap,close)=>{const title=wrap.querySelector('#studyTitle').value.trim();const terms=parsePairs(wrap.querySelector('#studyTerms').value);if(!title)return toast('Give the study set a title');if(!terms.length)return toast('Add at least one term and definition');const oldKnown=new Map((s.terms||[]).map(t=>[`${t.term}\u0000${t.definition}`,t]));terms.forEach(t=>{const old=oldKnown.get(`${t.term}\u0000${t.definition}`);if(old){t.id=old.id;t.known=old.known;}});const next={...s,title,classId:wrap.querySelector('#studyClass').value,description:wrap.querySelector('#studyDesc').value.trim(),terms,updatedAt:now()};if(existing)state.studySets=state.studySets.map(x=>x.id===setId?next:x);else state.studySets.push(next);persist();close();rerender();toast(existing?'Study set updated':'Study set created');});
}

function openBulk(state,{persist,toast,rerender}){
  modal('Bulk import study set',`<div class="form-grid"><div class="field"><label>Set title</label><input id="bulkStudyTitle" class="input" placeholder="Psychology Module 1"></div><div class="field"><label>Class</label><select id="bulkStudyClass">${classOptions(state,state.classes[0]?.id)}</select></div><div class="field span-2"><label>Paste terms</label><textarea id="bulkStudyTerms" style="min-height:300px" placeholder="Psychology | Study of behavior and mental processes\nNeuron | A nerve cell\nSynapse | Gap between neurons"></textarea><div class="subtle">Accepted separators: <strong>|</strong>, tab, <strong>::</strong>, or <strong> - </strong>.</div></div></div>`,(wrap,close)=>{const title=wrap.querySelector('#bulkStudyTitle').value.trim();const terms=parsePairs(wrap.querySelector('#bulkStudyTerms').value);if(!title)return toast('Give the study set a title');if(!terms.length)return toast('I could not find any term/definition pairs');state.studySets.push({id:id('set'),title,classId:wrap.querySelector('#bulkStudyClass').value,description:'',terms,createdAt:now(),updatedAt:now()});persist();close();rerender();toast(`${terms.length} terms imported`);},'Import set');
}
