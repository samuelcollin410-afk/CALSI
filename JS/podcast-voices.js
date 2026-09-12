const SETTINGS_KEY='calsi_podcast_settings_v1';
const PREVIEW_TEXT='Hi, this is a preview of your CALSI podcast voice. Use this voice if it sounds good for studying.';

function readSettings(){
  try{return {rate:1,pitch:1,voice:'',...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')}}catch{return {rate:1,pitch:1,voice:''}}
}
function writeSettings(next){localStorage.setItem(SETTINGS_KEY,JSON.stringify(next));}
function voiceKey(v){return `${v.name}|||${v.lang}`;}
function findVoice(value){
  const voices=speechSynthesis.getVoices();
  return voices.find(v=>voiceKey(v)===value)||voices.find(v=>v.name===value)||null;
}
function englishFirst(voices){
  return [...voices].sort((a,b)=>{
    const ae=/^en(-|_)/i.test(a.lang)?0:1,be=/^en(-|_)/i.test(b.lang)?0:1;
    if(ae!==be)return ae-be;
    if(a.default!==b.default)return a.default?-1:1;
    return `${a.lang} ${a.name}`.localeCompare(`${b.lang} ${b.name}`);
  });
}
function refreshVoiceSelect(select){
  if(!select)return;
  const settings=readSettings();
  const current=select.value||settings.voice;
  const voices=englishFirst(speechSynthesis.getVoices());
  if(!voices.length){select.innerHTML='<option value="">Loading voices…</option>';return;}
  select.innerHTML=voices.map(v=>{
    const key=voiceKey(v);
    const selected=(current===key||current===v.name||settings.voice===v.name)?' selected':'';
    const label=`${v.name} — ${v.lang}${v.default?' • Default':''}`;
    return `<option value="${key.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"${selected}>${label.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`;
  }).join('');
  const chosen=findVoice(select.value);
  if(chosen){
    select.dataset.voiceName=chosen.name;
    const s=readSettings();
    if(s.voice!==chosen.name)writeSettings({...s,voice:chosen.name});
  }
}
function preview(select,button){
  const voice=findVoice(select.value)||speechSynthesis.getVoices().find(v=>v.name===readSettings().voice);
  if(!voice)return;
  speechSynthesis.cancel();
  const s=readSettings();
  const u=new SpeechSynthesisUtterance(PREVIEW_TEXT);
  u.voice=voice;u.lang=voice.lang;u.rate=Number(s.rate)||1;u.pitch=Number(s.pitch)||1;
  button.textContent='■ Stop preview';
  u.onend=u.onerror=()=>{button.textContent='▶ Preview voice';};
  speechSynthesis.speak(u);
}
function enhance(){
  const select=document.querySelector('#podVoice');
  if(!select)return;
  if(select.dataset.enhanced!=='1'){
    select.dataset.enhanced='1';
    refreshVoiceSelect(select);
    select.addEventListener('change',()=>{
      const voice=findVoice(select.value);
      if(!voice)return;
      const s=readSettings();writeSettings({...s,voice:voice.name});
    });
  }
  if(!document.querySelector('#previewPodVoice')){
    const btn=document.createElement('button');
    btn.id='previewPodVoice';btn.type='button';btn.className='ghost-btn';btn.textContent='▶ Preview voice';
    btn.style.marginTop='8px';btn.style.width='100%';
    select.closest('label')?.append(btn);
    btn.onclick=()=>{if(speechSynthesis.speaking){speechSynthesis.cancel();btn.textContent='▶ Preview voice';}else preview(select,btn);};
  }
  if(!document.querySelector('#voiceHint')){
    const hint=document.createElement('div');hint.id='voiceHint';hint.className='subtle';
    hint.style.marginTop='6px';hint.textContent='Voices come from this device. Try the English voices and preview them before listening.';
    select.closest('label')?.append(hint);
  }
}

const observer=new MutationObserver(()=>enhance());
observer.observe(document.documentElement,{childList:true,subtree:true});
if('speechSynthesis' in window){
  speechSynthesis.addEventListener?.('voiceschanged',()=>{const s=document.querySelector('#podVoice');if(s){s.dataset.enhanced='';enhance();}});
  setTimeout(enhance,0);setTimeout(enhance,500);setTimeout(enhance,1500);
}
