export const uid = (prefix='id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
export const pad = n => String(n).padStart(2,'0');
export const localISODate = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const parseLocalDate = iso => { const [y,m,d] = (iso||'').split('-').map(Number); return y ? new Date(y,m-1,d) : null; };
export const dateKey = d => localISODate(d);
export const escapeHTML = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
export const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
export const daysBetween = (a,b) => Math.round((new Date(b.getFullYear(),b.getMonth(),b.getDate())-new Date(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);
export const formatDate = (iso, opts={month:'short',day:'numeric'}) => { const d=parseLocalDate(iso); return d ? d.toLocaleDateString(undefined,opts) : 'No date'; };
export const formatLongDate = iso => formatDate(iso,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
export const formatTime = t => { if(!t) return ''; const [h,m] = t.split(':').map(Number); return new Date(2000,0,1,h,m).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}); };
export const relativeDue = (iso,time='') => {
  if(!iso) return 'No due date';
  const today=new Date(), d=parseLocalDate(iso), diff=daysBetween(today,d);
  let label = diff===0?'Today':diff===1?'Tomorrow':diff===-1?'Yesterday':diff>1?`In ${diff} days`:`${Math.abs(diff)} days ago`;
  return time ? `${label} • ${formatTime(time)}` : label;
};
export const debounce = (fn,wait=250) => { let t; return (...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),wait);} };
export const downloadJSON = (filename,data) => { const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); };
export const isPastDue = a => {
  if(!a.dueDate || ['completed','submitted','skipped'].includes(a.status)) return false;
  const d=parseLocalDate(a.dueDate); if(a.dueTime){const [h,m]=a.dueTime.split(':').map(Number);d.setHours(h,m,59,999);} else d.setHours(23,59,59,999);
  return Date.now()>d.getTime();
};
export const sortAssignments = (arr,mode='dueSoonest') => [...arr].sort((a,b)=>{
  const da=a.dueDate?`${a.dueDate}T${a.dueTime||'23:59'}`:'9999', db=b.dueDate?`${b.dueDate}T${b.dueTime||'23:59'}`:'9999';
  if(mode==='dueLatest') return db.localeCompare(da);
  if(mode==='pointsHigh') return (b.points||0)-(a.points||0);
  if(mode==='pointsLow') return (a.points||0)-(b.points||0);
  if(mode==='priority') { const p={urgent:4,high:3,normal:2,low:1}; return (p[b.priority]||0)-(p[a.priority]||0)||da.localeCompare(db); }
  if(mode==='recent') return (b.createdAt||'').localeCompare(a.createdAt||'');
  if(mode==='class') return (a.classId||'').localeCompare(b.classId||'')||da.localeCompare(db);
  return da.localeCompare(db);
});