import { defaultState } from './state.js';
const KEY='courseflow_state_v1';

export function loadState(){
  const base=defaultState();
  try{
    const raw=localStorage.getItem(KEY); if(!raw) return base;
    const saved=JSON.parse(raw);
    return {
      ...base,...saved,
      settings:{...base.settings,...saved.settings,statusColors:{...base.settings.statusColors,...saved.settings?.statusColors},shortcuts:{...base.settings.shortcuts,...saved.settings?.shortcuts}},
      ui:{...base.ui,...saved.ui,assignmentFilters:{...base.ui.assignmentFilters,...saved.ui?.assignmentFilters}},
      auth:{...base.auth,...saved.auth,user:null}
    };
  }catch(e){console.warn('Could not load state',e);return base;}
}

export function saveState(state){
  const copy=structuredClone(state); copy.auth.user=null; localStorage.setItem(KEY,JSON.stringify(copy));
}

export function resetLocal(){ localStorage.removeItem(KEY); }