(function () {
  'use strict';

  var AUTH_USER = atob('Q0FCVw==');
  var AUTH_PASS = atob('Q0BidzIwMjYyMDI2');
  var AUTH_FLAG = 'cabw_painel_authenticated';
  var ATTEMPT_KEY = 'cabw_painel_auth_attempts';
  var MAX_ATTEMPTS = 3;
  var SUPPORT_EMAIL = 'chf.ati.cabw@fab.mil.br';

  function injectStyle() {
    if (document.getElementById('cabw-auth-style')) return;
    var css = '' +
      'html.cabw-auth-pending body{visibility:hidden!important;}' +
      'body.cabw-auth-locked{overflow:hidden!important;}' +
      '#cabw-auth-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(4,18,37,.98),rgba(8,42,72,.96));font-family:Arial,Helvetica,sans-serif;color:#f8fafc;padding:24px;}' +
      '#cabw-auth-card{width:min(440px,96vw);background:#ffffff;color:#152033;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.38);padding:28px;border-top:6px solid #d4af37;}' +
      '#cabw-auth-card h1{font-size:1.45rem;margin:0 0 8px 0;color:#0b2f57;font-weight:800;}' +
      '#cabw-auth-card p{margin:0 0 18px 0;color:#42526a;font-size:.95rem;line-height:1.35;}' +
      '#cabw-auth-card label{display:block;font-size:.82rem;font-weight:700;color:#334155;margin:14px 0 6px 0;}' +
      '#cabw-auth-card input{width:100%;height:44px;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-size:1rem;outline:none;box-sizing:border-box;}' +
      '#cabw-auth-card input:focus{border-color:#0b4f8a;box-shadow:0 0 0 3px rgba(11,79,138,.16);}' +
      '#cabw-auth-card button{width:100%;height:46px;border:0;border-radius:10px;background:#0b4f8a;color:#fff;font-weight:800;font-size:1rem;margin-top:18px;cursor:pointer;}' +
      '#cabw-auth-card button:hover{background:#083e6d;}' +
      '#cabw-auth-card button:disabled{background:#94a3b8;cursor:not-allowed;}' +
      '#cabw-auth-message{min-height:22px;margin-top:12px;color:#b91c1c;font-size:.9rem;font-weight:700;}' +
      '#cabw-auth-help{margin-top:12px;font-size:.82rem;color:#64748b;line-height:1.35;}' +
      '#cabw-auth-help a{color:#0b4f8a;font-weight:700;}';
    var style = document.createElement('style');
    style.id = 'cabw-auth-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function attempts() {
    var n = parseInt(sessionStorage.getItem(ATTEMPT_KEY) || '0', 10);
    return isNaN(n) ? 0 : n;
  }

  function setAttempts(n) {
    sessionStorage.setItem(ATTEMPT_KEY, String(n));
  }

  function isAuthenticated() {
    return sessionStorage.getItem(AUTH_FLAG) === '1';
  }

  function unlockPage() {
    document.documentElement.classList.remove('cabw-auth-pending');
    document.body.classList.remove('cabw-auth-locked');
    var overlay = document.getElementById('cabw-auth-overlay');
    if (overlay) overlay.remove();
  }

  function lockMessage() {
    return 'Credenciais inválidas por 3 tentativas. Contate o mantenedor do painel pelo e-mail ' + SUPPORT_EMAIL + '.';
  }

  function renderAuth() {
    if (isAuthenticated()) {
      unlockPage();
      return;
    }

    injectStyle();
    document.body.classList.add('cabw-auth-locked');

    var overlay = document.createElement('div');
    overlay.id = 'cabw-auth-overlay';
    overlay.innerHTML = '' +
      '<div id="cabw-auth-card" role="dialog" aria-modal="true" aria-labelledby="cabw-auth-title">' +
      '  <h1 id="cabw-auth-title">Acesso ao Painel CABW</h1>' +
      '  <p>Informe as credenciais para acessar os painéis.</p>' +
      '  <form id="cabw-auth-form" autocomplete="off">' +
      '    <label for="cabw-auth-user">Usuário</label>' +
      '    <input id="cabw-auth-user" name="cabw-auth-user" type="text" autocomplete="username" autofocus>' +
      '    <label for="cabw-auth-pass">Senha</label>' +
      '    <input id="cabw-auth-pass" name="cabw-auth-pass" type="password" autocomplete="current-password">' +
      '    <button id="cabw-auth-submit" type="submit">Entrar</button>' +
      '    <div id="cabw-auth-message" aria-live="polite"></div>' +
      '  </form>' +
      '  <div id="cabw-auth-help">Após 3 tentativas inválidas, o acesso nesta sessão será bloqueado.</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.documentElement.classList.remove('cabw-auth-pending');

    var form = document.getElementById('cabw-auth-form');
    var userInput = document.getElementById('cabw-auth-user');
    var passInput = document.getElementById('cabw-auth-pass');
    var msg = document.getElementById('cabw-auth-message');
    var btn = document.getElementById('cabw-auth-submit');

    function applyBlockedState() {
      msg.textContent = lockMessage();
      userInput.disabled = true;
      passInput.disabled = true;
      btn.disabled = true;
      btn.textContent = 'Acesso bloqueado';
      document.getElementById('cabw-auth-help').innerHTML = 'Solicite apoio pelo e-mail <a href="mailto:' + SUPPORT_EMAIL + '">' + SUPPORT_EMAIL + '</a>.';
    }

    if (attempts() >= MAX_ATTEMPTS) {
      applyBlockedState();
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var user = (userInput.value || '').trim();
      var pass = passInput.value || '';
      if (user === AUTH_USER && pass === AUTH_PASS) {
        sessionStorage.setItem(AUTH_FLAG, '1');
        setAttempts(0);
        unlockPage();
        return;
      }
      var n = attempts() + 1;
      setAttempts(n);
      if (n >= MAX_ATTEMPTS) {
        applyBlockedState();
      } else {
        msg.textContent = 'Credenciais inválidas. Tentativas restantes: ' + (MAX_ATTEMPTS - n) + '.';
        passInput.value = '';
        passInput.focus();
      }
    });
  }

  injectStyle();
  document.documentElement.classList.add('cabw-auth-pending');

  if (isAuthenticated()) {
    document.documentElement.classList.remove('cabw-auth-pending');
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAuth);
  } else {
    renderAuth();
  }
})();
