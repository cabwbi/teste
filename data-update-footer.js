(function () {
  'use strict';

  var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var panels = {
    'index.html': 'entrada',
    'contratos.html': 'contratos',
    'contratos-administrativos.html': 'contratos',
    'contratos-finalisticos.html': 'contratos',
    'fms.html': 'contratos',
    'credito.html': 'credito',
    'action.html': 'credito',
    'consistency.html': 'credito',
    'detail.html': 'credito',
    'ug.html': 'credito',
    'processos.html': 'processos',
    'governanca.html': 'governanca',
    'governanca-cabw-numeros.html': 'governanca',
    'governanca-calendario.html': 'governanca',
    'governanca-paac.html': 'governanca',
    'governanca-pta.html': 'governanca',
    'governanca-rp.html': 'rp',
    'evolution.html': 'rp',
    'suprimento-fundos.html': 'suprimento'
  };
  var panel = panels[page] || 'entrada';

  function formatDate(value, timeZone) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '');
    return date.toLocaleDateString('pt-BR', {
      timeZone: timeZone || 'America/New_York',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function render(status) {
    var sources = status && status.paineis && status.paineis[panel];
    if (!Array.isArray(sources) || !sources.length || !document.body) return;
    var existing = document.getElementById('cabw-data-update-footer');
    if (existing) existing.remove();

    var timeZone = status.fusoHorarioExibicao || 'America/New_York';
    var footer = document.createElement('div');
    footer.id = 'cabw-data-update-footer';
    footer.setAttribute('role', 'contentinfo');
    footer.style.cssText = [
      'box-sizing:border-box',
      'width:100%',
      'max-width:1440px',
      'margin:30px auto 10px',
      'padding:8px 20px 4px',
      'color:#aab2bd',
      'font-size:11px',
      'font-weight:400',
      'line-height:1.45',
      'text-align:center',
      'letter-spacing:.01em'
    ].join(';');

    var items = sources.map(function (source) {
      return source.arquivo + ' — ' + formatDate(source.atualizadoEm, timeZone);
    });
    footer.textContent = 'Atualização dos arquivos utilizados neste painel: ' + items.join(' · ');
    document.body.appendChild(footer);
  }

  function load() {
    fetch('data-update-status.json?v=' + Date.now(), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('Status de atualização indisponível');
        return response.json();
      })
      .then(render)
      .catch(function (error) {
        console.warn('Não foi possível exibir as datas das fontes do painel.', error);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load, { once: true });
  } else {
    load();
  }
})();
