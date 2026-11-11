/* PREPARACAO INATIVA: nao incluir este arquivo nas paginas ate o corte autorizado.
 * O login antigo em auth.js permanece em funcionamento.
 * Esta camada nao protege os arquivos publicos do GitHub Pages.
 */
(function (global) {
  'use strict';
  function requireConfig() {
    var cfg = global.SISCABW_FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId || !cfg.loginEmailDomain ||
        Object.values(cfg).some(function (v) { return typeof v === 'string' && v.indexOf('PREENCHER_') === 0; })) {
      throw new Error('Firebase ainda nao configurado. Login legado preservado.');
    }
    return cfg;
  }
  function usernameToEmail(username, domain) {
    var name = String(username || '').trim().toUpperCase();
    if (!/^[A-Z0-9._-]{1,64}$/.test(name)) throw new Error('Identificador de usuario invalido.');
    if (!/^[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/.test(domain)) throw new Error('Dominio de login invalido.');
    return name.toLowerCase() + '@' + domain.toLowerCase();
  }
  // SDK deve ser carregado apenas na futura pagina de autenticacao.
  // signInWithEmailAndPassword/auth state sao operacoes do Firebase SDK;
  // nao armazenar senha em sessionStorage/localStorage nem em arquivos publicos.
  global.SISCABW_FIREBASE_PREP = Object.freeze({
    config: requireConfig,
    usernameToEmail: usernameToEmail
  });
})(window);
