
(function(){
'use strict';
const data=window.CABW_CREDIT_DATA||{digits:[],purchaseOrders:[],signatureOrders:[],meta:{}};
const $=(s,c)=> (c||document).querySelector(s); const $all=(s,c)=>Array.from((c||document).querySelectorAll(s));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>'US$ '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const num=v=>Number(v||0).toLocaleString('pt-BR');
const pct=(a,b)=> b ? ((a/b)*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%' : '0,00%';
function selected(sel){if(!sel)return []; return Array.from(sel.selectedOptions).map(o=>o.value).filter(Boolean);}
function unique(a){return Array.from(new Set(a.filter(v=>v!==undefined&&v!==null&&String(v).trim()!==''))).sort((a,b)=>String(a).localeCompare(String(b),'pt-BR'));}
function omLabel(r){return r.omLabel || [r.sigla,r.nomeUgr].filter(Boolean).join(' - ') || 'N/I';}
function projectLabels(r){ if(Array.isArray(r.projetosLabels)&&r.projetosLabels.length) return r.projetosLabels; if(r.projetoLabel)return [r.projetoLabel]; if(Array.isArray(r.projetos))return r.projetos; if(r.projeto)return [r.projeto]; return [];}
function hasAny(rowVals, selectedVals){ return !selectedVals.length || selectedVals.some(v=>rowVals.includes(v)); }
function filters(){return {ug:selected($('#creditFilterUg')), acao:selected($('#creditFilterAcao')), natureza:selected($('#creditFilterNatureza')), projeto:selected($('#creditFilterProjeto'))};}
function rowMatches(r,f){return (!f.ug.length||f.ug.includes(omLabel(r))) && (!f.acao.length||f.acao.includes(r.acao||'')) && (!f.natureza.length||f.natureza.includes(r.natureza||'')) && hasAny(projectLabels(r), f.projeto);}
function filtered(){const f=filters(); return {digits:data.digits.filter(r=>rowMatches(r,f)), pos:data.purchaseOrders.filter(r=>rowMatches(r,f)), sig:data.signatureOrders.filter(r=>rowMatches(r,f)), f};}

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
  @media(max-width:768px){.cabw-multi-menu{min-width:100%!important;max-width:calc(100vw - 32px)!important;}}

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
  wrap.innerHTML=`<button type="button" class="cabw-multi-button" aria-haspopup="listbox" aria-expanded="false"></button><div class="cabw-multi-menu"><div class="cabw-multi-filter-line"><input type="search" class="cabw-multi-search" data-ms-search placeholder="Texto para selecionar..."><button type="button" class="cabw-multi-search-button" data-ms-action="contains">Selecionar</button></div><div class="cabw-multi-actions"><button type="button" data-ms-action="all">Marcar todas</button><button type="button" data-ms-action="clear">Limpar</button></div>${menuItems}</div>`;
  const btn=wrap.querySelector('.cabw-multi-button');
  btn.addEventListener('click',e=>{e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.cabw-multi-dropdown.open').forEach(w=>{if(w!==wrap)w.classList.remove('open')}); wrap.classList.toggle('open'); btn.setAttribute('aria-expanded',wrap.classList.contains('open')?'true':'false'); if(wrap.classList.contains('open')) setTimeout(()=>positionCabwMultiMenu(wrap),0);});
  btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault(); btn.click();}});
  wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',()=>{ const opt=Array.from(sel.options).find(o=>o.value===cb.value); if(opt) opt.selected=cb.checked; updateCabwMulti(sel); sel.dispatchEvent(new Event('change',{bubbles:true})); }));
  const searchInput=wrap.querySelector('[data-ms-search]'); const filterOptions=()=>{const q=(searchInput?.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); wrap.querySelectorAll('.cabw-multi-option').forEach(label=>{const txt=(label.textContent||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); label.style.display=!q||txt.includes(q)?'flex':'none';});}; searchInput?.addEventListener('input',filterOptions); searchInput?.addEventListener('click',e=>e.stopPropagation()); wrap.querySelector('[data-ms-action="contains"]')?.addEventListener('click',e=>{e.preventDefault(); const q=(searchInput?.value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); if(!q)return; Array.from(sel.options).forEach(o=>{const t=(o.textContent||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); if(t.includes(q)) o.selected=true;}); updateCabwMulti(sel); sel.dispatchEvent(new Event('change',{bubbles:true}));});
  wrap.querySelector('[data-ms-action="all"]')?.addEventListener('click',e=>{e.preventDefault(); Array.from(sel.options).forEach(o=>o.selected=true); updateCabwMulti(sel); sel.dispatchEvent(new Event('change',{bubbles:true}));});
  wrap.querySelector('[data-ms-action="clear"]')?.addEventListener('click',e=>{e.preventDefault(); Array.from(sel.options).forEach(o=>o.selected=false); updateCabwMulti(sel); sel.dispatchEvent(new Event('change',{bubbles:true}));});
  updateCabwMulti(sel);
}
function updateAllCabwMultis(){document.querySelectorAll('select.cabw-native-multi-hidden').forEach(updateCabwMulti);}

function isValidOmFilterLabel(v){ const s=String(v||'').trim(); return /[A-Za-zÀ-ÿ]/.test(s) && !/^[-\d.,\s]+$/.test(s) && !/^([\d.]+)(\s*-\s*\1)?$/.test(s); }
function fillMulti(sel, vals){ if(!sel)return; const old=selected(sel); sel.multiple=true; sel.innerHTML=vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); if(old.length){old.forEach(v=>{const o=Array.from(sel.options).find(o=>o.value===v); if(o)o.selected=true;});} else {Array.from(sel.options).forEach(o=>o.selected=false);} rebuildCabwMulti(sel); }
function initFilters(){ const d=data.digits||[], p=data.purchaseOrders||[], s=data.signatureOrders||[]; fillMulti($('#creditFilterUg'), unique([].concat(d.map(omLabel),p.map(omLabel),s.map(omLabel))).filter(isValidOmFilterLabel)); fillMulti($('#creditFilterAcao'), unique([].concat(d.map(r=>r.acao),p.map(r=>r.acao),s.map(r=>r.acao)))); fillMulti($('#creditFilterNatureza'), unique([].concat(d.map(r=>r.natureza),p.map(r=>r.natureza),s.map(r=>r.natureza)))); fillMulti($('#creditFilterProjeto'), unique([].concat(...d.map(projectLabels),...p.map(projectLabels),...s.map(projectLabels)))); $all('#creditFilterUg,#creditFilterAcao,#creditFilterNatureza,#creditFilterProjeto').forEach(el=>el.addEventListener('change', renderAll)); $('#clearCreditFilters')?.addEventListener('click',()=>{$all('#creditFilterUg,#creditFilterAcao,#creditFilterNatureza,#creditFilterProjeto').forEach(e=>Array.from(e.options).forEach(o=>o.selected=false)); updateAllCabwMultis(); renderAll();}); }
function agg(arr, keyFn, valFn){const m=new Map(); arr.forEach(r=>{const k=keyFn(r)||'N/I'; m.set(k,(m.get(k)||0)+Number(valFn(r)||0));}); return Array.from(m,([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);}
function shortAxisLabel(v){const t=String(v==null?'':v); return t.length>20?t.slice(0,20)+'...':t;}
function addAxisTitles(el, shown, full){try{const map=new Map(shown.map((v,i)=>[v,full[i]])); setTimeout(()=>{el.querySelectorAll('.ytick text,.xtick text').forEach(t=>{const key=(t.textContent||'').trim(); const fullLabel=map.get(key); if(fullLabel&&!t.querySelector('title')){const title=document.createElementNS('http://www.w3.org/2000/svg','title'); title.textContent=fullLabel; t.appendChild(title);}});},150);}catch(e){}}
function drawPie(id, rows, title){const el=$('#'+id); if(!el)return; if(!window.Plotly){el.innerHTML='<p>Plotly não carregado.</p>';return;} Plotly.newPlot(el,[{type:'pie',labels:rows.map(r=>r.label),values:rows.map(r=>r.value),textinfo:'label+percent',hovertemplate:'%{label}<br>'+title+': %{value:$,.2f}<extra></extra>'}],{title:{text:title,font:{size:16}},height:360,margin:{l:20,r:20,t:60,b:20}}, {displayModeBar:false,responsive:true});}
function drawBar(id, rows, title, yTitle){const el=$('#'+id); if(!el)return; if(!window.Plotly){el.innerHTML='<p>Plotly não carregado.</p>';return;} const top=rows.filter(r=>Number(r.value)>0).slice(0,20).reverse(); const fullLabels=top.map(r=>String(r.label||'')); const shownLabels=fullLabels.map(shortAxisLabel); Plotly.newPlot(el,[{type:'bar',orientation:'h',y:shownLabels,x:top.map(r=>r.value),customdata:fullLabels,text:top.map(r=>money(r.value)),textposition:'auto',hovertemplate:'%{customdata}<br>Valor: %{x:$,.2f}<extra></extra>',marker:{color:'#003b7a'}}],{title:{text:title,font:{size:16}},height:Math.max(360,top.length*26+120),margin:{l:130,r:30,t:60,b:50},xaxis:{title:yTitle||'US$'},yaxis:{automargin:true}}, {displayModeBar:false,responsive:true}).then(()=>addAxisTitles(el, shownLabels, fullLabels));}
function renderExecutive(){ if(!$('#kpiCreditAvailable')) return; const {digits,pos,sig}=filtered(); const credito=digits.reduce((a,r)=>a+Number(r.saldo||0),0); const empenhado=pos.reduce((a,r)=>a+Number(r.valorUsd||0),0); const assinatura=sig.reduce((a,r)=>a+Number(r.valorUsd||0),0); const total=credito+empenhado+assinatura; $('#kpiCreditAvailable').textContent=money(credito); $('#kpiCommitted').textContent=money(empenhado); $('#kpiSigning').textContent=money(assinatura); $('#kpiReceived').textContent=money(total); $('#kpiAvailablePct').textContent=pct(credito,total); $('#kpiDigitsCount').textContent=num(digits.length); const table=$('#executiveSummaryBody'); if(table)table.innerHTML=`<tr><td>2026</td><td class="text-right">${money(credito)}</td><td class="text-right">${money(empenhado)}</td><td class="text-right">${money(assinatura)}</td><td class="text-right">${money(total)}</td><td class="text-center">${pct(credito,total)}</td><td class="text-center">${num(digits.length)}</td></tr>`; drawPie('creditByGcChart', agg(digits, r=>r.gcDescricao||r.grandComando||'N/I', r=>r.saldo), 'Crédito disponível por Grande Comando'); drawPie('poByGcChart', agg(pos, r=>r.gcDescricao||r.grandComando||'N/I', r=>r.valorUsd), 'PO por Grande Comando'); drawBar('poByCompanyChart', agg(pos, r=>r.fornecedor||'N/I', r=>r.valorUsd), 'Empenhos por empresa', 'Valor empenhado'); drawBar('poByProjectChart', agg(pos, r=>projectLabels(r).join(', ')||'Sem projeto', r=>r.valorUsd), 'Empenhos por projeto', 'Valor empenhado'); renderDigitsTable(digits); }
function renderDigitsTable(digits){const tb=$('#digitsListBody'); if(!tb)return; tb.innerHTML=digits.slice().sort((a,b)=>Number(b.saldo||0)-Number(a.saldo||0)).map(r=>`<tr><td>${esc(r.digito)}</td><td>${esc(omLabel(r))}</td><td>${esc(r.acao)}</td><td>${esc(r.natureza)}</td><td>${esc(projectLabels(r).join(', '))}</td><td class="text-right">${money(r.saldo)}</td><td>${esc(r.objetivo)}</td></tr>`).join('');}
function renderUG(){ if(!$('#ugChart') && !$('#ugTableBody'))return; const {digits}=filtered(); const rows=agg(digits, r=>r.sigla||omLabel(r), r=>r.saldo); if(window.Plotly&&$('#ugChart')) drawBar('ugChart', rows, 'Crédito disponível por OM', 'Saldo disponível'); const body=$('#ugTableBody'); if(body) body.innerHTML=rows.map(r=>`<tr><td>${esc(r.label)}</td><td class="text-right">${money(r.value)}</td></tr>`).join(''); }
function renderAction(){ if(!$('#actionChart') && !$('#actionTableBody'))return; const {digits}=filtered(); const rows=agg(digits, r=>r.acao||'Sem ação', r=>r.saldo); if(window.Plotly&&$('#actionChart')) drawBar('actionChart', rows, 'Crédito disponível por ação', 'Saldo disponível'); const body=$('#actionTableBody'); if(body) body.innerHTML=rows.map(r=>`<tr><td>${esc(r.label)}</td><td class="text-right">${money(r.value)}</td></tr>`).join(''); }
function renderDetail(){ if(!$('#detailTableBody'))return; const {digits}=filtered(); const total=digits.reduce((a,r)=>a+Number(r.saldo||0),0); $('#detailKpiCredit')&&($('#detailKpiCredit').textContent=money(total)); $('#detailKpiUgs')&&($('#detailKpiUgs').textContent=num(unique(digits.map(omLabel)).length)); $('#detailKpiActions')&&($('#detailKpiActions').textContent=num(unique(digits.map(r=>r.acao)).length)); $('#detailTableBody').innerHTML=digits.sort((a,b)=>Number(b.saldo||0)-Number(a.saldo||0)).map(r=>`<tr><td>${esc(r.digito)}</td><td>${esc(omLabel(r))}</td><td>${esc(r.acao)}</td><td>${esc(r.ptres)}</td><td>${esc(r.natureza)}</td><td>${esc(projectLabels(r).join(', '))}</td><td class="text-right">${money(r.saldo)}</td><td>${esc(r.objetivo)}</td></tr>`).join(''); }
function renderConsistency(){ if(!$('#consistencyTableBody'))return; const all=data.digits||[]; const total=all.reduce((a,r)=>a+Number(r.saldo||0),0); $('#consistencyTableBody').innerHTML=`<tr><td>Total de dígitos carregados</td><td class="text-right">${num(all.length)}</td><td>Fonte: ${esc(data.meta.sourceDigits||'digitos.xlsx')}</td></tr><tr><td>Saldo total disponível</td><td class="text-right">${money(total)}</td><td>Dígitos filtráveis por OM e projeto descritivos</td></tr>`;}

async function getPlotlyImage(id){
  const el=$('#'+id);
  if(!el || !window.Plotly || !el.data) return '';
  try{return await Plotly.toImage(el,{format:'png',width:1000,height:460,scale:1.5});}catch(e){console.warn('Falha ao capturar gráfico',id,e); return '';}
}
function selectedFiltersHtml(){
  const rows=$all('.cabw-multi-dropdown').map(w=>{const label=w.closest('label')?.querySelector('span')?.textContent?.trim()||'Filtro'; const val=w.querySelector('.cabw-multi-button')?.textContent?.trim()||'Todas as opções'; return `<tr><th>${esc(label)}</th><td>${esc(val)}</td></tr>`;});
  return rows.length?`<table class="report-filter-table"><tbody>${rows.join('')}</tbody></table>`:'<p>Sem filtros específicos selecionados.</p>';
}
function reportStyles(){return `<style>body{font-family:Arial,Helvetica,sans-serif;color:#0a2450;margin:32px;}h1{font-size:28px;margin:0 0 6px;color:#00265f;}h2{font-size:18px;color:#00265f;border-bottom:2px solid #ffd200;padding-bottom:6px;margin-top:24px;}p{text-align:justify;line-height:1.45}.meta{color:#52627a;margin-bottom:18px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0}.card{border:1px solid #d9e2ef;border-radius:12px;padding:12px;background:#f8fbff}.card span{display:block;font-size:12px;color:#52627a;font-weight:700}.card strong{display:block;font-size:18px;color:#00265f;margin-top:4px}.chart{width:100%;max-width:900px;margin:12px auto;display:block;border:1px solid #e1e8f2;border-radius:8px}.report-filter-table,table{border-collapse:collapse;width:100%;font-size:12px}.report-filter-table th{width:180px;text-align:left;background:#eef3fa}th,td{border:1px solid #d9e2ef;padding:7px;vertical-align:top}thead th{background:#003b7a;color:#fff}.text-right{text-align:right}.print-actions{position:sticky;top:0;background:#fff;padding:8px 0;margin-bottom:12px}.print-actions button{background:#003b7a;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:700}@media print{.print-actions{display:none}.chart{page-break-inside:avoid}body{margin:18mm}.cards{grid-template-columns:repeat(2,1fr)}} </style>`;}
async function generateCreditReport(){
  const {digits,pos,sig}=filtered();
  const credito=digits.reduce((a,r)=>a+Number(r.saldo||0),0), empenhado=pos.reduce((a,r)=>a+Number(r.valorUsd||0),0), assinatura=sig.reduce((a,r)=>a+Number(r.valorUsd||0),0), total=credito+empenhado+assinatura;
  const chartIds=['creditByGcChart','poByGcChart','poByCompanyChart','poByProjectChart'];
  const imgs=(await Promise.all(chartIds.map(getPlotlyImage))).filter(Boolean);
  const digitRows=digits.slice().sort((a,b)=>Number(b.saldo||0)-Number(a.saldo||0)).map(r=>`<tr><td>${esc(r.digito)}</td><td>${esc(omLabel(r))}</td><td>${esc(r.acao)}</td><td>${esc(r.natureza)}</td><td>${esc(projectLabels(r).join(', '))}</td><td class="text-right">${money(r.saldo)}</td><td>${esc(r.objetivo)}</td></tr>`).join('');
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Relatório - Visão Executiva</title>${reportStyles()}</head><body><div class="print-actions"><button onclick="window.print()">Imprimir / salvar PDF</button></div><h1>Relatório Gerencial - Visão Executiva</h1><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')} com base nos filtros aplicados no painel.</div><p>Este relatório consolida o crédito disponível, os empenhos realizados e os empenhos em processo de assinatura, apresentando os dados atualmente filtrados de forma gerencial para apoio à tomada de decisão.</p><h2>Filtros aplicados</h2>${selectedFiltersHtml()}<h2>Indicadores</h2><div class="cards"><div class="card"><span>Crédito Disponível</span><strong>${money(credito)}</strong></div><div class="card"><span>Empenhos realizados</span><strong>${money(empenhado)}</strong></div><div class="card"><span>Empenhos em assinatura</span><strong>${money(assinatura)}</strong></div><div class="card"><span>Crédito total recebido</span><strong>${money(total)}</strong></div><div class="card"><span>% Crédito disponível</span><strong>${pct(credito,total)}</strong></div><div class="card"><span>Dígitos criados</span><strong>${num(digits.length)}</strong></div></div><h2>Gráficos</h2>${imgs.map(src=>`<img class="chart" src="${src}">`).join('')}<h2>Lista de dígitos filtrada</h2><table><thead><tr><th>Dígito</th><th>OM</th><th>Ação</th><th>Natureza</th><th>Projeto</th><th>Saldo disponível</th><th>Objetivo</th></tr></thead><tbody>${digitRows||'<tr><td colspan="7">Nenhum dígito encontrado.</td></tr>'}</tbody></table></body></html>`;
  const w=window.open('','_blank'); if(!w){alert('Autorize pop-ups para gerar o relatório.'); return;} w.document.open(); w.document.write(html); w.document.close();
}

function renderAll(){renderExecutive();renderUG();renderAction();renderDetail();renderConsistency();}
document.addEventListener('DOMContentLoaded',()=>{try{initFilters(); renderAll(); $('#generateCreditReport')?.addEventListener('click',generateCreditReport);}catch(e){console.error('CABW credit error',e);}});
})();