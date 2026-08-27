import { firebaseConfig } from './firebase-config.js';
let app, auth, db, provider, modules;
export const cloudConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

async function ensure(){
  if(modules) return modules;
  const appMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
  const authMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
  const dbMod=await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
  app=appMod.initializeApp(firebaseConfig);
  auth=authMod.getAuth(app);
  db=dbMod.getFirestore(app);
  provider=new authMod.GoogleAuthProvider();
  modules={...authMod,...dbMod};
  return modules;
}

export async function observeAuth(cb){
  if(!cloudConfigured()) return cb(null);
  const m=await ensure();
  return m.onAuthStateChanged(auth,cb);
}

export async function signIn(){
  const m=await ensure();
  return (await m.signInWithPopup(auth,provider)).user;
}

export async function signOutCloud(){
  const m=await ensure();
  await m.signOut(auth);
}

export async function pushCloud(uid,state){
  const m=await ensure();
  const copy=structuredClone(state);
  copy.auth={cloudEnabled:true,lastSync:new Date().toISOString()};
  await m.setDoc(
    m.doc(db,'users',uid),
    {state:copy,updatedAt:m.serverTimestamp()},
    {merge:true}
  );
  return copy.auth.lastSync;
}

export async function pullCloud(uid){
  const m=await ensure();
  const snap=await m.getDoc(m.doc(db,'users',uid));
  return snap.exists()?snap.data().state:null;
}

// Keep every signed-in device up to date while CALSI is open.
export async function watchCloud(uid,cb){
  const m=await ensure();
  return m.onSnapshot(m.doc(db,'users',uid),snap=>{
    if(!snap.exists()) return;
    const data=snap.data();
    if(data?.state) cb(data.state);
  });
}
