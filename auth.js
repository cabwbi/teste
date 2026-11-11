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
  var IDLE_MS=8*60*60*1000;
  var ACTIVITY_KEY='siscabw_firebase_last_activity_v1';
  var lastWrite=0;
  function lastActivity(){return Number(localStorage.getItem(ACTIVITY_KEY)||0);}
  function expired(){var t=lastActivity();return !t||Date.now()-t>=IDLE_MS||t>Date.now()+60000;}
  function recordActivity(){if(document.visibilityState==='hidden'||expired())return;var now=Date.now();if(now-lastWrite<30000)return;lastWrite=now;localStorage.setItem(ACTIVITY_KEY,String(now));}
  function redirect(){
    login.searchParams.set('next',next);
    location.replace(login.href);
  }
  import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js').then(function(app){
    return import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js').then(function(sdk){
      var cfg={apiKey:'AIzaSyCW8ouc1TagS_sunV3voxhdWml_UMK83uE',authDomain:'siscabw-teste-cabw.firebaseapp.com',projectId:'siscabw-teste-cabw',appId:'1:940516958506:web:138ea7446949acb0747e53'};
      var auth=sdk.getAuth(app.getApps().length?app.getApp():app.initializeApp(cfg));
      var checking=false;
      function expireSession(){if(checking)return;checking=true;localStorage.removeItem(ACTIVITY_KEY);document.documentElement.style.visibility='hidden';sdk.signOut(auth).then(redirect,redirect);}
      function checkIdle(){if(expired())expireSession();}
      sdk.onAuthStateChanged(auth,function(user){
        if(!user){redirect();return;}
        user.reload().then(function(){
          var current=auth.currentUser;
          if(!current||!current.emailVerified||!((current.email||'').trim().toLowerCase().split('@').length===2 && (current.email||'').trim().toLowerCase().split('@')[0].length>0 && (current.email||'').trim().toLowerCase().split('@')[1]==='fab.mil.br')){
            return sdk.signOut(auth).then(redirect);
          }
          if(expired()){expireSession();return;}
          document.documentElement.style.visibility='';
          ['pointerdown','keydown','touchstart','scroll'].forEach(function(eventName){window.addEventListener(eventName,recordActivity,{passive:true});});
          window.addEventListener('storage',function(e){if(e.key===ACTIVITY_KEY)checkIdle();});
          document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')checkIdle();});
          setInterval(checkIdle,60000);
        }).catch(redirect);
      },redirect);
    });
  }).catch(function(e){console.error('Firebase authentication unavailable',e);redirect();});
})();
