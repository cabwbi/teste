// SISCABW TESTE - gate Firebase para ativacao futura, apos auditoria de todas as paginas.
// Nao incluir em producao ate confirmar cobertura e reversao.
// Nao contem senhas nem autentica dados publicados diretamente no GitHub Pages.
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
const cfg={apiKey:"AIzaSyCW8ouc1TagS_sunV3voxhdWml_UMK83uE",authDomain:"siscabw-teste-cabw.firebaseapp.com",projectId:"siscabw-teste-cabw",appId:"1:940516958506:web:138ea7446949acb0747e53"};
const auth=getAuth(getApps().length?getApp():initializeApp(cfg));
const allowed=email=>typeof email==='string'&&/^[^@\\s]+@fab\\.mil\\.br$/i.test(email.trim());
const login=new URL('firebase/teste-login.html',new URL('../',import.meta.url));
const requested=location.pathname+location.search+location.hash;
document.documentElement.style.visibility='hidden';
onAuthStateChanged(auth,async user=>{
  if(!user){login.searchParams.set('next',requested);location.replace(login.href);return}
  try {
    await user.reload();
    const verified=auth.currentUser;
    if(!verified||!verified.emailVerified||!allowed(verified.email)){
      await signOut(auth);
      login.searchParams.set('next',requested);
      location.replace(login.href);
      return;
    }
    document.documentElement.style.visibility='';
  }catch(e){
    console.error('Firebase session validation failed',e.code||'unknown');
    login.searchParams.set('next',requested);
    location.replace(login.href);
  }
},()=>{login.searchParams.set('next',requested);location.replace(login.href)});
