(function(){
'use strict';
const data=window.CABW_COMPAT_DATA||{creditos:[],requisicoes:[],lookups:{om:{},projetos:{}},meta:{}};
const engine=window.CABW_COMPAT_ENGINE;
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>'US$ '+Number(value||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const integer=value=>Number(value||0).toLocaleString('pt-BR',{maximumFractionDigits:0});
const unique=values=>Array.from(new Set((values||[]).map(value=>String(value==null?'':value).trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
const normalized=value=>String(value==null?'':value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const selections=select=>select?Array.from(select.selectedOptions).map(option=>option.value).filter(Boolean):[];
let currentAnalysis=null;
let filtersDirty=false;
const chartModes={credit:'total',request:'status'};
const DETAIL_COLORS=['#003676','#2e9d57','#f28e2b','#7656b5','#0097a7','#c44e52','#8a6d1d','#4e79a7','#d65f5f','#6b8e23','#a45aa5','#007f73'];

function analysisYears(){
  const generatedYear=Number(String(data.meta.geradoEm||'').slice(0,4));
  const currentYear=Number.isFinite(generatedYear)&&generatedYear>=2000?generatedYear:new Date().getFullYear();
  return [String(currentYear-1),String(currentYear)];
}

function options(values,labels){
  const labelMap=labels||{};
  return unique(values).map(value=>({value,label:labelMap[value]||value})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
}
function fillSelect(id,items,placeholder){
  const select=$(id);if(!select)return;
  select.innerHTML=items.map(item=>`<option value="${esc(item.value)}">${esc(item.label)}</option>`).join('');
  buildMulti(select,placeholder);
}
function buildMulti(select,placeholder){
  const wrapper=document.createElement('div');wrapper.className='compat-ms';
  wrapper.dataset.placeholder=placeholder||'Todas as opções';
  select.insertAdjacentElement('afterend',wrapper);
  const menuItems=Array.from(select.options).map(option=>`<label class="compat-ms__option"><input type="checkbox" value="${esc(option.value)}"><span>${esc(option.textContent)}</span></label>`).join('');
  wrapper.innerHTML=`<button class="compat-ms__button" type="button" aria-haspopup="listbox" aria-expanded="false">${esc(wrapper.dataset.placeholder)}</button><div class="compat-ms__menu"><div class="compat-ms__search"><input type="search" placeholder="Filtrar opções a partir de 1 caractere"><div class="compat-ms__actions"><button type="button" data-action="all">Marcar visíveis</button><button type="button" data-action="clear">Limpar seleção</button></div></div>${menuItems||'<div class="compat-empty">Sem opções.</div>'}<div class="compat-ms__no-results" hidden>Nenhuma opção encontrada.</div></div>`;
  const button=wrapper.querySelector('.compat-ms__button');const menu=wrapper.querySelector('.compat-ms__menu');const search=wrapper.querySelector('input[type="search"]');
  function update(){
    const chosen=Array.from(select.selectedOptions).map(option=>option.textContent.trim());
    button.textContent=!chosen.length?wrapper.dataset.placeholder:(chosen.length<=2?chosen.join(', '):`${chosen.length} selecionadas`);
    button.removeAttribute('title');button.setAttribute('aria-label',!chosen.length?wrapper.dataset.placeholder:`${chosen.length} opção${chosen.length===1?'':'ões'} selecionada${chosen.length===1?'':'s'}`);
    wrapper.querySelectorAll('.compat-ms__option input').forEach(input=>{const option=Array.from(select.options).find(item=>item.value===input.value);input.checked=Boolean(option&&option.selected);});
  }
  button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    $$('.compat-ms.open').forEach(item=>{if(item!==wrapper){item.classList.remove('open');item.querySelector('.compat-ms__button')?.setAttribute('aria-expanded','false');}});
    wrapper.classList.toggle('open');button.setAttribute('aria-expanded',wrapper.classList.contains('open')?'true':'false');
    if(wrapper.classList.contains('open'))setTimeout(()=>{wrapper.classList.toggle('align-right',menu.getBoundingClientRect().right>window.innerWidth-12);search&&search.focus();},0);
  });
  wrapper.querySelectorAll('.compat-ms__option input').forEach(input=>input.addEventListener('change',()=>{
    const option=Array.from(select.options).find(item=>item.value===input.value);if(option)option.selected=input.checked;
    update();select.dispatchEvent(new Event('change',{bubbles:true}));
  }));
  search&&search.addEventListener('input',()=>{
    const query=normalized(search.value),compactQuery=query.replace(/[^a-z0-9]/g,'');let visible=0;
    wrapper.querySelectorAll('.compat-ms__option').forEach(label=>{const value=normalized(label.textContent),compactValue=value.replace(/[^a-z0-9]/g,'');const show=!query||value.includes(query)||(compactQuery&&compactValue.includes(compactQuery));label.hidden=!show;label.style.display=show?'flex':'none';if(show)visible+=1;});
    const noResults=wrapper.querySelector('.compat-ms__no-results');if(noResults)noResults.hidden=visible>0;
  });
  wrapper.querySelector('[data-action="all"]')?.addEventListener('click',event=>{event.preventDefault();wrapper.querySelectorAll('.compat-ms__option').forEach(label=>{if(label.hidden||label.style.display==='none')return;const input=label.querySelector('input');const option=Array.from(select.options).find(item=>item.value===input.value);if(option)option.selected=true;});update();select.dispatchEvent(new Event('change',{bubbles:true}));});
  wrapper.querySelector('[data-action="clear"]')?.addEventListener('click',event=>{event.preventDefault();Array.from(select.options).forEach(option=>option.selected=false);update();select.dispatchEvent(new Event('change',{bubbles:true}));});
  wrapper.addEventListener('keydown',event=>{if(event.key==='Escape'){wrapper.classList.remove('open');button.setAttribute('aria-expanded','false');button.focus();}});
  select._compatUpdate=update;update();
}
function updateAllMultis(){$$('.compat-native').forEach(select=>select._compatUpdate&&select._compatUpdate());}

function initFilters(){
  const credits=data.creditos||[];const requests=data.requisicoes||[];const omLabels=(data.lookups||{}).om||{};const projectLabels=(data.lookups||{}).projetos||{};
  fillSelect('#filterSharedOm',options(credits.flatMap(row=>row.omCodigos||[]).concat(requests.map(row=>row.omCodigo)),omLabels),'Todas as OM');
  fillSelect('#filterSharedNatureza',options(credits.map(row=>row.natureza).concat(requests.map(row=>row.natureza))),'Todas as naturezas');
  fillSelect('#filterCreditAcao',options(credits.map(row=>row.acao)),'Todas as ações');
  fillSelect('#filterCreditPi',options(credits.map(row=>row.planoInterno)),'Todos os PI');
  fillSelect('#filterCreditProjeto',options(credits.flatMap(row=>row.projetos||[]),projectLabels),'Todos os projetos');
  fillSelect('#filterCreditFonte',options(credits.map(row=>row.fonte)),'Todas as fontes');
  fillSelect('#filterCreditObjetivo',options(credits.map(row=>row.objetivo)),'Todos os objetivos');
  fillSelect('#filterReqProjeto',options(requests.map(row=>row.projeto),projectLabels),'Todos os projetos');
  fillSelect('#filterReqPrioridade',options(requests.map(row=>row.prioridade).map(value=>value==='0'?'0':value),{'0':'0 - Não definida','1':'1 - Prioridade máxima','2':'2','3':'3','4':'4','5':'5'}),'Todas as prioridades');
  fillSelect('#filterReqStatus',options(requests.map(row=>row.status)),'Todas as situações');
  fillSelect('#filterReqValidade',options(['valido','vencido'],{'valido':'Válido','vencido':'Vencido'}),'Todas as validades');
  fillSelect('#filterReqAno',options(analysisYears()),'Ano atual e anterior');
  fillSelect('#reportOm',options(requests.map(row=>row.omCodigo),omLabels),'Todas as OM');
  fillSelect('#reportAcao',options(credits.map(row=>row.acao)),'Todas as ações');
  $$('.compat-filter-stack .compat-native').forEach(select=>select.addEventListener('change',markFiltersDirty));
  document.addEventListener('click',event=>{if(!event.target.closest('.compat-ms'))$$('.compat-ms.open').forEach(item=>{item.classList.remove('open');item.querySelector('.compat-ms__button')?.setAttribute('aria-expanded','false');});});
}
function creditFilters(){return {om:selections($('#filterSharedOm')),acao:selections($('#filterCreditAcao')),planoInterno:selections($('#filterCreditPi')),natureza:selections($('#filterSharedNatureza')),projeto:selections($('#filterCreditProjeto')),fonte:selections($('#filterCreditFonte')),objetivo:selections($('#filterCreditObjetivo'))};}
function requestFilters(){const typed=String($('#filterReqText')?.value||'').trim(),selectedYears=selections($('#filterReqAno'));return {om:selections($('#filterSharedOm')),projeto:selections($('#filterReqProjeto')),natureza:selections($('#filterSharedNatureza')),prioridade:selections($('#filterReqPrioridade')),situacao:selections($('#filterReqStatus')),validadeMapa:selections($('#filterReqValidade')),anoCertame:selectedYears.length?selectedYears:analysisYears(),dataReferencia:String(data.meta.geradoEm||'').slice(0,10),termos:typed?[typed]:[]};}

function markFiltersDirty(){
  filtersDirty=true;
  $('#applyCompatFilters')?.classList.add('is-dirty');
  const status=$('#compatFilterStatus');if(status)status.textContent='Seleções alteradas. Clique em Consultar para atualizar a análise.';
}

function statusLabel(prefix){return {'M-':'Mapa aprovado','G-':'Mapa gerado','C-':'Em cotação','P-':'Pronto para cotação','I-':'Inserida para avaliação'}[prefix]||prefix;}
function shortDescription(value){const text=String(value==null?'':value).trim();return text.length>30?text.slice(0,30)+'...':text;}
function mapValidityDetail(row){
  if(engine.statusPrefix(row.status)!=='M-')return 'Não se aplica';
  const opened=Date.parse(String(row.dataAbertura||'').slice(0,10)+'T00:00:00Z');
  if(!Number.isFinite(opened))return 'Data de abertura não informada';
  const expires=new Date(opened+60*86400000);const state=engine.mapValidity(row,String(data.meta.geradoEm||'').slice(0,10));
  return `${state==='valido'?'Válido':'Vencido'} · ${state==='valido'?'válido até':'venceu em'} ${expires.toLocaleDateString('pt-BR',{timeZone:'UTC'})}`;
}
function stableColor(value){const text=String(value||'N/I');let hash=0;for(let index=0;index<text.length;index+=1)hash=((hash<<5)-hash+text.charCodeAt(index))|0;return DETAIL_COLORS[Math.abs(hash)%DETAIL_COLORS.length];}
function projectDetail(codes){const projects=unique(codes||[]);if(!projects.length)return 'Sem projeto informado';if(projects.length===1)return (data.lookups?.projetos||{})[projects[0]]||projects[0];return `Compartilhado: ${projects.join(' / ')}`;}
function compactCategory(row,key){
  const omCode=String(row.omCodigo||String(key||'').split('|')[0]||'N/I');
  const fullLabel=String(row.label||omCode);const acronym=(fullLabel.split(/\s+-\s+/)[0]||omCode).trim();
  return `${omCode} · ${acronym} · ND ${row.natureza||'N/I'}`;
}
function chartLayout(title,height,maxValue,categoryKeys,categoryLabels,annotations){return {
  height,autosize:true,
  margin:{l:210,r:24,t:76,b:55,pad:0,autoexpand:false},
  paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',
  font:{family:'Montserrat,Arial,sans-serif',color:'#16345e',size:11},
  xaxis:{title,domain:[0,1],gridcolor:'#e7edf5',zeroline:false,tickprefix:'US$ ',tickformat:',.2s',range:[0,maxValue],rangemode:'tozero',fixedrange:true,automargin:false},
  yaxis:{domain:[0,1],categoryorder:'array',categoryarray:(categoryKeys||[]).slice(),tickmode:'array',tickvals:(categoryKeys||[]).slice(),ticktext:(categoryLabels||[]).slice(),automargin:false,fixedrange:true},
  legend:{orientation:'h',x:0,xanchor:'left',y:1.025,yanchor:'bottom',font:{size:10}},
  annotations:annotations||[],barmode:'overlay',hovermode:'closest',hoverlabel:{namelength:-1,align:'left',bgcolor:'#fff',bordercolor:'#cad7e6',font:{family:'Montserrat,Arial,sans-serif',size:11,color:'#16345e'}}
};}
function chartSeries(analysis){
  const creditRows=analysis.creditByOmNatureza||[];const demandRows=analysis.demandByOmNaturezaStatus||[];
  const creditMap=new Map(creditRows.map(row=>[row.key,row]));const demandMap=new Map(demandRows.map(row=>[row.key,row]));
  const keys=unique([...creditRows.map(row=>row.key),...demandRows.map(row=>row.key)]);
  const order=keys.sort((a,b)=>{
    const av=Number(creditMap.get(a)?.valor||0),bv=Number(creditMap.get(b)?.valor||0);
    return bv-av||a.localeCompare(b,'pt-BR');
  });
  const rows=order.map(key=>creditMap.get(key)||demandMap.get(key)||{});
  const full=rows.map((row,index)=>`${row.label||row.omCodigo||order[index]} · ND ${row.natureza||'N/I'}`);
  const labels=rows.map((row,index)=>compactCategory(row,order[index]));
  const creditValues=order.map(key=>Number(creditMap.get(key)?.valor||0));
  const demandTotals=order.map(key=>engine.STATUS_ORDER.reduce((sum,prefix)=>sum+Number((demandMap.get(key)?.values||{})[prefix]||0),0));
  const creditPeak=Math.max(0,...creditValues),demandPeak=Math.max(0,...demandTotals);
  const creditMax=creditPeak>0?creditPeak*1.08:1,demandMax=demandPeak>0?demandPeak*1.08:1,sharedMax=Math.max(creditMax,demandMax);
  return {order,labels,full,creditMap,demandMap,creditValues,demandTotals,creditMax,demandMax,sharedMax};
}
function placeSegments(rows,categoryOrder,detailValue,idValue){
  const positions=new Map(categoryOrder.map((key,index)=>[key,index]));const cursor=new Map();
  return (rows||[]).slice().sort((a,b)=>(positions.get(a.key)??Number.MAX_SAFE_INTEGER)-(positions.get(b.key)??Number.MAX_SAFE_INTEGER)||String(detailValue(a)).localeCompare(String(detailValue(b)),'pt-BR')||String(idValue(a)).localeCompare(String(idValue(b)),'pt-BR')).map(row=>{
    const base=cursor.get(row.key)||0;cursor.set(row.key,base+Number(row.valor||0));return {...row,base};
  });
}
function compactDetails(rows,formatter,limit){
  const ordered=(rows||[]).slice().sort((a,b)=>String(a.id||'').localeCompare(String(b.id||''),'pt-BR',{numeric:true}));
  const visible=ordered.slice(0,limit||10).map(formatter);const remaining=ordered.length-visible.length;
  return visible.join('<br>')+(remaining?`<br><b>… e mais ${integer(remaining)} registro(s)</b>`:'');
}
function aggregateSegments(rows,categoryOrder){
  const groups=new Map();
  (rows||[]).forEach(row=>{
    const groupKey=row.key+'\u0000'+row.detail;
    if(!groups.has(groupKey))groups.set(groupKey,{key:row.key,detail:row.detail,color:row.color,valor:0,entries:[]});
    const target=groups.get(groupKey);target.valor+=Number(row.valor||0);target.entries.push(row);
  });
  return placeSegments(Array.from(groups.values()),categoryOrder,row=>row.detail,row=>row.detail);
}
function creditSegments(analysis,mode,categoryOrder){
  const rows=engine.buildPools(analysis.credits||[]).filter(pool=>Number(pool.original)>0).map(pool=>{
    const project=projectDetail(pool.projetos);const detail=mode==='action'?(pool.acao||'Ação não informada'):(mode==='project'?project:'Crédito disponível');
    return {key:engine.omNaturezaKey(pool.om,pool.natureza),valor:Number(pool.original),id:pool.digito||'N/I',digito:pool.digito||'N/I',acao:pool.acao||'N/I',project,detail,color:mode==='total'?'#003676':stableColor(detail)};
  });
  return aggregateSegments(rows,categoryOrder).map(row=>({...row,details:compactDetails(row.entries,item=>`Ação ${esc(item.acao)} · Dígito ${esc(item.digito)} · ${esc(money(item.valor))}`,12)}));
}
function requestSegments(analysis,mode,categoryOrder){
  const rows=(analysis.compatible||[]).filter(row=>Number(row.valorUsd)>0).map(row=>{
    const prefix=engine.statusPrefix(row.status),project=row.projetoLabel||((data.lookups?.projetos||{})[row.projeto])||row.projeto||'Projeto não informado';const detail=mode==='project'?project:statusLabel(prefix);
    return {key:engine.omNaturezaKey(row.omCodigo,row.natureza),valor:Number(row.valorUsd),id:row.requisicao||'N/I',requisicao:row.requisicao||'N/I',project,descricao:shortDescription(row.descricao||row.nomenclatura),validade:mapValidityDetail(row),detail,color:mode==='project'?stableColor(project):(engine.STATUS_COLORS[prefix]||'#8d99a8')};
  });
  return aggregateSegments(rows,categoryOrder).map(row=>({...row,details:compactDetails(row.entries,item=>`${esc(item.project)} · ${esc(item.requisicao)} · ${esc(money(item.valor))} · ${esc(item.descricao)} · ${esc(item.validade)}`,10)}));
}
function creditTrace(segments){return {type:'bar',orientation:'h',showlegend:false,y:segments.map(row=>row.key),x:segments.map(row=>row.valor),base:segments.map(row=>row.base),customdata:segments.map(row=>[row.detail,money(row.valor),row.details]),marker:{color:segments.map(row=>row.color),line:{color:'rgba(255,255,255,.42)',width:.35}},hovertemplate:'<b>%{customdata[0]}</b><br><b>Total:</b> %{customdata[1]}<br><b>Ação · Dígito · Saldo:</b><br>%{customdata[2]}<extra></extra>'};}
function requestTrace(segments){return {type:'bar',orientation:'h',showlegend:false,y:segments.map(row=>row.key),x:segments.map(row=>row.valor),base:segments.map(row=>row.base),customdata:segments.map(row=>[row.detail,money(row.valor),row.details]),marker:{color:segments.map(row=>row.color),line:{color:'rgba(255,255,255,.38)',width:.3}},hovertemplate:'<b>%{customdata[0]}</b><br><b>Total:</b> %{customdata[1]}<br><b>Projeto · Requisição · Valor · Descrição · Validade do mapa:</b><br>%{customdata[2]}<extra></extra>'};}
function statusLegendTraces(mode){return mode!=='status'?[]:engine.STATUS_ORDER.map(prefix=>({type:'bar',orientation:'h',name:statusLabel(prefix),x:[null],y:[null],showlegend:true,hoverinfo:'skip',marker:{color:engine.STATUS_COLORS[prefix]}}));}
function totalAnnotations(keys,values,maxValue,prefix){return keys.map((key,index)=>{const value=Number(values[index]||0);if(!value)return null;const inside=value>maxValue*.23;return {x:value,y:key,text:`${prefix||'Total'} ${money(value)}`,showarrow:false,xanchor:inside?'right':'left',xshift:inside?-4:4,yanchor:'middle',bgcolor:'rgba(255,255,255,.9)',bordercolor:'#d6e0ec',borderwidth:1,borderpad:2,font:{family:'Montserrat,Arial,sans-serif',size:9,color:'#16345e'}};}).filter(Boolean);}
async function drawCharts(analysis,creditTarget,requestTarget,exportMode,forceComparable){
  if(!window.Plotly)return;
  const series=chartSeries(analysis);const reversedLabels=series.labels.slice().reverse();const reversedKeys=series.order.slice().reverse();const height=Math.max(exportMode?520:430,series.order.length*27+120);
  const toggle=$('#compareCompatScale');const comparable=typeof forceComparable==='boolean'?forceComparable:(toggle?toggle.checked:true);const creditMax=comparable?series.sharedMax:series.creditMax;const demandMax=comparable?series.sharedMax:series.demandMax;
  const creditValues=reversedKeys.map(key=>Number(series.creditMap.get(key)?.valor||0)),creditRows=creditSegments(analysis,chartModes.credit,reversedKeys),requestRows=requestSegments(analysis,chartModes.request,reversedKeys);
  await Plotly.newPlot(creditTarget,[creditTrace(creditRows)],chartLayout('Saldo dos dígitos',height,creditMax,reversedKeys,reversedLabels,totalAnnotations(reversedKeys,creditValues,creditMax,'Total')), {displayModeBar:false,responsive:!exportMode,staticPlot:Boolean(exportMode)});
  const demandTotals=reversedKeys.map(key=>engine.STATUS_ORDER.reduce((sum,prefix)=>sum+Number((series.demandMap.get(key)?.values||{})[prefix]||0),0));
  await Plotly.newPlot(requestTarget,[requestTrace(requestRows),...statusLegendTraces(chartModes.request)],chartLayout('Valor das requisições',height,demandMax,reversedKeys,reversedLabels,totalAnnotations(reversedKeys,demandTotals,demandMax,'Total')),{displayModeBar:false,responsive:!exportMode,staticPlot:Boolean(exportMode)});
}

function setChartMode(group,mode){
  if(!Object.prototype.hasOwnProperty.call(chartModes,group))return;
  chartModes[group]=mode;
  const selector=group==='credit'?'[data-credit-detail]':'[data-request-detail]';
  $$(selector).forEach(button=>{const value=group==='credit'?button.dataset.creditDetail:button.dataset.requestDetail;const active=value===mode;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',active?'true':'false');});
  if(currentAnalysis)drawCharts(currentAnalysis,$('#chartCompatCredit'),$('#chartCompatRequests'),false);
}

function transferText(row){
  const transfers=(row.transfers||[]).map(item=>`${item.origemDigito||'N/I'} → ${(item.destinoDigitos||[]).join(', ')||'definir destino'}`);
  return unique(transfers).join('; ')||'Definir dígitos de origem e destino';
}

function planRows(plans,stage){return plans.filter(row=>row.stage===stage).sort((a,b)=>b.valorUsd-a.valorUsd);}
function immediateDigitRows(plans){
  const map=new Map();
  planRows(plans,'imediato').forEach(row=>(row.sources||[]).forEach(source=>{
    const digit=String(source.digito||'N/I');
    if(!map.has(digit))map.set(digit,{digito:digit,requisicoes:new Set(),oms:new Set(),naturezas:new Set(),valor:0});
    const target=map.get(digit);target.requisicoes.add(row.requisicao);target.oms.add(row.om||row.omCodigo);target.naturezas.add(row.natureza);target.valor+=Number(source.valor||0);
  }));
  return Array.from(map.values()).sort((a,b)=>b.valor-a.valor||a.digito.localeCompare(b.digito));
}
function immediateSourceCell(row){
  const sources=(row.sources||[]).slice().sort((a,b)=>String(a.digito).localeCompare(String(b.digito)));
  return sources.map(source=>`<div><strong>${esc(source.digito||'N/I')}</strong><br><small>Parcela: ${money(source.valor)}</small></div>`).join('')||'Não identificado';
}
function emptyRow(cols,text){return `<tr><td class="compat-empty" colspan="${cols}">${esc(text)}</td></tr>`;}
function adjustmentType(row){return String(row.stage||'').startsWith('projeto')?'Ajuste de projeto':'Ajuste de PI e/ou projeto';}
function adjustmentRoute(row){
  if(String(row.stage||'').startsWith('projeto')){const origins=unique(row.sources.flatMap(source=>source.projetos||[]).filter(code=>code!==row.projeto)).join(', ')||'Projeto compartilhado';return `${origins} → ${row.projeto}`;}
  const sourcePi=unique(row.sources.map(source=>source.planoInterno)).join(', ')||'Não informado';return `${sourcePi} → ${row.destinoPi}`;
}
function adjustmentTableRows(rows,emptyText){return rows.length?rows.slice(0,200).map(row=>`<tr title="${esc(row.descricao||'')}"><td>${esc(row.requisicao)}</td><td>${esc(row.om)}<br>ND ${esc(row.natureza)}</td><td>${esc(adjustmentType(row))}</td><td>${esc(transferText(row))}</td><td>${esc(adjustmentRoute(row))}</td><td>${esc(mapValidityDetail(row))}</td><td>${money(row.valorUsd)}</td></tr>`).join(''):emptyRow(7,emptyText);}
function renderPlans(analysis){
  const plans=analysis.allocation.plans;
  const immediate=planRows(plans,'imediato'),revalidation=planRows(plans,'revalidacao');
  const validAdjustments=plans.filter(row=>row.stage==='projeto'||row.stage==='pi').sort((a,b)=>b.valorUsd-a.valorUsd);
  const invalidAdjustments=plans.filter(row=>row.stage==='projeto_vencido'||row.stage==='pi_vencido').sort((a,b)=>b.valorUsd-a.valorUsd);
  $('#totalImmediate').textContent=money(immediate.reduce((sum,row)=>sum+row.valorUsd,0));
  $('#totalRevalidation').textContent=money(revalidation.reduce((sum,row)=>sum+row.valorUsd,0));
  $('#totalValidAdjustment').textContent=money(validAdjustments.reduce((sum,row)=>sum+row.valorUsd,0));
  $('#totalInvalidAdjustment').textContent=money(invalidAdjustments.reduce((sum,row)=>sum+row.valorUsd,0));
  $('#tableImmediate').innerHTML=immediate.length?immediate.map(row=>`<tr title="${esc(row.descricao)}"><td>${esc(row.requisicao)}<br><small>${esc(mapValidityDetail(row))}</small></td><td>${esc(row.om)}<br>ND ${esc(row.natureza)}</td><td>${esc(row.projetoLabel||row.projeto)}</td><td>${immediateSourceCell(row)}</td><td>${money(row.valorUsd)}</td></tr>`).join(''):emptyRow(5,'Nenhuma requisição com mapa válido integralmente coberta sem realocação.');
  $('#tableRevalidation').innerHTML=revalidation.length?revalidation.map(row=>`<tr title="${esc(row.descricao)}"><td>${esc(row.requisicao)}<br><small>${esc(mapValidityDetail(row))}</small></td><td>${esc(row.om)}<br>ND ${esc(row.natureza)}</td><td>${esc(row.projetoLabel||row.projeto)}</td><td>${immediateSourceCell(row)}</td><td>${money(row.valorUsd)}</td></tr>`).join(''):emptyRow(5,'Nenhuma requisição com mapa vencido integralmente coberta sem realocação.');
  $('#tableValidAdjustment').innerHTML=adjustmentTableRows(validAdjustments,'Nenhum mapa válido necessita de ajuste de Projeto ou PI.');
  $('#tableInvalidAdjustment').innerHTML=adjustmentTableRows(invalidAdjustments,'Nenhum mapa vencido possui cenário de ajuste de Projeto ou PI.');
}
function render(){
  if(!engine){$('#compatFilterStatus').textContent='Mecanismo de compatibilidade indisponível.';return;}
  const aligned=harmonizeFilters(creditFilters(),requestFilters());
  currentAnalysis=engine.analyze(data,aligned.credit,aligned.request);
  const summary=currentAnalysis.summary;
  $('#kpiCompatCredit').textContent=money(summary.creditoDisponivel);
  $('#kpiCompatDemand').textContent=money(summary.demandaCompativel);
  $('#kpiCompatPotential').textContent=money(summary.potencialEmpenho);
  $('#kpiCompatReady').textContent=money(summary.valorProntoEmpenho);
  $('#kpiCompatRemaining').textContent=money(summary.saldoAposPotencial);
  filtersDirty=false;$('#applyCompatFilters')?.classList.remove('is-dirty');
  $('#compatFilterStatus').textContent=`${integer(currentAnalysis.credits.length)} dígitos · ${integer(currentAnalysis.requests.length)} requisições selecionadas · ${integer(currentAnalysis.compatible.length)} compatíveis · OM, ND e projeto sincronizados`;
  drawCharts(currentAnalysis,$('#chartCompatCredit'),$('#chartCompatRequests'),false);
  renderPlans(currentAnalysis);
}

function mergeSelection(base,additional){
  if(!base.length)return additional.slice();if(!additional.length)return base.slice();
  const extra=new Set(additional);const intersection=base.filter(value=>extra.has(value));return intersection.length?intersection:['__SEM_CORRESPONDENCIA__'];
}
function harmonizeFilters(credit,request){
  const cf={...(credit||{})},rf={...(request||{})};
  ['om','natureza','projeto'].forEach(key=>{const shared=mergeSelection((cf[key]||[]).slice(),(rf[key]||[]).slice());cf[key]=shared.slice();rf[key]=shared.slice();});
  return {credit:cf,request:rf};
}
function reportAnalysis(){
  const aligned=harmonizeFilters(creditFilters(),requestFilters()),cf=aligned.credit,rf=aligned.request;const reportOms=selections($('#reportOm')),reportActions=selections($('#reportAcao'));
  cf.om=mergeSelection(cf.om,reportOms);cf.acao=mergeSelection(cf.acao,reportActions);rf.om=mergeSelection(rf.om,reportOms);
  return {analysis:engine.analyze(data,cf,rf),reportOms,reportActions};
}
function reportStyles(){return `<style>@page{size:A4 landscape;margin:9mm}body{font-family:Arial,sans-serif;color:#102d56;margin:24px}h1{margin:0;color:#00265f;font-size:23px}.meta{color:#607089;margin-top:5px;font-size:11px}.note{padding:9px 11px;background:#eef4fb;border-left:4px solid #003676;font-size:11px;line-height:1.4}.report-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.report-chart{border:1px solid #dce4ef;border-radius:9px;padding:9px;background:#fff;break-inside:avoid}.report-chart h2{margin:0 0 7px;color:#00265f;font-size:14px}.report-chart img{display:block;width:100%;height:auto;max-height:170mm;object-fit:contain}.area{margin-top:18px;border:1px solid #dce4ef;border-radius:9px;overflow:hidden}.area-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;background:#f3f7fc;border-bottom:2px solid #ffd200}.area-head h2{margin:0;color:#00265f;font-size:16px}.area-summary{display:flex;gap:14px;color:#52627a;font-size:10px;white-space:nowrap}.area-summary strong{color:#003676;font-size:13px}table{width:100%;border-collapse:collapse;font-size:8.8px}th,td{padding:5px;border:1px solid #dce4ef;vertical-align:top}th{background:#003676;color:#fff;text-align:left}.action{font-weight:bold;color:#003676}.reqs{max-width:260px;line-height:1.35;overflow-wrap:anywhere}.muted{color:#65738a;font-size:9.5px}.print{position:sticky;top:0;margin-bottom:10px;padding:7px 0;background:#fff}.print button{padding:8px 12px;border:0;border-radius:7px;background:#003676;color:#fff;font-weight:bold}@media(max-width:900px){.report-chart-grid{grid-template-columns:1fr}}@media print{body{margin:0}.print{display:none}.report-chart-grid{break-after:page}.area{break-before:auto}thead{display:table-header-group}tr{break-inside:avoid}}</style>`;}
function immediateReportRows(plans,stage){
  const map=new Map();
  (plans||[]).filter(row=>row.stage===(stage||'imediato')).forEach(row=>(row.sources||[]).forEach(source=>{
    const key=[source.digito,row.omCodigo,row.natureza,source.acao,source.planoInterno,row.projeto].join('|');
    if(!map.has(key))map.set(key,{digito:source.digito,om:row.om,omCodigo:row.omCodigo,natureza:row.natureza,acao:source.acao,pi:source.planoInterno,projeto:row.projetoLabel||row.projeto,requisicoes:new Set(),validades:new Set(),valor:0});
    const target=map.get(key);target.requisicoes.add(row.requisicao);target.validades.add(mapValidityDetail(row));target.valor+=Number(source.valor||0);
  }));
  return Array.from(map.values()).sort((a,b)=>b.valor-a.valor||String(a.digito).localeCompare(String(b.digito)));
}
function adjustmentReportRows(plans,stage){
  const map=new Map();
  const selectedStages=Array.isArray(stage)?stage:(stage?[stage]:['projeto','pi']);
  (plans||[]).filter(row=>selectedStages.includes(row.stage)).forEach(row=>(row.transfers||[]).forEach(item=>{
    const origemProjetos=unique(item.origemProjetos||[]),destinoDigitos=unique(item.destinoDigitos||[]),destinoPis=unique(item.destinoPis||[]);const projetoDestino=row.projetoLabel||item.destinoProjeto||row.projeto;
    const tipo=String(row.stage).startsWith('projeto')?'Entre projetos (mesmo PI)':'Entre projetos com ajuste de PI';
    const key=[row.stage,row.omCodigo,row.natureza,item.origemAcao,item.origemDigito,destinoDigitos.join(','),origemProjetos.join(','),item.origemPi,destinoPis.join(','),row.projeto].join('|');
    if(!map.has(key))map.set(key,{tipo,om:row.om,omCodigo:row.omCodigo,natureza:row.natureza,acao:item.origemAcao,origemDigito:item.origemDigito,destinoDigitos,origemProjetos,projetoDestino,origemPi:item.origemPi,destinoPis,requisicoes:new Set(),validades:new Set(),valor:0});
    const target=map.get(key);target.requisicoes.add(row.requisicao);target.validades.add(mapValidityDetail(row));target.valor+=Number(item.valor||0);
  }));
  return Array.from(map.values()).sort((a,b)=>a.tipo.localeCompare(b.tipo,'pt-BR')||b.valor-a.valor);
}
function reportMetrics(rows){const requisicoes=new Set();let valor=0;(rows||[]).forEach(row=>{(row.requisicoes||[]).forEach(req=>requisicoes.add(req));valor+=Number(row.valor||0);});return {qtd:requisicoes.size,valor,requisicoes};}
function reportRequestList(row){return Array.from(row.requisicoes||[]).sort((a,b)=>String(a).localeCompare(String(b))).join(', ');}
function reportValidityList(row){return Array.from(row.validades||[]).sort((a,b)=>String(a).localeCompare(String(b))).join('; ')||'Não se aplica';}
function directReportBody(rows,emptyText){return rows.length?rows.map(row=>`<tr><td class="action">${esc(row.digito||'N/I')}</td><td>${esc(row.om)}<br>ND ${esc(row.natureza)}</td><td>${esc(row.acao||'N/I')}<br>PI ${esc(row.pi||'N/I')}</td><td>${esc(row.projeto||'N/I')}</td><td class="reqs">${esc(reportRequestList(row))}</td><td>${esc(reportValidityList(row))}</td><td>${integer(row.requisicoes.size)}</td><td>${money(row.valor)}</td></tr>`).join(''):`<tr><td colspan="8">${esc(emptyText)}</td></tr>`;}
function adjustmentReportBody(rows,emptyText){return rows.length?rows.map(row=>`<tr><td>${esc(row.om)}<br>ND ${esc(row.natureza)}</td><td>${esc(row.origemProjetos.join(', ')||'N/I')} → ${esc(row.projetoDestino||'N/I')}</td><td>${esc(row.origemDigito||'N/I')} → ${esc(row.destinoDigitos.join(', ')||'Definir destino')}</td><td>${esc(row.acao||'N/I')}<br>PI ${esc(row.origemPi||'N/I')} → ${esc(row.destinoPis.join(', ')||'Definir PI')}</td><td class="reqs">${esc(reportRequestList(row))}</td><td>${esc(reportValidityList(row))}</td><td>${integer(row.requisicoes.size)}</td><td>${money(row.valor)}</td></tr>`).join(''):`<tr><td colspan="8">${esc(emptyText)}</td></tr>`;}
function reportArea(title,rows,body,amountLabel,adjustment){const metrics=reportMetrics(rows);const headings=adjustment?'<th>OM / ND</th><th>Projeto origem → destino</th><th>Dígito origem → destino sugerido</th><th>Ação / PI origem → destino</th><th>Requisições</th><th>Validade do mapa</th><th>Qtd.</th><th>Valor</th>':'<th>Dígito aplicável</th><th>OM / ND</th><th>Ação / PI</th><th>Projeto</th><th>Requisições</th><th>Validade do mapa</th><th>Qtd.</th><th>Valor</th>';return `<section class="area"><div class="area-head"><h2>${esc(title)}</h2><div class="area-summary"><span><strong>${integer(metrics.qtd)}</strong> requisições</span><span><strong>${money(metrics.valor)}</strong> ${esc(amountLabel)}</span></div></div><table><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table></section>`;}
async function reportChartImages(analysis){
  if(!window.Plotly)return '';
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:1400px;background:#fff;z-index:-1';
  const credit=document.createElement('div'),requests=document.createElement('div');host.append(credit,requests);document.body.appendChild(host);
  try{
    await drawCharts(analysis,credit,requests,true,true);
    const height=Math.min(1200,Math.max(620,Number(credit.layout?.height||620)));
    const creditImage=await Plotly.toImage(credit,{format:'png',width:1400,height,scale:1});
    const requestImage=await Plotly.toImage(requests,{format:'png',width:1400,height,scale:1});
    return `<section class="report-chart-grid"><article class="report-chart"><h2>Crédito disponível por OM e natureza de despesa</h2><img src="${creditImage}" alt="Crédito disponível filtrado"></article><article class="report-chart"><h2>Requisições por OM, natureza e situação</h2><img src="${requestImage}" alt="Requisições filtradas"></article></section>`;
  }finally{try{Plotly.purge(credit);Plotly.purge(requests);}catch(error){}host.remove();}
}
async function generateReport(){
  if(filtersDirty){alert('Há seleções ainda não consultadas. Clique em Consultar antes de gerar o relatório.');return;}
  const popup=window.open('','_blank');if(!popup){alert('Autorize pop-ups para gerar o relatório.');return;}
  popup.document.write('<p style="font-family:Arial;padding:30px">Gerando relatório para emprego do crédito…</p>');
  try{
    const bundle=reportAnalysis(),plans=bundle.analysis.allocation.plans,immediate=immediateReportRows(plans,'imediato'),revalidation=immediateReportRows(plans,'revalidacao'),validAdjustments=adjustmentReportRows(plans,['projeto','pi']),invalidAdjustments=adjustmentReportRows(plans,['projeto_vencido','pi_vencido']);
    const charts=await reportChartImages(bundle.analysis);
    const omText=bundle.reportOms.length?bundle.reportOms.map(code=>(data.lookups.om||{})[code]||code).join('; '):'Todas as OM dos filtros analíticos';const actionText=bundle.reportActions.length?bundle.reportActions.join(', '):'Todas as ações dos filtros analíticos';
    const sections=[reportArea('Empenho imediato',immediate,directReportBody(immediate,'Nenhum empenho imediato com mapa válido.'),'potencial',false),reportArea('Cenário mediante revalidação do mapa',revalidation,directReportBody(revalidation,'Nenhum mapa vencido com cobertura direta.'),'informativo, não financiável',false),reportArea('Mapas válidos mediante ajuste de Projeto e/ou PI',validAdjustments,adjustmentReportBody(validAdjustments,'Nenhum mapa válido necessita de ajuste.'),'financiável mediante ajuste',true),reportArea('Mapas não válidos mediante ajuste de Projeto e/ou PI',invalidAdjustments,adjustmentReportBody(invalidAdjustments,'Nenhum mapa vencido possui cenário de ajuste.'),'informativo, não financiável',true)].join('');
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório para emprego do crédito</title>${reportStyles()}</head><body><div class="print"><button onclick="window.print()">Imprimir / salvar em PDF</button></div><h1>Relatório para emprego do crédito</h1><div class="meta">Dados atualizados em ${esc(data.meta.geradoEm||'data não informada')} · Gerado em ${new Date().toLocaleString('pt-BR')}</div><p class="note"><strong>Filtros:</strong> OM requisitante: ${esc(omText)} · Ação orçamentária: ${esc(actionText)} · Anos de abertura analisados: ${esc(requestFilters().anoCertame.join(', '))}.<br>Somente requisições com mapa aprovado válido por até 60 dias contados da data de abertura são classificadas como financiáveis. A área de revalidação é exclusivamente informativa e não integra o empenho potencial.</p>${charts}${sections}<p class="muted">As quatro áreas são mutuamente exclusivas. Empenho imediato e ajustes de projeto/PI incluem apenas mapas válidos; confirme os dígitos de destino antes de qualquer movimentação.</p></body></html>`;
    popup.document.open();popup.document.write(html);popup.document.close();
  }catch(error){console.error(error);popup.document.body.innerHTML='<p style="font-family:Arial;padding:30px;color:#8b1a1a">Não foi possível gerar o relatório. Recarregue o painel e tente novamente.</p>';}
}

function resetFilters(){
  $$('.compat-native').forEach(select=>Array.from(select.options).forEach(option=>option.selected=false));$$('.compat-ms__search input').forEach(input=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));});$('#filterReqText').value='';updateAllMultis();render();
}
function applyFilters(){$$('.compat-ms.open').forEach(item=>{item.classList.remove('open');item.querySelector('.compat-ms__button')?.setAttribute('aria-expanded','false');});render();}
function init(){
  initFilters();
  $('#filterReqText').addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyFilters();}});$('#filterReqText').addEventListener('input',markFiltersDirty);
  $('#applyCompatFilters').addEventListener('click',applyFilters);$('#resetCompatFilters').addEventListener('click',resetFilters);$('#generateCompatReport').addEventListener('click',generateReport);
  $$('[data-credit-detail]').forEach(button=>button.addEventListener('click',()=>setChartMode('credit',button.dataset.creditDetail)));
  $$('[data-request-detail]').forEach(button=>button.addEventListener('click',()=>setChartMode('request',button.dataset.requestDetail)));
  const scaleToggle=$('#compareCompatScale');scaleToggle.checked=true;scaleToggle.addEventListener('change',()=>{if(currentAnalysis)drawCharts(currentAnalysis,$('#chartCompatCredit'),$('#chartCompatRequests'),false);});
  $('#compatGeneratedAt').textContent='Dados atualizados em '+(data.meta.geradoEm||'data não informada');
  $('#compatSource').textContent=`Fontes: ${data.meta.fonteCreditos||'digitos.xlsx'} e ${data.meta.fonteRequisicoes||'requisicoes.xlsx'} · Atualização: ${data.meta.geradoEm||'não informada'}.`;
  render();
  Object.assign(window.CABW_COMPAT_PANEL_TEST,{getAnalysis:()=>currentAnalysis,creditFilters,requestFilters,reportAnalysis,applyFilters});
}
window.CABW_COMPAT_PANEL_TEST={chartSeries,chartLayout,drawCharts,creditSegments,requestSegments,creditTrace,requestTrace,statusLegendTraces,totalAnnotations,shortDescription,mapValidityDetail,aggregateSegments,compactDetails,setChartMode,getChartModes:()=>({...chartModes}),immediateDigitRows,immediateReportRows,adjustmentReportRows,adjustmentType,adjustmentRoute,reportMetrics,reportChartImages,analysisYears,generateReport,mergeSelection,harmonizeFilters};
document.addEventListener('DOMContentLoaded',()=>{try{init();}catch(error){console.error('CABW compatibility error',error);const status=$('#compatFilterStatus');if(status)status.textContent='Não foi possível inicializar a análise.';}});
})();
