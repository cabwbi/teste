
(function(){
'use strict';
const root=window.CABW_CONTRACTS_DATA||{records:[],summary:{}}; const records=Array.isArray(root.records)?root.records:[]; const summary=root.summary||{};
const $=(s,c)=> (c||document).querySelector(s); const $all=(s,c)=>Array.from((c||document).querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>'US$ '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const chartMoney=v=>'$ '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const contractMoney=(v,currency)=>String(currency||'USD').toUpperCase()+' '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>Number(v||0).toLocaleString('pt-BR');
function selected(sel){if(!sel)return []; return Array.from(sel.selectedOptions).map(o=>o.value).filter(Boolean);}
function unique(a){return Array.from(new Set(a.filter(v=>v!==undefined&&v!==null&&String(v).trim()!==''))).sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));}

function ensureCabwMultiCss(){
  if(document.getElementById('cabw-multi-dropdown-css')) return;
  const st=document.createElement('style'); st.id='cabw-multi-dropdown-css';
  st.textContent=`
  select.cabw-native-multi-hidden{display:none!important;}
  .cabw-multi-dropdown{position:relative;width:100%;font-family:inherit;}
  .cabw-multi-button{width:100%;min-height:46px;border:1px solid #ccd6e6;border-radius:10px;background:#f8fbff;color:#001f55;padding:10px 42px 10px 14px;text-align:left;font-weight:500;box-shadow:inset 0 1px 0 rgba(255,255,255,.75);cursor:pointer;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .cabw-multi-button:after{content:'▾';position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:15px;color:#003b7a;pointer-events:none;}
  .cabw-multi-dropdown.open .cabw-multi-button{border-color:#f5c400;box-shadow:0 0 0 .2rem rgba(245,196,0,.18);background:#fff;}
  .cabw-multi-menu{display:none;position:absolute;z-index:3000;left:0;right:0;top:calc(100% + 6px);max-height:300px;overflow:auto;background:#fff;border:1px solid #ccd6e6;border-radius:12px;box-shadow:0 14px 32px rgba(0,31,85,.18);padding:6px;}
  .cabw-multi-dropdown.open .cabw-multi-menu{display:block;}
  .cabw-multi-option{display:flex;gap:9px;align-items:flex-start;padding:8px 9px;border-radius:8px;color:#001f55;font-size:14px;line-height:1.25;cursor:pointer;margin:0;}
  .cabw-multi-option:hover{background:#eef5ff;}
  .cabw-multi-option input{margin-top:2px;accent-color:#003b7a;flex:0 0 auto;}
  .cabw-multi-actions{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #e7edf6;margin-bottom:4px;padding:4px 4px 8px;position:sticky;top:0;background:#fff;z-index:1;}
  .cabw-multi-actions button{border:0;border-radius:8px;background:#e9eef6;color:#003b7a;font-weight:700;padding:5px 8px;font-size:12px;cursor:pointer;}
  .cabw-multi-actions button:hover{background:#dce6f2;}
  .cabw-multi-empty{padding:10px;color:#6c7890;font-size:13px;}
  /* checkbox-proportional-fix */
  .detail-field .cabw-multi-option input[type="checkbox"],.contracts-field .cabw-multi-option input[type="checkbox"],.cabw-multi-option input[type="checkbox"]{appearance:auto!important;-webkit-appearance:checkbox!important;width:18px!important;min-width:18px!important;max-width:18px!important;height:18px!important;min-height:18px!important;max-height:18px!important;padding:0!important;margin:1px 7px 0 0!important;border:1px solid #8fa2bd!important;border-radius:3px!important;background:#fff!important;box-shadow:none!important;flex:0 0 18px!important;transform:none!important;accent-color:#003b7a!important;}
  .cabw-multi-menu{box-sizing:border-box!important;width:100%!important;min-width:100%!important;max-width:min(760px,calc(100vw - 32px))!important;max-height:260px!important;overflow-y:auto!important;overflow-x:auto!important;}
  .cabw-multi-option{display:flex!important;align-items:flex-start!important;gap:8px!important;padding:7px 8px!important;font-size:13px!important;line-height:1.25!important;}
  .cabw-multi-option span{display:block;min-width:0;white-space:nowrap;overflow:visible;}
  .cabw-multi-actions button{min-height:28px!important;width:auto!important;min-width:0!important;padding:5px 10px!important;}

  .cabw-multi-filter-line{display:flex;gap:6px;align-items:center;border-bottom:1px solid #e7edf6;margin-bottom:4px;padding:4px 4px 8px;position:sticky;top:0;background:#fff;z-index:2;}
  .cabw-multi-search{min-width:0;flex:1;border:1px solid #ccd6e6;border-radius:8px;padding:7px 8px;font:inherit;font-size:12px;color:#001f55;background:#f8fbff;}
  .cabw-multi-search-button{border:0;border-radius:8px;background:#003b7a;color:#fff;font-weight:800;padding:7px 9px;font-size:11px;cursor:pointer;white-space:nowrap;}
  .cabw-multi-menu{left:0!important;right:auto!important;width:max-content!important;min-width:min(440px,calc(100vw - 48px))!important;max-width:min(780px,calc(100vw - 48px))!important;overflow-x:auto!important;}
  .cabw-multi-dropdown.cabw-align-right .cabw-multi-menu{left:auto!important;right:0!important;}
  .cabw-multi-option span{white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;}
  .cabw-multi-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
  .cabw-multi-actions button{width:100%!important;white-space:nowrap!important;padding:7px 10px!important;}
  .contracts-filter-grid{grid-template-columns:repeat(3,minmax(230px,1fr))!important;align-items:end!important;}
  @media(max-width:1320px){.contracts-filter-grid{grid-template-columns:repeat(2,minmax(230px,1fr))!important;}}
  @media(max-width:768px){.contracts-filter-grid{grid-template-columns:1fr!important;}.cabw-multi-menu{min-width:100%!important;max-width:calc(100vw - 32px)!important;}}

  `;
  document.head.appendChild(st);
  document.addEventListener('click',e=>{ if(!e.target.closest('.cabw-multi-dropdown')) document.querySelectorAll('.cabw-multi-dropdown.open').forEach(w=>w.classList.remove('open')); });
}
function multiPlaceholder(sel){
  const label=sel.closest('label'); const span=label?label.querySelector('span'):null; const name=(span?span.textContent.trim():'opções').toLowerCase();
  if(name.includes('empresa')) return 'Todas as empresas';
  if(name.includes('número')) return 'Todos os números';
  if(name.includes('unidade')) return 'Todas as unidades';
  if(name.includes('orden')) return 'Todas as ordenações';
  if(name.includes('grande')) return 'Todos os Grandes Comandos';
  if(name.includes('ação')) return 'Todas as ações';
  if(name.includes('moeda')) return 'Todas as moedas';
  if(name.includes('vigência')) return 'Todas';
  if(name.includes('natureza')) return 'Todas as naturezas';
  if(name.includes('projeto')) return 'Todos os projetos';
  if(name==='om') return 'Todas as OM';
  return 'Todas as opções';
}
function positionCabwMultiMenu(wrap){try{wrap.classList.remove('cabw-align-right'); const menu=wrap.querySelector('.cabw-multi-menu'); if(!menu)return; const r=menu.getBoundingClientRect(); if(r.right>window.innerWidth-16) wrap.classList.add('cabw-align-right');}catch(e){}}
function updateCabwMulti(sel){
  const wrap=sel.nextElementSibling && sel.nextElementSibling.classList && sel.nextElementSibling.classList.contains('cabw-multi-dropdown') ? sel.nextElementSibling : null;
  if(!wrap) return;
  const chosen=Array.from(sel.selectedOptions).map(o=>o.textContent.trim()).filter(Boolean);
  const btn=wrap.querySelector('.cabw-multi-button');
  if(btn){ btn.textContent = chosen.length ? (chosen.length<=2 ? chosen.join(', ') : `${chosen.length} selecionadas`) : multiPlaceholder(sel); btn.title = chosen.join(', '); }
  wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>{ const opt=Array.from(sel.options).find(o=>o.value===cb.value); cb.checked=!!(opt&&opt.selected); });
}
function rebuildCabwMulti(sel){
  ensureCabwMultiCss();
  sel.multiple=true; sel.size=1; sel.classList.remove('cabw-multi-select'); sel.classList.add('cabw-native-multi-hidden'); sel.setAttribute('aria-hidden','true'); sel.tabIndex=-1;
  let wrap=sel.nextElementSibling && sel.nextElementSibling.classList && sel.nextElementSibling.classList.contains('cabw-multi-dropdown') ? sel.nextElementSibling : null;
  if(!wrap){ wrap=document.createElement('div'); wrap.className='cabw-multi-dropdown'; sel.parentNode.insertBefore(wrap, sel.nextSibling); }
  const options=Array.from(sel.options);
  const menuItems=options.length ? options.map(o=>`<label class="cabw-multi-option"><input type="checkbox" value="${esc(o.value)}" ${o.selected?'checked':''}><span>${esc(o.textContent)}</span></label>`).join('') : '<div class="cabw-multi-empty">Sem opções disponíveis</div>';
  wrap.innerHTML=`<button type="button" class="cabw-multi-button" aria-haspopup="listbox" aria-expanded="false"></button><div class="cabw-multi-menu"><div class="cabw-multi-filter-line"><input type="search" class="cabw-multi-search" data-ms-search placeholder="Filtrar opções..."><button type="button" class="cabw-multi-search-button" data-ms-action="contains">Aplicar</button></div><div class="cabw-multi-actions"><button type="button" data-ms-action="all">Marcar todas</button><button type="button" data-ms-action="clear">Limpar</button></div>${menuItems}</div>`;
  const btn=wrap.querySelector('.cabw-multi-button');
  btn.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.cabw-multi-dropdown.open').forEach(w=>{if(w!==wrap)w.classList.remove('open')}); wrap.classList.toggle('open'); btn.setAttribute('aria-expanded',wrap.classList.contains('open')?'true':'false'); if(wrap.classList.contains('open')) setTimeout(()=>positionCabwMultiMenu(wrap),0);});
  btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault(); btn.click();}});
  wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',()=>{ /* seleção pendente: aplica somente ao clicar em Aplicar */ }));
  const searchInput=wrap.querySelector('[data-ms-search]'); const filterOptions=()=>{const q=(searchInput?.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); wrap.querySelectorAll('.cabw-multi-option').forEach(label=>{const txt=(label.textContent||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); label.style.display=!q||txt.includes(q)?'flex':'none';});}; searchInput?.addEventListener('input',filterOptions); searchInput?.addEventListener('click',e=>e.stopPropagation()); wrap.querySelector('[data-ms-action="contains"]')?.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); const checked=new Set(Array.from(wrap.querySelectorAll('input[type="checkbox"]:checked')).map(cb=>cb.value)); Array.from(sel.options).forEach(o=>{o.selected=checked.has(o.value);}); updateCabwMulti(sel); sel.dispatchEvent(new Event('change',{bubbles:true})); wrap.classList.remove('open');});
  wrap.querySelector('[data-ms-action="all"]')?.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=true);});
  wrap.querySelector('[data-ms-action="clear"]')?.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=false);});
  updateCabwMulti(sel);
}
function updateAllCabwMultis(){document.querySelectorAll('select.cabw-native-multi-hidden').forEach(updateCabwMulti);}

function fillMulti(sel, vals){if(!sel)return; const old=selected(sel); sel.multiple=true; sel.innerHTML=vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); if(old.length){old.forEach(v=>{const o=Array.from(sel.options).find(o=>o.value===v); if(o)o.selected=true;});} else {Array.from(sel.options).forEach(o=>o.selected=false);} rebuildCabwMulti(sel);}
function dateBr(s){if(!s)return '—'; const [y,m,d]=String(s).split('-'); return d&&m&&y?`${d}/${m}/${y}`:'—';}
function daysToEnd(r){if(!r.dataFinal)return null; const end=new Date(r.dataFinal+'T00:00:00'); const now=new Date(); now.setHours(0,0,0,0); return Math.ceil((end-now)/(1000*60*60*24));}
function vigenciaBucket(r){const d=daysToEnd(r); if(d===null||Number.isNaN(d)) return 'Sem data final'; if(d<0) return 'Vigência expirada'; if(d<90) return 'Vencimento em menos de 90 dias'; if(d<=150) return 'Vencimento entre 90 e 150 dias'; return 'Vencimento acima de 150 dias';}
function risk(r){const d=daysToEnd(r); if(d===null||Number.isNaN(d)) return ''; if(d<0)return 'VENCIDO'; if(d<90)return 'RISCO'; return '';}
function dueSeverity(r){const d=daysToEnd(r); if(d===null||Number.isNaN(d))return 'sem-data'; if(d<0)return 'vencido'; if(d<90)return 'ate-90'; if(d<=150)return 'ate-150'; return 'regular';}
function dueDaysText(r){const d=daysToEnd(r); if(d===null||Number.isNaN(d))return 'Sem data'; if(d<0)return 'Vencido há '+Math.abs(d)+' dia(s)'; if(d===0)return 'Vence hoje'; return d+' dia(s)';}
function dueBadgeHtml(r){const sev=dueSeverity(r); return '<span class="contract-due-badge contract-due-badge--'+sev+'">'+esc(dueDaysText(r))+'</span>'; }
function riskBucket(r){const d=daysToEnd(r); if(d===null||Number.isNaN(d)) return {cls:'sem-data',label:'Sem data'}; if(d<0) return {cls:'critico',label:'Vencido'}; if(d<90) return {cls:'critico',label:'< 90 dias'}; if(d<=150) return {cls:'atencao',label:'90 a 150 dias'}; return {cls:'normal',label:'> 150 dias'};}
function riskColumnHtml(r){const b=riskBucket(r); return '<div class="contract-risk-stack"><span class="contract-risk-chip contract-risk-chip--'+b.cls+'">'+esc(b.label)+'</span><small class="contract-risk-days">'+esc(dueDaysText(r))+'</small></div>';}
function dueStatusHtml(r){const sev=dueSeverity(r); const label=vigenciaBucket(r); const flag=risk(r); return '<span class="contract-status-pill contract-status-pill--'+sev+'">'+esc(label)+'</span>'+(flag?'<strong class="risk-flag">'+esc(flag)+'</strong>':'');}
function dueSortValue(r){const d=daysToEnd(r); if(d===null||Number.isNaN(d))return 999999; return d;}
function sortByDueDate(rows){return rows.slice().sort((a,b)=>dueSortValue(a)-dueSortValue(b)||String(a.empresa||'').localeCompare(String(b.empresa||''),'pt-BR')||String(a.numero||'').localeCompare(String(b.numero||''),'pt-BR'));}
function catRows(cat){return records.filter(r=>!cat||r.category===cat);}
function accountabilityRowsForCategory(cat){
  const isAdministrative=row=>String(row.grandComando||row.grandeComando||'').trim().toUpperCase()==='CW';
  const isFms=row=>String(row.cage||'').trim().toUpperCase()==='W2525';
  if(cat==='administrativos')return records.filter(isAdministrative);
  if(cat==='finalisticos')return records.filter(row=>!isAdministrative(row)&&!isFms(row));
  if(cat==='fms')return records.filter(isFms);
  return records.slice();
}
const administrativeAccountabilityOrder=[
  '205721', // WEX BANK — CT 033/CABW/2021
  '223218', // VERIZON MÓVEL — 025/CABW/2022
  '224662', // VERIZON FIXA — 033/CABW/2022
  '260020', // ADVANTAGE LEASING — 003/CABW/2026
  '240487', // DC WATER — 034/CABW/2024
  '260134', // MILCLEAN — 007/CABW/2026
  '260050', // MILCLEAN — CT 012/CABW/2026
  '224225', // GRANITE — 021/CABW/2022
  '240488', // WASHINGTON SUBURBAN SANITARY — 038/CABW/2024
  '260113', // CAREFIRST
  '211258', // UNITED HEALTHCARE — 022/CABW/2021
  '260124', // BARIC — 006/CABW/2026
  '250159', // BARIC — 015/CABW/2025
  '250503', // BARIC — 016/CABW/2025
  '240080', // SAHOURI — seguro predial e veicular
  '260105', // SAHOURI — 005/CABW/2026
  '231103', // DARCARS — 002/CABW/2024
  '240486', // WASHINGTON GAS — 035/CABW/2024
  '240489', // PEPCO — 033/CABW/2024
  '240619', // GENEXUS
  '240233', // transporte de materiais
  '250550', // transporte marítimo
  '260056', // desembaraço aduaneiro — NORVIK
  '250577', // transporte logístico internacional
  '260024', // transporte internacional de cargas
  '260025'  // transporte internacional de cargas
];
function sortAccountabilityRows(rows,cat){
  if(cat!=='administrativos')return sortByDueDate(rows);
  const rank=new Map(administrativeAccountabilityOrder.map((value,index)=>[value,index]));
  return rows.slice().sort((a,b)=>{
    const ar=rank.has(String(a.contrato||''))?rank.get(String(a.contrato||'')):Number.MAX_SAFE_INTEGER;
    const br=rank.has(String(b.contrato||''))?rank.get(String(b.contrato||'')):Number.MAX_SAFE_INTEGER;
    return ar-br||dueSortValue(a)-dueSortValue(b)||String(a.numero||'').localeCompare(String(b.numero||''),'pt-BR');
  });
}
function agg(rows){const paid=rows.reduce((a,r)=>a+Number(r.totalEmpenhadoUsd||0),0), billed=rows.reduce((a,r)=>a+Number(r.totalFaturadoUsd||0),0); return {count:rows.length,value:rows.reduce((a,r)=>a+Number(r.valorContrato||0),0),paid:paid,billed:billed,toBill:paid-billed,available:rows.reduce((a,r)=>a+Number(r.valorAEmpenhar||0),0)};}
function filters(){return {numero:selected($('#filterNumeroContrato')), empresa:selected($('#filterEmpresa')), unidade:selected($('#filterUnidade')), gc:selected($('#filterGrandeComando')), ordenador:selected($('#filterOrdenador')), acao:selected($('#filterAcao')), moeda:selected($('#filterMoeda')), status:selected($('#filterStatus')), valueRange:selected($('#filterValueRange')), search:($('#filterContratoSearch')?.value||'').trim().toLowerCase()};}
function has(sel,val){return !sel.length||sel.includes(val||'');}
function valueRangeBucket(v){v=Number(v||0); if(v<=10000)return 'até US$ 10,000.00'; if(v<=50000)return 'entre US$ 10,000.00 e US$ 50,000.00'; if(v<=1000000)return 'Entre US$ 50,000.00 e US$ 1,000,000.00'; return 'Acima de US$ 1,000,000.00';}
const valueRangeOptions=['até US$ 10,000.00','entre US$ 10,000.00 e US$ 50,000.00','Entre US$ 50,000.00 e US$ 1,000,000.00','Acima de US$ 1,000,000.00'];
const poDetails=root.poDetails||root.purchaseOrdersByContract||{};
function poDateValue(s){return String(s||'');}
function formatDateIso(s){if(!s)return '—'; const p=String(s).slice(0,10).split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:String(s);}
function contractPurchaseOrders(r){
  const key=String(r&&r.contrato||'').trim(); const uniqueByPo=new Map();
  (poDetails[key]||[]).forEach(p=>{const po=String(p&&p.po||'').trim(); if(!po)return; const previous=uniqueByPo.get(po); if(!previous||poDateValue(p.data)>=poDateValue(previous.data))uniqueByPo.set(po,p);});
  return Array.from(uniqueByPo.values());
}
function contractPoBalance(r){return contractPurchaseOrders(r).reduce((sum,p)=>sum+Number(p.saldoUsd||0),0);}
function poRowsForContracts(rows){const arr=[]; rows.forEach(r=>{contractPurchaseOrders(r).forEach(p=>arr.push(Object.assign({contrato:r.contrato,numeroContrato:r.numero},p)));}); return arr.sort((a,b)=>poDateValue(b.data).localeCompare(poDateValue(a.data)));}

function ensureInvoiceMonthlySection(){let sec=$('#contractsInvoiceMonthlySection'); if(sec)return sec; const tableSec=$('#contractsTable')?.closest('.contracts-table-card'); if(!tableSec)return null; tableSec.insertAdjacentHTML('afterend','<section class="contracts-table-card" id="contractsInvoiceMonthlySection" aria-label="Faturamento mensal por contrato"><div class="contracts-table-toolbar"><h2>Faturamento mensal por PO associada</h2><span>Valores faturados por mês nas POs vinculadas aos contratos filtrados</span></div><div class="contracts-invoice-chart-wrap" style="position:relative;width:100%;min-height:440px"><div id="contractsInvoiceMonthlyChart" style="min-height:420px;width:100%"></div><aside id="contractsInvoiceAverageBox" aria-label="Média mensal faturada"></aside></div></section>'); return $('#contractsInvoiceMonthlySection');}
function invoiceDetailLabel(items){
  if(!items||!items.length)return 'Sem faturas no mês';
  const grouped=new Map();
  items.forEach(it=>{const fat=String(it.fatura||'Sem fatura').trim()||'Sem fatura'; const po=String(it.po||'').trim(); const k=fat+'|'+po; const cur=grouped.get(k)||{fatura:fat,po:po,valor:0}; cur.valor+=Number(it.valor||0); grouped.set(k,cur);});
  const arr=Array.from(grouped.values()).sort((a,b)=>String(a.fatura).localeCompare(String(b.fatura),'pt-BR')||String(a.po).localeCompare(String(b.po),'pt-BR'));
  const max=28;
  const lines=arr.slice(0,max).map(it=>`${esc(it.fatura)}${it.po?' / PO '+esc(it.po):''}: ${money(it.valor)}`);
  if(arr.length>max) lines.push(`... mais ${arr.length-max} fatura(s)`);
  return lines.join('<br>');
}

function parseIsoDate(v){if(!v)return null; const d=new Date(String(v).slice(0,10)+'T00:00:00'); return isNaN(d.getTime())?null:d;}
function activeMonthsInYearForRows(rows, year){
  const generatedAt=parseIsoDate(root.meta&&root.meta.geradoEm); const referenceDate=generatedAt||new Date(); const y=Number(year);
  const yearStart=new Date(y,0,1); const naturalYearEnd=new Date(y,11,31);
  const cutoff=(y===referenceDate.getFullYear())? new Date(y,referenceDate.getMonth(),referenceDate.getDate()) : naturalYearEnd;
  const months=new Set();
  (rows||[]).forEach(r=>{
    const start=parseIsoDate(r.dataInicio)||yearStart;
    const end=parseIsoDate(r.dataFinal)||cutoff;
    const s=start>yearStart?start:yearStart;
    const e=end<cutoff?end:cutoff;
    if(e>=s){for(let m=s.getMonth();m<=e.getMonth();m++) months.add(m);}
  });
  return Math.max(1, months.size || (rows&&rows.length?1:1));
}
function monthlyInvoiceForRows(rows){const meta=root.invoiceMonthlyMeta||{}; const map=root.invoiceMonthlyByContract||{}; const detailMap=root.invoiceMonthlyDetailsByContract||{}; const cur=Array(12).fill(0), prev=Array(12).fill(0); const curDetails=Array.from({length:12},()=>[]), prevDetails=Array.from({length:12},()=>[]); rows.forEach(r=>{const key=String(r.contrato||'').trim(); const rec=map[key]; if(rec){(rec.current||[]).forEach((v,i)=>cur[i]+=Number(v||0)); (rec.previous||[]).forEach((v,i)=>prev[i]+=Number(v||0));} const det=detailMap[key]; if(det){(det.current||[]).forEach((items,i)=>(items||[]).forEach(x=>curDetails[i].push(x))); (det.previous||[]).forEach((items,i)=>(items||[]).forEach(x=>prevDetails[i].push(x)));}}); return {current:cur, previous:prev, currentDetails:curDetails, previousDetails:prevDetails, currentYear:meta.currentYear||new Date().getFullYear(), previousYear:meta.previousYear||((meta.currentYear||new Date().getFullYear())-1)};}
function drawInvoiceMonthlyChart(rows){const sec=ensureInvoiceMonthlySection(); if(!sec)return; const el=$('#contractsInvoiceMonthlyChart'); if(!el)return; const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; const d=monthlyInvoiceForRows(rows); const currentHover=d.currentDetails.map(invoiceDetailLabel); const previousHover=d.previousDetails.map(invoiceDetailLabel); const currentText=d.current.map(v=>Math.abs(Number(v||0))>0.005?money(v):''); const denomCurrent=activeMonthsInYearForRows(rows,d.currentYear); const denomPrevious=activeMonthsInYearForRows(rows,d.previousYear); const avgCurrent=d.current.reduce((a,b)=>a+Number(b||0),0)/denomCurrent; const avgPrevious=d.previous.reduce((a,b)=>a+Number(b||0),0)/denomPrevious; let avgBox=document.getElementById('contractsInvoiceAverageBox'); if(avgBox){avgBox.style.cssText='position:absolute;right:26px;top:58px;z-index:5;width:220px;border:1px solid #d9e2ef;border-radius:14px;background:rgba(248,251,255,.96);padding:12px 14px;color:#001f55;box-shadow:0 8px 22px rgba(0,31,85,.10);pointer-events:none'; avgBox.innerHTML='<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#52627a;margin-bottom:7px">Média mensal faturada</div><div style="margin-bottom:8px"><span style="display:block;font-size:11px;color:#52627a">'+d.currentYear+' · '+denomCurrent+' mês(es)</span><strong style="font-size:17px;color:#001f55">'+money(avgCurrent)+'</strong></div><div><span style="display:block;font-size:11px;color:#52627a">'+d.previousYear+' · '+denomPrevious+' mês(es)</span><strong style="font-size:17px;color:#6b7280">'+money(avgPrevious)+'</strong></div>';} if(window.Plotly){Plotly.newPlot(el,[{type:'scatter',mode:'lines+markers+text',name:String(d.currentYear),x:months,y:d.current,text:currentText,textposition:'top center',textfont:{color:'#001f55',size:11},cliponaxis:false,customdata:currentHover,line:{color:'#001f55',width:4},marker:{color:'#001f55',size:7},hovertemplate:'%{x}<br>'+d.currentYear+': US$ %{y:,.2f}<br><b>Faturas</b><br>%{customdata}<extra></extra>'},{type:'scatter',mode:'lines+markers',name:String(d.previousYear),x:months,y:d.previous,customdata:previousHover,line:{color:'#8d96a6',width:3},marker:{color:'#8d96a6',size:6},hovertemplate:'%{x}<br>'+d.previousYear+': US$ %{y:,.2f}<br><b>Faturas</b><br>%{customdata}<extra></extra>'}],{height:430,margin:{l:80,r:230,t:48,b:55},yaxis:{title:'US$',autorange:true},xaxis:{type:'category',categoryorder:'array',categoryarray:months},legend:{orientation:'h',x:0,y:1.14},hovermode:'closest'},{displayModeBar:false,responsive:true}); setTimeout(()=>{try{Plotly.Plots.resize(el)}catch(e){}},80);}else{el.innerHTML='<p>Plotly não carregado.</p>';}}
function poDetailsTableHtml(rows,reportMode){const pos=poRowsForContracts(rows); const total=pos.reduce((a,p)=>a+Number(p.valorTotalUsd||0),0); const fat=pos.reduce((a,p)=>a+Number(p.valorFaturadoUsd||0),0); const sal=pos.reduce((a,p)=>a+Number(p.saldoUsd||0),0); const totalRow=`<tr class="po-total-row" style="font-weight:800;background:#eef3fa;color:#00265f"><td colspan="6">Total das POs listadas</td><td class="text-right">${money(total)}</td><td class="text-right">${money(fat)}</td><td class="text-right">${money(sal)}</td></tr>`; const dataRows=pos.map(p=>`<tr><td>${esc(p.contrato)}</td><td>${esc(p.numeroContrato)}</td><td>${esc(p.po)}</td><td>${formatDateIso(p.data)}</td><td>${esc(p.fornecedor)}</td><td>${esc(p.objetoResumo||p.projeto||"")}</td><td class="text-right">${money(p.valorTotalUsd)}</td><td class="text-right">${money(p.valorFaturadoUsd)}</td><td class="text-right">${money(p.saldoUsd)}</td></tr>`).join('') || '<tr><td colspan="9">Nenhuma PO encontrada para os contratos filtrados.</td></tr>'; const table=`<table class="contracts-table"><thead><tr><th>Contrato</th><th>Número contrato</th><th>Ordem de compra</th><th>Data emissão</th><th>Fornecedor</th><th>Objeto - resumo</th><th>Valor total PO</th><th>Valor faturado PO</th><th>Saldo PO</th></tr></thead><tbody>${totalRow}${dataRows}</tbody></table>`; return reportMode?table:`<div class="contracts-table-wrap">${table}</div>`;}
function renderPoDetails(rows){const box=$('#contractPoDetails'); if(!box)return; const pos=poRowsForContracts(rows); box.style.display='block'; box.innerHTML=`<div class="contracts-table-toolbar"><h2>Detalhamento por PO</h2><span>${num(pos.length)} ordem(ns) de compra associada(s) aos contratos filtrados</span></div>${poDetailsTableHtml(rows,false)}`;}
function rowMatches(r,f,cat){const ordVal = cat==='finalisticos' ? r.tipoOrdenacao : r.ordenadorDespesa; const hay=[r.contrato,r.numero,r.empresa,r.objetoResumo,r.unidade,r.grandComando,r.acao,r.cage,ordVal].join(' ').toLowerCase(); return has(f.numero,r.numero)&&has(f.empresa,r.empresa)&&has(f.unidade,r.unidade)&&has(f.gc,r.grandComando)&&has(f.ordenador,ordVal)&&has(f.acao,r.acao)&&has(f.moeda,r.moeda)&&has(f.status,vigenciaBucket(r))&&has(f.valueRange,valueRangeBucket(r.valorContrato))&&(!f.search||hay.includes(f.search));}
function populateFilters(rows,cat){fillMulti($('#filterNumeroContrato'), unique(rows.map(r=>r.numero))); fillMulti($('#filterEmpresa'), unique(rows.map(r=>r.empresa))); fillMulti($('#filterUnidade'), unique(rows.map(r=>r.unidade))); fillMulti($('#filterGrandeComando'), unique(rows.map(r=>r.grandComando))); fillMulti($('#filterOrdenador'), cat==='finalisticos' ? ['Ordenação de despesas pela CABW','Ordenação de Despesas pela OM Requisitante'] : unique(rows.map(r=>r.ordenadorDespesa))); fillMulti($('#filterAcao'), unique(rows.map(r=>r.acao))); fillMulti($('#filterMoeda'), unique(rows.map(r=>r.moeda))); fillMulti($('#filterStatus'), ['Vencimento acima de 150 dias','Vencimento entre 90 e 150 dias','Vencimento em até 90 dias','Vigência expirada','Sem data final']); fillMulti($('#filterValueRange'), valueRangeOptions);}
function drawChart(rows){const el=$('#contractsValueChart'); if(!el)return; const a=agg(rows); if(window.Plotly){Plotly.newPlot(el,[{type:'bar',x:['Valor contratado','Empenhado','Faturado','Saldo empenhado a faturar','Disponível p/ empenho'],y:[a.value,a.paid,a.billed,a.toBill,a.available],text:[money(a.value),money(a.paid),money(a.billed),money(a.toBill),money(a.available)],textposition:'auto',marker:{color:['#003b7a','#0e63b6','#f5c400','#1f7a66','#4c6a92']}}],{height:390,margin:{l:80,r:20,t:20,b:105},yaxis:{title:'US$'},xaxis:{automargin:true,tickangle:-18}},{displayModeBar:false,responsive:true});}else{el.innerHTML='<p>Plotly não carregado.</p>';}}

async function getContractChartImage(){const el=$('#contractsValueChart'); if(!el||!window.Plotly||!el.data) return ''; try{return await Plotly.toImage(el,{format:'png',width:1000,height:460,scale:1.5});}catch(e){console.warn('Falha ao capturar gráfico',e); return '';}}

async function getInvoiceMonthlyChartImage(){const el=$('#contractsInvoiceMonthlyChart'); if(!el||!window.Plotly||!el.data) return ''; try{return await Plotly.toImage(el,{format:'png',width:1000,height:460,scale:1.5});}catch(e){console.warn('Falha ao capturar gráfico mensal',e); return '';}}
function contractReportStyles(){return `<style>body{font-family:Arial,Helvetica,sans-serif;color:#0a2450;margin:32px;}h1{font-size:28px;margin:0 0 6px;color:#00265f;}h2{font-size:18px;color:#00265f;border-bottom:2px solid #ffd200;padding-bottom:6px;margin-top:24px;}p{text-align:justify;line-height:1.45}.meta{color:#52627a;margin-bottom:18px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.card{border:1px solid #d9e2ef;border-radius:12px;padding:12px;background:#f8fbff}.card span{display:block;font-size:12px;color:#52627a;font-weight:700}.card strong{display:block;font-size:18px;color:#00265f;margin-top:4px}.chart{width:100%;max-width:900px;margin:12px auto;display:block;border:1px solid #e1e8f2;border-radius:8px}.report-filter-table,table{border-collapse:collapse;width:100%;font-size:11px}.report-filter-table th{width:190px;text-align:left;background:#eef3fa}th,td{border:1px solid #d9e2ef;padding:6px;vertical-align:top}thead th{background:#003b7a;color:#fff}.po-total-row td,.po-total-row th{font-weight:800!important;background:#eef3fa!important;color:#00265f!important}.text-right{text-align:right}.risk{background:#fff5d6}.contract-risk-chip{display:inline-flex;padding:4px 8px;border-radius:999px;font-weight:800;white-space:nowrap}.contract-risk-chip--critico{background:#b91c1c;color:#fff}.contract-risk-chip--atencao{background:#ffd200;color:#4a3a00}.contract-risk-chip--normal{background:#003b7a;color:#fff}.contract-risk-chip--sem-data{background:#e5e7eb;color:#374151}.contract-row--vencido td{background:#f8d7da!important}.contract-row--ate-90 td{background:#fff3cd!important}.contract-row--ate-150 td{background:#fff8e1!important}.contract-row--sem-data td{background:#eef1f5!important}.print-actions{position:sticky;top:0;background:#fff;padding:8px 0;margin-bottom:12px}.print-actions button{background:#003b7a;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:700}@media print{.print-actions{display:none}.chart{page-break-inside:avoid}body{margin:16mm}.cards{grid-template-columns:repeat(2,1fr)}table{font-size:9px}} </style>`;}
function contractSelectedFiltersHtml(){const rows=$all('.cabw-multi-dropdown').map(w=>{const label=w.closest('label')?.querySelector('span')?.textContent?.trim()||'Filtro'; const val=w.querySelector('.cabw-multi-button')?.textContent?.trim()||'Todas as opções'; return `<tr><th>${esc(label)}</th><td>${esc(val)}</td></tr>`;}); const search=$('#filterContratoSearch')?.value?.trim(); if(search) rows.push(`<tr><th>Busca geral</th><td>${esc(search)}</td></tr>`); return rows.length?`<table class="report-filter-table"><tbody>${rows.join('')}</tbody></table>`:'<p>Sem filtros específicos selecionados.</p>';}
async function generateContractsReport(){
  const cat=document.body.getAttribute('data-contract-category'); const base=catRows(cat); const f=filters(); const rows=base.filter(r=>rowMatches(r,f,cat)); const a=agg(rows); const chart=await getContractChartImage(); const invoiceChart=await getInvoiceMonthlyChartImage();
  const title=$('#contract-section-title')?.textContent?.trim()||'Contratos';
  const reportRows=sortByDueDate(rows);
  const bodyRows=reportRows.map(r=>`<tr class="contract-row--${dueSeverity(r)} ${risk(r)?'risk':''}"><td>${riskColumnHtml(r)}</td><td>${esc(r.contrato)}</td><td>${esc(r.numero)}</td><td>${esc(r.unidade)}</td><td>${esc(cat==='finalisticos'?r.tipoOrdenacao:r.ordenadorDespesa)}</td><td>${esc(r.grandComando)}</td><td>${esc(r.empresa)}</td><td>${esc(r.objetoResumo)}</td><td>${esc(r.moeda)}</td><td class="text-right">${money(r.valorContrato)}</td><td class="text-right">${money(r.totalEmpenhadoUsd)}</td><td class="text-right">${money(r.totalFaturadoUsd)}</td><td class="text-right">${money(r.valorAEmpenhar)}</td><td>${dateBr(r.dataFinal)}</td><td>${esc(vigenciaBucket(r))} ${risk(r)?risk(r):''}</td></tr>`).join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Relatório - ${esc(title)}</title>${contractReportStyles()}</head><body><div class="print-actions"><button onclick="window.print()">Imprimir / salvar PDF</button></div><h1>Relatório Gerencial - ${esc(title)}</h1><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')} com base nos filtros aplicados no painel.</div><p>Este relatório apresenta os contratos filtrados, seus principais indicadores financeiros, situação de vigência e detalhamento gerencial para acompanhamento da execução contratual.</p><h2>Filtros aplicados</h2>${contractSelectedFiltersHtml()}<h2>Indicadores</h2><div class="cards"><div class="card"><span>Contratos</span><strong>${num(a.count)}</strong></div><div class="card"><span>Valor contratado</span><strong>${money(a.value)}</strong></div><div class="card"><span>Total empenhado USD</span><strong>${money(a.paid)}</strong></div><div class="card"><span>Total faturado USD</span><strong>${money(a.billed)}</strong></div></div><h2>Gráfico de valores</h2>${chart?`<img class="chart" src="${chart}">`:'<p>Gráfico indisponível.</p>'}<h2>Tabela detalhada de contratos</h2><table><thead><tr><th>Risco / prazo</th><th>Contrato</th><th>Número</th><th>Unidade</th><th>Ordenação</th><th>Grande Comando</th><th>Empresa</th><th>Objeto</th><th>Moeda</th><th>Valor</th><th>Empenhado USD</th><th>Faturado USD</th><th>Disp. empenho</th><th>Fim vigência</th><th>Situação</th></tr></thead><tbody>${bodyRows||'<tr><td colspan="15">Nenhum contrato encontrado.</td></tr>'}</tbody></table><h2>Faturamento mensal por PO associada</h2>${invoiceChart?`<img class="chart" src="${invoiceChart}">`:'<p>Gráfico mensal indisponível.</p>'}<h2>Detalhamento por PO</h2>${poDetailsTableHtml(rows,true)}</body></html>`;
  const w=window.open('','_blank'); if(!w){alert('Autorize pop-ups para gerar o relatório.'); return;} w.document.open(); w.document.write(html); w.document.close();
}

function ensureAccountabilityButton(){
  const panel=$('.cabw-report-panel'); const regular=$('#generateContractsReport');
  if(!panel||!regular||$('#generateAccountabilityReport'))return;
  const button=document.createElement('button');
  button.type='button'; button.className='cabw-report-button'; button.id='generateAccountabilityReport';
  button.style.marginTop='10px';
  button.innerHTML='<i class="bi bi-journal-check"></i> Consolidação para prestação de contas';
  regular.insertAdjacentElement('afterend',button);
}
function reportBarChart(items){
  const max=Math.max(1,...items.map(i=>Math.max(0,Number(i.value||0))));
  return '<div class="account-bars">'+items.map(i=>{const color=esc(i.color||'#0e63b6');return '<div class="account-bar-row"><span>'+esc(i.label)+'</span><div class="account-bar-track"><i style="width:'+Math.max(0,Number(i.value||0))/max*100+'%;background:'+color+';color:'+color+';box-shadow:inset 0 0 0 1000px currentColor"></i></div><strong>'+esc(i.display||money(i.value))+'</strong></div>';}).join('')+'</div>';
}
function monthlyDetailsForOm(details,omCode){return (details||[]).map(items=>(items||[]).filter(item=>accountabilityOmInfo(item,{}).code===omCode));}
function monthlyTotalsFromDetails(details){return (details||[]).map(items=>(items||[]).reduce((sum,item)=>sum+Number(item.valor||0),0));}
function monthlyDataForOm(source,omCode){
  if(!omCode||omCode==='ALL')return source;
  const previousDetails=monthlyDetailsForOm(source.previousDetails,omCode),currentDetails=monthlyDetailsForOm(source.currentDetails,omCode);
  return Object.assign({},source,{previous:monthlyTotalsFromDetails(previousDetails),current:monthlyTotalsFromDetails(currentDetails),previousDetails,currentDetails});
}
function monthlyOmOptions(source){
  const found=new Map();
  [...(source.previousDetails||[]),...(source.currentDetails||[])].forEach(items=>(items||[]).forEach(item=>{const info=accountabilityOmInfo(item,{});if(info.code&&!found.has(info.code))found.set(info.code,{code:info.code,label:(info.full.split(' - ')[0]||info.code).trim()||info.code,full:info.full});}));
  return Array.from(found.values()).sort((a,b)=>(a.code==='CW'?-1:b.code==='CW'?1:a.label.localeCompare(b.label,'pt-BR')));
}
function contractOmOptions(r,source){
  const found=new Map(monthlyOmOptions(source).map(item=>[item.code,item]));
  contractPurchaseOrders(r).forEach(po=>{const info=accountabilityOmInfo({omCodigo:po.omCodigo,om:po.om},po);if(info.code&&!found.has(info.code))found.set(info.code,{code:info.code,label:(info.full.split(' - ')[0]||info.code).trim()||info.code,full:info.full});});
  return Array.from(found.values()).filter(item=>item.code!=='N/I').sort((a,b)=>(a.code==='CW'?-1:b.code==='CW'?1:a.label.localeCompare(b.label,'pt-BR')));
}
function monthlyAverageStats(source){
  const reference=parseIsoDate(root.meta&&root.meta.geradoEm)||new Date();
  const currentYear=Number(source.currentYear),referenceYear=reference.getFullYear();
  const closedCurrent=currentYear<referenceYear?12:(currentYear===referenceYear?reference.getMonth():0);
  const previousTotal=(source.previous||[]).slice(0,12).reduce((sum,value)=>sum+Number(value||0),0);
  const currentTotal=(source.current||[]).slice(0,closedCurrent).reduce((sum,value)=>sum+Number(value||0),0);
  return {previous:previousTotal/12,current:closedCurrent?currentTotal/closedCurrent:0,previousMonths:12,currentMonths:closedCurrent};
}
function monthlyTooltip(label,value,items){const grouped=new Map();(items||[]).forEach(item=>{const invoice=String(item.fatura||'Sem fatura').trim()||'Sem fatura';const po=String(item.po||'').trim();const key=invoice+'|'+po;const row=grouped.get(key)||{invoice,po,value:0};row.value+=Number(item.valor||0);grouped.set(key,row);});const lines=[label+' — '+money(value)];if(!grouped.size)lines.push('Sem faturas no mês');else Array.from(grouped.values()).sort((a,b)=>a.invoice.localeCompare(b.invoice,'pt-BR')).forEach(item=>lines.push(item.invoice+(item.po?' · PO '+item.po:'')+': '+money(item.value)));return lines.join('\n');}
function monthlyScaleMax(source){const averages=monthlyAverageStats(source);return Math.max(1,averages.previous,averages.current,...(source.previous||[]).map(Number),...(source.current||[]).map(Number));}
function monthlyChartVariant(source,omCode,scaleMax){
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; const d=monthlyDataForOm(source,omCode); const values=[]; const averages=monthlyAverageStats(d);
  (d.previous||[]).forEach((value,i)=>{const label=months[i]+'/'+String(d.previousYear).slice(-2);values.push({label,value:Number(value||0),color:'#8d96a6',tooltip:monthlyTooltip(label,Number(value||0),(d.previousDetails||[])[i])});});
  (d.current||[]).forEach((value,i)=>{const label=months[i]+'/'+String(d.currentYear).slice(-2);values.push({label,value:Number(value||0),color:'#0e63b6',tooltip:monthlyTooltip(label,Number(value||0),(d.currentDetails||[])[i])});});
  const max=Math.max(1,Number(scaleMax||monthlyScaleMax(source))); const previousHeight=Math.max(0,averages.previous/max*82),currentHeight=Math.max(0,averages.current/max*82);
  const bars='<div class="month-bars" data-scale-max="'+max+'" aria-label="Histórico mensal: cinza para o ano anterior e azul para o ano atual, com escala fixa para todas as OM">'+values.map(i=>{const height=Math.max(i.value>0?4:0,i.value/max*82);return '<div class="month-bar" title="'+esc(i.tooltip)+'"><div class="month-bar-track" style="--bar-height:'+height+'%"><span class="month-value">'+chartMoney(i.value)+'</span><i style="height:var(--bar-height);background:'+i.color+';color:'+i.color+';box-shadow:inset 0 0 0 1000px currentColor"></i></div><strong>'+esc(i.label)+'</strong></div>';}).join('')+'<div class="month-average-overlay" aria-hidden="true"><span class="month-average-line month-average-line--previous" style="--average-height:'+previousHeight+'%"></span><span class="month-average-line month-average-line--current" style="--average-height:'+currentHeight+'%"></span></div></div>';
  const legend='<div class="month-legend"><span><i class="previous"></i>'+esc(String(d.previousYear))+'</span><span><i class="current"></i>'+esc(String(d.currentYear))+'</span><span class="month-average-legend"><i class="average-previous"></i>Média de '+esc(String(d.previousYear))+': <strong>'+chartMoney(averages.previous)+'</strong></span><span class="month-average-legend"><i class="average-current"></i>Média de '+esc(String(d.currentYear))+': <strong>'+chartMoney(averages.current)+'</strong></span></div>';
  return bars+legend;
}
function contractMonthlyHistoryHtml(r){
  const source=monthlyInvoiceForRows([r]); const oms=contractOmOptions(r,source); const options=[{code:'ALL',label:'Todas OM',full:'Todas as organizações militares'},...oms]; const scaleMax=monthlyScaleMax(source);
  const controls='<div class="month-history-toolbar"><span>Faturamentos por OM</span><div class="month-om-buttons" role="group" aria-label="Filtrar faturamentos por organização militar">'+options.map((option,index)=>'<button type="button" class="month-om-button'+(index===0?' is-active':'')+'" data-om="'+esc(option.code)+'" aria-pressed="'+(index===0?'true':'false')+'" title="'+esc(option.full)+'" onclick="accountabilityFilterOm(this)">'+esc(option.label)+'</button>').join('')+'</div></div>';
  const views=options.map((option,index)=>'<div class="month-history-view" data-om-view="'+esc(option.code)+'"'+(index===0?'':' hidden')+'>'+monthlyChartVariant(source,option.code,scaleMax)+'</div>').join('');
  return '<div class="month-history" data-contract="'+esc(r.contrato||'')+'">'+controls+views+'</div>';
}
function closedMonthsAverage(r,omCode){
  const monthly=monthlyDataForOm(monthlyInvoiceForRows([r]),omCode||'ALL');
  const reference=parseIsoDate(root.meta&&root.meta.geradoEm)||new Date();
  const year=Number(monthly.currentYear);
  const referenceYear=reference.getFullYear();
  const closedMonths=year<referenceYear?12:(year===referenceYear?reference.getMonth():0);
  const total=monthly.current.slice(0,closedMonths).reduce((sum,value)=>sum+Number(value||0),0);
  const monthNames=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const period=closedMonths?`Jan a ${monthNames[closedMonths-1]}/${year}`:`Nenhum mês encerrado em ${year}`;
  return {year,closedMonths,total,average:closedMonths?total/closedMonths:0,period};
}
function accountabilityOmInfo(item,po){
  const requisition=String(item&&item.requisicao||'').trim();
  const code=String(item&&item.omCodigo||requisition.slice(0,2)||po&&po.omCodigo||'N/I').trim().toUpperCase()||'N/I';
  const full=String(item&&item.om||po&&po.om||'Não informado').trim()||'Não informado';
  const acronym=(full.split(' - ')[0]||code).trim();
  return {code,full,label:'POs da '+(acronym&&acronym!==code?acronym:code)+' (OM '+code+')'};
}
function accountabilityOmOrder(item,po){const info=accountabilityOmInfo(item,po);return (info.code==='CW'?'0':'1')+'|'+info.label;}
function accountabilityOmHeader(info,older){return '<tr class="om-separator'+older+'"><td colspan="7" title="'+esc(info.full)+'">'+esc(info.label)+'</td></tr>';}
function contractLiquidationTableHtml(r,options){
  const settings=options||{}; const collapsedMonths=Math.max(0,Number(settings.collapsedMonths||0)); const omCode=String(settings.omCode||'ALL').trim().toUpperCase();
  const key=String(r.contrato||'').trim(); const allPos=contractPurchaseOrders(r); const allByPo=new Map(allPos.map(p=>[String(p.po||'').trim(),p]));
  const pos=omCode==='ALL'?allPos:allPos.filter(po=>accountabilityOmInfo({omCodigo:po.omCodigo,om:po.om},po).code===omCode); const byPo=new Map(pos.map(p=>[String(p.po||'').trim(),p]));
  const historical=root.liquidationDetailsByContract&&root.liquidationDetailsByContract[key]; let invoices=Array.isArray(historical)?historical.slice():[];
  if(!invoices.length){const details=root.invoiceMonthlyDetailsByContract&&root.invoiceMonthlyDetailsByContract[key];if(details){['previous','current'].forEach(period=>(details[period]||[]).forEach(month=>(month||[]).forEach(item=>invoices.push(item))));}}
  if(omCode!=='ALL')invoices=invoices.filter(item=>accountabilityOmInfo(item,allByPo.get(String(item.po||'').trim())||{}).code===omCode);
  const liquidatedPoCodes=new Set(invoices.map(item=>String(item.po||'').trim()).filter(Boolean));
  const entries=invoices.map(item=>({kind:'liquidation',item,po:byPo.get(String(item.po||'').trim())||{},groupDate:String(item.data||'')}));
  pos.forEach(po=>{const poCode=String(po.po||'').trim();if(poCode&&!liquidatedPoCodes.has(poCode))entries.push({kind:'without-liquidation',item:{po:poCode,omCodigo:po.omCodigo,om:po.om},po,groupDate:String(po.data||'')});});
  entries.sort((a,b)=>String(b.groupDate||'').slice(0,7).localeCompare(String(a.groupDate||'').slice(0,7))||accountabilityOmOrder(a.item,a.po).localeCompare(accountabilityOmOrder(b.item,b.po),'pt-BR')||String(b.groupDate||'').localeCompare(String(a.groupDate||''))||String(b.item.po||'').localeCompare(String(a.item.po||''),'pt-BR')||String(b.item.fatura||'').localeCompare(String(a.item.fatura||''),'pt-BR'));
  const totalBalance=pos.reduce((sum,p)=>sum+Number(p.saldoUsd||0),0);
  const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const monthHeader=value=>{const match=String(value||'').match(/^(\d{4})-(\d{2})/);return match?monthNames[Number(match[2])-1]+' de '+match[1]:'Data não informada';};
  const olderClass=index=>collapsedMonths&&index>=collapsedMonths?' liquidation-older':'';
  let lastMonth='',lastOm='',monthIndex=-1;const tableRows=[];entries.forEach(entry=>{const item=entry.item,po=entry.po,month=String(entry.groupDate||'').slice(0,7)||'sem-data';if(month!==lastMonth){monthIndex+=1;lastOm='';tableRows.push('<tr class="month-separator'+olderClass(monthIndex)+'"><td colspan="7">'+esc(monthHeader(entry.groupDate))+'</td></tr>');lastMonth=month;}const om=accountabilityOmInfo(item,po);if(om.code!==lastOm){tableRows.push(accountabilityOmHeader(om,olderClass(monthIndex)));lastOm=om.code;}const without=entry.kind==='without-liquidation';const rowClass=(olderClass(monthIndex)+(without?' po-without-liquidation':'')).trim();tableRows.push('<tr class="'+rowClass+'"><td>'+esc(item.po||po.po||'—')+'</td><td>'+formatDateIso(po.data)+'</td><td class="text-right">'+money(po.valorTotalUsd)+'</td><td>'+(without?'<span class="liquidation-status-empty">Sem liquidação</span>':esc(item.fatura||'—'))+'</td><td>'+(!without?formatDateIso(item.data):'—')+'</td><td class="text-right">'+(!without?money(item.valor):'—')+'</td><td class="text-right">'+money(po.saldoUsd)+'</td></tr>');});
  const rows=tableRows.join('');
  const average=closedMonthsAverage(r,omCode); const monthCount=new Set(entries.map(entry=>String(entry.groupDate||'').slice(0,7)||'sem-data')).size;
  const poWithLiquidation=pos.filter(po=>liquidatedPoCodes.has(String(po.po||'').trim())).length; const poWithoutLiquidation=Math.max(0,pos.length-poWithLiquidation);
  const expand=collapsedMonths&&monthCount>collapsedMonths?'<button class="expand-liquidations" type="button" onclick="const slide=this.closest(\'.contract-slide\');const open=slide.classList.toggle(\'history-expanded\');this.textContent=open?\'Mostrar somente os 2 últimos meses\':\'Exibir histórico completo\'">Exibir histórico completo</button>':'';
  return '<div class="execution-summary"><div class="po-balance"><span>Saldo empenhado a liquidar</span><strong>'+money(totalBalance)+'</strong><small>'+num(pos.length)+' PO(s): '+num(poWithLiquidation)+' com liquidação e '+num(poWithoutLiquidation)+' sem liquidação</small></div><div class="po-balance average-card"><span>Média mensal de liquidações</span><strong>'+money(average.average)+'</strong><small>'+esc(average.period)+' · '+num(average.closedMonths)+' mês(es) fechado(s)</small></div></div>'+expand+'<div class="table-wrap"><table><thead><tr><th>PO</th><th>Data da PO</th><th>Valor inicial da PO</th><th>Fatura</th><th>Data da NL</th><th>Valor da fatura</th><th>Saldo remanescente da PO</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7">Nenhuma PO associada ao contrato.</td></tr>')+'</tbody></table></div>';
}
function contractLiquidationViewsHtml(r,options){
  const source=monthlyInvoiceForRows([r]); const choices=[{code:'ALL'},...contractOmOptions(r,source)];
  return '<div class="accountability-detail-views">'+choices.map((option,index)=>'<div class="accountability-detail-view" data-om-detail="'+esc(option.code)+'"'+(index===0?'':' hidden')+'>'+contractLiquidationTableHtml(r,Object.assign({},options||{},{omCode:option.code}))+'</div>').join('')+'</div>';
}
function accountabilityStyles(){return `<style>
*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#102b55;margin:0;background:#eef3f9;line-height:1.4}.report-head{position:sticky;top:0;z-index:10;background:#002f6c;color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;gap:18px;box-shadow:0 4px 18px rgba(0,0,0,.16)}.report-head h1{font-size:19px;margin:0}.report-head p{margin:3px 0 0;color:#d9e8fb;font-size:11px}.report-controls{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.report-controls button,.report-controls select{border:1px solid rgba(255,255,255,.32);border-radius:8px;padding:9px 11px;background:#fff;color:#00265f;font-weight:800;cursor:pointer}.report-controls button.primary{background:#ffd200;border-color:#ffd200}.report-controls button:disabled{opacity:.45;cursor:not-allowed}.slide-position{min-width:132px;text-align:center;font-size:11px;font-weight:800;color:#fff}.report-body{max-width:1820px;margin:18px auto;padding:0 14px}.contract-slide{display:none;background:#fff;border:1px solid #d7e1ee;border-radius:18px;box-shadow:0 12px 26px rgba(0,31,85,.08);overflow:hidden;min-height:calc(100vh - 112px)}.contract-slide.is-active{display:block}.contract-identity{padding:20px 30px;border-left:9px solid #0e63b6;background:#f8fbff}.contract-identity.warning{border-left-color:#e5b900;background:#fff9dd}.contract-identity.danger{border-left-color:#c81e1e;background:#fff0f0}.contract-identity h2{margin:0 0 5px;color:#00265f;font-size:23px}.contract-identity--compact{padding-top:14px;padding-bottom:14px}.contract-identity--compact h2{font-size:19px}.slide-kicker{color:#607089;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}.identity-grid{display:grid;grid-template-columns:1fr 1.5fr repeat(3,1fr);gap:14px;margin-top:13px}.identity-grid div{border-top:1px solid #dce5f0;padding-top:7px}.identity-grid span,.card span,.po-balance span{display:block;color:#607089;font-size:11px;font-weight:800;text-transform:uppercase}.identity-grid strong{display:block;margin-top:3px;color:#102b55}.validity-text.danger{color:#c81e1e}.validity-text.warning{color:#8a6800}.contract-content{padding:19px 30px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px}.card{border:1px solid #dce5f0;border-radius:12px;padding:13px;background:#f8fbff}.card strong{display:block;color:#00265f;font-size:18px;margin-top:5px}.section-title{font-size:17px;color:#00265f;border-bottom:2px solid #ffd200;padding-bottom:5px;margin:18px 0 12px}.account-bars{display:grid;gap:14px}.account-bar-row{display:grid;grid-template-columns:240px minmax(480px,1fr) 190px;gap:16px;align-items:center;font-size:15px}.account-bar-track{height:42px;border-radius:9px;background:#e8eef6;overflow:hidden}.account-bar-track i{display:block;height:100%;min-width:1px}.account-bar-row strong{text-align:right;font-size:16px}.month-history-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;margin:-3px 0 8px}.month-history-toolbar>span{font-size:11px;font-weight:800;color:#607089;text-transform:uppercase}.month-om-buttons{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.month-om-button{border:1px solid #9eb0c8;border-radius:999px;background:#fff;color:#003b7a;padding:6px 11px;font-size:11px;font-weight:800;cursor:pointer}.month-om-button:hover,.month-om-button.is-active{background:#003b7a;color:#fff;border-color:#003b7a}.month-history-view[hidden]{display:none!important}.month-bars{position:relative;width:100%;height:260px;display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:4px;align-items:end;border-bottom:1px solid #9eb0c8;padding:14px 38px 0;overflow:hidden}.month-bar{height:100%;min-width:0;display:grid;grid-template-rows:1fr 22px;text-align:center;gap:4px;position:relative;z-index:1}.month-bar strong{font-size:12px;white-space:nowrap}.month-bar-track{position:relative;min-width:0;display:flex;align-items:flex-end;justify-content:center;background:#f2f6fb}.month-value{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--bar-height) + 5px);font-size:12px;font-weight:400;line-height:1;white-space:nowrap;letter-spacing:-.02em;z-index:3}.month-bar-track i{width:72%;border-radius:5px 5px 0 0}.month-average-overlay{position:absolute;z-index:2;pointer-events:none;left:38px;right:38px;top:14px;bottom:26px;display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:4px}.month-average-line{position:relative}.month-average-line:after{content:'';position:absolute;left:0;right:0;bottom:var(--average-height);border-top:3px dashed}.month-average-line--previous{grid-column:1/13}.month-average-line--previous:after{border-color:#4b5563}.month-average-line--current{grid-column:13/25}.month-average-line--current:after{border-color:#c45100}.month-legend{display:flex;justify-content:center;gap:18px;margin-top:10px;font-size:12px;font-weight:800;flex-wrap:wrap}.month-legend span{display:flex;align-items:center;gap:5px}.month-legend i{width:13px;height:13px;border-radius:2px}.month-legend .previous{background:#8d96a6}.month-legend .current{background:#0e63b6}.month-average-legend strong{font-weight:400}.month-legend .average-previous,.month-legend .average-current{height:0;width:22px;border-radius:0;background:transparent;border-top:3px dashed}.month-legend .average-previous{border-color:#4b5563}.month-legend .average-current{border-color:#c45100}.execution-summary{display:grid;grid-template-columns:repeat(2,minmax(300px,1fr));gap:14px;margin-bottom:10px}.po-balance{display:block;border:1px solid #bfd0e4;border-left:5px solid #ffd200;border-radius:10px;padding:10px 14px}.po-balance.average-card{border-left-color:#0e63b6}.po-balance strong{display:block;font-size:18px;color:#00265f}.po-balance small{display:block;color:#607089;margin-top:3px}.expand-liquidations{border:1px solid #0e63b6;border-radius:8px;background:#fff;color:#003b7a;font-weight:800;padding:8px 11px;margin:0 0 10px;cursor:pointer}.table-wrap{overflow:auto;max-height:44vh}table{border-collapse:collapse;width:100%;min-width:1350px;font-size:13px;line-height:1.4}th,td{border:1px solid #d7e1ee;padding:9px 10px;vertical-align:top}thead th{background:#003b7a;color:#fff;position:sticky;top:0;font-size:12px}.month-separator td{background:#e9f0f8;color:#00265f;font-weight:900;font-size:14px;padding:11px 13px;border-top:2px solid #8aa4c4}.om-separator td{background:#f8fbff;color:#003b7a;font-weight:900;font-size:12px;padding:9px 15px 9px 26px;border-top:1px solid #b8c9dc;border-bottom:1px solid #d8e3ef;text-transform:uppercase;letter-spacing:.025em}.month-separator+.om-separator td{border-top:0}.po-without-liquidation td{background:#fbfcfe;color:#53647c}.liquidation-status-empty{display:inline-block;border-radius:999px;background:#e8eef6;color:#405574;font-weight:800;padding:3px 8px;white-space:nowrap}.liquidation-older{display:none}.history-expanded .liquidation-older{display:table-row}.text-right{text-align:right;white-space:nowrap}@media(max-width:1000px){.report-head{align-items:flex-start;flex-direction:column}.report-controls{justify-content:flex-start}.identity-grid,.cards{grid-template-columns:1fr 1fr}.account-bar-row{grid-template-columns:145px minmax(180px,1fr) 125px;font-size:12px}.account-bar-row strong{font-size:12px}.account-bar-track{height:30px}.report-body{padding:0 10px}.contract-content,.contract-identity{padding-left:18px;padding-right:18px}.month-bars{gap:2px;padding-left:24px;padding-right:24px}.month-average-overlay{left:24px;right:24px;gap:2px}.month-bar strong{font-size:9px}.month-value{font-size:9px}.execution-summary{grid-template-columns:1fr}.contract-slide{min-height:auto}}@page{size:A4 landscape;margin:8mm}@media print{body{background:#fff}.report-head{display:none}.report-body{max-width:none;margin:0;padding:0}.contract-slide,.contract-slide.is-active{display:block!important;box-shadow:none;border:0;border-radius:0;min-height:0;page-break-after:always;break-after:page}.contract-slide:last-child{page-break-after:auto;break-after:auto}.contract-identity,.cards,.account-bars,.month-bars,.execution-summary{break-inside:avoid}.account-bar-row{grid-template-columns:175px minmax(280px,1fr) 145px;font-size:10.5px;gap:8px}.account-bar-row strong{font-size:10.5px}.account-bar-track{height:29px}.month-history-toolbar{display:none}.month-bars{height:205px;grid-template-columns:repeat(24,minmax(0,1fr));gap:2px;padding-left:18px;padding-right:18px}.month-average-overlay{left:18px;right:18px;gap:2px;top:14px;bottom:21px}.month-bar{min-width:0;grid-template-rows:1fr 17px}.month-bar strong{font-size:8.5px}.month-value{font-size:8.5px;font-weight:400}.month-legend{font-size:8.5px;gap:9px}.table-wrap{overflow:visible;max-height:none}.liquidation-older{display:table-row!important}.expand-liquidations{display:none}table{font-size:9.5px;min-width:0}th,td{padding:5px 6px}thead th{position:static}.month-separator td{font-size:10.5px;padding:6px 8px}.om-separator td{font-size:9.5px;padding:5px 8px 5px 15px}}
.month-average-line--current:after,.month-legend .average-current{border-color:#2f80ed}.accountability-detail-view[hidden]{display:none!important}
</style><style>@media print{html,body,.contract-slide,.contract-identity,.card,.account-bar-track,.account-bar-track i,.month-bar-track,.month-bar-track i,.month-legend i,thead th,.month-separator td,.om-separator td,.liquidation-status-empty{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.account-bar-track i,.month-bar-track i{border-color:currentColor!important}.month-legend .previous{box-shadow:inset 0 0 0 1000px #8d96a6}.month-legend .current{box-shadow:inset 0 0 0 1000px #0e63b6}}</style>`;}
function accountabilityContractHtml(r,index){
  const days=daysToEnd(r); const severity=days!==null&&days<90?'danger':days!==null&&days<=150?'warning':'';
  const pending=Math.max(0,Number(r.valorAEmpenhar||0));
  const poBalance=contractPoBalance(r);
  const financial=reportBarChart([{label:'Valor do contrato',value:r.valorContrato,display:contractMoney(r.valorContrato,r.moeda),color:'#003b7a'},{label:'Valor empenhado',value:r.totalEmpenhadoUsd,color:'#0e63b6'},{label:'Valor liquidado e pago',value:r.totalFaturadoUsd,color:'#1f7a66'},{label:'Saldo empenhado a liquidar',value:poBalance,color:'#e5b900'}]);
  const title=(index+1)+'. Contrato '+esc(r.numero||r.contrato||'Não informado');
  const identity='<header class="contract-identity '+severity+'"><div class="slide-kicker">Página 1 de 2 · Informações gerais e execução financeira</div><h2>'+title+'</h2><p>'+esc(r.empresa||'Empresa não informada')+' — '+esc(r.objetoResumo||r.objeto||'Objeto não informado')+'</p><div class="identity-grid"><div><span>Identificador SILOMS</span><strong>'+esc(r.contrato||'—')+'</strong></div><div><span>Empresa</span><strong>'+esc(r.empresa||'—')+'</strong></div><div><span>Assinatura</span><strong>'+dateBr(r.dataAssinatura)+'</strong></div><div><span>Início da vigência</span><strong>'+dateBr(r.dataInicio)+'</strong></div><div><span>Fim da vigência</span><strong class="validity-text '+severity+'">'+dateBr(r.dataFinal)+' · '+esc(dueDaysText(r))+'</strong></div></div></header>';
  const pageOne='<section class="contract-slide" data-contract-index="'+index+'" data-slide-part="1">'+identity+'<div class="contract-content"><div class="cards"><div class="card"><span>Valor do contrato</span><strong>'+contractMoney(r.valorContrato,r.moeda)+'</strong></div><div class="card"><span>Valor empenhado (USD)</span><strong>'+money(r.totalEmpenhadoUsd)+'</strong></div><div class="card"><span>Valor liquidado e pago (USD)</span><strong>'+money(r.totalFaturadoUsd)+'</strong></div><div class="card"><span>Pendente de empenho</span><strong>'+contractMoney(pending,r.moeda)+'</strong></div></div><h3 class="section-title">Execução financeira do contrato</h3>'+financial+'</div></section>';
  const pageTwo='<section class="contract-slide" data-contract-index="'+index+'" data-slide-part="2"><header class="contract-identity contract-identity--compact '+severity+'"><div class="slide-kicker">Página 2 de 2 · Histórico de execução e liquidações</div><h2>'+title+'</h2><p>'+esc(r.empresa||'Empresa não informada')+' — '+esc(r.objetoResumo||r.objeto||'Objeto não informado')+'</p></header><div class="contract-content"><h3 class="section-title">Histórico de faturamento mensal</h3>'+contractMonthlyHistoryHtml(r)+'<h3 class="section-title">Saldo disponível, média mensal e liquidações por ordem de compra</h3>'+contractLiquidationViewsHtml(r,{collapsedMonths:2})+'</div></section>';
  return pageOne+pageTwo;
}
function accountabilityNavigationScript(){return `<script>
(function(){
  const slides=Array.from(document.querySelectorAll('.contract-slide'));
  const position=document.getElementById('slidePosition');
  const prev=document.getElementById('slidePrev');
  const next=document.getElementById('slideNext');
  const jump=document.getElementById('contractJump');
  let current=0;
  let boundaryLockUntil=0;
  let wheelAccumulated=0;
  let wheelDirection=0;
  let wheelResetTimer=0;
  function interactiveTarget(target){return !!(target&&target.closest&&target.closest('input,select,textarea,[contenteditable="true"]'));}
  function show(index){
    if(!slides.length)return false;
    const target=Math.max(0,Math.min(index,slides.length-1));
    if(target===current&&slides[current].classList.contains('is-active'))return false;
    current=target;
    slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===current));
    const active=slides[current];
    const contractIndex=Number(active.dataset.contractIndex||0);
    const part=Number(active.dataset.slidePart||1);
    if(position)position.textContent='Contrato '+(contractIndex+1)+' · página '+part+'/2';
    if(jump)jump.value=String(contractIndex);
    if(prev)prev.disabled=current===0;
    if(next)next.disabled=current===slides.length-1;
    wheelAccumulated=0;
    window.scrollTo({top:0,left:0,behavior:'auto'});
    return true;
  }
  window.accountabilityPrev=()=>show(current-1);
  window.accountabilityNext=()=>show(current+1);
  window.accountabilityJump=value=>show(Number(value)*2);
  window.accountabilityPrint=()=>{document.documentElement.classList.add('accountability-printing');requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));};
  window.addEventListener('afterprint',()=>document.documentElement.classList.remove('accountability-printing'));
  window.accountabilityFilterOm=button=>{const history=button&&button.closest('.month-history');const slide=button&&button.closest('.contract-slide');if(!history||!slide)return;const selected=button.dataset.om;history.querySelectorAll('.month-om-button').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',active?'true':'false');});slide.querySelectorAll('.month-history-view').forEach(view=>{view.hidden=view.dataset.omView!==selected;});slide.querySelectorAll('.accountability-detail-view').forEach(view=>{view.hidden=view.dataset.omDetail!==selected;});};
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||interactiveTarget(event.target))return;
    const forward=event.key==='ArrowRight'||event.key==='ArrowDown'||event.key==='PageDown'||event.key===' ';
    const backward=event.key==='ArrowLeft'||event.key==='ArrowUp'||event.key==='PageUp';
    if(!forward&&!backward)return;
    event.preventDefault();
    if(forward)window.accountabilityNext();else window.accountabilityPrev();
  });
  window.addEventListener('wheel',event=>{
    if(event.ctrlKey||interactiveTarget(event.target)||Date.now()<boundaryLockUntil)return;
    const maxScroll=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
    const atTop=window.scrollY<=2;
    const atBottom=window.scrollY>=maxScroll-2;
    const direction=Math.sign(event.deltaY);
    const eligible=(direction>0&&atBottom&&current<slides.length-1)||(direction<0&&atTop&&current>0);
    if(!eligible){wheelAccumulated=0;wheelDirection=0;return;}
    event.preventDefault();
    if(direction!==wheelDirection){wheelAccumulated=0;wheelDirection=direction;}
    wheelAccumulated+=Math.abs(event.deltaY);
    clearTimeout(wheelResetTimer);
    wheelResetTimer=setTimeout(()=>{wheelAccumulated=0;wheelDirection=0;},280);
    if(wheelAccumulated<70)return;
    boundaryLockUntil=Date.now()+700;
    if(direction>0)window.accountabilityNext();else window.accountabilityPrev();
  },{passive:false});
  show(0);
}());
<\/script>`;}
function accountabilityReportHtml(rows,title,updated){
  const options=rows.map((r,index)=>'<option value="'+index+'">'+(index+1)+'. '+esc(r.numero||r.contrato||'Contrato')+' · '+esc(r.empresa||'Empresa não informada')+'</option>').join('');
  const controls='<div class="report-controls"><button id="slidePrev" type="button" onclick="accountabilityPrev()">Página anterior</button><span class="slide-position" id="slidePosition"></span><button class="primary" id="slideNext" type="button" onclick="accountabilityNext()">Próxima página</button><select id="contractJump" onchange="accountabilityJump(this.value)" aria-label="Ir para contrato">'+options+'</select><button type="button" onclick="accountabilityPrint()">Imprimir / salvar PDF</button></div>';
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prestação de contas - '+esc(title)+'</title>'+accountabilityStyles()+'</head><body><header class="report-head"><div><h1>Consolidação para prestação de contas — '+esc(title)+'</h1><p>'+num(rows.length)+' contrato(s) · dados atualizados em '+esc(updated)+'</p></div>'+controls+'</header><main class="report-body">'+(rows.map(accountabilityContractHtml).join('')||'<p>Nenhum contrato encontrado nesta categoria.</p>')+'</main>'+accountabilityNavigationScript()+'</body></html>';
}
function generateAccountabilityReport(){
  const cat=document.body.getAttribute('data-contract-category'); const rows=sortAccountabilityRows(accountabilityRowsForCategory(cat),cat); const title=$('#contract-section-title')?.textContent?.trim()||'Contratos';
  const updated=(root.meta&&root.meta.geradoEm)||'não informada';
  const html=accountabilityReportHtml(rows,title,updated);
  const w=window.open('','_blank'); if(!w){alert('Autorize pop-ups para abrir a consolidação.'); return;} w.document.open(); w.document.write(html); w.document.close();
}

function renderOverview(){const rootEl=document.querySelector('[data-contract-overview]'); if(!rootEl)return; const all=agg(records); $('[data-all-contracts-count]')&&($('[data-all-contracts-count]').textContent=num(all.count)); $('[data-all-contracts-paid]')&&($('[data-all-contracts-paid]').textContent=money(all.paid)+' empenhados'); $all('[data-contract-summary]').forEach(card=>{const cat=card.getAttribute('data-contract-summary'); const a=agg(catRows(cat)); $('[data-summary-count]',card)&&($('[data-summary-count]',card).textContent=num(a.count)); $('[data-summary-value]',card)&&($('[data-summary-value]',card).textContent=money(a.value)); $('[data-summary-paid]',card)&&($('[data-summary-paid]',card).textContent=money(a.paid));});}
function renderPanel(){const cat=document.body.getAttribute('data-contract-category'); if(!cat)return; const base=catRows(cat); $('#contract-section-title')&&($('#contract-section-title').textContent={administrativos:'Contratos Administrativos',finalisticos:'Contratos Finalísticos',fms:'FMS (Foreign Military Sales)'}[cat]||'Contratos'); populateFilters(base,cat); ensureAccountabilityButton(); function refresh(){const f=filters(); const rows=base.filter(r=>rowMatches(r,f,cat)); const a=agg(rows); $('[data-kpi="count"]')&&($('[data-kpi="count"]').textContent=num(a.count)); $('[data-kpi="value"]')&&($('[data-kpi="value"]').textContent=money(a.value)); $('[data-kpi="paidUsd"]')&&($('[data-kpi="paidUsd"]').textContent=money(a.paid)); $('[data-kpi="billedUsd"]')&&($('[data-kpi="billedUsd"]').textContent=money(a.billed)); const count=$('#contractsTableCount'); if(count) count.textContent=num(rows.length)+' contrato(s) · ordenados por vencimento mais próximo'; const tb=$('#contractsTable tbody'); if(tb){const displayRows=sortByDueDate(rows); tb.innerHTML=displayRows.map(r=>`<tr class="contract-row--${dueSeverity(r)} ${risk(r)?'contract-risk-row':''}"><td>${riskColumnHtml(r)}</td><td>${esc(r.contrato)}</td><td>${esc(r.numero)}</td><td>${esc(r.unidade)}</td><td>${esc(cat==='finalisticos'?r.tipoOrdenacao:r.ordenadorDespesa)}</td><td><strong class="contract-gc-chip">${esc(r.grandComando||'—')}</strong></td><td>${esc(r.empresa)}</td><td class="contracts-object-cell">${esc(r.objetoResumo)}</td><td>${esc(r.moeda)}</td><td class="text-right">${money(r.valorContrato)}</td><td class="text-right">${money(r.totalEmpenhadoUsd)}</td><td class="text-right">${money(r.totalFaturadoUsd)}</td><td class="text-right">${money(r.valorAEmpenhar)}</td><td class="contract-date-cell">${dateBr(r.dataFinal)}</td><td>${dueStatusHtml(r)}</td></tr>`).join('');} drawChart(rows); drawInvoiceMonthlyChart(rows); renderPoDetails(rows);} $all('#filterNumeroContrato,#filterEmpresa,#filterUnidade,#filterGrandeComando,#filterOrdenador,#filterAcao,#filterMoeda,#filterStatus,#filterValueRange').forEach(el=>el.addEventListener('change',refresh)); $('#filterContratoSearch')?.addEventListener('input',refresh); $('#resetContractFilters')?.addEventListener('click',()=>{ $all('#filterNumeroContrato,#filterEmpresa,#filterUnidade,#filterGrandeComando,#filterOrdenador,#filterAcao,#filterMoeda,#filterStatus,#filterValueRange').forEach(sel=>Array.from(sel.options).forEach(o=>o.selected=false)); updateAllCabwMultis(); if($('#filterContratoSearch'))$('#filterContratoSearch').value=''; refresh();}); const regular=$('#generateContractsReport'); regular?.addEventListener('click',generateContractsReport); if(regular)regular.__cabwReportBound=true; $('#generateAccountabilityReport')?.addEventListener('click',generateAccountabilityReport); refresh();}
window.CABW_CONTRACTS_PANEL_TEST={contractPurchaseOrders,contractPoBalance,contractMonthlyHistoryHtml,contractLiquidationTableHtml,contractLiquidationViewsHtml,closedMonthsAverage,accountabilityOmInfo,accountabilityOmOrder,accountabilityContractHtml,accountabilityStyles,accountabilityRowsForCategory,sortAccountabilityRows,administrativeAccountabilityOrder,accountabilityNavigationScript,accountabilityReportHtml,chartMoney,monthlyInvoiceForRows,monthlyDataForOm,monthlyOmOptions,contractOmOptions,monthlyAverageStats,monthlyScaleMax,monthlyChartVariant};
document.addEventListener('DOMContentLoaded',()=>{try{renderOverview();renderPanel();}catch(e){console.error('CABW contracts panel error',e);}});
})();
