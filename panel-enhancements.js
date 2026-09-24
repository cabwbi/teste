(function(){
'use strict';
const FALLBACK_STATUS={"geradoEm":"2026-08-05 19:00:00","fusoHorarioExibicao":"America/New_York","paineis":{"entrada":[{"arquivo":"NL_requisicao.XLS","atualizadoEm":"2026-08-03T00:34:49.000Z"},{"arquivo":"ordem_de_compra_em_assinatura.XLS","atualizadoEm":"2026-08-03T00:36:05.000Z"},{"arquivo":"controle_financeiro_contratos.XLS","atualizadoEm":"2026-08-05T18:25:00.000Z"},{"arquivo":"descricao_OM.XLS","atualizadoEm":"2026-07-31T12:30:17.253Z"},{"arquivo":"descricao_projetos.XLS","atualizadoEm":"2026-07-31T12:30:17.439Z"},{"arquivo":"digitos.XLS","atualizadoEm":"2026-08-03T00:34:52.000Z"},{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"},{"arquivo":"requisicoes.XLS","atualizadoEm":"2026-08-03T00:34:10.000Z"},{"arquivo":"volumes.xlsx","atualizadoEm":"2026-07-16T20:01:38.000Z"}],"contratos":[{"arquivo":"controle_financeiro_contratos.XLS","atualizadoEm":"2026-08-05T18:25:00.000Z"},{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"},{"arquivo":"NL_requisicao.XLS","atualizadoEm":"2026-08-03T00:34:49.000Z"},{"arquivo":"requisicoes.XLS","atualizadoEm":"2026-08-03T00:34:10.000Z"}],"credito":[{"arquivo":"digitos.XLS","atualizadoEm":"2026-08-03T00:34:52.000Z"},{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"},{"arquivo":"ordem_de_compra_em_assinatura.XLS","atualizadoEm":"2026-08-03T00:36:05.000Z"},{"arquivo":"descricao_OM.XLS","atualizadoEm":"2026-07-31T12:30:17.253Z"},{"arquivo":"descricao_projetos.XLS","atualizadoEm":"2026-07-31T12:30:17.439Z"},{"arquivo":"requisicoes.XLS","atualizadoEm":"2026-08-03T00:34:10.000Z"}],"processos":[{"arquivo":"requisicoes.XLS","atualizadoEm":"2026-08-03T00:34:10.000Z"},{"arquivo":"volumes.xlsx","atualizadoEm":"2026-07-16T20:01:38.000Z"},{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"}],"governanca":[{"arquivo":"digitos.XLS","atualizadoEm":"2026-08-03T00:34:52.000Z"},{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"},{"arquivo":"requisicoes.XLS","atualizadoEm":"2026-08-03T00:34:10.000Z"},{"arquivo":"descricao_OM.XLS","atualizadoEm":"2026-07-31T12:30:17.253Z"},{"arquivo":"descricao_projetos.XLS","atualizadoEm":"2026-07-31T12:30:17.439Z"}],"rp":[{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"},{"arquivo":"NL_requisicao.XLS","atualizadoEm":"2026-08-03T00:34:49.000Z"},{"arquivo":"requisicoes.XLS","atualizadoEm":"2026-08-03T00:34:10.000Z"},{"arquivo":"descricao_OM.XLS","atualizadoEm":"2026-07-31T12:30:17.253Z"},{"arquivo":"controle_financeiro_contratos.XLS","atualizadoEm":"2026-08-03T00:36:06.000Z"}],"suprimento":[{"arquivo":"ordem_de_compras.XLS","atualizadoEm":"2026-08-03T00:34:37.000Z"},{"arquivo":"digitos.XLS","atualizadoEm":"2026-08-03T00:34:52.000Z"},{"arquivo":"descricao_OM.XLS","atualizadoEm":"2026-07-31T12:30:17.253Z"},{"arquivo":"descricao_projetos.XLS","atualizadoEm":"2026-07-31T12:30:17.439Z"}]},"metodoContratos":{"fonteAtual":"controle_financeiro_contratos.XLS enviado pelo usuário em 05/08/2026","registrosNaFonteAtual":136,"totalPublicado":136,"administrativos":28,"finalisticos":56,"fms":52,"regra":"Substituição integral pela planilha enviada; FMS por CAGE W2525; administrativos por Grande Comando CW; demais finalísticos."},"correcoesPacote":{"cardEntradaContratos":{"administrativos":28,"fms":52,"finalisticos":56},"rodapeDatasFontes":true,"buscaParcialFiltros":"Exibe somente categorias contendo o texto digitado; texto vazio exibe todas."}};
const PAGE_TO_PANEL={
  'index.html':'entrada','':'entrada',
  'contratos.html':'contratos','contratos-administrativos.html':'contratos','contratos-finalisticos.html':'contratos','fms.html':'contratos',
  'credito.html':'credito','detail.html':'credito','evolution.html':'credito','consistency.html':'credito',
  'processos.html':'processos',
  'governanca.html':'governanca','governanca-cabw-numeros.html':'governanca','governanca-calendario.html':'governanca','governanca-paac.html':'governanca','governanca-pta.html':'governanca',
  'governanca-rp.html':'rp','test_rp.html':'rp',
  'suprimento-fundos.html':'suprimento'
};
function norm(value){return String(value||'').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
function optionContext(input){
  const wrap=input.closest('.cabw-multi-dropdown,.rp-multi,.sf-multi');
  if(!wrap)return null;
  let selector='.cabw-multi-option';
  if(wrap.classList.contains('rp-multi'))selector='.rp-option';
  if(wrap.classList.contains('sf-multi'))selector='.sf-multi-option';
  return {wrap:wrap,options:Array.from(wrap.querySelectorAll(selector))};
}
function filterVisibleOptions(input){
  const ctx=optionContext(input); if(!ctx)return;
  const q=norm(input.value);
  ctx.options.forEach(function(option){
    const show=!q||norm(option.textContent).includes(q);
    option.hidden=!show;
    option.style.setProperty('display',show?'flex':'none','important');
    option.setAttribute('aria-hidden',show?'false':'true');
  });
}
function attachFilterInput(input){
  if(!input||input.dataset.cabwContainsFilter==='1')return;
  input.dataset.cabwContainsFilter='1';
  input.setAttribute('autocomplete','off');
  input.addEventListener('input',function(){filterVisibleOptions(input);});
  input.addEventListener('search',function(){filterVisibleOptions(input);});
  filterVisibleOptions(input);
}
function scanFilterInputs(scope){
  const base=scope&&scope.querySelectorAll?scope:document;
  base.querySelectorAll('.cabw-multi-search,.rp-search-line input[type="search"],.sf-multi-search').forEach(attachFilterInput);
}
document.addEventListener('click',function(event){
  const clear=event.target.closest('[data-ms-action="clear"],[data-act="clear"]');
  if(!clear)return;
  const wrap=clear.closest('.cabw-multi-dropdown,.rp-multi,.sf-multi');
  const input=wrap&&wrap.querySelector('.cabw-multi-search,.rp-search-line input[type="search"],.sf-multi-search');
  if(input){input.value='';setTimeout(function(){filterVisibleOptions(input);},0);}
},true);
function formatSourceDate(iso){
  if(!iso)return 'data não informada';
  const d=new Date(iso);
  if(Number.isNaN(d.getTime()))return String(iso).slice(0,10).split('-').reverse().join('/');
  return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/New_York',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
}
function pageName(){return (location.pathname.split('/').pop()||'index.html').toLowerCase();}
function renderSourceDates(status){
  const panel=PAGE_TO_PANEL[pageName()]; if(!panel)return;
  const sources=status&&status.paineis&&status.paineis[panel]; if(!Array.isArray(sources)||!sources.length)return;
  let note=document.getElementById('cabw-source-dates');
  if(!note){note=document.createElement('p');note.id='cabw-source-dates';note.className='cabw-source-dates';(document.querySelector('main')||document.body).appendChild(note);}
  note.textContent='Arquivos utilizados: '+sources.map(function(item){return item.arquivo+' — '+formatSourceDate(item.atualizadoEm);}).join(' · ');
}
function updateHomeContractCard(summary){
  if(pageName()!=='index.html')return;
  const card=Array.from(document.querySelectorAll('.home-card')).find(function(el){return norm(el.querySelector('h2')&&el.querySelector('h2').textContent)==='contratos';});
  if(!card)return;
  const counts=(summary&&summary.counts)||{administrativos:28,fms:52,finalisticos:56};
  card.querySelectorAll('.home-card__metrics div').forEach(function(item){
    const label=norm(item.querySelector('span')&&item.querySelector('span').textContent);
    const value=item.querySelector('strong'); if(!value)return;
    if(label.includes('administr'))value.textContent=counts.administrativos;
    else if(label.includes('fms'))value.textContent=counts.fms;
    else if(label.includes('final'))value.textContent=counts.finalisticos;
  });
}
function updateHomeProcessCard(summary){
  if(pageName()!=='index.html')return;
  const card=Array.from(document.querySelectorAll('.home-card')).find(function(el){return norm(el.querySelector('h2')&&el.querySelector('h2').textContent)==='processos de contratacao';});
  if(!card)return;
  const fallback={materiais2026:{requisicoes:307,valorEmpenhadoUsd:4919366.3},reparos2026:{requisicoes:16,valorEmpenhadoUsd:54440}};
  const data=summary||fallback;
  const values={
    'materials-count':data.materiais2026&&data.materiais2026.requisicoes,
    'materials-value':data.materiais2026&&data.materiais2026.valorEmpenhadoUsd,
    'repairs-count':data.reparos2026&&data.reparos2026.requisicoes,
    'repairs-value':data.reparos2026&&data.reparos2026.valorEmpenhadoUsd,
  };
  card.querySelectorAll('[data-process-metric]').forEach(function(element){
    const key=element.dataset.processMetric;
    const value=Number(values[key]||0);
    element.textContent=key.endsWith('-value')
      ?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'USD'}).format(value)
      :new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(value);
  });
}
function updateHomeFinanceCard(summary){
  if(pageName()!=='index.html')return;
  const card=Array.from(document.querySelectorAll('.home-card')).find(function(el){return norm(el.querySelector('h2')&&el.querySelector('h2').textContent)==='indicadores financeiros';});
  if(!card)return;
  const data=summary||{ano:2026,quantidadeNlPagamento:2233,valorNlPagamentoUsd:87553294,empresasPagas:209};
  const values={
    'nl-count':Number(data.quantidadeNlPagamento||0),
    'nl-value':Number(data.valorNlPagamentoUsd||0),
    'companies-count':Number(data.empresasPagas||0),
  };
  card.querySelectorAll('[data-finance-metric]').forEach(function(element){
    const key=element.dataset.financeMetric;
    if(key==='nl-value'){
      element.textContent='US$ '+new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(values[key]);
      element.title=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'USD'}).format(values[key]);
    }else element.textContent=new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0}).format(values[key]);
  });
  card.querySelectorAll('[data-finance-year]').forEach(function(element){element.textContent=String(data.ano||2026);});
}
function installStyle(){
  if(document.getElementById('cabw-panel-enhancements-css'))return;
  const style=document.createElement('style');style.id='cabw-panel-enhancements-css';style.textContent='.cabw-source-dates{margin:28px 8px 4px;padding-top:10px;color:#a3acb9!important;font-size:11px!important;font-weight:400!important;line-height:1.45;text-align:right;letter-spacing:.005em}.cabw-source-dates::before{content:"";display:block;width:72px;height:1px;background:#e4e8ee;margin:0 0 8px auto}@media(max-width:768px){.cabw-source-dates{text-align:left;margin-left:0;margin-right:0}.cabw-source-dates::before{margin-left:0;margin-right:auto}}';document.head.appendChild(style);
}
async function loadJson(path,fallback){try{const response=await fetch(path,{cache:'no-store'});if(!response.ok)throw new Error(String(response.status));return await response.json();}catch(error){return fallback;}}
document.addEventListener('DOMContentLoaded',function(){
  installStyle();scanFilterInputs(document);
  const observer=new MutationObserver(function(mutations){mutations.forEach(function(m){m.addedNodes.forEach(function(node){if(node.nodeType===1){if(node.matches&&node.matches('.cabw-multi-search,.rp-search-line input[type="search"],.sf-multi-search'))attachFilterInput(node);scanFilterInputs(node);}});});});
  observer.observe(document.body,{childList:true,subtree:true});
  loadJson('data-update-status.json',FALLBACK_STATUS).then(function(status){renderSourceDates(status);updateHomeProcessCard(status&&status.processosResumo);updateHomeFinanceCard(status&&status.pagamentosResumo);});
  if(pageName()==='index.html')loadJson('contracts-summary.json',{counts:{administrativos:28,fms:52,finalisticos:56}}).then(updateHomeContractCard);
});
})();
