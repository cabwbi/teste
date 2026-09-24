(function(){
  'use strict';
  const data=window.CABW_HOME_DATA||{};
  const meta=data.meta||{},credit=data.gestaoCredito||{},contracts=data.contratos||{},requests=data.requisicoes||{},finance=data.financas||{},sf=data.suprimentoFundos||{};
  const money=value=>'US$ '+Number(value||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const integer=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
  const percent=value=>Number(value||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'% do crédito recebido';
  const set=(key,value)=>document.querySelectorAll('[data-home="'+key+'"]').forEach(node=>node.textContent=value);
  const dateTime=value=>{const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);return match?`${match[3]}/${match[2]}/${match[1]} às ${match[4]}:${match[5]}:${match[6]}`:(value||'—');};
  set('updatedAt',dateTime(meta.geradoEm));set('year',meta.ano||finance.ano||'—');
  set('creditReceived',money(credit.creditoRecebidoUsd));set('creditAvailable',money(credit.creditoNaoEmpenhadoUsd??credit.creditoDisponivelUsd));set('creditCommitted',money(credit.creditoEmpenhadoUsd));set('creditLiquidated',money(credit.creditoLiquidadoUsd));
  set('creditReceivedPct','100,00% do crédito recebido');set('creditAvailablePct',percent(credit.percentualNaoEmpenhado));set('creditCommittedPct',percent(credit.percentualEmpenhado));set('creditLiquidatedPct',percent(credit.percentualLiquidado));
  set('contractsValue',money(contracts.valorContratadoUsd));set('contractsCommitted',money(contracts.valorEmpenhadoUsd));set('contractsBilled',money(contracts.valorFaturadoUsd));set('contractsCount',integer(contracts.quantidade));
  const categories=contracts.categorias||{};set('contractsBreakdown',`${integer(categories.administrativos)} administrativos · ${integer(categories.finalisticos)} finalísticos · ${integer(categories.fms)} FMS`);
  set('materialsCount',integer((requests.materiais||{}).quantidade));set('materialsValue',money((requests.materiais||{}).valorEmpenhadoUsd));set('repairsCount',integer((requests.reparos||{}).quantidade));set('repairsValue',money((requests.reparos||{}).valorEmpenhadoUsd));
  set('paymentValue',money(finance.valorNlPagamentoUsd));set('paymentCount',integer(finance.quantidadeNlPagamento));set('paidSuppliers',integer(finance.empresasPagasElegiveis));
  const largest=finance.maiorPagamentoUltimos30Dias||{};set('largestSupplier',largest.fornecedor||'Não informado');set('largestPayment',money(largest.valorUsd));
  set('sfCredit',money(sf.creditoDisponivelUsd));set('sfCommitted',money(sf.valorEmpenhadoUsd));set('sfBalance',money(sf.valorEmpenhadoNaoLiquidadoUsd));set('sfPeople',integer(sf.pessoasAtendidas));
  const actions=document.querySelector('#top-actions');
  if(actions)actions.innerHTML=(credit.principaisAcoes||[]).map(item=>`<div class="action-item"><b>Ação ${escapeHtml(item.acao||'Não informada')}</b><span>${money(item.valorRecebidoUsd)} (${Number(item.percentual||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%)</span></div>`).join('')||'<div class="action-item"><span>Sem dados disponíveis.</span></div>';
  const years=document.querySelector('#rp-years'),rpYears=(data.restosPagar||{}).anos||{};
  if(years)years.innerHTML=['2022','2023','2024','2025'].map(year=>{const item=rpYears[year]||{};return `<article class="rp-year"><h3>${year}</h3><dl><div><dt>Total inscrito</dt><dd>${money(item.inscrito)}</dd></div><div><dt>Saldo atual</dt><dd>${money(item.atual)}</dd></div><div><dt>Liquidado desde jan/${meta.ano||2026}</dt><dd>(${Number(item.percentualLiquidado||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%)</dd></div></dl></article>`;}).join('');
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));}
})();
