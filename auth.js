/* SISCABW TESTE: autenticacao Firebase compartilhada por todas as paginas que carregam auth.js.
   A sessao e persistida pelo Firebase no mesmo dominio: nao solicitar senha ao navegar.
   ATENCAO: o controle de interface nao protege arquivos publicos no GitHub Pages. */
(function(){
  'use strict';
  document.documentElement.style.visibility='hidden';
  var script=document.currentScript;
  var base=new URL('./',script&&script.src?script.src:location.href);
  var login=new URL('firebase/teste-login.html',base);
  var next=location.pathname+location.search+location.hash;
  function redirect(){
    login.searchParams.set('next',next);
    location.replace(login.href);
  }
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js').then(function(app){
    return import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js').then(function(sdk){
      var cfg={apiKey:'AIzaSyCW8ouc1TagS_sunV3voxhdWml_UMK83uE',authDomain:'siscabw-teste-cabw.firebaseapp.com',projectId:'siscabw-teste-cabw',appId:'1:940516958506:web:138ea7446949acb0747e53'};
      var auth=sdk.getAuth(app.getApps().length?app.getApp():app.initializeApp(cfg));
      sdk.onAuthStateChanged(auth,function(user){
        if(!user){redirect();return;}
        user.reload().then(function(){
          var current=auth.currentUser;
          if(!current||!current.emailVerified||!(/^[^@\\s]+@fab\\.mil\\.br$/i).test((current.email||'').trim())){
            return sdk.signOut(auth).then(redirect);
          }
          document.documentElement.style.visibility='';
        }).catch(redirect);
      },redirect);
    });
  }).catch(function(e){console.error('Firebase authentication unavailable',e);redirect();});
})();
