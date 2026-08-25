const KEY='courseflow_state_v1';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};

function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function klass(state,id){return (state.classes||[]).find(c=>c.id===id)}
function scheduleOnly(state,a){return !!klass(state,a.classId)?.scheduleOnly}
function pastSchedule(state,a){return scheduleOnly(state,a)&&a.dueDate&&a.dueDate<today()}
function visibleActive(state){return (state.assignments||[]).filter(a=>!['completed','skipped'].includes(a.status)&&!pastSchedule(state,a))}
function trueDue(state){return visibleActive(state).filter(a=>!scheduleOnly(state,a))}
function dueSort(a,b){return `${a.dueDate||'9999-99-99'}T${a.dueTime||'23:59'}`.localeCompare(`${b.dueDate||'9999-99-99'}T${b.dueTime||'23:59'}`)}
function daysFromNow(iso){if(!iso)return 9999;const [y,m,d]=iso.split('-').map(Number);const x=new Date(y,m-1,d),n=new Date();n.setHours(0,0,0,0);return Math.round((x-n)/86400000)}
function relative(a){const n=daysFromNow(a.dueDate);if(n===0)return 'Today';if(n===1)return 'Tomorrow';if(n>1)return `In ${n} days`;return `${Math.abs(n)} day${Math.abs(n)===1?'':'s'} ago`}
function workload(items){const points=items.reduce((s,a)=>s+(Number(a.points)||0),0),score=items.length+Math.min(points/40,4);return score>=6?['Heavy','🔴']:score>=3?['Moderate','🟡']:items.length?['Light','🟢']:['Clear','⚪']}

function assignmentByElement(state,el){const id=el.dataset.openAssignment;return id?(state.assignments||[]).find(a=>a.id===id):null}

function patchAssignmentElements(state){
  $$('[data-open-assignment]').forEach(el=>{
    const a=assignmentByElement(state,el);if(!a)return;
    if(pastSchedule(state,a)){el.style.display='none';return}
    el.style.display='';
    if(!scheduleOnly(state,a))return;
    el.dataset.scheduleOnly='true';
    if(el.classList.contains('assignment-card')){
      const meta=el.querySelector('.assignment-meta');
      if(meta){const spans=[...meta.querySelectorAll('span')];if(spans[1])spans[1].textContent=a.dueDate?`Scheduled ${new Date(a.dueDate+'T12:00:00').toLocaleDateString([],{month:'short',day:'numeric'})}`:'Scheduled';if(spans.length)spans[spans.length-1].textContent='Scheduled'}
      const badge=el.querySelector('.priority-badge');if(badge)badge.textContent='schedule';
      const dot=el.querySelector('.status-dot');if(dot)dot.style.setProperty('--status-color',klass(state,a.classId)?.color||'#7c5cff');
    }
  });
}

function patchHome(state){
  const due=trueDue(state),active=visibleActive(state),next=[...due].filter(a=>a.dueDate).sort(dueSort)[0];
  const week=due.filter(a=>{const n=daysFromNow(a.dueDate);return n>=0&&n<=6});
  const overdue=due.filter(a=>a.dueDate&&daysFromNow(a.dueDate)<0).length;
  const hero=$('.hero');
  if(hero){const p=hero.querySelector('p');if(p)p.innerHTML=next?`Your next deadline is <strong>${escapeHtml(next.name)}</strong> ${escapeHtml(relative(next).toLowerCase())}.`:'You are clear — no upcoming deadlines are saved.';const pills=[...hero.querySelectorAll('.hero-meta .pill')];if(pills[0])pills[0].innerHTML=`<strong>${week.length}</strong> due this week`;if(pills[2]){if(next?.points!=null)pills[2].innerHTML=`<strong>${next.points}</strong> pts next`;else pills[2].remove()}}
  $$('.stat').forEach(card=>{const label=card.querySelector('.stat-label')?.textContent||'',value=card.querySelector('.stat-value');if(!value)return;if(label.includes('Due in next 7 days'))value.textContent=week.length;if(label==='Overdue')value.textContent=overdue;if(label.includes('Until next deadline')&&next){const n=Math.max(0,daysFromNow(next.dueDate));value.textContent=n?`${n}d`:'<24h'}});
  const workloadCard=[...$$('.card')].find(c=>c.querySelector('.card-title')?.textContent==='Workload');
  if(workloadCard){[...workloadCard.querySelectorAll('.switch-row')].forEach((row,i)=>{const d=new Date();d.setDate(d.getDate()+i);const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,items=due.filter(a=>a.dueDate===iso),[label,icon]=workload(items);const sub=row.querySelector('.subtle');if(sub)sub.textContent=`${d.toLocaleDateString([],{month:'short',day:'numeric'})} • ${items.length} assignment${items.length===1?'':'s'}`;const right=row.lastElementChild;if(right)right.textContent=`${icon} ${label}`})}
  const pointsCard=[...$$('.card')].find(c=>c.querySelector('.card-title')?.textContent==='Points by class');
  if(pointsCard){[...pointsCard.querySelectorAll('.card.soft')].forEach(card=>{const name=card.querySelector('strong')?.textContent?.replace(/^\S+\s+/,'').trim()||card.querySelector('strong')?.textContent?.trim();const c=(state.classes||[]).find(x=>name?.includes(x.name));if(c?.scheduleOnly){const sub=card.querySelector('.subtle.mt-8');if(sub)sub.textContent='Schedule-only • not counted in deadline points';const pct=card.querySelector('.flex .subtle');if(pct)pct.textContent='—';const bar=card.querySelector('.progress-bar');if(bar)bar.style.width='0%'}})}
}

function patchClassCards(state){$$('[data-class]').forEach(el=>{const c=klass(state,el.dataset.class);if(!c?.scheduleOnly)return;if(!el.querySelector('.schedule-only-note')){const info=el.querySelector('.class-info');if(info){const s=document.createElement('span');s.className='schedule-only-note';s.textContent='◷ Schedule-only dates';info.appendChild(s)}}})}

function patchClassModal(state){
  const modal=$('.modal');if(!modal)return;const title=modal.querySelector('.modal-head strong')?.textContent;if(!['Edit class','Add class'].includes(title))return;
  const form=modal.querySelector('.form-grid'),nameInput=$('#cName');if(!form||!nameInput)return;
  if(!$('#cScheduleOnly')){
    const existing=(state.classes||[]).find(c=>c.name===nameInput.value.trim());
    const wrap=document.createElement('div');wrap.className='field span-2';wrap.innerHTML=`<div class="switch-row"><div><strong>Schedule-only class</strong><div class="subtle mt-8">Dates still show around CALSI, but they do not count as deadlines, never become overdue, and automatically disappear after the date passes.</div></div><div id="cScheduleOnly" class="switch ${existing?.scheduleOnly?'on':''}"></div></div>`;form.appendChild(wrap);$('#cScheduleOnly').onclick=e=>e.currentTarget.classList.toggle('on')
  }
  const saveBtn=$('#modalSave');if(saveBtn&&!saveBtn.dataset.scheduleBound){saveBtn.dataset.scheduleBound='1';saveBtn.addEventListener('click',()=>{const enabled=$('#cScheduleOnly')?.classList.contains('on')||false,newName=$('#cName')?.value.trim();setTimeout(()=>{const fresh=load(),c=(fresh.classes||[]).find(x=>x.name===newName);if(c){c.scheduleOnly=enabled;save(fresh);location.reload()}},30)})}
}

function patchDrawer(state){const drawer=$('.drawer');if(!drawer)return;const title=drawer.querySelector('h2')?.textContent;if(!title)return;const a=(state.assignments||[]).find(x=>x.name===title&&!pastSchedule(state,x));if(!a||!scheduleOnly(state,a))return;const status=[...drawer.querySelectorAll('.pill')].find(x=>/Not Started|Working On|Almost Finished|Submitted|Overdue|Skipped/.test(x.textContent));if(status)status.innerHTML=`<span class="status-dot" style="--status-color:${klass(state,a.classId)?.color||'#7c5cff'}"></span>Scheduled`;[...drawer.querySelectorAll('strong')].forEach(x=>{if(x.textContent==='Due')x.textContent='Scheduled'})}

function patchDayCount(){const drawer=$('.drawer');if(!drawer||!drawer.querySelector('.eyebrow')?.textContent.includes('DAY VIEW'))return;const sub=drawer.querySelector('.subtle');if(sub){const visible=[...drawer.querySelectorAll('.assignment-card')].filter(x=>x.style.display!=='none').length;sub.textContent=`${visible} item${visible===1?'':'s'} scheduled for this day`}}

function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

let queued=false;
function enhance(){queued=false;const state=load();if(!state.classes)return;patchAssignmentElements(state);patchHome(state);patchClassCards(state);patchClassModal(state);patchDrawer(state);patchDayCount()}
function queue(){if(queued)return;queued=true;requestAnimationFrame(enhance)}
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',queue);queue();
