import { uid, localISODate } from './utils.js';

const MONTHS={jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12};
function normalizeDate(text){
  let m=text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/); if(m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;
  m=text.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/); if(m){let y=m[3]?Number(m[3]):new Date().getFullYear(); if(y<100)y+=2000; return `${y}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;}
  m=text.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,?\s*(20\d{2}))?/i);
  if(m){let y=Number(m[3]||new Date().getFullYear()); return `${y}-${String(MONTHS[m[1].toLowerCase()]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;}
  return '';
}
function normalizeTime(text){ const m=text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i); if(!m) return ''; let h=Number(m[1]),min=Number(m[2]||0); if(m[3].toLowerCase()==='pm'&&h<12)h+=12;if(m[3].toLowerCase()==='am'&&h===12)h=0;return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; }
function points(text){ const m=text.match(/\b(\d+(?:\.\d+)?)\s*(?:pts?|points?)\b/i); return m?Number(m[1]):null; }
function detectMeaning(text){ const lower=text.toLowerCase(); if(/(?:due|submit|complete by|deadline|by\s+(?:mon|tue|wed|thu|fri|sat|sun))/i.test(lower))return 'due'; if(/assigned|given|posted|released/i.test(lower))return 'assigned'; if(/opens|available/i.test(lower))return 'available'; if(/quiz|test|exam|presentation|event|game|meeting/i.test(lower))return 'event'; return 'uncertain'; }
function inferType(text){ const types=['Homework','Quiz','Test','Project','Essay','Presentation','Lab','Reading','Event']; return types.find(t=>new RegExp(`\\b${t}\\b`,'i').test(text))||'Assignment'; }

export function parseBulk(text,classes,options={detect:true,defaultMeaning:'due'}){
  let currentClass='general'; const rows=[];
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim(); if(!line) continue;
    const classHeader=line.match(/^@?class\s*[:\-]?\s*(.+)$/i) || (!/[|]/.test(line) && !normalizeDate(line) && line.length<60 ? [null,line] : null);
    if(classHeader){ const name=classHeader[1].trim(); const found=classes.find(c=>c.name.toLowerCase()===name.toLowerCase()); if(found){currentClass=found.id;continue;} if(/^@?class/i.test(line)){rows.push({kind:'class-missing',className:name});continue;} }
    const date=normalizeDate(line), time=normalizeTime(line), pts=points(line), meaning=options.detect?detectMeaning(line):options.defaultMeaning;
    let name=line.replace(/\|/g,' ').replace(/\b(?:due|assigned|given|posted|released|opens|available)\b\s*:?/gi,'').replace(/\b\d+(?:\.\d+)?\s*(?:pts?|points?)\b/gi,'').replace(/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?)\b/g,'').replace(/\b(?:\d{1,2})(?::\d{2})?\s*(?:am|pm)\b/gi,'').replace(/\s{2,}/g,' ').replace(/^[-–—:\s]+|[-–—:\s]+$/g,'').trim();
    if(!name) name='Untitled Assignment';
    rows.push({kind:'assignment',item:{id:uid('asg'),name,classId:currentClass,type:inferType(line),dueDate:meaning==='due'||meaning==='uncertain'?date:'',assignedDate:meaning==='assigned'?date:'',eventDate:meaning==='event'?date:'',availableDate:meaning==='available'?date:'',dueTime:meaning==='due'?time:'',points:pts,status:'notStarted',priority:'normal',description:'',notes:'',tags:[],subtasks:[],createdAt:new Date().toISOString()},meaning,warning:meaning==='uncertain'&&date?'Date meaning is uncertain. Review before importing.':!date?'No date detected.':''});
  }
  return rows;
}