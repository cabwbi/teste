(function () {
  'use strict';

  const DATA = window.CABW_PROCESSOS_DATA || { meta: {}, summary: {}, materials: [], repairs: [], otherRepairs: [] };
  const pageMode = document.body && document.body.dataset.processPage;
  const $ = (selector, scope) => (scope || document).querySelector(selector);
  const $$ = (selector, scope) => Array.from((scope || document).querySelectorAll(selector));
  const money = value => 'US$ ' + Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number = value => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const percentage = value => Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const norm = value => String(value || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function supplierNameFromLabel(code, label) {
    const normalizedCode = String(code || '').trim();
    const normalizedLabel = String(label || '').trim();
    if (!normalizedCode || !normalizedLabel || normalizedLabel === normalizedCode) return '';
    const prefix = `${normalizedCode} - `;
    return normalizedLabel.toLocaleUpperCase('pt-BR').startsWith(prefix.toLocaleUpperCase('pt-BR'))
      ? normalizedLabel.slice(prefix.length).trim()
      : '';
  }

  function buildSupplierNames(rows) {
    const names = new Map();
    rows.forEach(row => {
      const code = String(row.empresaVencedoraCodigo || '').trim();
      const name = supplierNameFromLabel(code, row.empresaVencedora);
      if (code && name && (!names.has(code) || name.length > names.get(code).length)) names.set(code, name);
    });
    return names;
  }

  function normalizeSupplierLabels(rows, supplierNames) {
    rows.forEach(row => {
      const code = String(row.empresaVencedoraCodigo || '').trim();
      if (!code) return;
      const existingName = supplierNameFromLabel(code, row.empresaVencedora);
      const name = supplierNames.get(code) || existingName || 'Nome não cadastrado na base';
      row.empresaVencedora = `${code} - ${name}`;
    });
  }

  function dateTime(value) {
    if (!value) return 'Data de geração não informada';
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    return match ? `Dados gerados em ${match[3]}/${match[2]}/${match[1]} às ${match[4]}:${match[5]}` : `Dados gerados em ${value}`;
  }

  function initLanding() {
    const materials = DATA.summary.materiais2026 || DATA.summary.materials2026 || {};
    const repairs = DATA.summary.reparos2026 || {};
    const values = {
      materialsCount: number(materials.requisicoes),
      materialsValue: money(materials.valorEmpenhadoUsd),
      repairsCount: number(repairs.requisicoes),
      repairsValue: money(repairs.valorEmpenhadoUsd),
    };
    Object.entries(values).forEach(([key, value]) => {
      $$(`[data-summary="${key}"]`).forEach(element => { element.textContent = value; element.title = value; });
    });
    $$('[data-generated-at]').forEach(element => { element.textContent = dateTime(DATA.meta.geradoEm); });
  }

  const FILTERS = [
    ['om', 'OM Requisitante'],
    ['projetoLabel', 'Projeto'],
    ['anoAbertura', 'Ano'],
    ['faixaValor', 'Faixa de Valor'],
    ['tipoRequisicao', 'Tipo da requisição'],
    ['grandeComando', 'Grande Comando'],
    ['empresaVencedora', 'Empresa vencedora'],
    ['empresaFabricante', 'Empresa fabricante'],
    ['descricao', 'Descrição do item'],
    ['partNumber', 'Part Number'],
    ['requisicao', 'Número da requisição'],
    ['certame', 'Número do certame SILOMS'],
    ['status', 'Situação da requisição'],
    ['validadeMapa', 'Validade do mapa comparativo'],
    ['po', 'Número da ordem de compra'],
    ['situacaoRetorno', 'Situação de retorno do item'],
    ['situacaoReparavel', 'Situação do reparável'],
  ];
  const RANGE_ORDER = ['Até US$ 10 mil', 'US$ 10 mil a US$ 50 mil', 'US$ 50 mil a US$ 250 mil', 'US$ 250 mil a US$ 1 milhão', 'Acima de US$ 1 milhão'];
  const LOGISTICS_STAGES = [
    ['not-committed', 'Requisição de reparo não empenhada'],
    ['committed-transit', 'Reparável no Brasil ou em trânsito para o Exterior'],
    ['dispatched-repairer', 'Reparável expedido ao reparador'],
    ['received-cab', 'Reparável recebido no Depósito da CAB'],
    ['shipped-brazil', 'Reparável embarcado para o Brasil'],
    ['received-requester', 'Reparável recebido no requisitante'],
    ['exceptions', 'Canceladas, suspensas ou recebidas parcialmente'],
  ];
  let sourceRows = [];
  let filterSourceRows = [];
  let otherRepairRows = [];
  let filteredRows = [];
  let filteredOtherRepairRows = [];
  let currentPage = 1;
  const pageSize = 25;
  let modalReturnFocus = null;
  let dispatchModalGroup = 'compraer';
  let selectedLogisticsStages = new Set();
  let activeAnalyticalFilters = [];

  function mapValidityValue(row) {
    if (!norm(row && row.status).includes('mapa aprovado')) return '';
    const opened = Date.parse(`${String(row.dataAbertura || '').slice(0, 10)}T00:00:00Z`);
    const reference = Date.parse(`${String(DATA.meta.dataReferenciaPrazos || DATA.meta.geradoEm || '').slice(0, 10)}T00:00:00Z`);
    if (!Number.isFinite(opened) || !Number.isFinite(reference)) return '';
    return Math.floor((reference - opened) / 86400000) <= 60 ? 'Válido' : 'Vencido';
  }

  function fieldValue(row, field) {
    return field === 'validadeMapa' ? mapValidityValue(row) : String(row[field] || '').trim();
  }

  function companyChartLabel(label) {
    const match = String(label || '').match(/^([^\s-]+)\s*-\s*(.+)$/);
    if (!match) return String(label || '').length > 20 ? `${String(label).slice(0, 20).trimEnd()}...` : String(label || '');
    const company = match[2].trim();
    return `${match[1]} - ${company.length > 20 ? `${company.slice(0, 20).trimEnd()}...` : company}`;
  }

  function unique(rows, field) {
    const values = Array.from(new Set(rows.map(row => fieldValue(row, field)).filter(Boolean)));
    if (field === 'faixaValor') return RANGE_ORDER.filter(value => values.includes(value));
    return values.sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }

  function selectedValues(select) {
    return select ? Array.from(select.selectedOptions).map(option => option.value) : [];
  }

  function buttonText(select) {
    const chosen = Array.from(select.selectedOptions).map(option => option.textContent.trim());
    if (!chosen.length) return 'Todas as opções';
    if (chosen.length <= 2) return chosen.join(', ');
    return `${chosen.length} selecionadas`;
  }

  function syncMulti(select, wrapper) {
    const button = $('.proc-multi__button', wrapper);
    button.textContent = buttonText(select);
    button.title = Array.from(select.selectedOptions).map(option => option.textContent.trim()).join(', ');
    const selected = new Set(selectedValues(select));
    $$('.proc-multi__option input', wrapper).forEach(input => { input.checked = selected.has(input.value); });
  }

  function buildMulti(select) {
    const wrapper = document.createElement('div');
    wrapper.className = 'proc-multi';
    const options = Array.from(select.options);
    wrapper.innerHTML = `
      <button class="proc-multi__button" type="button" aria-haspopup="listbox" aria-expanded="false">Todas as opções</button>
      <div class="proc-multi__menu">
        <div class="proc-multi__search"><input type="search" autocomplete="off" placeholder="Pesquisar opção..."><button type="button" data-multi-action="apply">Aplicar</button></div>
        <div class="proc-multi__actions"><button type="button" data-multi-action="all">Marcar todas</button><button type="button" data-multi-action="clear">Limpar</button></div>
        <div class="proc-multi__options">${options.map(option => `<label class="proc-multi__option"><input type="checkbox" value="${esc(option.value)}"><span>${esc(option.textContent)}</span></label>`).join('')}</div>
      </div>`;
    select.insertAdjacentElement('afterend', wrapper);
    const button = $('.proc-multi__button', wrapper);
    const menu = $('.proc-multi__menu', wrapper);
    const search = $('.proc-multi__search input', wrapper);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      $$('.proc-multi.open').forEach(other => { if (other !== wrapper) other.classList.remove('open'); });
      wrapper.classList.toggle('open');
      wrapper.classList.remove('align-right');
      button.setAttribute('aria-expanded', wrapper.classList.contains('open') ? 'true' : 'false');
      if (wrapper.classList.contains('open')) {
        setTimeout(() => { if (menu.getBoundingClientRect().right > window.innerWidth - 14) wrapper.classList.add('align-right'); }, 0);
      }
    });
    menu.addEventListener('click', event => event.stopPropagation());
    search.addEventListener('input', () => {
      const query = norm(search.value);
      $$('.proc-multi__option', wrapper).forEach(label => { label.hidden = !!query && !norm(label.textContent).includes(query); });
    });
    $('[data-multi-action="all"]', wrapper).addEventListener('click', () => {
      $$('.proc-multi__option:not([hidden]) input', wrapper).forEach(input => { input.checked = true; });
    });
    $('[data-multi-action="clear"]', wrapper).addEventListener('click', () => {
      $$('.proc-multi__option input', wrapper).forEach(input => { input.checked = false; });
      search.value = '';
      $$('.proc-multi__option', wrapper).forEach(label => { label.hidden = false; });
    });
    $('[data-multi-action="apply"]', wrapper).addEventListener('click', () => {
      const checked = new Set($$('.proc-multi__option input:checked', wrapper).map(input => input.value));
      Array.from(select.options).forEach(option => { option.selected = checked.has(option.value); });
      syncMulti(select, wrapper);
      wrapper.classList.remove('open');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    syncMulti(select, wrapper);
  }

  function populateFilters() {
    FILTERS.forEach(([field]) => {
      const select = $(`select[data-filter="${field}"]`);
      if (!select) return;
      select.multiple = true;
      unique(filterSourceRows, field).forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
      buildMulti(select);
      select.addEventListener('change', applyFilters);
    });
    document.addEventListener('click', () => $$('.proc-multi.open').forEach(wrapper => wrapper.classList.remove('open')));
  }

  function logisticsStageId(row) {
    const status = norm(row && row.status);
    if (!status) return '';
    if (status.includes('cancel') || status.includes('suspens') || status.includes('recebido parcial')) return 'exceptions';
    if (status.includes('mapa aprovado')) return 'not-committed';
    if (status.includes('empenho gerado') || status.includes('empenho aprovado')) return 'committed-transit';
    if (status.includes('reparav') && status.includes('exp') && (status.includes('fornec') || status.includes('reparador'))) return 'dispatched-repairer';
    if ((status.startsWith('d-') && status.includes('recebido')) || (status.includes('recebido') && (status.includes('comissao') || status.includes('deposito da cab')))) return 'received-cab';
    if (status.includes('embarcado')) return 'shipped-brazil';
    if (status.includes('encerrado') || status.includes('recebido no solicitante') || status.includes('recebido no requisitante') || status.includes('volume no solicitante')) return 'received-requester';
    return '';
  }

  function renderLogisticsFilter(analyticalRows) {
    if (pageMode !== 'repairs') return;
    const counts = new Map(LOGISTICS_STAGES.map(([id]) => [id, 0]));
    analyticalRows.forEach(row => {
      const stage = logisticsStageId(row);
      if (stage) counts.set(stage, (counts.get(stage) || 0) + 1);
    });
    $$('[data-logistics-stage]').forEach(button => {
      const stage = button.dataset.logisticsStage;
      const active = selectedLogisticsStages.has(stage);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      const badge = $('[data-logistics-count]', button);
      if (badge) badge.textContent = number(counts.get(stage) || 0);
    });
    const selection = $('#procLogisticsSelection');
    if (selection) {
      const labels = LOGISTICS_STAGES.filter(([id]) => selectedLogisticsStages.has(id)).map(([, label]) => label);
      selection.textContent = labels.length ? `${number(labels.length)} opção(ões) selecionada(s): ${labels.join(' · ')}` : 'Todas as etapas do fluxo consideradas';
    }
  }

  function initLogisticsFilter() {
    if (pageMode !== 'repairs') return;
    const status = $('#procLogisticsStatus');
    if (status) {
      status.textContent = 'Fluxo logístico ativo';
      status.classList.add('is-ready');
    }
    document.body.dataset.logisticsFilterReady = 'true';
    $$('[data-logistics-stage]').forEach(button => {
      button.addEventListener('click', () => {
        const stage = button.dataset.logisticsStage;
        if (selectedLogisticsStages.has(stage)) selectedLogisticsStages.delete(stage);
        else selectedLogisticsStages.add(stage);
        applyFilters();
      });
    });
  }

  function applyFilters() {
    activeAnalyticalFilters = FILTERS.map(([field]) => {
      const select = $(`select[data-filter="${field}"]`);
      return [field, new Set(selectedValues(select))];
    }).filter(([, values]) => values.size);
    const analyticalRows = sourceRows.filter(matchesCurrentAnalyticalFilters);
    filteredRows = analyticalRows.filter(matchesCurrentLogisticsFilter);
    filteredOtherRepairRows = otherRepairRows.filter(row => matchesCurrentAnalyticalFilters(row) && matchesCurrentLogisticsFilter(row));
    renderLogisticsFilter(analyticalRows);
    currentPage = 1;
    renderAll();
  }

  function resetFilters() {
    selectedLogisticsStages.clear();
    $$('select[data-filter]').forEach(select => {
      Array.from(select.options).forEach(option => { option.selected = false; });
      const wrapper = select.nextElementSibling;
      if (wrapper && wrapper.classList.contains('proc-multi')) syncMulti(select, wrapper);
    });
    applyFilters();
  }

  function sum(rows, field) { return rows.reduce((total, row) => total + Number(row[field] || 0), 0); }
  function countDistinct(rows, field) { return new Set(rows.map(row => row[field]).filter(Boolean)).size; }
  function countReturn(rows, label) { return sum(rows.filter(row => row.situacaoRetorno === label), 'quantidade'); }
  function isDispatchedToSupplier(row) {
    const status = norm(row.status);
    return row.reparavelExpedidoAoFornecedor === true || (status.startsWith('l-') && status.includes('reparav') && status.includes('fornec'));
  }
  function matchesCurrentAnalyticalFilters(row) {
    return activeAnalyticalFilters.every(([field, values]) => values.has(fieldValue(row, field)));
  }
  function matchesCurrentLogisticsFilter(row) {
    return !selectedLogisticsStages.size || selectedLogisticsStages.has(logisticsStageId(row));
  }
  function dispatchedRowsForCurrentFilters(group) {
    const rows = group === 'other' ? otherRepairRows : sourceRows;
    return rows.filter(row => matchesCurrentAnalyticalFilters(row) && matchesCurrentLogisticsFilter(row) && isDispatchedToSupplier(row));
  }
  function economy(rows) {
    const comparable = rows.filter(row => Number(row.valorReferenciaUsd || 0) > 0);
    const reference = sum(comparable, 'valorReferenciaUsd');
    const total = sum(comparable, 'valorEmpenhadoUsd');
    const absolute = reference - total;
    const percent = reference ? absolute / reference * 100 : 0;
    return { absolute, percent, comparable: comparable.length };
  }

  function requisitionsWithFutureDpe(rows) {
    const now = new Date();
    const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    return new Set(rows.filter(row => {
      const status = norm(row.status);
      const dpe = String(row.dpe || '').slice(0, 10);
      return status.includes('empenho aprovado') && /^\d{4}-\d{2}-\d{2}$/.test(dpe) && dpe > today;
    }).map(row => String(row.requisicao || row.id || '').trim()).filter(Boolean)).size;
  }

  function kpiCard(label, value, icon, note, action) {
    const isDispatch = String(action || '').startsWith('repair-dispatched-');
    const heading = isDispatch
      ? `<div class="proc-kpi__heading"><span class="proc-kpi__icon"><i class="bi ${esc(icon)}"></i></span><div class="proc-kpi__label">${esc(label)}</div></div>`
      : `<div class="proc-kpi__top"><span class="proc-kpi__icon"><i class="bi ${esc(icon)}"></i></span></div><div class="proc-kpi__label">${esc(label)}</div>`;
    const content = `${heading}<strong title="${esc(value)}">${esc(value)}</strong><small>${esc(note || 'Conforme filtros aplicados')}</small>`;
    if (action) return `<button class="proc-kpi proc-kpi--action${isDispatch ? ' proc-kpi--dispatch' : ''}" type="button" data-kpi-action="${esc(action)}" aria-haspopup="dialog">${content}</button>`;
    return `<article class="proc-kpi">${content}</article>`;
  }

  function renderKpis() {
    const container = $('#procKpis');
    if (!container) return;
    let dispatchKpis = [];
    const base = [
      ['Quantidade de requisições', number(filteredRows.length), 'bi-file-earmark-text', 'Registros no escopo selecionado'],
      [pageMode === 'materials' ? 'Valor total homologado' : 'Valor total empenhado', money(sum(filteredRows, 'valorEmpenhadoUsd')), 'bi-currency-dollar', pageMode === 'materials' ? 'Soma do valor homologado das requisições' : 'Soma do valor das requisições'],
      ['Requisitantes atendidos', number(countDistinct(filteredRows, 'om')), 'bi-buildings', 'OMs requisitantes distintas'],
    ];
    const saving = economy(filteredRows);
    base.push([
      'Economia da licitação',
      money(saving.absolute),
      'bi-graph-down-arrow',
      saving.comparable
        ? `${saving.percent >= 0 ? 'Redução' : 'Acréscimo'} de ${number(Math.abs(saving.percent))}% sobre o valor de referência`
        : 'Sem valor de referência no recorte',
    ]);
    if (pageMode === 'materials') {
      base.push(['Quantidade de requisições atrasadas', number(requisitionsWithFutureDpe(filteredRows)), 'bi-clock-history', 'Requisições em Empenho aprovado com DPE posterior à data de hoje']);
    } else {
      const repaired = countReturn(filteredRows, 'Reparado');
      const ber = countReturn(filteredRows, 'BER');
      const bpr = countReturn(filteredRows, 'BPR');
      const asIs = countReturn(filteredRows, 'AS IS');
      const completed = repaired + ber + bpr + asIs;
      const successRate = completed ? repaired / completed * 100 : 0;
      base.push(
        ['Quantidade de itens', number(sum(filteredRows, 'quantidade')), 'bi-box-seam', 'Soma das quantidades requisitadas'],
        ['BER', number(ber), 'bi-exclamation-octagon', 'Itens classificados como BER'],
        ['BPR', number(bpr), 'bi-wrench-adjustable', 'Itens classificados como BPR'],
        ['AS IS', number(asIs), 'bi-box-arrow-up-right', 'Itens classificados como AS IS'],
        ['Reparados', number(repaired), 'bi-check2-circle', 'Itens com retorno reparado'],
        ['Em processo', number(countReturn(filteredRows, 'Em processo')), 'bi-hourglass-split', 'Condição de retorno ainda em branco'],
        ['Percentual de sucesso', percentage(successRate), 'bi-bullseye', completed ? `${number(repaired)} reparado(s) de ${number(completed)} item(ns) concluído(s)` : 'Sem itens concluídos no recorte'],
      );
      const dispatchedCompraer = dispatchedRowsForCurrentFilters('compraer');
      const dispatchedOther = dispatchedRowsForCurrentFilters('other');
      dispatchKpis = [
        ['Reparáveis Expedidos ao fornecedor - ComprAer', number(dispatchedCompraer.length), 'bi-truck', 'Recalculado pelo recorte atual · clique para consultar', 'repair-dispatched-compraer'],
        ['Reparáveis expedidos ao fornecedor - Outras fontes', number(dispatchedOther.length), 'bi-tools', 'Recalculado pelo recorte atual · clique para consultar', 'repair-dispatched-other'],
      ];
    }
    const dispatchGroup = dispatchKpis.length
      ? `<section class="proc-kpi-pair" aria-label="Indicadores analisados em conjunto">${dispatchKpis.map(item => kpiCard(...item)).join('')}</section>`
      : '';
    container.innerHTML = base.map(item => kpiCard(...item)).join('') + dispatchGroup;
    $$('[data-kpi-action^="repair-dispatched-"]', container).forEach(button => button.addEventListener('click', openDispatchModal));
  }

  function topBuckets(rows, key, valueField, limit) {
    const map = new Map();
    rows.forEach(row => {
      const label = String(row[key] || 'Não informado').trim() || 'Não informado';
      const value = valueField ? Number(row[valueField] || 0) : 1;
      map.set(label, (map.get(label) || 0) + value);
    });
    const ordered = Array.from(map, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    const selected = ordered.slice(0, limit || 14);
    if (ordered.length > selected.length) selected.push({ label: 'Outros', value: ordered.slice(selected.length).reduce((total, item) => total + item.value, 0) });
    return selected.reverse();
  }

  function drawBar(id, rows, key, valueField, color, isMoney) {
    const element = document.getElementById(id);
    if (!element) return;
    if (!window.Plotly) { element.innerHTML = '<p class="proc-empty">Biblioteca de gráficos não carregada.</p>'; return; }
    const items = topBuckets(rows, key, valueField, 14);
    const x = items.map(item => item.value);
    const fullLabels = items.map(item => item.label);
    const y = fullLabels.map(label => {
      if (pageMode !== 'materials' || key !== 'empresaVencedora' || label === 'Outros') return label;
      return companyChartLabel(label);
    });
    Plotly.react(element, [{
      type: 'bar', orientation: 'h', x, y,
      marker: { color },
      customdata: x.map((value, index) => [isMoney ? money(value) : number(value), fullLabels[index]]),
      hovertemplate: '<b>%{customdata[1]}</b><br>%{customdata[0]}<extra></extra>',
    }], {
      margin: { l: 185, r: 24, t: 18, b: 42 },
      xaxis: { gridcolor: '#e6edf5', zeroline: false, tickformat: isMoney ? '$,.2s' : ',.0f', automargin: true },
      yaxis: { automargin: true, tickfont: { size: 10 } },
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#fff',
      font: { family: 'Montserrat, Arial, sans-serif', color: '#244160' },
      showlegend: false,
    }, { displayModeBar: false, responsive: true });
  }

  function drawReturnByCompany() {
    const element = document.getElementById('chartRetornoEmpresa');
    if (!element || !window.Plotly) return;
    const companyGroups = new Map();
    filteredRows.forEach(row => {
      const code = String(row.empresaVencedoraCodigo || '').trim();
      const rawLabel = String(row.empresaVencedora || '').trim();
      if ((!code && !rawLabel) || rawLabel === 'Não informado') return;
      const key = code || rawLabel;
      if (!companyGroups.has(key)) companyGroups.set(key, { key, label: rawLabel || code, rows: [] });
      const group = companyGroups.get(key);
      group.rows.push(row);
      if (rawLabel.length > group.label.length) group.label = rawLabel;
    });
    const companyList = Array.from(companyGroups.values())
      .sort((a, b) => b.rows.length - a.rows.length || a.label.localeCompare(b.label, 'pt-BR', { numeric: true }))
      .reverse();
    const companies = companyList.map(group => group.label);
    if (!companies.length) {
      Plotly.purge(element);
      element.style.height = '425px';
      element.innerHTML = '<p class="proc-empty">Nenhuma empresa contratada no recorte atual.</p>';
      return;
    }
    const chartHeight = Math.max(500, companies.length * 30 + 150);
    element.style.height = `${chartHeight}px`;
    const statuses = ['BER', 'BPR', 'AS IS', 'Reparado', 'Em processo', 'Outros'];
    const knownStatuses = new Set(statuses.filter(status => status !== 'Outros'));
    const colors = ['#b4232f', '#ef8b27', '#758399', '#17805c', '#1769aa', '#6f7783'];
    const companyTotals = new Map(companyList.map(group => [group.label, group.rows.length]));
    const sumUniquePurchaseOrders = rows => {
      const orders = new Map();
      rows.forEach(row => {
        const po = String(row.po || '').trim();
        if (po && po !== 'Não informado') orders.set(po, Number(row.valorOrdemCompraUsd || 0));
      });
      return Array.from(orders.values()).reduce((total, value) => total + value, 0);
    };
    const traces = statuses.map((status, index) => {
      const groups = companyList.map(group => group.rows.filter(row => status === 'Outros' ? !knownStatuses.has(row.situacaoRetorno) : row.situacaoRetorno === status));
      const counts = groups.map(rows => rows.length);
      return {
        type: 'bar', orientation: 'h', name: status, y: companies, x: counts,
        customdata: counts.map((count, companyIndex) => [
          companyTotals.get(companies[companyIndex]) ? count / companyTotals.get(companies[companyIndex]) * 100 : 0,
          money(sumUniquePurchaseOrders(groups[companyIndex])),
        ]),
        marker: { color: colors[index] },
        hovertemplate: `<b>%{y}</b><br>${status}: %{x} requisição(ões)<br>%{customdata[0]:.1f}%<br>Valor das OCs: %{customdata[1]}<extra></extra>`,
      };
    });
    const annotations = companies.map(company => {
      const total = companyTotals.get(company) || 0;
      return {
        x: 101, y: company, xref: 'x', yref: 'y', showarrow: false, xanchor: 'left',
        text: `<b>${number(total)} ${total === 1 ? 'requisição' : 'requisições'}</b>`,
        font: { size: 10, color: '#244160' },
      };
    });
    Plotly.react(element, traces, {
      barmode: 'stack', barnorm: 'percent',
      height: chartHeight,
      margin: { l: 210, r: 116, t: 24, b: 50 },
      xaxis: { title: 'Percentual dentro da empresa', ticksuffix: '%', range: [0, 118], tickvals: [0, 25, 50, 75, 100], gridcolor: '#e6edf5' },
      yaxis: { automargin: true, tickfont: { size: 10 } },
      legend: { orientation: 'h', y: 1.13, x: 0 },
      annotations,
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: '#fff',
      font: { family: 'Montserrat, Arial, sans-serif', color: '#244160' },
    }, { displayModeBar: false, responsive: true });
  }

  function renderCharts() {
    drawBar('chartValorOm', filteredRows, 'om', 'valorEmpenhadoUsd', '#00569b', true);
    drawBar('chartQtdOm', filteredRows, 'om', null, '#4f7eaa', false);
    drawBar('chartQtdEmpresa', filteredRows, 'empresaVencedora', null, '#d4a900', false);
    drawBar('chartValorEmpresa', filteredRows, 'empresaVencedora', 'valorEmpenhadoUsd', '#e1b900', true);
    drawBar('chartQtdProjeto', filteredRows, 'projetoLabel', null, '#48728f', false);
    drawBar('chartValorProjeto', filteredRows, 'projetoLabel', 'valorEmpenhadoUsd', '#0b7a75', true);
    drawBar('chartQtdSituacao', filteredRows, 'status', null, '#6f42c1', false);
    drawBar('chartValorSituacao', filteredRows, 'status', 'valorEmpenhadoUsd', '#8b5cc7', true);
    if (pageMode === 'repairs') drawReturnByCompany();
  }

  function dateBr(value) {
    const parts = String(value || '').slice(0, 10).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : '—';
  }

  function shortenedText(value, limit) {
    const full = String(value || 'Não informado').replace(/\s+/g, ' ').trim();
    return full.length > limit ? `${full.slice(0, limit - 3).trimEnd()}...` : full;
  }

  function dispatchDescriptionCell(row) {
    const full = String(row.descricaoCompleta || row.descricao || 'Não informado').replace(/\s+/g, ' ').trim();
    const short = shortenedText(full, 76);
    return `<span class="proc-modal__description" title="${esc(full)}">${esc(short)}</span>`;
  }

  function dispatchDaysCell(row, colorScale) {
    if (!isDispatchedToSupplier(row)) return '—';
    const rawDays = row.diasDesdeExpedicao;
    const days = rawDays === null || rawDays === undefined || rawDays === '' ? NaN : Number(rawDays);
    if (!Number.isFinite(days)) return '<span class="proc-age proc-age--missing">Data não informada</span>';
    let style = '';
    if (colorScale) {
      const { min, max } = colorScale;
      const ratio = max === min ? .5 : Math.max(0, Math.min(1, (days - min) / (max - min)));
      const hue = Math.round(118 * (1 - ratio));
      style = ` style="--proc-age-hue:${hue}"`;
    }
    const date = dateBr(row.dataExpedicaoReparavel);
    return `<span class="proc-age${colorScale ? ' proc-age--scale' : ''}"${style}><strong>${esc(number(days))} dias</strong>${colorScale ? `<small>Desde ${esc(date)}</small>` : ''}</span>`;
  }

  function renderDispatchModal() {
    const body = $('#repairDispatchBody');
    const info = $('#repairDispatchInfo');
    if (!body || !info) return;
    const isOtherGroup = dispatchModalGroup === 'other';
    const title = $('#repairDispatchTitle');
    if (title) title.textContent = isOtherGroup ? 'Reparáveis expedidos ao fornecedor - Outras fontes' : 'Reparáveis Expedidos ao fornecedor - ComprAer';
    const rows = dispatchedRowsForCurrentFilters(isOtherGroup ? 'other' : 'compraer').sort((a, b) => Number(b.diasDesdeExpedicao ?? -1) - Number(a.diasDesdeExpedicao ?? -1));
    const validDays = rows.map(row => row.diasDesdeExpedicao).filter(value => value !== null && value !== undefined && value !== '').map(Number).filter(Number.isFinite);
    const colorScale = { min: validDays.length ? Math.min(...validDays) : 0, max: validDays.length ? Math.max(...validDays) : 0 };
    info.textContent = `${number(rows.length)} requisição(ões) no recorte atual · data de referência: ${dateBr(DATA.meta.dataReferenciaPrazos)}`;
    body.innerHTML = rows.length ? rows.map(row => `<tr>
      <td><strong>${esc(row.requisicao)}</strong></td>
      <td><strong>${esc(isOtherGroup ? (row.contratoOrigem || 'Não localizado') : (row.certame || 'Não informado'))}</strong></td>
      <td>${dispatchDescriptionCell(row)}</td>
      <td><span class="proc-status">${esc(row.reparoAprovado || 'Não informado')}</span></td>
      <td class="proc-table__money">${esc(money(row.valorEmpenhadoUsd))}</td>
      <td>${esc(row.empresaVencedora)}</td>
      <td>${dispatchDaysCell(row, colorScale)}</td>
      <td class="proc-modal__observation">${esc(row.observacaoRequisicao || 'Não informado')}</td>
    </tr>`).join('') : '<tr><td colspan="8" class="proc-empty">Nenhuma requisição nessa situação corresponde aos filtros aplicados.</td></tr>';
  }

  function openDispatchModal(event) {
    const modal = $('#repairDispatchModal');
    if (!modal) return;
    modalReturnFocus = event?.currentTarget || document.activeElement;
    dispatchModalGroup = event?.currentTarget?.dataset.kpiAction === 'repair-dispatched-other' ? 'other' : 'compraer';
    renderDispatchModal();
    modal.hidden = false;
    document.body.classList.add('proc-modal-open');
    $('#repairDispatchClose')?.focus();
  }

  function closeDispatchModal() {
    const modal = $('#repairDispatchModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('proc-modal-open');
    modalReturnFocus?.focus?.();
  }

  function initDispatchModal() {
    const modal = $('#repairDispatchModal');
    if (!modal) return;
    $$('[data-modal-close]', modal).forEach(element => element.addEventListener('click', closeDispatchModal));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDispatchModal(); });
  }

  function tableRow(row) {
    const fullDescription = String(row.descricao || 'Não informado').replace(/\s+/g, ' ').trim();
    const base = `
      <td><strong>${esc(row.requisicao)}</strong></td>
      <td>${esc(row.certame)}</td>
      <td class="proc-table__desc" title="${esc(fullDescription)}">${esc(shortenedText(fullDescription, 120))}</td>
      <td>${esc(number(row.quantidade))}</td>
      <td>${esc(row.empresaFabricante)}</td>
      <td>${esc(row.empresaVencedora)}</td>
      <td>${esc(row.po)}</td>
      <td class="proc-table__money">${esc(money(row.valorEmpenhadoUsd))}</td>
      <td class="proc-table__money">${esc(money(row.saldoPoUsd))}</td>
      <td><span class="proc-status${row.atrasada ? ' proc-status--late' : ''}">${esc(row.status)}</span></td>
      <td>${esc(dateBr(row.dpe))}</td>`;
    if (pageMode === 'repairs') return `<tr>${base}<td><span class="proc-status">${esc(row.situacaoRetorno)}</span></td><td>${esc(row.situacaoReparavel)}</td><td>${dispatchDaysCell(row)}</td></tr>`;
    return `<tr>${base}</tr>`;
  }

  function renderTable() {
    const body = $('#procTableBody');
    if (!body) return;
    const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * pageSize;
    const rows = filteredRows.slice(start, start + pageSize);
    const columns = pageMode === 'repairs' ? 14 : 11;
    body.innerHTML = rows.length ? rows.map(tableRow).join('') : `<tr><td colspan="${columns}" class="proc-empty">Nenhuma requisição corresponde aos filtros selecionados.</td></tr>`;
    const info = $('#procTableInfo');
    if (info) info.textContent = filteredRows.length ? `Exibindo ${start + 1}–${Math.min(start + pageSize, filteredRows.length)} de ${number(filteredRows.length)} requisições` : 'Nenhuma requisição encontrada';
    const current = $('#procPageCurrent');
    if (current) current.textContent = `${currentPage} / ${pages}`;
    const previous = $('#procPagePrev');
    const next = $('#procPageNext');
    if (previous) previous.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= pages;
  }

  function reportFiltersHtml() {
    const blocks = FILTERS.map(([field, label]) => {
      const select = $(`select[data-filter="${field}"]`);
      if (!select) return '';
      const values = selectedValues(select);
      return `<strong>${esc(label)}:</strong> ${esc(values.length ? values.join(', ') : 'Todas as opções')}`;
    }).filter(Boolean);
    if (pageMode === 'repairs') {
      const flowLabels = LOGISTICS_STAGES.filter(([id]) => selectedLogisticsStages.has(id)).map(([, label]) => label);
      blocks.push(`<strong>Fluxo logístico:</strong> ${esc(flowLabels.length ? flowLabels.join(', ') : 'Todas as etapas')}`);
    }
    return `<p class="r-filters">${blocks.join(' &nbsp; | &nbsp; ')}</p>`;
  }

  function reportKpisHtml() {
    const cards = $$('.proc-kpi', $('#procKpis')).map(card => {
      const label = $('.proc-kpi__label', card)?.textContent || '';
      const value = $('strong', card)?.textContent || '';
      return `<article><span>${esc(label)}</span><strong>${esc(value)}</strong></article>`;
    });
    return `<section class="r-kpis">${cards.join('')}</section>`;
  }

  async function reportChartsHtml() {
    if (!window.Plotly) return '';
    let html = '';
    for (const chart of $$('.proc-chart.js-plotly-plot')) {
      try {
        const title = $('h3', chart.closest('.proc-chart-card'))?.textContent || chart.id || 'Gráfico';
        const image = await Plotly.toImage(chart, { format: 'png', width: 1200, height: 560, scale: 1 });
        html += `<section class="r-section"><h2>${esc(title)}</h2><img class="r-chart" src="${image}" alt="${esc(title)}"></section>`;
      } catch (error) {
        // Mantém o relatório disponível mesmo se um gráfico isolado não puder ser convertido.
      }
    }
    return html;
  }

  function reportTableHtml() {
    const repairColumns = pageMode === 'repairs'
      ? '<th>Situação</th><th>Retorno</th><th>Reparo aprovado</th>'
      : '<th>Situação</th>';
    const rows = filteredRows.map(row => `<tr>
      <td>${esc(row.requisicao)}</td>
      <td>${esc(row.certame || 'Não informado')}</td>
      <td>${esc(shortenedText(row.descricao, 180))}</td>
      <td class="num">${esc(number(row.quantidade))}</td>
      <td>${esc(row.empresaVencedora)}</td>
      <td>${esc(row.po)}</td>
      <td class="num">${esc(money(row.valorEmpenhadoUsd))}</td>
      <td>${esc(row.status)}</td>
      ${pageMode === 'repairs' ? `<td>${esc(row.situacaoRetorno)}</td><td>${esc(row.reparoAprovado || 'Não informado')}</td>` : ''}
    </tr>`).join('');
    const columnCount = pageMode === 'repairs' ? 10 : 8;
    return `<section class="r-section"><h2>Requisições filtradas</h2><p>${number(filteredRows.length)} requisição(ões)</p><table><thead><tr><th>Requisição</th><th>Certame</th><th>Descrição</th><th>Quantidade</th><th>Empresa vencedora</th><th>Ordem de compra</th><th>Valor</th>${repairColumns}</tr></thead><tbody>${rows || `<tr><td colspan="${columnCount}">Nenhuma requisição no recorte atual.</td></tr>`}</tbody></table></section>`;
  }

  function reportCss() {
    return '@page{size:A4 landscape;margin:10mm}body{font-family:Arial,Helvetica,sans-serif;color:#10233f;margin:24px;line-height:1.4}.ministry{text-align:center;font-weight:700;margin-bottom:18px}h1{text-align:center;color:#00265f;margin:10px 0 18px}.intro{font-size:13px;text-align:justify}.r-filters{padding:11px 13px;border-left:5px solid #ffd200;border-radius:8px;background:#eef3fa;font-size:10px}.r-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:18px 0}.r-kpis article{padding:10px;border:1px solid #dbe4f0;border-radius:9px}.r-kpis span{display:block;color:#52657f;font-size:9px;text-transform:uppercase}.r-kpis strong{display:block;margin-top:5px;color:#00265f;font-size:16px}.r-section{margin-top:22px;page-break-inside:avoid}.r-section h2{padding-bottom:5px;border-bottom:2px solid #ffd200;color:#00265f}.r-chart{display:block;width:100%;max-height:500px;object-fit:contain}table{width:100%;border-collapse:collapse;font-size:7.5px;page-break-inside:auto}tr{page-break-inside:avoid}th{background:#003b7a;color:#fff}td,th{padding:4px;border:1px solid #cdd6e4;text-align:left;vertical-align:top}tr:nth-child(even) td{background:#f6f8fb}.num{text-align:right;white-space:nowrap}footer{margin-top:24px;color:#667;text-align:center;font-size:10px}@media print{body{margin:0}.r-kpis{grid-template-columns:repeat(4,1fr)}}';
  }

  async function generateProcessReport() {
    const button = $('#procGenerateReport');
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) { window.alert('Permita pop-ups para gerar o relatório em PDF.'); return; }
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); }
    reportWindow.document.write('<!doctype html><html><body style="font-family:Arial;padding:32px;color:#00265f"><p>Preparando relatório...</p></body></html>');
    reportWindow.document.close();
    try {
      const title = pageMode === 'repairs' ? 'Relatório - Requisições de Reparo' : 'Relatório - Requisições de Materiais e Publicações';
      const charts = await reportChartsHtml();
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${reportCss()}</style></head><body>
        <header><div class="ministry">Ministério da Defesa<br>Comando da Aeronáutica<br>Comissão Aeronáutica Brasileira em Washington</div><h1>${esc(title)}</h1><p class="intro">Relatório gerencial elaborado com os dados atualmente filtrados no painel. Os indicadores, gráficos e a tabela refletem o recorte vigente no momento da geração.</p>${reportFiltersHtml()}</header>
        ${reportKpisHtml()}${charts}${reportTableHtml()}<footer>Gerado em ${esc(new Date().toLocaleString('pt-BR'))} · ${esc(dateTime(DATA.meta.geradoEm))}</footer>
      </body></html>`;
      reportWindow.document.open();
      reportWindow.document.write(html);
      reportWindow.document.close();
      setTimeout(() => { try { reportWindow.focus(); reportWindow.print(); } catch (error) {} }, 800);
    } finally {
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  }

  function renderAll() {
    renderKpis();
    renderCharts();
    renderTable();
    const total = $('#procFilteredTotal');
    if (total) total.textContent = `${number(filteredRows.length)} requisições no recorte atual`;
  }

  function initDashboard() {
    const allRows = (DATA.materials || []).concat(DATA.repairs || [], DATA.otherRepairs || []);
    const supplierNames = buildSupplierNames(allRows);
    normalizeSupplierLabels(allRows, supplierNames);
    sourceRows = pageMode === 'repairs' ? (DATA.repairs || []) : (DATA.materials || []);
    otherRepairRows = pageMode === 'repairs' ? (DATA.otherRepairs || []) : [];
    filteredRows = sourceRows.slice();
    filteredOtherRepairRows = otherRepairRows.slice();
    filterSourceRows = pageMode === 'repairs' ? sourceRows.concat(otherRepairRows) : sourceRows;
    const generated = $('#procGeneratedAt');
    if (generated) generated.textContent = dateTime(DATA.meta.geradoEm);
    populateFilters();
    initLogisticsFilter();
    $('#procResetFilters')?.addEventListener('click', resetFilters);
    $('#procGenerateReport')?.addEventListener('click', generateProcessReport);
    $('#procPagePrev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage -= 1; renderTable(); } });
    $('#procPageNext')?.addEventListener('click', () => { if (currentPage * pageSize < filteredRows.length) { currentPage += 1; renderTable(); } });
    if (pageMode === 'repairs') initDispatchModal();
    applyFilters();
  }

  window.CABW_PROCESSOS_PANEL_TEST = { mapValidityValue, fieldValue, companyChartLabel, buildSupplierNames, normalizeSupplierLabels };
  document.addEventListener('DOMContentLoaded', () => {
    if (pageMode === 'landing') initLanding();
    if (pageMode === 'materials' || pageMode === 'repairs') initDashboard();
  });
}());
