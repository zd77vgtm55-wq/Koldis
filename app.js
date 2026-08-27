
/* KOLDIS 0.9.0 — Supabase accounts integration
   Original KOLDIS recipe/planner UI preserved.
   Supabase client is initialized by index.html.
*/
'use strict';

const KOLDIS_AUTH = {
  client: window.koldisSupabase || null,
  user: null,
  ready: false
};

let currentUser = null;
let authMode = 'none'; // 'user' | 'guest' | 'none'
let passwordRecoveryMode = false;
let lastActivityWrite = 0;
const AUTH_ACTIVITY_KEY = 'koldis-auth-activity-v1';
const AUTH_REMEMBER_KEY = 'koldis-auth-remember-v1';
const GUEST_SESSION_KEY = 'koldis-guest-session-v1';
const AUTH_IDLE_MS = 60 * 60 * 1000;

function getRememberChoice(){
  try { return localStorage.getItem(AUTH_REMEMBER_KEY) !== '0'; } catch { return true; }
}
function setRememberChoice(value){
  try { localStorage.setItem(AUTH_REMEMBER_KEY, value ? '1' : '0'); } catch {}
}
function markAuthActivity(force=false){
  if(!currentUser && authMode!=='guest') return;
  const now=Date.now();
  if(!force && now-lastActivityWrite<15000) return;
  lastActivityWrite=now;
  try {
    localStorage.setItem(AUTH_ACTIVITY_KEY, String(now));
    if(authMode==='guest') localStorage.setItem(GUEST_SESSION_KEY, String(now));
  } catch {}
}
function authWasIdleTooLong(){
  try {
    const raw=localStorage.getItem(AUTH_ACTIVITY_KEY);
    const last=Number(raw||0);
    return last>0 && Date.now()-last>AUTH_IDLE_MS;
  } catch { return false; }
}
function clearGuestSession(){
  try { localStorage.removeItem(GUEST_SESSION_KEY); } catch {}
}
function startGuestSession(){
  currentUser=null;
  KOLDIS_AUTH.user=null;
  authMode='guest';
  state.onboardingDone=true;
  state.page='home';
  try {
    const now=Date.now();
    localStorage.setItem(AUTH_ACTIVITY_KEY,String(now));
    localStorage.setItem(GUEST_SESSION_KEY,String(now));
  } catch {}
  saveLocalOnly();
  render();
}
function hasValidGuestSession(){
  try {
    const last=Number(localStorage.getItem(GUEST_SESSION_KEY)||0);
    if(!last || Date.now()-last>AUTH_IDLE_MS) return false;
    return true;
  } catch { return false; }
}

['click','touchstart','keydown','scroll'].forEach(evt=>{
  window.addEventListener(evt,()=>markAuthActivity(),{passive:true});
});

function authConfigured(){
  return !!(KOLDIS_AUTH.client &&
    typeof KOLDIS_AUTH.client.auth?.getSession === 'function');
}

function isPasswordRecoveryUrl(){
  try{
    const hash=new URLSearchParams((window.location.hash||'').replace(/^#/,''));
    const query=new URLSearchParams(window.location.search||'');
    return hash.get('type')==='recovery' || query.get('type')==='recovery';
  }catch{return false}
}

function clearPasswordRecoveryUrl(){
  try{
    const clean=window.location.origin+window.location.pathname+(window.location.search||'');
    window.history.replaceState({},document.title,clean);
  }catch{}
}

function showPasswordReset(message=''){
  const app=document.getElementById('app');
  if(!app) return;
  passwordRecoveryMode=true;
  app.innerHTML=`
    <main class="auth-page">
      <section class="auth-card">
        <div class="onboarding-mark">🔐</div>
        <div class="eyebrow">KOLDIS</div>
        <h1>Neues<br><em>Passwort.</em></h1>
        <p class="lead">Lege jetzt ein neues Passwort für dein KOLDIS-Konto fest.</p>
        ${message ? `<div class="auth-message ${message.startsWith('Passwort erfolgreich')?'auth-success':''}">${esc(message)}</div>` : ''}
        <form id="resetForm" class="auth-form">
          <label>Neues Passwort<input id="newPassword" type="password" autocomplete="new-password" placeholder="Mindestens 6 Zeichen" minlength="6" required></label>
          <label>Passwort wiederholen<input id="newPasswordConfirm" type="password" autocomplete="new-password" placeholder="Passwort erneut eingeben" minlength="6" required></label>
          <button class="primary full" id="resetSubmit" type="submit">Passwort ändern</button>
        </form>
        <button class="secondary full" id="resetBack" type="button">← Zur Anmeldung</button>
        <p class="onboarding-note">Dein neues Passwort wird sicher bei KOLDIS gespeichert.</p>
      </section>
    </main>`;

  const form=app.querySelector('#resetForm');
  const submit=app.querySelector('#resetSubmit');
  form.onsubmit=async(e)=>{
    e.preventDefault();
    if(!authConfigured()){showPasswordReset('Supabase ist noch nicht verbunden.');return}
    const password=app.querySelector('#newPassword').value;
    const confirm=app.querySelector('#newPasswordConfirm').value;
    if(password.length<6){showPasswordReset('Das Passwort muss mindestens 6 Zeichen haben.');return}
    if(password!==confirm){showPasswordReset('Die Passwörter stimmen nicht überein.');return}
    submit.disabled=true;
    submit.textContent='Wird gespeichert …';
    try{
      const {data,error}=await KOLDIS_AUTH.client.auth.updateUser({password});
      if(error) throw error;
      passwordRecoveryMode=false;
      currentUser=data?.user||currentUser;
      KOLDIS_AUTH.user=currentUser;
      clearPasswordRecoveryUrl();
      await loadCloudProfile(currentUser);
      state.page='home';
      if(!state.onboardingDone) onboarding(); else render();
    }catch(err){
      console.error('KOLDIS Passwort-Reset:',err);
      submit.disabled=false;
      submit.textContent='Passwort ändern';
      showPasswordReset(authError(err));
    }
  };
  app.querySelector('#resetBack').onclick=()=>{
    passwordRecoveryMode=false;
    clearPasswordRecoveryUrl();
    showAuth();
  };
}

function showAuth(message=''){
  const app=document.getElementById('app');
  if(!app) return;
  app.innerHTML=`
    <main class="auth-page">
      <section class="auth-card">
        <div class="onboarding-mark">🥗</div>
        <div class="eyebrow">KOLDIS</div>
        <h1>Dein Essen.<br><em>Dein Plan.</em></h1>
        <p class="lead">Melde dich an oder erstelle kostenlos dein KOLDIS-Konto.</p>
        ${message ? `<div class="auth-message">${esc(message)}</div>` : ''}
        <div class="auth-tabs">
          <button class="auth-tab active" id="showLogin">Anmelden</button>
          <button class="auth-tab" id="showSignup">Konto erstellen</button>
        </div>
        <form id="authForm" class="auth-form">
          <label>E-Mail<input id="authEmail" type="email" autocomplete="email" placeholder="deine@email.de" required></label>
          <label>Passwort<input id="authPassword" type="password" autocomplete="current-password" placeholder="Mindestens 6 Zeichen" minlength="6" required></label>
          <label class="remember-row"><input id="rememberMe" type="checkbox" ${getRememberChoice()?'checked':''}> <span>Angemeldet bleiben</span></label>
          <button class="primary full" id="authSubmit" type="submit">Anmelden</button>
        </form>
        <button class="link auth-reset" id="forgotPassword">Passwort vergessen?</button>
        <button class="guest-link" id="continueGuest" type="button">Ohne Konto fortfahren →</button>
        <p class="onboarding-note">Mit Konto werden deine Daten gespeichert und synchronisiert.</p>
      </section>
    </main>`;
  let mode='login';
  const form=app.querySelector('#authForm');
  const submit=app.querySelector('#authSubmit');
  const loginTab=app.querySelector('#showLogin');
  const signupTab=app.querySelector('#showSignup');
  const setMode=(next)=>{
    mode=next;
    loginTab.classList.toggle('active',mode==='login');
    signupTab.classList.toggle('active',mode==='signup');
    submit.textContent=mode==='login'?'Anmelden':'Konto erstellen';
  };
  loginTab.onclick=()=>setMode('login');
  signupTab.onclick=()=>setMode('signup');
  form.onsubmit=async(e)=>{
    e.preventDefault();
    if(!authConfigured()){ showAuth('Supabase ist noch nicht verbunden. Bitte prüfe URL und Publishable Key in index.html.'); return; }
    const email=app.querySelector('#authEmail').value.trim();
    const password=app.querySelector('#authPassword').value;
    setRememberChoice(!!app.querySelector('#rememberMe')?.checked);
    submit.disabled=true;
    submit.textContent='Bitte warten …';
    try{
      let result;
      if(mode==='signup'){
        result=await KOLDIS_AUTH.client.auth.signUp({
          email,password,
          options:{emailRedirectTo:window.location.origin+window.location.pathname}
        });
        if(result.error) throw result.error;
        if(result.data.session){
          await finishLogin(result.data.user);
        }else{
          showAuth('Konto erstellt. Bitte bestätige zuerst deine E-Mail-Adresse. Danach kannst du dich anmelden.');
        }
      }else{
        result=await KOLDIS_AUTH.client.auth.signInWithPassword({email,password});
        if(result.error) throw result.error;
        await finishLogin(result.data.user);
      }
    }catch(err){
      console.error('KOLDIS Auth:',err);
      showAuth(authError(err));
    }finally{
      submit.disabled=false;
    }
  };
  app.querySelector('#forgotPassword').onclick=async()=>{
    if(!authConfigured()){showAuth('Supabase ist noch nicht verbunden.');return}
    const email=app.querySelector('#authEmail').value.trim();
    if(!email){showAuth('Bitte zuerst deine E-Mail-Adresse eingeben.');return}
    try{
      const {error}=await KOLDIS_AUTH.client.auth.resetPasswordForEmail(email,{
        redirectTo:window.location.origin+window.location.pathname
      });
      if(error) throw error;
      showAuth('Wenn die Adresse bei KOLDIS registriert ist, wurde eine E-Mail zum Zurücksetzen des Passworts verschickt.');
    }catch(err){showAuth(authError(err))}
  };
  app.querySelector('#continueGuest').onclick=()=>startGuestSession();
}

function authError(err){
  const m=String(err?.message||err||'');
  if(/invalid login credentials/i.test(m)) return 'E-Mail oder Passwort ist nicht korrekt.';
  if(/email not confirmed/i.test(m)) return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if(/password.*(6|characters)/i.test(m)) return 'Das Passwort muss mindestens 6 Zeichen haben.';
  if(/user already registered/i.test(m)) return 'Für diese E-Mail existiert bereits ein Konto. Melde dich an.';
  return m || 'Die Anmeldung konnte nicht abgeschlossen werden.';
}

async function loadCloudProfile(user){
  if(!user || !authConfigured()) return;
  try{
    const {data,error}=await KOLDIS_AUTH.client
      .from('profiles')
      .select('*')
      .eq('id',user.id)
      .maybeSingle();
    if(error) throw error;
    if(data){
      if(typeof data.budget==='number') state.budget=data.budget;
      if(typeof data.market==='string' && data.market) state.store=data.market;
      if(typeof data.goal==='string' && data.goal) state.goals=[data.goal];
      if(typeof data.cooking_method==='string' && data.cooking_method) state.method=data.cooking_method;
      if(Number.isInteger(data.standard_portions) && data.standard_portions>0) state.portionDefault=data.standard_portions;
      if(Array.isArray(data.likes)) state.likes=data.likes;
      if(Array.isArray(data.dislikes)) state.dislikes=data.dislikes;
      if(typeof data.onboarding_completed==='boolean') state.onboardingDone=data.onboarding_completed;
      saveLocalOnly();
    }
  }catch(err){
    console.warn('KOLDIS Profil konnte nicht geladen werden:',err);
  }
}

let profileSyncTimer=null;
function queueProfileSync(){
  if(!currentUser || !authConfigured()) return;
  clearTimeout(profileSyncTimer);
  profileSyncTimer=setTimeout(syncProfile,500);
}

async function syncProfile(){
  if(!currentUser || !authConfigured()) return;
  try{
    const goals=Array.isArray(state.goals)?state.goals:[];
    const {error}=await KOLDIS_AUTH.client.from('profiles').upsert({
      id:currentUser.id,
      budget:Number(state.budget)||60,
      market:state.store||null,
      goal:goals[0]||null,
      cooking_method:state.method||'Egal',
      standard_portions:Number(state.portionDefault)||4,
      likes:Array.isArray(state.likes)?state.likes:[],
      dislikes:Array.isArray(state.dislikes)?state.dislikes:[],
      onboarding_completed:!!state.onboardingDone,
      updated_at:new Date().toISOString()
    },{onConflict:'id'});
    if(error) throw error;
  }catch(err){
    console.warn('KOLDIS Profil konnte nicht gespeichert werden:',err);
  }
}

async function finishLogin(user){
  currentUser=user||null;
  KOLDIS_AUTH.user=currentUser;
  authMode='user';
  clearGuestSession();
  markAuthActivity(true);
  await loadCloudProfile(currentUser);
  state.page='home';
  if(!state.onboardingDone) onboarding(); else render();
}

async function logoutKoldis(){
  if(authMode==='guest') {
    currentUser=null;
    KOLDIS_AUTH.user=null;
    authMode='none';
    clearGuestSession();
    try { localStorage.removeItem(AUTH_ACTIVITY_KEY); } catch {}
    showAuth('Du nutzt KOLDIS jetzt als Gast.');
    return;
  }
  if(!authConfigured()) return;
  const {error}=await KOLDIS_AUTH.client.auth.signOut();
  if(error) console.warn(error);
  currentUser=null;
  KOLDIS_AUTH.user=null;
  authMode='none';
  try { localStorage.removeItem(AUTH_ACTIVITY_KEY); } catch {}
  clearGuestSession();
  showAuth('Du wurdest abgemeldet.');
}

async function bootAuth(){
  if(!authConfigured()){
    if(hasValidGuestSession()){
      authMode='guest';
      state.onboardingDone=true;
      state.page=state.page||'home';
      markAuthActivity(true);
      render();
    }else{
      showAuth('Anmeldung ist gerade nicht verfügbar. Du kannst KOLDIS trotzdem ohne Konto nutzen.');
    }
    return;
  }

  const recoveryRequested=isPasswordRecoveryUrl();
  const {data,error}=await KOLDIS_AUTH.client.auth.getSession();
  if(error){console.error(error);showAuth('Die Anmeldung konnte nicht geladen werden.');return;}

  currentUser=data?.session?.user||null;
  KOLDIS_AUTH.user=currentUser;

  if(recoveryRequested){
    if(currentUser){
      authMode='user';
      KOLDIS_AUTH.ready=true;
      showPasswordReset();
    }else{
      showPasswordReset('Der Passwort-Link ist abgelaufen oder nicht mehr gültig. Bitte fordere einen neuen Link an.');
    }
  }

  // Nicht dauerhaft angemeldet: nach 60 Minuten ohne Aktivität ausloggen.
  if(currentUser && !getRememberChoice() && authWasIdleTooLong()){
    try { await KOLDIS_AUTH.client.auth.signOut(); } catch(e) { console.warn(e); }
    currentUser=null;
    KOLDIS_AUTH.user=null;
    authMode='none';
    try { localStorage.removeItem(AUTH_ACTIVITY_KEY); } catch {}
    showAuth('Deine Anmeldung ist wegen Inaktivität abgelaufen.');
    return;
  }

  if(currentUser){
    authMode='user';
    markAuthActivity(true);
    await loadCloudProfile(currentUser);
    KOLDIS_AUTH.ready=true;
    if(!recoveryRequested){
      if(!state.onboardingDone) onboarding(); else render();
    }
  }else if(hasValidGuestSession() && !recoveryRequested){
    authMode='guest';
    state.onboardingDone=true;
    markAuthActivity(true);
    KOLDIS_AUTH.ready=true;
    render();
  }else{
    authMode='none';
    KOLDIS_AUTH.ready=true;
    if(!recoveryRequested) showAuth();
  }

  KOLDIS_AUTH.client.auth.onAuthStateChange(async(event,session)=>{
    if(event==='PASSWORD_RECOVERY'){
      currentUser=session?.user||currentUser;
      KOLDIS_AUTH.user=currentUser;
      authMode='user';
      KOLDIS_AUTH.ready=true;
      showPasswordReset();
      return;
    }
    if(passwordRecoveryMode && event==='SIGNED_IN' && session?.user){
      currentUser=session.user;
      KOLDIS_AUTH.user=currentUser;
      authMode='user';
      KOLDIS_AUTH.ready=true;
      showPasswordReset();
      return;
    }
    if(event==='SIGNED_IN' && session?.user){
      currentUser=session.user;
      KOLDIS_AUTH.user=currentUser;
      authMode='user';
      clearGuestSession();
      markAuthActivity(true);
      await loadCloudProfile(currentUser);
      if(!state.onboardingDone) onboarding(); else render();
    }
    if(event==='SIGNED_OUT'){
      currentUser=null;
      KOLDIS_AUTH.user=null;
      authMode='none';
      try { localStorage.removeItem(AUTH_ACTIVITY_KEY); } catch {}
      clearGuestSession();
      showAuth();
    }
  });
}

const RECIPES=[{"id":1,"e":"🍗","name":"Chicken-Reis-Pfanne","kcal":620,"p":52,"carbs":68,"fat":14,"price":3.2,"method":"Pfanne","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","150 g Paprika","150 g Brokkoli"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. 150 g Paprika, 150 g Brokkoli waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":2,"e":"🌯","name":"Protein-Burrito","kcal":640,"p":49,"carbs":72,"fat":16,"price":3.4,"method":"Pfanne","tags":["High Protein","Günstig"],"ingredients":["150 g Rinderhack","1 Tortilla","100 g Kidneybohnen","50 g Mais"],"prep":["1 Tortilla nach Packungsangabe bzw. die Beilage vorbereiten.","150 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. 100 g Kidneybohnen, 50 g Mais waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":3,"e":"🥙","name":"Chicken-Bowl","kcal":570,"p":55,"carbs":58,"fat":11,"price":3.1,"method":"Mikrowelle","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","125 g Reis","150 g Gemüse"],"prep":["Alle Zutaten klein schneiden und in eine mikrowellengeeignete Schüssel geben.","200 g Hähnchen gleichmäßig verteilen und würzen.","Abgedeckt in 2–3-Minuten-Intervallen erhitzen und zwischendurch umrühren, bis alles gleichmäßig heiß und die Hauptzutat vollständig durchgegart ist.","Kurz ruhen lassen, abschmecken und servieren."]},{"id":4,"e":"🍕","name":"Protein-Pizza","kcal":590,"p":47,"carbs":54,"fat":18,"price":3.8,"method":"Ofen","tags":["High Protein"],"ingredients":["Protein-Wrap","100 g Hähnchen","50 g Light-Käse","Tomatensauce"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","Protein-Wrap mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Tomatensauce waschen/schneiden.","Protein-Wrap vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":5,"e":"🥔","name":"Hack-Kartoffel-Pfanne","kcal":680,"p":54,"carbs":62,"fat":21,"price":3.6,"method":"Pfanne","tags":["High Protein","Günstig"],"ingredients":["200 g Rinderhack","300 g Kartoffeln","150 g Paprika","1 Zwiebel"],"prep":["300 g Kartoffeln nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. 150 g Paprika, 1 Zwiebel waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":6,"e":"🍝","name":"Protein-Pasta","kcal":610,"p":50,"carbs":67,"fat":15,"price":3.3,"method":"Topf","tags":["High Protein"],"ingredients":["100 g Protein-Pasta","150 g Hähnchen","Tomatensauce","Zucchini"],"prep":["100 g Protein-Pasta nach Packungsangabe vorbereiten.","100 g Protein-Pasta in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Zucchini waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":7,"e":"🥗","name":"Chicken-Salat","kcal":430,"p":48,"carbs":22,"fat":15,"price":3,"method":"Egal","tags":["High Protein","Low Calorie","Günstig"],"ingredients":["200 g Hähnchen","Salat","Tomaten","Gurke"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","200 g Hähnchen in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":8,"e":"🍳","name":"Protein-Omelett","kcal":460,"p":42,"carbs":12,"fat":27,"price":2.8,"method":"Pfanne","tags":["High Protein","Günstig"],"ingredients":["4 Eier","50 g Light-Käse","150 g Paprika","Spinat"],"prep":["None nach Packungsangabe bzw. die Beilage vorbereiten.","4 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. 150 g Paprika, Spinat waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":9,"e":"🍛","name":"Chicken-Curry mit Reis","kcal":650,"p":50,"carbs":74,"fat":13,"price":3.5,"method":"Topf","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","Paprika","Kokosmilch"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","200 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Paprika waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":10,"e":"🥔","name":"Hähnchen-Kartoffel-Blech","kcal":610,"p":54,"carbs":55,"fat":16,"price":3.2,"method":"Ofen","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Hähnchen","300 g Kartoffeln","Karotten","Brokkoli"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","200 g Hähnchen mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Karotten, Brokkoli waschen/schneiden.","300 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":11,"e":"🌮","name":"Chicken-Wraps","kcal":590,"p":51,"carbs":61,"fat":15,"price":3.1,"method":"Pfanne","tags":["High Protein","Schnell"],"ingredients":["180 g Hähnchen","2 Wraps","Salat","Tomaten"],"prep":["2 Wraps nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Salat, Tomaten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":12,"e":"🍝","name":"Hackfleisch-Pasta","kcal":690,"p":47,"carbs":78,"fat":19,"price":3.3,"method":"Topf","tags":["Günstig"],"ingredients":["150 g Rinderhack","100 g Nudeln","Tomatensauce","Zwiebeln"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","150 g Rinderhack in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Zwiebeln waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":13,"e":"🐟","name":"Lachs-Reis-Bowl","kcal":670,"p":44,"carbs":62,"fat":24,"price":4.9,"method":"Ofen","tags":["High Protein","Gesünder essen"],"ingredients":["180 g Lachs","100 g Reis","Gurke","Avocado"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","180 g Lachs mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Gurke waschen/schneiden.","100 g Reis vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":14,"e":"🥙","name":"Puten-Wrap","kcal":510,"p":49,"carbs":48,"fat":12,"price":3.2,"method":"Pfanne","tags":["High Protein","Low Calorie","Schnell"],"ingredients":["180 g Pute","2 Wraps","Salat","Paprika"],"prep":["2 Wraps nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Pute in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Salat, Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":15,"e":"🍲","name":"Chili con Carne","kcal":630,"p":48,"carbs":55,"fat":20,"price":3.4,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Rinderhack","Kidneybohnen","Mais","Tomaten"],"prep":["Einen Topf auf mittlere Hitze bringen und die Zutaten vorbereiten.","200 g Rinderhack in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Kidneybohnen, Mais, Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":16,"e":"🍚","name":"Egg-Fried-Rice","kcal":560,"p":32,"carbs":70,"fat":17,"price":2.6,"method":"Pfanne","tags":["Günstig","Schnell"],"ingredients":["2 Eier","150 g Reis","Erbsen","Karotten"],"prep":["150 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","2 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Erbsen, Karotten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":17,"e":"🥦","name":"Chicken-Brokkoli-Pfanne","kcal":490,"p":57,"carbs":25,"fat":17,"price":3.1,"method":"Pfanne","tags":["High Protein","Low Calorie","Günstig"],"ingredients":["220 g Hähnchen","200 g Brokkoli","Paprika","Reis"],"prep":["Reis nach Packungsangabe bzw. die Beilage vorbereiten.","220 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. 200 g Brokkoli, Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":18,"e":"🍠","name":"Puten-Süßkartoffel-Bowl","kcal":580,"p":50,"carbs":55,"fat":15,"price":3.8,"method":"Ofen","tags":["High Protein","Gesünder essen"],"ingredients":["200 g Pute","250 g Süßkartoffel","Spinat","Tomaten"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","200 g Pute mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Spinat, Tomaten waschen/schneiden.","250 g Süßkartoffel vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":19,"e":"🍕","name":"Wrap-Pizza","kcal":470,"p":39,"carbs":42,"fat":15,"price":2.9,"method":"Ofen","tags":["Low Calorie","Günstig","Schnell"],"ingredients":["1 Wrap","80 g Hähnchen","Light-Käse","Tomatensauce"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","80 g Hähnchen mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Tomatensauce waschen/schneiden.","1 Wrap vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":20,"e":"🥘","name":"Hähnchen-Gemüse-Reis","kcal":600,"p":53,"carbs":69,"fat":12,"price":3,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","Brokkoli","Karotten"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","200 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Brokkoli, Karotten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":21,"e":"🌯","name":"Chicken-Caesar-Wrap","kcal":560,"p":50,"carbs":47,"fat":17,"price":3.3,"method":"Egal","tags":["High Protein","Schnell"],"ingredients":["180 g Hähnchen","2 Wraps","Salat","Parmesan"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","180 g Hähnchen in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":22,"e":"🍝","name":"Hähnchen-Tomaten-Pasta","kcal":640,"p":52,"carbs":75,"fat":12,"price":3.1,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["180 g Hähnchen","100 g Nudeln","Tomatensauce","Zucchini"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Zucchini waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":23,"e":"🥘","name":"Rinderhack-Reis-Pfanne","kcal":670,"p":50,"carbs":68,"fat":18,"price":3.4,"method":"Pfanne","tags":["High Protein","Günstig"],"ingredients":["200 g Rinderhack","100 g Reis","Paprika","Mais"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Mais waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":24,"e":"🌮","name":"Beef-Tacos","kcal":620,"p":45,"carbs":55,"fat":22,"price":3.7,"method":"Pfanne","tags":["High Protein"],"ingredients":["180 g Rinderhack","3 Tortillas","Tomaten","Mais"],"prep":["3 Tortillas nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Tomaten, Mais waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":25,"e":"🍛","name":"Puten-Curry","kcal":590,"p":54,"carbs":48,"fat":15,"price":3.6,"method":"Topf","tags":["High Protein","Meal Prep"],"ingredients":["200 g Pute","100 g Reis","Paprika","Kokosmilch"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","200 g Pute in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Paprika waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":26,"e":"🥔","name":"Puten-Kartoffel-Pfanne","kcal":560,"p":53,"carbs":49,"fat":14,"price":3,"method":"Pfanne","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Pute","300 g Kartoffeln","Paprika","Zwiebeln"],"prep":["300 g Kartoffeln nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Pute in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Zwiebeln waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":27,"e":"🍳","name":"Rührei mit Kartoffeln","kcal":520,"p":31,"carbs":42,"fat":25,"price":2.5,"method":"Pfanne","tags":["Günstig"],"ingredients":["4 Eier","250 g Kartoffeln","Spinat","Light-Käse"],"prep":["250 g Kartoffeln nach Packungsangabe bzw. die Beilage vorbereiten.","4 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Spinat waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":28,"e":"🥗","name":"Thunfisch-Reis-Salat","kcal":510,"p":42,"carbs":54,"fat":12,"price":3.2,"method":"Egal","tags":["High Protein","Low Calorie","Schnell"],"ingredients":["1 Dose Thunfisch","100 g Reis","Gurke","Tomaten"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","1 Dose Thunfisch in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":29,"e":"🐟","name":"Lachs mit Kartoffeln","kcal":690,"p":43,"carbs":50,"fat":29,"price":4.9,"method":"Ofen","tags":["High Protein","Gesünder essen"],"ingredients":["180 g Lachs","300 g Kartoffeln","Brokkoli"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","180 g Lachs mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Brokkoli waschen/schneiden.","300 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":30,"e":"🍤","name":"Garnelen-Gemüse-Reis","kcal":540,"p":41,"carbs":67,"fat":10,"price":4.2,"method":"Pfanne","tags":["High Protein","Low Calorie"],"ingredients":["200 g Garnelen","100 g Reis","Brokkoli","Paprika"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Garnelen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli, Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":31,"e":"🍕","name":"Chicken-Protein-Pizza","kcal":610,"p":55,"carbs":45,"fat":19,"price":3.9,"method":"Ofen","tags":["High Protein"],"ingredients":["Protein-Wrap","150 g Hähnchen","Mozzarella","Tomatensauce"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","Protein-Wrap mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Tomatensauce waschen/schneiden.","Protein-Wrap vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":32,"e":"🥙","name":"Hack-Wrap mit Bohnen","kcal":650,"p":48,"carbs":62,"fat":18,"price":3.2,"method":"Pfanne","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["180 g Rinderhack","2 Wraps","Kidneybohnen","Tomaten"],"prep":["2 Wraps nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Kidneybohnen, Tomaten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":33,"e":"🍲","name":"Hähnchen-Bohnen-Chili","kcal":570,"p":58,"carbs":45,"fat":12,"price":3.3,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Hähnchen","Kidneybohnen","Mais","Tomaten"],"prep":["Einen Topf auf mittlere Hitze bringen und die Zutaten vorbereiten.","200 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Kidneybohnen, Mais, Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":34,"e":"🥦","name":"Puten-Brokkoli-Reis","kcal":550,"p":56,"carbs":58,"fat":9,"price":3.1,"method":"Pfanne","tags":["High Protein","Low Calorie","Meal Prep"],"ingredients":["200 g Pute","100 g Reis","Brokkoli","Karotten"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Pute in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli, Karotten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":35,"e":"🍝","name":"Hackfleisch-Protein-Pasta","kcal":680,"p":55,"carbs":62,"fat":20,"price":3.8,"method":"Topf","tags":["High Protein","Meal Prep"],"ingredients":["180 g Rinderhack","100 g Protein-Pasta","Tomatensauce","Parmesan"],"prep":["100 g Protein-Pasta nach Packungsangabe vorbereiten.","180 g Rinderhack in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":36,"e":"🥔","name":"Loaded Potatoes mit Hähnchen","kcal":630,"p":52,"carbs":58,"fat":16,"price":3.5,"method":"Ofen","tags":["High Protein","Meal Prep"],"ingredients":["250 g Kartoffeln","180 g Hähnchen","Light-Käse","Paprika"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","180 g Hähnchen mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Paprika waschen/schneiden.","250 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":37,"e":"🍚","name":"Chicken-Erdnuss-Reis","kcal":660,"p":51,"carbs":70,"fat":18,"price":3.8,"method":"Pfanne","tags":["High Protein"],"ingredients":["200 g Hähnchen","100 g Reis","Erdnussbutter","Brokkoli"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":38,"e":"🌯","name":"Puten-Salat-Wraps","kcal":450,"p":47,"carbs":39,"fat":10,"price":3,"method":"Egal","tags":["High Protein","Low Calorie","Schnell"],"ingredients":["180 g Pute","2 Wraps","Salat","Gurke"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","180 g Pute in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":39,"e":"🍲","name":"Chili sin Carne","kcal":510,"p":24,"carbs":71,"fat":10,"price":2.4,"method":"Topf","tags":["Günstig","Meal Prep","Gesünder essen"],"ingredients":["Kidneybohnen","Mais","Tomaten","Paprika"],"prep":["Einen Topf auf mittlere Hitze bringen und die Zutaten vorbereiten.","Kidneybohnen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Kidneybohnen, Mais, Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":40,"e":"🥗","name":"Mediterrane Chicken-Bowl","kcal":580,"p":49,"carbs":50,"fat":18,"price":3.9,"method":"Egal","tags":["High Protein","Gesünder essen"],"ingredients":["200 g Hähnchen","100 g Reis","Gurke","Tomaten","Feta"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","200 g Hähnchen in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":41,"e":"🍗","name":"Paprika-Hähnchen mit Reis","kcal":610,"p":54,"carbs":63,"fat":13,"price":3.1,"method":"Pfanne","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","Paprika","Tomaten"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Tomaten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":42,"e":"🥘","name":"Hähnchen-Gemüse-Couscous","kcal":590,"p":49,"carbs":67,"fat":12,"price":3.2,"method":"Topf","tags":["High Protein","Schnell"],"ingredients":["180 g Hähnchen","100 g Couscous","Zucchini","Paprika"],"prep":["100 g Couscous nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Zucchini, Paprika waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":43,"e":"🌯","name":"Puten-Burrito","kcal":620,"p":51,"carbs":68,"fat":15,"price":3.3,"method":"Pfanne","tags":["High Protein","Meal Prep"],"ingredients":["180 g Pute","1 Tortilla","Kidneybohnen","Mais"],"prep":["1 Tortilla nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Pute in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Kidneybohnen, Mais waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":44,"e":"🍝","name":"Pasta mit Hähnchen und Spinat","kcal":650,"p":53,"carbs":72,"fat":13,"price":3.4,"method":"Topf","tags":["High Protein","Meal Prep"],"ingredients":["180 g Hähnchen","100 g Nudeln","Spinat","Tomatensauce"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Spinat, Tomatensauce waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":45,"e":"🥔","name":"Kartoffel-Hack-Auflauf","kcal":700,"p":50,"carbs":58,"fat":25,"price":3.5,"method":"Ofen","tags":["High Protein","Günstig"],"ingredients":["200 g Rinderhack","300 g Kartoffeln","Tomaten","Light-Käse"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","200 g Rinderhack mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Tomaten waschen/schneiden.","300 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":46,"e":"🍛","name":"Rotes Thai-Curry mit Hähnchen","kcal":680,"p":50,"carbs":54,"fat":25,"price":4,"method":"Topf","tags":["High Protein"],"ingredients":["200 g Hähnchen","100 g Reis","Paprika","Kokosmilch"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","200 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Paprika waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":47,"e":"🥗","name":"Mediterraner Hähnchen-Salat","kcal":470,"p":49,"carbs":24,"fat":20,"price":3.4,"method":"Egal","tags":["High Protein","Low Calorie","Gesünder essen"],"ingredients":["200 g Hähnchen","Tomaten","Gurke","Feta","Salat"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","200 g Hähnchen in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":48,"e":"🍳","name":"Shakshuka mit Eiern","kcal":520,"p":31,"carbs":30,"fat":27,"price":2.9,"method":"Pfanne","tags":["Günstig","Gesünder essen"],"ingredients":["4 Eier","Tomaten","Paprika","Zwiebeln"],"prep":["None nach Packungsangabe bzw. die Beilage vorbereiten.","4 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Tomaten, Paprika, Zwiebeln waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":49,"e":"🥙","name":"Falafel-Wrap","kcal":590,"p":22,"carbs":72,"fat":21,"price":2.8,"method":"Pfanne","tags":["Günstig","Schnell"],"ingredients":["2 Wraps","Falafel","Salat","Tomaten","Gurke"],"prep":["2 Wraps nach Packungsangabe bzw. die Beilage vorbereiten.","2 Wraps in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Salat, Tomaten, Gurke waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":50,"e":"🍲","name":"Linsen-Bolognese","kcal":570,"p":29,"carbs":79,"fat":12,"price":2.3,"method":"Topf","tags":["Günstig","Meal Prep","Gesünder essen"],"ingredients":["100 g Linsen","100 g Nudeln","Tomatensauce","Karotten"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","100 g Linsen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Karotten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":51,"e":"🍚","name":"Teriyaki-Hähnchen mit Reis","kcal":650,"p":53,"carbs":78,"fat":10,"price":3.5,"method":"Pfanne","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","Brokkoli","Teriyaki-Sauce"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":52,"e":"🌮","name":"Puten-Tacos mit Salat","kcal":540,"p":48,"carbs":52,"fat":16,"price":3.4,"method":"Pfanne","tags":["High Protein","Schnell"],"ingredients":["180 g Pute","3 Tortillas","Salat","Tomaten","Mais"],"prep":["3 Tortillas nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Pute in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Salat, Tomaten, Mais waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":53,"e":"🍝","name":"Cremige Hähnchen-Pasta","kcal":690,"p":55,"carbs":70,"fat":18,"price":3.8,"method":"Topf","tags":["High Protein"],"ingredients":["180 g Hähnchen","100 g Nudeln","Light-Käse","Spinat"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Spinat waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":54,"e":"🥦","name":"Rindfleisch mit Brokkoli und Reis","kcal":660,"p":52,"carbs":64,"fat":18,"price":4.1,"method":"Pfanne","tags":["High Protein","Meal Prep"],"ingredients":["200 g Rind","100 g Reis","Brokkoli","Karotten"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","100 g Reis in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli, Karotten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":55,"e":"🥔","name":"Ofenkartoffeln mit Kräuterquark","kcal":560,"p":31,"carbs":66,"fat":16,"price":2.7,"method":"Ofen","tags":["Günstig","Gesünder essen"],"ingredients":["350 g Kartoffeln","200 g Joghurt","Gurke","Kräuter"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","350 g Kartoffeln mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Gurke waschen/schneiden.","350 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":56,"e":"🍳","name":"Omelett mit Hähnchen und Gemüse","kcal":500,"p":53,"carbs":18,"fat":24,"price":3.1,"method":"Pfanne","tags":["High Protein","Low Calorie"],"ingredients":["3 Eier","120 g Hähnchen","Paprika","Spinat"],"prep":["None nach Packungsangabe bzw. die Beilage vorbereiten.","3 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Spinat waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":57,"e":"🥘","name":"Hack-Gemüse-Pfanne mit Reis","kcal":640,"p":49,"carbs":65,"fat":18,"price":3.3,"method":"Pfanne","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Rinderhack","100 g Reis","Zucchini","Paprika"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Zucchini, Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":58,"e":"🍛","name":"Puten-Gemüse-Curry","kcal":610,"p":52,"carbs":59,"fat":17,"price":3.5,"method":"Topf","tags":["High Protein","Meal Prep"],"ingredients":["200 g Pute","100 g Reis","Brokkoli","Kokosmilch"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","200 g Pute in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Brokkoli waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":59,"e":"🐟","name":"Thunfisch-Pasta","kcal":620,"p":46,"carbs":75,"fat":13,"price":3.2,"method":"Topf","tags":["High Protein","Günstig"],"ingredients":["1 Dose Thunfisch","100 g Nudeln","Tomatensauce","Spinat"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","1 Dose Thunfisch in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Spinat waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":60,"e":"🐟","name":"Lachs mit Ofengemüse","kcal":640,"p":42,"carbs":36,"fat":31,"price":4.8,"method":"Ofen","tags":["High Protein","Low Calorie","Gesünder essen"],"ingredients":["180 g Lachs","250 g Kartoffeln","Brokkoli","Karotten"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","180 g Lachs mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Brokkoli, Karotten waschen/schneiden.","250 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":61,"e":"🍤","name":"Garnelen-Pasta mit Tomaten","kcal":590,"p":43,"carbs":70,"fat":12,"price":4.2,"method":"Topf","tags":["High Protein","Schnell"],"ingredients":["200 g Garnelen","100 g Nudeln","Tomaten","Spinat"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","200 g Garnelen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomaten, Spinat waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":62,"e":"🥗","name":"Couscous-Salat mit Feta","kcal":520,"p":24,"carbs":66,"fat":18,"price":2.9,"method":"Egal","tags":["Günstig","Schnell","Gesünder essen"],"ingredients":["100 g Couscous","80 g Feta","Gurke","Tomaten","Paprika"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","100 g Couscous in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":63,"e":"🍚","name":"Gebratener Reis mit Hähnchen","kcal":630,"p":50,"carbs":72,"fat":14,"price":3.1,"method":"Pfanne","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["180 g Hähnchen","150 g Reis","2 Eier","Erbsen","Karotten"],"prep":["150 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Erbsen, Karotten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":64,"e":"🥙","name":"Chicken-Quesadillas","kcal":650,"p":48,"carbs":53,"fat":24,"price":3.6,"method":"Pfanne","tags":["High Protein","Schnell"],"ingredients":["180 g Hähnchen","2 Tortillas","Light-Käse","Paprika"],"prep":["2 Tortillas nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":65,"e":"🍕","name":"Tortilla-Pizza mit Gemüse","kcal":480,"p":31,"carbs":49,"fat":17,"price":2.7,"method":"Ofen","tags":["Low Calorie","Günstig","Schnell"],"ingredients":["1 Tortilla","Light-Käse","Tomatensauce","Paprika","Mais"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","1 Tortilla mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Tomatensauce, Paprika, Mais waschen/schneiden.","1 Tortilla vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":66,"e":"🍝","name":"Penne Arrabbiata mit Hähnchen","kcal":630,"p":50,"carbs":79,"fat":11,"price":3,"method":"Topf","tags":["High Protein","Günstig"],"ingredients":["180 g Hähnchen","100 g Nudeln","Tomatensauce","Chili"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":67,"e":"🥔","name":"Kartoffel-Gemüse-Pfanne mit Ei","kcal":540,"p":30,"carbs":59,"fat":21,"price":2.5,"method":"Pfanne","tags":["Günstig","Gesünder essen"],"ingredients":["300 g Kartoffeln","3 Eier","Brokkoli","Paprika"],"prep":["300 g Kartoffeln nach Packungsangabe bzw. die Beilage vorbereiten.","3 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli, Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":68,"e":"🍲","name":"Bohnen-Chili mit Reis","kcal":610,"p":26,"carbs":91,"fat":12,"price":2.4,"method":"Topf","tags":["Günstig","Meal Prep","Gesünder essen"],"ingredients":["Kidneybohnen","100 g Reis","Mais","Tomaten","Paprika"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","100 g Reis in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Kidneybohnen, Mais, Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":69,"e":"🌯","name":"Rinderhack-Wraps","kcal":650,"p":49,"carbs":57,"fat":23,"price":3.5,"method":"Pfanne","tags":["High Protein","Schnell"],"ingredients":["180 g Rinderhack","2 Wraps","Salat","Tomaten"],"prep":["2 Wraps nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Salat, Tomaten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":70,"e":"🍗","name":"Honig-Senf-Hähnchen mit Kartoffeln","kcal":670,"p":54,"carbs":63,"fat":18,"price":3.4,"method":"Ofen","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","300 g Kartoffeln","Brokkoli","Honig-Senf-Sauce"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","200 g Hähnchen mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Brokkoli waschen/schneiden.","300 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":71,"e":"🍛","name":"Hähnchen-Gyros mit Reis","kcal":650,"p":56,"carbs":66,"fat":14,"price":3.6,"method":"Pfanne","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","Gurke","Tomaten","Joghurt"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Gurke, Tomaten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":72,"e":"🥗","name":"Puten-Salat mit Ei","kcal":480,"p":49,"carbs":18,"fat":23,"price":3.2,"method":"Egal","tags":["High Protein","Low Calorie"],"ingredients":["160 g Pute","2 Eier","Salat","Gurke","Tomaten"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","160 g Pute in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":73,"e":"🍝","name":"Tomaten-Mozzarella-Pasta","kcal":620,"p":28,"carbs":78,"fat":20,"price":3.1,"method":"Topf","tags":["Günstig","Gesünder essen"],"ingredients":["100 g Nudeln","125 g Mozzarella","Tomaten","Basilikum"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","100 g Nudeln in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":74,"e":"🥘","name":"Zucchini-Hack-Pfanne","kcal":520,"p":47,"carbs":22,"fat":25,"price":3.2,"method":"Pfanne","tags":["High Protein","Low Calorie"],"ingredients":["200 g Rinderhack","Zucchini","Tomaten","Paprika"],"prep":["None nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Rinderhack in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Zucchini, Tomaten, Paprika waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":75,"e":"🍳","name":"Egg-Bowl mit Reis und Gemüse","kcal":560,"p":31,"carbs":71,"fat":17,"price":2.6,"method":"Pfanne","tags":["Günstig","Schnell"],"ingredients":["3 Eier","120 g Reis","Brokkoli","Karotten"],"prep":["120 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","3 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli, Karotten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":76,"e":"🥙","name":"Puten-Sandwich","kcal":510,"p":43,"carbs":51,"fat":16,"price":3,"method":"Egal","tags":["High Protein","Schnell"],"ingredients":["160 g Pute","2 Scheiben Vollkornbrot","Salat","Tomaten","Light-Käse"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","160 g Pute in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":77,"e":"🍲","name":"Hähnchen-Nudel-Suppe","kcal":540,"p":48,"carbs":58,"fat":12,"price":3,"method":"Topf","tags":["High Protein","Günstig"],"ingredients":["180 g Hähnchen","80 g Nudeln","Karotten","Brokkoli"],"prep":["80 g Nudeln nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Karotten, Brokkoli waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":78,"e":"🍚","name":"Rindfleisch-Reis-Bowl mit Gurke","kcal":640,"p":51,"carbs":67,"fat":17,"price":3.9,"method":"Pfanne","tags":["High Protein","Meal Prep"],"ingredients":["180 g Rind","100 g Reis","Gurke","Karotten"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","100 g Reis in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Gurke, Karotten waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":79,"e":"🌮","name":"Fisch-Tacos","kcal":560,"p":42,"carbs":56,"fat":17,"price":4.2,"method":"Pfanne","tags":["High Protein","Schnell"],"ingredients":["180 g Weißfisch","3 Tortillas","Salat","Gurke"],"prep":["3 Tortillas nach Packungsangabe bzw. die Beilage vorbereiten.","180 g Weißfisch in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Salat, Gurke waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":80,"e":"🍝","name":"Pesto-Hähnchen-Pasta","kcal":700,"p":54,"carbs":71,"fat":24,"price":3.9,"method":"Topf","tags":["High Protein"],"ingredients":["180 g Hähnchen","100 g Nudeln","Pesto","Tomaten"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","180 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":81,"e":"🥔","name":"Süßkartoffel-Hack-Bowl","kcal":650,"p":48,"carbs":61,"fat":21,"price":3.7,"method":"Ofen","tags":["High Protein","Meal Prep"],"ingredients":["200 g Rinderhack","250 g Süßkartoffel","Spinat","Tomaten"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","200 g Rinderhack mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Spinat, Tomaten waschen/schneiden.","250 g Süßkartoffel vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":82,"e":"🥗","name":"Mediterrane Couscous-Bowl","kcal":540,"p":23,"carbs":71,"fat":18,"price":3.1,"method":"Egal","tags":["Günstig","Gesünder essen","Meal Prep"],"ingredients":["100 g Couscous","Kichererbsen","Gurke","Tomaten","Feta"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","100 g Couscous in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":83,"e":"🍛","name":"Kichererbsen-Curry mit Reis","kcal":620,"p":22,"carbs":91,"fat":15,"price":2.8,"method":"Topf","tags":["Günstig","Gesünder essen","Meal Prep"],"ingredients":["Kichererbsen","100 g Reis","Kokosmilch","Spinat"],"prep":["100 g Reis nach Packungsangabe vorbereiten.","100 g Reis in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Kichererbsen, Spinat waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":84,"e":"🍗","name":"Hähnchen mit Erdnuss-Sauce und Reis","kcal":690,"p":56,"carbs":68,"fat":22,"price":3.9,"method":"Pfanne","tags":["High Protein"],"ingredients":["200 g Hähnchen","100 g Reis","Erdnussbutter","Brokkoli"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":85,"e":"🌯","name":"Burrito-Bowl mit Hack","kcal":680,"p":48,"carbs":74,"fat":20,"price":3.7,"method":"Egal","tags":["High Protein","Meal Prep"],"ingredients":["180 g Rinderhack","100 g Reis","Kidneybohnen","Mais","Tomaten"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","180 g Rinderhack in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":86,"e":"🍳","name":"Protein-Rührei mit Gemüse","kcal":430,"p":42,"carbs":16,"fat":24,"price":2.6,"method":"Pfanne","tags":["High Protein","Low Calorie","Schnell"],"ingredients":["4 Eier","Light-Käse","Paprika","Spinat"],"prep":["None nach Packungsangabe bzw. die Beilage vorbereiten.","4 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Spinat waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":87,"e":"🥦","name":"Hähnchen in Zitronen-Kräuter-Sauce","kcal":520,"p":55,"carbs":22,"fat":21,"price":3.4,"method":"Pfanne","tags":["High Protein","Low Calorie"],"ingredients":["200 g Hähnchen","Zucchini","Brokkoli","Zitrone"],"prep":["None nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Zucchini, Brokkoli waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":88,"e":"🍝","name":"Bolognese mit Rinderhack","kcal":690,"p":48,"carbs":76,"fat":21,"price":3.4,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["180 g Rinderhack","100 g Nudeln","Tomatensauce","Karotten"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","180 g Rinderhack in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Karotten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":89,"e":"🥔","name":"Kartoffel-Hähnchen-Auflauf","kcal":650,"p":55,"carbs":57,"fat":18,"price":3.3,"method":"Ofen","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","300 g Kartoffeln","Brokkoli","Light-Käse"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","200 g Hähnchen mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Brokkoli waschen/schneiden.","300 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":90,"e":"🍚","name":"Chicken Teriyaki Bowl","kcal":640,"p":54,"carbs":72,"fat":12,"price":3.7,"method":"Pfanne","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","100 g Reis","Brokkoli","Teriyaki-Sauce"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Hähnchen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Brokkoli waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":91,"e":"🥗","name":"Thunfisch-Bohnen-Salat","kcal":470,"p":43,"carbs":32,"fat":18,"price":3.1,"method":"Egal","tags":["High Protein","Low Calorie","Schnell"],"ingredients":["1 Dose Thunfisch","Kidneybohnen","Tomaten","Gurke"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","1 Dose Thunfisch in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":92,"e":"🍤","name":"Garnelen-Reis-Pfanne","kcal":570,"p":44,"carbs":68,"fat":11,"price":4,"method":"Pfanne","tags":["High Protein","Schnell"],"ingredients":["200 g Garnelen","100 g Reis","Paprika","Erbsen"],"prep":["100 g Reis nach Packungsangabe bzw. die Beilage vorbereiten.","200 g Garnelen in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Erbsen waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":93,"e":"🌯","name":"Chicken-Avocado-Wrap","kcal":620,"p":49,"carbs":51,"fat":24,"price":3.9,"method":"Egal","tags":["High Protein","Schnell"],"ingredients":["180 g Hähnchen","2 Wraps","Avocado","Salat","Tomaten"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","180 g Hähnchen in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]},{"id":94,"e":"🍲","name":"Puten-Linsen-Eintopf","kcal":590,"p":50,"carbs":63,"fat":13,"price":3.2,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["180 g Pute","100 g Linsen","Karotten","Tomaten"],"prep":["Einen Topf auf mittlere Hitze bringen und die Zutaten vorbereiten.","180 g Pute in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Karotten, Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":95,"e":"🍕","name":"Gemüse-Flammkuchen","kcal":580,"p":24,"carbs":65,"fat":23,"price":3,"method":"Ofen","tags":["Günstig","Gesünder essen"],"ingredients":["Fladenbrot","Light-Käse","Paprika","Zwiebeln","Tomaten"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","Fladenbrot mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. Paprika, Zwiebeln, Tomaten waschen/schneiden.","Fladenbrot vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":96,"e":"🥘","name":"Hähnchen-Paprika-Gulasch","kcal":610,"p":55,"carbs":44,"fat":20,"price":3.3,"method":"Topf","tags":["High Protein","Meal Prep"],"ingredients":["200 g Hähnchen","Paprika","Tomaten","Kartoffeln"],"prep":["Kartoffeln nach Packungsangabe vorbereiten.","200 g Hähnchen in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Paprika, Tomaten waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":97,"e":"🍝","name":"Puten-Pasta mit Tomatensauce","kcal":630,"p":55,"carbs":73,"fat":11,"price":3.2,"method":"Topf","tags":["High Protein","Günstig","Meal Prep"],"ingredients":["200 g Pute","100 g Nudeln","Tomatensauce","Zucchini"],"prep":["100 g Nudeln nach Packungsangabe vorbereiten.","200 g Pute in etwas Öl rundum anbraten und mit Salz, Pfeffer und Gewürzen abschmecken. Tomatensauce, Zucchini waschen/schneiden.","Die restlichen Zutaten dazugeben und alles bei mittlerer Hitze 8–12 Minuten köcheln bzw. durchziehen lassen.","Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken."]},{"id":98,"e":"🥔","name":"Kartoffel-Brokkoli-Gratin","kcal":570,"p":25,"carbs":63,"fat":23,"price":2.8,"method":"Ofen","tags":["Günstig","Gesünder essen"],"ingredients":["300 g Kartoffeln","200 g Brokkoli","Light-Käse","Joghurt"],"prep":["Backofen auf 200 °C Ober-/Unterhitze vorheizen.","300 g Kartoffeln mit 1 EL Öl, Salz, Pfeffer und passenden Gewürzen vermengen. 200 g Brokkoli waschen/schneiden.","300 g Kartoffeln vorbereiten und zusammen mit den übrigen Zutaten auf einem Blech verteilen.","20–30 Minuten backen, bis die Hauptzutat vollständig durchgegart und das Gemüse bissfest ist. Kurz ruhen lassen und servieren."]},{"id":99,"e":"🍳","name":"Frühstücks-Burrito mit Ei","kcal":560,"p":31,"carbs":57,"fat":24,"price":2.9,"method":"Pfanne","tags":["Günstig","Schnell"],"ingredients":["3 Eier","1 Tortilla","Light-Käse","Paprika","Mais"],"prep":["1 Tortilla nach Packungsangabe bzw. die Beilage vorbereiten.","3 Eier in einer heißen beschichteten Pfanne mit etwas Öl 4–6 Minuten anbraten. Paprika, Mais waschen/schneiden.","Die übrigen Zutaten dazugeben und bei mittlerer bis hoher Hitze weiterbraten, bis alles gar und leicht gebräunt ist.","Mit Salz, Pfeffer und passenden Gewürzen abschmecken und direkt servieren."]},{"id":100,"e":"🥗","name":"Chicken-Couscous-Salat","kcal":560,"p":48,"carbs":60,"fat":14,"price":3.3,"method":"Egal","tags":["High Protein","Meal Prep","Schnell"],"ingredients":["180 g Hähnchen","100 g Couscous","Gurke","Tomaten","Paprika"],"prep":["Alle Zutaten vorbereiten und die Hauptzutaten würzen.","180 g Hähnchen in einer beschichteten Pfanne oder im Ofen vollständig garen.","Die übrigen Zutaten separat fertigstellen und anschließend miteinander kombinieren.","Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen."]}];
const DAYS=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const FILTERS=['Alle','High Protein','Günstig','Schnell','Meal Prep','Low Calorie','Gesünder essen'];
const STORES=['ALDI','LIDL','COMBI','EDEKA','REWE','PENNY','Netto'];
const KEY='koldis-0.9.2-local-v1';
const defaults={page:'home',budget:60,store:'',goals:['High Protein'],likes:[],dislikes:[],intolerances:[],method:'Egal',plan:{},plans:[{id:'w1',label:'Woche 1',plan:{}}],currentPlan:0,cart:[],customShopping:[],shoppingChecked:{},saved:[],filter:'Alle',query:'',theme:'dark',portionDefault:4,onboardingDone:false};
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY)||'null');
    const st={...defaults,...(x&&typeof x==='object'?x:{})};

    if(!Array.isArray(st.goals)) st.goals=[...defaults.goals];
    if(!Array.isArray(st.likes)) st.likes=[];
    if(!Array.isArray(st.dislikes)) st.dislikes=[];
    if(!Array.isArray(st.intolerances)) st.intolerances=[];
    if(!Array.isArray(st.cart)) st.cart=[];
    if(!Array.isArray(st.customShopping)) st.customShopping=[];
    if(!st.shoppingChecked || typeof st.shoppingChecked!=='object') st.shoppingChecked={};
    if(!Array.isArray(st.saved)) st.saved=[];
    if(!st.filter) st.filter='Alle';
    if(typeof st.query!=='string') st.query='';
    if(typeof st.budget!=='number' || !Number.isFinite(st.budget)) st.budget=60;
    if(typeof st.portionDefault!=='number' || !Number.isFinite(st.portionDefault) || st.portionDefault<1) st.portionDefault=4;
    if(typeof st.method!=='string') st.method='Egal';
    if(typeof st.store!=='string') st.store='';
    if(typeof st.onboardingDone!=='boolean') st.onboardingDone=false;
    if(!st.plan || typeof st.plan!=='object' || Array.isArray(st.plan)) st.plan={};

    if(!Array.isArray(st.plans) || !st.plans.length){
      st.plans=[{id:'w1',label:'Woche 1',plan:st.plan}];
    }

    st.plans=st.plans.map((w,i)=>({
      id: w && w.id ? String(w.id) : 'w'+(i+1),
      label: w && w.label ? String(w.label) : 'Woche '+(i+1),
      plan: w && w.plan && typeof w.plan==='object' && !Array.isArray(w.plan) ? w.plan : {}
    }));

    if(!Number.isInteger(st.currentPlan) || st.currentPlan<0) st.currentPlan=0;
    if(st.currentPlan>=st.plans.length) st.currentPlan=st.plans.length-1;
    st.plan=st.plans[st.currentPlan].plan || {};
    st.plans[st.currentPlan].plan=st.plan;
    return st;
  }catch(err){
    console.warn('KOLDIS state reset:',err);
    return {...defaults,plans:[{id:'w1',label:'Woche 1',plan:{}}],plan:{},currentPlan:0};
  }
}
const state=load();
function syncPlan(){
  if(!Array.isArray(state.plans)||!state.plans.length)
    state.plans=[{id:'w1',label:'Woche 1',plan:{}}];
  if(!Number.isInteger(state.currentPlan)||state.currentPlan<0) state.currentPlan=0;
  if(state.currentPlan>=state.plans.length) state.currentPlan=state.plans.length-1;
  const w=state.plans[state.currentPlan];
  if(!w.plan || typeof w.plan!=='object' || Array.isArray(w.plan)) w.plan={};
  state.plan=w.plan;
}
function setCurrentPlan(i){syncPlan();state.currentPlan=Math.max(0,Math.min(i,state.plans.length-1));state.plan=state.plans[state.currentPlan].plan||{};state.plans[state.currentPlan].plan=state.plan;save()}
function addWeek(){syncPlan();const n=state.plans.length+1;state.plans.push({id:'w'+Date.now(),label:'Woche '+n,plan:{}});state.currentPlan=state.plans.length-1;state.plan=state.plans[state.currentPlan].plan;save()}
function clearCurrentWeek(){
  syncPlan();
  if(state.plans.length<=1){
    state.plans[0].plan={};
    state.currentPlan=0;
  }else{
    state.plans.splice(state.currentPlan,1);
    state.currentPlan=Math.max(0,state.currentPlan-1);
  }
  state.plan=state.plans[state.currentPlan].plan||{};
  state.plans[state.currentPlan].plan=state.plan;
  save();
}
function clearAllWeeks(){state.plans=[{id:'w1',label:'Woche 1',plan:{}}];state.currentPlan=0;state.plan=state.plans[0].plan;save()}

const app=document.getElementById('app');
function formatQty(n){if(Number.isInteger(n))return String(n);return String(Math.round(n*10)/10).replace('.',',')}
function scaleText(text, portions){
  const factor=portions/1;
  return String(text).replace(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|EL|TL|Stk\.?|Stück|Eier|Ei|Wraps?|Tortillas?)(?=\b|\s)/gi,(m,num,unit)=>{
    const v=parseFloat(String(num).replace(',','.'));
    return `${formatQty(v*factor)} ${unit}`;
  });
}
function scaledIngredients(r, portions){return r.ingredients.map(i=>scaleText(i,portions))}
function scaledPrep(r, portions){return r.prep.map(i=>scaleText(i,portions))}
function cartEntries(){
  return (state.cart||[]).map(x=>typeof x==='number'?{id:x,portions:state.portionDefault||4}:x).filter(x=>x&&x.id);
}
function addToCart(id, portions=state.portionDefault||4){
  const entries=cartEntries();
  const existing=entries.find(x=>x.id===id);
  if(existing) existing.portions=portions; else entries.push({id,portions});
  state.cart=entries;
  save();
}
function saveCart(entries){state.cart=entries;save()}
function saveLocalOnly(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}}
function save(){saveLocalOnly();queueProfileSync()}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function money(n){return Number(n).toFixed(2).replace('.',',')}
function excluded(r){const bad=[...(state.dislikes||[]),...(state.intolerances||[])].map(x=>String(x).toLowerCase());const text=(r.name+' '+r.ingredients.join(' ')).toLowerCase();if(bad.some(x=>x&&text.includes(x)))return true;if((state.intolerances||[]).includes('Laktose')&&/joghurt|mozzarella|feta|käse|milch/.test(text))return true;if((state.intolerances||[]).includes('Gluten')&&/nudel|pasta|wrap|tortilla|fladen|couscous/.test(text))return true;if((state.intolerances||[]).includes('Nüsse')&&/nuss|erdnuss/.test(text))return true;return false}
function matches(r){if(excluded(r))return false;const q=state.query.trim().toLowerCase();if(q&&!(`${r.name} ${r.ingredients.join(' ')} ${r.tags.join(' ')}`).toLowerCase().includes(q))return false;switch(state.filter){case'High Protein':return r.p>=40;case'Günstig':return r.price<=3.5;case'Schnell':return r.tags.includes('Schnell')||r.method==='Pfanne'||r.method==='Mikrowelle'||r.method==='Airfryer';case'Meal Prep':return r.tags.includes('Meal Prep');case'Low Calorie':return r.kcal<=550;case'Gesünder essen':return r.tags.includes('Gesünder essen');default:return true}}
function sortedRecipes(){const likes=(state.likes||[]).map(x=>String(x).toLowerCase());return RECIPES.filter(matches).map(r=>{const text=(r.name+' '+r.ingredients.join(' ')+' '+r.tags.join(' ')).toLowerCase();const score=likes.reduce((n,l)=>n+(text.includes(l)?1:0),0);return {...r,_score:score}}).sort((a,b)=>b._score-a._score||a.price-b.price)}
function nav(page){if(!state.onboardingDone){onboarding();return}state.page=page;save();render()}
function header(){const count=state.cart.length;return `<header class="top"><div><div class="brand">🥗 KOLDIS</div><div class="tagline">Dein Essen. Dein Markt. Dein Budget.</div></div><button class="cart" data-nav="shopping">🛒 <b>${count}</b></button></header>`}
function bottom(){const items=[['home','🏠','Start'],['recipes','🍽️','Rezepte'],['plan','📅','Plan'],['shopping','🛒','Einkauf'],['profile','👤','Profil']];return `<nav class="bottom">${items.map(([p,i,l])=>`<button class="${state.page===p?'active':''}" data-nav="${p}"><span>${i}</span><small>${l}</small>${p==='shopping'&&state.cart.length?`<b>${state.cart.length}</b>`:''}</button>`).join('')}</nav>`}
function shell(content){app.innerHTML=`${header()}<main>${content}</main>${bottom()}`;app.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>nav(b.dataset.nav))}
function home(){syncPlan();const planned=Object.keys(state.plan||{}).length;const spent=Object.values(state.plan||{}).reduce((s,id)=>s+(RECIPES.find(r=>r.id===id)?.price||0),0);const rec=sortedRecipes().slice(0,3);shell(`<section class="home"><div class="hero"><div class="eyebrow">KOLDIS</div><h1>Deine Woche.<br><em>Einfach geplant.</em></h1><p>Finde Gerichte, plane deine Woche und erhalte daraus automatisch deine Einkaufsliste.</p><div class="hero-actions"><button class="primary" id="autoPlan">✨ Meine Woche planen</button><button class="secondary" id="discover">🍽️ Gerichte entdecken</button></div></div><section class="intro-card"><div class="intro-copy"><div class="eyebrow">SO FUNKTIONIERT KOLDIS</div><h2>Vom Gericht zur fertigen Einkaufsliste.</h2><p>Du findest passende Rezepte, planst deine Woche und KOLDIS stellt dir daraus automatisch deinen Einkauf zusammen – passend zu deinen Vorlieben und deinem Budget.</p><div class="intro-steps"><span class="intro-step">1 · Gericht finden</span><span class="intro-step">2 · Woche planen</span><span class="intro-step">3 · Einkauf erledigen</span></div></div><img class="intro-visual" src="koldis-intro.jpg?v=0.8.9" alt="KOLDIS App Vorschau" loading="eager"></section><div class="quick"><button data-go="recipes"><span>🍽️</span><strong>Gerichte</strong><small>${RECIPES.length} Rezepte entdecken</small></button><button data-go="plan"><span>📅</span><strong>Wochenplan</strong><small>${planned}/7 Tage geplant</small></button><button data-go="shopping"><span>🛒</span><strong>Einkauf</strong><small>${money(spent)} € geplant</small></button></div><section><div class="section-head"><div><div class="eyebrow">FÜR DICH</div><h2>Das könnte dir gefallen</h2></div><button class="link" id="all">Alle anzeigen</button></div><div class="recommend">${rec.map(cardMini).join('')}</div></section><div class="budget"><div><div class="eyebrow">DEIN BUDGET</div><strong>${money(state.budget)} € <small>/ Woche</small></strong><p>Noch ca. ${money(Math.max(0,state.budget-spent))} € frei</p></div><div class="ring">${Math.min(100,Math.round(spent/Math.max(1,state.budget)*100))}%</div></div></section>`);app.querySelector('#autoPlan').onclick=autoPlan;app.querySelector('#discover').onclick=()=>nav('recipes');app.querySelector('#all').onclick=()=>nav('recipes');app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go));app.querySelectorAll('[data-mini]').forEach(b=>b.onclick=()=>openRecipe(+b.dataset.mini))}
function cardMini(r){return `<button class="mini" data-mini="${r.id}"><span>${r.e}</span><div><strong>${esc(r.name)}</strong><small>${r.p} g Protein · ${money(r.price)} € · ${esc(r.method)}</small></div><b>›</b></button>`}
function recipeCard(r){return `<article class="recipe"><button class="open" data-open="${r.id}"><div class="badge">${esc(r.tags[0]||'REZEPT')}</div><div class="rtitle"><h3>${esc(r.name)}</h3><span>›</span></div><div class="tags">${r.tags.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="stats">🔥 ${r.kcal} kcal · 💪 ${r.p} g Protein<br>💶 ca. ${money(r.price*4)} € / 4 Portionen · ⏱️ ${esc(r.method)}</div></button><div class="actions3"><button data-cart="${r.id}">🛒 Einkauf</button><button data-plan="${r.id}">📅 Planen</button><button data-save="${r.id}">${state.saved.includes(r.id)?'♥':'♡'}</button></div></article>`}
function recipesPage(){const list=sortedRecipes();shell(`<section class="recipes"><div class="eyebrow">REZEPTE</div><h1>Finde dein Essen</h1><p class="lead">Aus passenden Gerichten findest du schnell das, was zu deinen Vorlieben, Zielen und deinem Budget passt.</p><div class="search"><span>🔎</span><input id="q" value="${esc(state.query)}" placeholder="Hähnchen, Pasta, Kartoffeln …"></div><div class="filters">${FILTERS.map(f=>`<button class="filter ${state.filter===f?'active':''}" data-filter="${f}">${f}</button>`).join('')}</div><div class="result"><strong>${list.length} Gerichte</strong><span>aus ${RECIPES.length} Rezepten</span><button id="reset" class="link">Zurücksetzen</button></div><div class="cards">${list.length?list.map(recipeCard).join(''):'<div class="empty">Keine passenden Rezepte gefunden.<br><button id="reset2" class="secondary">Filter zurücksetzen</button></div>'}</div></section>`);const q=app.querySelector('#q');q.oninput=()=>{state.query=q.value;renderRecipesOnly()};app.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;save();recipesPage()});app.querySelector('#reset').onclick=()=>{state.filter='Alle';state.query='';save();recipesPage()};const r2=app.querySelector('#reset2');if(r2)r2.onclick=()=>{state.filter='Alle';state.query='';save();recipesPage()};bindRecipeActions();}
function renderRecipesOnly(){const list=sortedRecipes();const cards=app.querySelector('.cards');const result=app.querySelector('.result');result.innerHTML=`<strong>${list.length} Gerichte</strong><span>aus ${RECIPES.length} Rezepten</span><button id="reset" class="link">Zurücksetzen</button>`;cards.innerHTML=list.length?list.map(recipeCard).join(''):'<div class="empty">Keine passenden Rezepte gefunden.<br><button id="reset2" class="secondary">Filter zurücksetzen</button></div>';app.querySelector('#reset').onclick=()=>{state.filter='Alle';state.query='';save();recipesPage()};const r2=app.querySelector('#reset2');if(r2)r2.onclick=()=>{state.filter='Alle';state.query='';save();recipesPage()};bindRecipeActions()}
function bindRecipeActions(){
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openRecipe(+b.dataset.open));
  app.querySelectorAll('[data-cart]').forEach(b=>b.onclick=()=>{addToCart(+b.dataset.cart, state.portionDefault||4);b.textContent='✓';setTimeout(render,500)});
  app.querySelectorAll('[data-plan]').forEach(b=>b.onclick=()=>{syncPlan();const day=nextDay();if(day){state.plan[day]=+b.dataset.plan;state.plans[state.currentPlan].plan=state.plan;save();b.textContent='✓';setTimeout(render,500)}});
  app.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const id=+b.dataset.save;state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];save();recipesPage()})
}
function nextDay(){syncPlan();return DAYS.find(d=>!state.plan[d])}
function openRecipe(id, initialPortions=state.portionDefault||4){
  const r=RECIPES.find(x=>x.id===id); if(!r)return;
  const day=nextDay(); let portions=Math.max(1,Math.min(12,Number(initialPortions)||4));
  const renderDetail=()=>{
    const ingredients=scaledIngredients(r,portions), prep=scaledPrep(r,portions);
    shell(`<section class="detail"><button class="back" id="back">← Zurück zu Rezepten</button><div class="badge">${esc(r.tags[0]||'REZEPT')}</div><h1>${esc(r.name)}</h1><div class="tags">${r.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
    <div class="portion-box"><div><small>MENGE ANPASSEN</small><strong>${portions} Portion${portions===1?'':'en'}</strong><span>für ${portions} Person${portions===1?'':'en'}</span></div><div class="portion-controls"><button id="minus" aria-label="Portionen verringern">−</button><b>${portions}</b><button id="plus" aria-label="Portionen erhöhen">+</button></div></div>
    <div class="stats4"><div><b>${r.kcal}</b><small>kcal / Portion</small></div><div><b>${r.p} g</b><small>Protein / Portion</small></div><div><b>${money(r.price*portions)} €</b><small>ca. gesamt</small></div><div><b>${esc(r.method)}</b><small>Zubereitung</small></div></div>
    <section><h2>Zutaten für ${portions} Portion${portions===1?'':'en'}</h2><ul>${ingredients.map(i=>`<li>${esc(i)}</li>`).join('')}</ul><p class="hint">KOLDIS rechnet standardmäßig mit 4 Portionen. Du kannst die Menge jederzeit anpassen.</p></section>
    <section><h2>Zubereitung</h2><div class="steps">${prep.map((st,i)=>`<div><b>${i+1}</b><p>${esc(st)}</p></div>`).join('')}</div></section>
    <div class="detail-actions"><button class="primary" id="dp">📅 ${day?'Für '+day+' planen':'Woche voll'}</button><button class="secondary" id="dc">🛒 ${portions} Portion${portions===1?'':'en'} zum Einkauf</button></div></section>`);
    app.querySelector('#back').onclick=()=>nav('recipes');
    app.querySelector('#minus').onclick=()=>{if(portions>1){portions--;renderDetail()}};
    app.querySelector('#plus').onclick=()=>{if(portions<12){portions++;renderDetail()}};
    const dp=app.querySelector('#dp'); if(day)dp.onclick=()=>{syncPlan();state.plan[day]=r.id;state.plans[state.currentPlan].plan=state.plan;save();dp.textContent='✓ Eingeplant';};else dp.disabled=true;
    app.querySelector('#dc').onclick=()=>{addToCart(r.id,portions);nav('shopping')};
  };
  renderDetail();
}
function autoPlan(){syncPlan();const list=sortedRecipes();const used=[];const plan={};let total=0;for(const d of DAYS){let pick=list.find(r=>!used.includes(r.id)&& (total+r.price<=state.budget || used.length<2));if(!pick)pick=list.find(r=>!used.includes(r.id));if(!pick)break;used.push(pick.id);plan[d]=pick.id;total+=pick.price;}state.plan=plan;state.plans[state.currentPlan].plan=plan;save();nav('plan')}
function planPage(){
  syncPlan();
  const total=Object.values(state.plan).reduce((s,id)=>s+(RECIPES.find(r=>r.id===id)?.price||0),0);
  const current=state.currentPlan;
  const weekButtons=state.plans.map((w,i)=>`<button class="week-tab ${i===current?'active':''}" data-week="${i}">${esc(w.label)}</button>`).join('');
  shell(`<section class="plan"><div class="eyebrow">WOCHENPLAN</div><div class="plan-head"><div><h1>Deine Pläne</h1><p class="lead">Plane mehrere Wochen und verschiebe deine Tage jederzeit.</p></div><button class="secondary" id="newWeek">＋ Woche</button></div>
    <div class="week-tabs">${weekButtons}</div>
    <div class="plan-toolbar"><button class="secondary" id="auto">✨ Woche planen</button><button class="secondary" id="clearWeek">🗑️ Woche löschen</button><button class="secondary" id="clearAll">🗑️ Alles löschen</button></div>
    <div class="week-meta"><strong>${esc(state.plans[current].label)}</strong><span>${Object.keys(state.plan).length}/7 Tage geplant</span></div>
    <div class="week">${DAYS.map(d=>{const r=RECIPES.find(x=>x.id===state.plan[d]);return `<article><div class="day-head"><small>${d}</small>${r?`<button class="day-menu" data-move="${d}">↔ Verschieben</button>`:''}</div>${r?`<div class="meal"><span>${r.e}</span><div><strong>${esc(r.name)}</strong><p>${r.p} g Protein · ${money(r.price)} €</p></div><button data-remove="${d}" aria-label="Mahlzeit löschen">×</button></div>`:`<button class="choose" data-choose="${d}">+ Gericht auswählen</button>`}</article>`}).join('')}</div>
    <div class="plan-total"><div><small>GESCHÄTZT · ${esc(state.plans[current].label)}</small><strong>${money(total)} €</strong></div><button class="primary" id="shop">🛒 Einkauf erstellen</button></div>
  </section>`);
  app.querySelector('#newWeek').onclick=()=>{addWeek();planPage()};
  app.querySelector('#auto').onclick=autoPlan;
  app.querySelector('#clearWeek').onclick=()=>{if(confirm(`${state.plans[current].label} wirklich löschen? Die komplette Woche mit allen geplanten Mahlzeiten wird entfernt.`)){clearCurrentWeek();planPage()}};
  app.querySelector('#clearAll').onclick=()=>{if(confirm('Wirklich alle geplanten Wochen löschen?')){clearAllWeeks();planPage()}};
  app.querySelectorAll('[data-week]').forEach(b=>b.onclick=()=>{setCurrentPlan(+b.dataset.week);planPage()});
  app.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{delete state.plan[b.dataset.remove];state.plans[current].plan=state.plan;save();planPage()});
  app.querySelectorAll('[data-choose]').forEach(b=>b.onclick=()=>nav('recipes'));
  app.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>moveDay(b.dataset.move));
  app.querySelector('#shop').onclick=()=>{state.cart=[...new Set(Object.values(state.plan))].map(id=>({id,portions:state.portionDefault||4}));save();nav('shopping')};
}
function moveDay(from){
  syncPlan();
  const targets=DAYS.filter(d=>d!==from);
  const choices=targets.map((d,i)=>`${i+1}. ${d}`).join('\n');
  const target=prompt(`Wohin soll ${from} verschoben werden?\n\n${choices}\n\nNummer eingeben:`);
  if(target===null)return;
  const idx=Number(target)-1;if(!Number.isInteger(idx)||!targets[idx]){alert('Bitte eine gültige Nummer wählen.');return}
  const to=targets[idx];const meal=state.plan[from];if(!meal)return;
  if(state.plan[to] && !confirm(`${to} ist bereits belegt. Die bestehende Mahlzeit ersetzen?`))return;
  state.plan[to]=meal;delete state.plan[from];state.plans[state.currentPlan].plan=state.plan;save();planPage();
}
function onboarding(){
  const goals=['High Protein','Low Calorie','Günstig','Meal Prep','Gesünder essen','Schnell'];
  const methods=['Egal','Pfanne','Ofen','Mikrowelle','Airfryer','Topf'];
  shellOnboarding(`<section class="onboarding">
    <div class="onboarding-mark">🥗</div>
    <div class="eyebrow">WILLKOMMEN BEI KOLDIS</div>
    <h1>Wir machen KOLDIS passend zu dir.</h1>
    <p class="lead">Beantworte ein paar kurze Fragen. Danach bekommst du Rezepte, Wochenpläne und Einkaufslisten, die besser zu deinem Alltag passen.</p>
    <div class="onboarding-progress"><span>1</span><i></i><span>2</span><i></i><span>3</span></div>
    <section class="onboarding-card"><small>DEIN ZIEL</small><h2>Was ist dir beim Essen wichtig?</h2><div class="choice-grid">${goals.map(x=>`<button class="choice ${state.goals.includes(x)?'selected':''}" data-ob-goal="${x}">${x}</button>`).join('')}</div></section>
    <section class="onboarding-card"><small>DEINE VORLIEBEN</small><h2>Was isst du gerne?</h2><div class="tag-edit"><input id="obLike" placeholder="z.B. Hähnchen, Reis, Pasta"><button class="primary" id="obAddLike">Hinzufügen</button></div><div class="chips">${state.likes.map(x=>`<button data-ob-like="${esc(x)}">❤️ ${esc(x)} ×</button>`).join('')}</div><h2>Was möchtest du vermeiden?</h2><div class="tag-edit"><input id="obDis" placeholder="z.B. Pilze"><button class="primary" id="obAddDis">Hinzufügen</button></div><div class="chips">${state.dislikes.map(x=>`<button data-ob-dis="${esc(x)}">❌ ${esc(x)} ×</button>`).join('')}</div></section>
    <section class="onboarding-card"><small>DEIN ALLTAG</small><h2>Wie bereitest du meistens Essen zu?</h2><div class="choice-grid">${methods.map(x=>`<button class="choice ${state.method===x?'selected':''}" data-ob-method="${x}">${x}</button>`).join('')}</div><h2>Wo kaufst du meistens ein?</h2><div class="store-grid">${STORES.map(s=>`<button class="${state.store===s?'selected':''}" data-ob-store="${s}">🛒 ${s}</button>`).join('')}</div></section>
    <section class="onboarding-card"><small>DEIN BUDGET & DEINE MENGE</small><h2>Wie viel möchtest du ungefähr pro Woche ausgeben?</h2><div class="budget-big"><span id="obBudgetValue">${state.budget}</span> €</div><input id="obBudget" type="range" min="25" max="150" step="5" value="${state.budget}"><h2>Wie viele Portionen kochst du normalerweise?</h2><div class="choice-grid">${[1,2,3,4,5,6].map(x=>`<button class="choice ${state.portionDefault===x?'selected':''}" data-ob-portions="${x}">${x} Portion${x===1?'':'en'}</button>`).join('')}</div></section>
    <button class="primary full onboarding-finish" id="obFinish">KOLDIS einrichten →</button>
    <p class="onboarding-note">Du kannst alles später jederzeit im Profil ändern.</p>
  </section>`);
  app.querySelectorAll('[data-ob-goal]').forEach(b=>b.onclick=()=>{const x=b.dataset.obGoal;state.goals=state.goals.includes(x)?state.goals.filter(y=>y!==x):[...state.goals,x];save();onboarding()});
  app.querySelectorAll('[data-ob-method]').forEach(b=>b.onclick=()=>{state.method=b.dataset.obMethod;save();onboarding()});
  app.querySelectorAll('[data-ob-store]').forEach(b=>b.onclick=()=>{state.store=b.dataset.obStore;save();onboarding()});
  app.querySelectorAll('[data-ob-portions]').forEach(b=>b.onclick=()=>{state.portionDefault=+b.dataset.obPortions;save();onboarding()});
  app.querySelector('#obBudget').oninput=e=>app.querySelector('#obBudgetValue').textContent=e.target.value;
  app.querySelector('#obBudget').onchange=e=>{state.budget=+e.target.value;save()};
  app.querySelector('#obAddLike').onclick=()=>{const x=app.querySelector('#obLike').value.trim();if(x&&!state.likes.includes(x))state.likes.push(x);save();onboarding()};
  app.querySelector('#obAddDis').onclick=()=>{const x=app.querySelector('#obDis').value.trim();if(x&&!state.dislikes.includes(x))state.dislikes.push(x);save();onboarding()};
  app.querySelectorAll('[data-ob-like]').forEach(b=>b.onclick=()=>{state.likes=state.likes.filter(x=>x!==b.dataset.obLike);save();onboarding()});
  app.querySelectorAll('[data-ob-dis]').forEach(b=>b.onclick=()=>{state.dislikes=state.dislikes.filter(x=>x!==b.dataset.obDis);save();onboarding()});
  app.querySelector('#obFinish').onclick=()=>{if(!state.store){alert('Bitte wähle noch deinen Markt aus.');return}if(!state.goals.length){alert('Bitte wähle mindestens ein Ziel aus.');return}state.onboardingDone=true;state.page='home';save();syncProfile();render()};
}
function shellOnboarding(content){app.innerHTML=`<main>${content}</main>`}

function shopping(){
  const entries=cartEntries().map(x=>({
    id:Number(x.id),
    portions:Math.max(1,Math.min(12,Number(x.portions)||state.portionDefault||4))
  })).filter(x=>RECIPES.some(r=>r.id===x.id));

  const total=entries.reduce((sum,x)=>{
    const r=RECIPES.find(r=>r.id===x.id);
    return sum+(r?.price||0)*x.portions;
  },0);

  // Zentrale Einkaufsliste: gleiche Zutaten werden zusammengezählt.
  // Auch eigene Einträge werden hier einsortiert und mit Rezeptzutaten kombiniert.
  const grouped=new Map();

  function normalizeName(name){return String(name).trim().toLowerCase().replace(/\s+/g,' ')}
  function addIngredient(raw){
    const original=String(raw).trim();
    if(!original)return;
    const match=original.match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|ml|EL|TL|stk\.?|stück|eier|ei|wraps?|tortillas?)\s+(.+)$/i);

    if(!match){
      const key=normalizeName(original);
      const item=grouped.get(key)||{name:original,amount:null,unit:'',key};
      grouped.set(key,item);
      return;
    }

    let amount=parseFloat(match[1].replace(',','.'));
    let unit=match[2];
    const name=match[3].trim();
    const u=unit.toLowerCase();

    if(u==='kg'){amount*=1000;unit='g'}
    else if(u==='mg'){amount/=1000;unit='g'}
    else if(u==='l'){amount*=1000;unit='ml'}
    else if(['stk.','stk','stück'].includes(u))unit='Stück';
    else if(['ei','eier'].includes(u))unit='Eier';
    else if(['wrap','wraps'].includes(u))unit='Wraps';
    else if(['tortilla','tortillas'].includes(u))unit='Tortillas';
    else if(u==='el')unit='EL';
    else if(u==='tl')unit='TL';

    const key=normalizeName(name)+'|'+unit.toLowerCase();
    const item=grouped.get(key)||{name,amount:0,unit,key};
    if(item.amount===null)item.amount=0;
    item.amount+=amount;
    grouped.set(key,item);
  }

  entries.forEach(entry=>{
    const r=RECIPES.find(x=>x.id===entry.id);
    if(r) scaledIngredients(r,entry.portions).forEach(addIngredient);
  });
  (state.customShopping||[]).forEach(addIngredient);

  const items=[...grouped.values()];
  const formatIngredient=item=>item.amount===null
    ? esc(item.name)
    : `${formatQty(item.amount)} ${esc(item.unit)} ${esc(item.name)}`;

  if(!items.length){
    shell(`<section class="shopping-page">
      <div class="eyebrow">EINKAUF</div>
      <h1>Deine Einkaufsliste</h1>
      <p class="lead">Noch nichts auf deiner Einkaufsliste.</p>
      <div class="shopping-add">
        <h2>➕ Eigene Sachen hinzufügen</h2>
        <div class="shopping-add-row">
          <input id="customShoppingInput" type="text" placeholder="z. B. 2 Flaschen Wasser, Küchenrolle, 5 Eier">
          <button class="primary" id="addCustomShopping">Hinzufügen</button>
        </div>
        <p class="shopping-hint">Du kannst Mengen angeben. Gleiche Zutaten werden automatisch zusammengezählt.</p>
      </div>
      <div class="empty shopping-empty">
        <div style="font-size:3rem">🛒</div>
        <h2>Liste ist noch leer</h2>
        <p>Plane Gerichte oder füge eigene Sachen hinzu.</p>
        <button class="primary" id="goRecipes">🍽️ Gerichte entdecken</button>
      </div>
    </section>`);
    bindShoppingAdd();
    app.querySelector('#goRecipes').onclick=()=>nav('recipes');
    return;
  }

  const rows=items.map((item,index)=>{
    const checked=!!state.shoppingChecked[item.key];
    return `<li class="shopping-item ${checked?'is-checked':''}">
      <label>
        <input type="checkbox" data-shopping-check="${index}" data-shopping-key="${esc(item.key)}" ${checked?'checked':''}>
        <span>${formatIngredient(item)}</span>
      </label>
    </li>`;
  }).join('');

  const customRows=(state.customShopping||[]).map((item,index)=>`<span class="custom-chip">${esc(item)} <button type="button" data-remove-custom="${index}" aria-label="${esc(item)} löschen">×</button></span>`).join('');

  shell(`<section class="shopping-page">
    <div class="eyebrow">EINKAUF</div>
    <div class="shopping-head">
      <div>
        <h1>Deine Einkaufsliste</h1>
        <p class="lead">${items.length} Positionen · ${entries.length} Gerichte · geschätzt ${money(total)} €</p>
      </div>
      <div class="shopping-head-actions">
        <button class="secondary" id="printShopping">🖨️ Drucken</button>
        <button class="secondary" id="clearCart">🗑️ Liste leeren</button>
      </div>
    </div>

    <div class="shopping-add">
      <h2>➕ Eigene Sachen hinzufügen</h2>
      <div class="shopping-add-row">
        <input id="customShoppingInput" type="text" placeholder="z. B. 2 Flaschen Wasser, Küchenrolle, 5 Eier">
        <button class="primary" id="addCustomShopping">Hinzufügen</button>
      </div>
      <p class="shopping-hint">Tipp: <b>5 Eier</b> wird mit Eiern aus deinen Rezepten addiert. Du kannst auch einfach „Küchenrolle“ eingeben.</p>
      ${customRows?`<div class="custom-chips">${customRows}</div>`:''}
    </div>

    <div class="shopping-summary">
      <h2>🛒 Einkauf auf einen Blick</h2>
      <p>Gleiche Zutaten werden automatisch zusammengezählt – damit du im Laden nicht zurücklaufen musst.</p>
    </div>

    <div class="shopping-list" id="shoppingPrintArea">
      <div class="shopping-list-title">
        <h2>Alles einkaufen</h2>
        <span>${items.length} Positionen</span>
      </div>
      <ul>${rows}</ul>
    </div>

    <div class="shopping-total">
      <div><small>GESCHÄTZT</small><strong>${money(total)} €</strong></div>
      <button class="primary" id="backPlan">📅 Zum Wochenplan</button>
    </div>
  </section>`);

  bindShoppingAdd();

  app.querySelectorAll('[data-shopping-check]').forEach(box=>{
    box.onchange=()=>{
      const key=box.dataset.shoppingKey;
      state.shoppingChecked[key]=box.checked;
      save();
      box.closest('.shopping-item')?.classList.toggle('is-checked',box.checked);
    };
  });

  app.querySelectorAll('[data-remove-custom]').forEach(btn=>{
    btn.onclick=()=>{
      const index=Number(btn.dataset.removeCustom);
      state.customShopping.splice(index,1);
      save();
      render();
    };
  });

  app.querySelector('#printShopping').onclick=()=>{
    window.print();
  };

  app.querySelector('#clearCart').onclick=()=>{
    if(confirm('Möchtest du die komplette Einkaufsliste leeren?')){
      state.cart=[];
      state.customShopping=[];
      state.shoppingChecked={};
      save();
      render();
    }
  };

  app.querySelector('#backPlan').onclick=()=>nav('plan');
}

function bindShoppingAdd(){
  const input=app.querySelector('#customShoppingInput');
  const button=app.querySelector('#addCustomShopping');
  if(!input||!button)return;
  const add=()=>{
    const value=input.value.trim();
    if(!value)return;
    if(!Array.isArray(state.customShopping))state.customShopping=[];
    state.customShopping.push(value);
    save();
    render();
    setTimeout(()=>app.querySelector('#customShoppingInput')?.focus(),0);
  };
  button.onclick=add;
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add()}};
}
function profile(){
  const isGuest=authMode==='guest' && !currentUser;
  const accountTitle=isGuest?'Gast':'Angemeldet';
  const accountSub=isGuest
    ? 'Du nutzt KOLDIS ohne Konto. Deine Daten bleiben auf diesem Gerät gespeichert.'
    : (currentUser?.email||'Dein KOLDIS-Konto');
  const accountActions=isGuest
    ? `<button class="primary full" id="loginFromProfile">🔐 Anmelden</button><button class="secondary full" id="signupFromProfile">✨ Konto erstellen</button>`
    : `<button class="secondary full" id="logout">🚪 Abmelden</button>`;

  shell(`<section class="profile">
    <div class="eyebrow">PROFIL</div>
    <h1>Dein KOLDIS-Profil</h1>
    <p class="lead">Deine Einrichtung bleibt gespeichert. Ändere sie jederzeit, wenn sich deine Vorlieben, dein Budget oder dein Alltag ändern.</p>
    <div class="profile-account">
      <small>KONTO</small>
      <strong>${esc(accountTitle)}</strong>
      <span class="account-sub">${esc(accountSub)}</span>
      ${accountActions}
    </div>
    <div class="profile-grid">
      <div><small>WÖCHENTLICHES BUDGET</small><strong>${money(state.budget)} €</strong></div>
      <div><small>MARKT</small><strong>${state.store||'Nicht gewählt'}</strong></div>
      <div><small>ZIELE</small><strong>${state.goals.join(', ')||'Keine'}</strong></div>
      <div><small>ZUBEREITUNG</small><strong>${state.method}</strong></div>
      <div><small>STANDARDMENGE</small><strong>${state.portionDefault||4} Portionen</strong></div>
    </div>
    <button class="secondary full" id="market">🛒 Markt ändern</button>
    <button class="secondary full" id="prefs">⚙️ Vorlieben & Ziele ändern</button>
    <button class="secondary full" id="budget">💶 Budget ändern</button>
  </section>`);

  app.querySelector('#market').onclick=()=>market();
  app.querySelector('#prefs').onclick=()=>prefs();
  app.querySelector('#budget').onclick=()=>budgetPage();
  app.querySelector('#logout')?.addEventListener('click',logoutKoldis);
  app.querySelector('#loginFromProfile')?.addEventListener('click',()=>showAuth());
  app.querySelector('#signupFromProfile')?.addEventListener('click',()=>{
    showAuth();
    setTimeout(()=>app.querySelector('#showSignup')?.click(),0);
  });
}
function market(){shell(`<section class="panel"><div class="eyebrow">MARKT</div><h1>Wo kaufst du ein?</h1><p class="lead">Wähle deinen bevorzugten Markt. Ein echter Preisvergleich kann später angebunden werden.</p><div class="store-grid">${STORES.map(s=>`<button class="${state.store===s?'selected':''}" data-store="${s}">🛒 ${s}</button>`).join('')}</div><button class="secondary full" id="back">← Profil</button></section>`);app.querySelectorAll('[data-store]').forEach(b=>b.onclick=()=>{state.store=b.dataset.store;save();profile()});app.querySelector('#back').onclick=()=>profile()}
function prefs(){shell(`<section class="panel"><div class="eyebrow">PERSÖNLICH</div><h1>Was passt zu dir?</h1><p class="lead">Mehrere Ziele und Vorlieben sind möglich. KOLDIS nutzt sie zur Sortierung und zum Ausschluss.</p><h2>Ziele</h2><div class="choice-grid">${['High Protein','Low Calorie','Günstig','Meal Prep','Gesünder essen','Schnell'].map(x=>`<button class="choice ${state.goals.includes(x)?'selected':''}" data-goal="${x}">${x}</button>`).join('')}</div><h2>Mag ich</h2><div class="tag-edit"><input id="likeInput" placeholder="z.B. Hähnchen"><button class="primary" id="addLike">Hinzufügen</button></div><div class="chips">${state.likes.map(x=>`<button data-like="${x}">❤️ ${x} ×</button>`).join('')}</div><h2>Mag ich nicht</h2><div class="tag-edit"><input id="disInput" placeholder="z.B. Pilze"><button class="primary" id="addDis">Hinzufügen</button></div><div class="chips">${state.dislikes.map(x=>`<button data-dis="${x}">❌ ${x} ×</button>`).join('')}</div><h2>Zubereitung</h2><div class="choice-grid">${['Egal','Pfanne','Ofen','Mikrowelle','Airfryer','Topf'].map(x=>`<button class="choice ${state.method===x?'selected':''}" data-method="${x}">${x}</button>`).join('')}</div><button class="secondary full" id="done">Fertig</button></section>`);app.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{const x=b.dataset.goal;state.goals=state.goals.includes(x)?state.goals.filter(y=>y!==x):[...state.goals,x];save();prefs()});app.querySelectorAll('[data-method]').forEach(b=>b.onclick=()=>{state.method=b.dataset.method;save();prefs()});app.querySelector('#addLike').onclick=()=>{const x=app.querySelector('#likeInput').value.trim();if(x&&!state.likes.includes(x))state.likes.push(x);save();prefs()};app.querySelector('#addDis').onclick=()=>{const x=app.querySelector('#disInput').value.trim();if(x&&!state.dislikes.includes(x))state.dislikes.push(x);save();prefs()};app.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>{state.likes=state.likes.filter(x=>x!==b.dataset.like);save();prefs()});app.querySelectorAll('[data-dis]').forEach(b=>b.onclick=()=>{state.dislikes=state.dislikes.filter(x=>x!==b.dataset.dis);save();prefs()});app.querySelector('#done').onclick=()=>profile()}
function budgetPage(){shell(`<section class="panel"><div class="eyebrow">BUDGET</div><h1>Was möchtest du pro Woche ausgeben?</h1><div class="budget-big"><span id="bv">${state.budget}</span> €</div><input id="br" type="range" min="25" max="150" step="5" value="${state.budget}"><p class="lead">KOLDIS versucht bei der Wochenplanung innerhalb deines Budgets zu bleiben.</p><button class="primary full" id="done">Speichern</button></section>`);app.querySelector('#br').oninput=e=>app.querySelector('#bv').textContent=e.target.value;app.querySelector('#done').onclick=()=>{state.budget=+app.querySelector('#br').value;save();profile()}}
function render(){try{if(!state.onboardingDone){onboarding();return}if(state.page==='home')home();else if(state.page==='recipes')recipesPage();else if(state.page==='plan')planPage();else if(state.page==='shopping')shopping();else if(state.page==='profile')profile();else home()}catch(err){console.error(err);app.innerHTML=`<div class="fatal"><h1>KOLDIS konnte nicht geladen werden.</h1><p>Ein interner Fehler wurde abgefangen. Bitte lade die Seite neu.</p><button onclick="location.reload()">Neu laden</button></div>`}}
bootAuth();
