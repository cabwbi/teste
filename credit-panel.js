
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
function omCodes(r){
  if(Array.isArray(r.omCodigos)&&r.omCodigos.length)return r.omCodigos.map(String);
  const raw=String(r.omCodigo||r.omUnid||'').trim();
  if(raw)return raw.split(/[,;/\s]+/).filter(Boolean);
  const label=omLabel(r); return label&&label!=='N/I'?[label]:[];
}
function projectLabels(r){ if(Array.isArray(r.projetosLabels)&&r.projetosLabels.length) return r.projetosLabels; if(r.projetoLabel)return [r.projetoLabel]; if(Array.isArray(r.projetos))return r.projetos; if(r.projeto)return [r.projeto]; return [];}
const digitLookup=new Map((data.digits||[]).map(d=>[String(d.digito||'').trim(),d]));
let creditOmDetailMode='natureza';
function gcFromDigit(r){const d=digitLookup.get(String(r.digito||'').trim()); return (d&&(d.gcDescricao||d.gcDesc||d.grandComando||d.gc)) || r.gcDescricao || r.grandComando || 'N/I';}
function viewportProfile(){const width=Math.max(document.documentElement?.clientWidth||0,window.innerWidth||0);return {width,mobile:width<=640,compact:width<=900};}
function wrapHoverLabel(value,max=30){const words=String(value||'Não informado').replace(/\s+/g,' ').trim().split(' ');const lines=[];let line='';words.forEach(word=>{const next=(line+' '+word).trim();if(line&&next.length>max){lines.push(line);line=word;}else line=next;});if(line)lines.push(line);return lines.join('<br>');}
function omAcronyms(r){
  const lookup=(data.lookups&&data.lookups.om)||{};
  const codes=omCodes(r),labels=Array.isArray(r.omLabels)&&r.omLabels.length?r.omLabels:codes.map(code=>lookup[code]||code);
  const values=labels.concat(r.omSigla||[],r.sigla||[]).map(value=>String(value||'').split(' - ',1)[0].trim()).filter(Boolean);
  return unique(values.map(value=>lookup[value]?String(lookup[value]).split(' - ',1)[0].trim():value));
}
function hasAny(rowVals, selectedVals){ return !selectedVals.length || selectedVals.some(v=>rowVals.includes(v)); }
function filters(){return {ug:selected($('#creditFilterUg')), acao:selected($('#creditFilterAcao')), natureza:selected($('#creditFilterNatureza')), projeto:selected($('#creditFilterProjeto'))};}
function rowMatches(r,f){return hasAny(omCodes(r),f.ug) && (!f.acao.length||f.acao.includes(r.acao||'')) && (!f.natureza.length||f.natureza.includes(r.natureza||'')) && hasAny(projectLabels(r), f.projeto);}
function filtered(){const f=filters(); return {digits:data.digits.filter(r=>rowMatches(r,f)), pos:data.purchaseOrders.filter(r=>rowMatches(r,f)), sig:data.signatureOrders.filter(r=>rowMatches(r,f)), f};}
function eligibleSignature(r){return !r.isAmend&&!/^AMEND\b/i.test(String(r.alteracao||r.objetoResumo||'').trim());}

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
  const syncPending=()=>wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>{const opt=Array.from(sel.options).find(o=>o.value===cb.value);cb.checked=!!(opt&&opt.selected);});
  const commitPending=()=>{wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>{const opt=Array.from(sel.options).find(o=>o.value===cb.value);if(opt)opt.selected=cb.checked;});updateCabwMulti(sel);sel.dispatchEvent(new Event('change',{bubbles:true}));wrap.classList.remove('open');btn.setAttribute('aria-expanded','false');};
  btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();document.querySelectorAll('.cabw-multi-dropdown.open').forEach(w=>{if(w!==wrap)w.classList.remove('open')});const opening=!wrap.classList.contains('open');wrap.classList.toggle('open',opening);btn.setAttribute('aria-expanded',opening?'true':'false');if(opening){syncPending();setTimeout(()=>positionCabwMultiMenu(wrap),0);}});
  btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){e.preventDefault(); btn.click();}});
  wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',()=>{wrap.dataset.pending='true';}));
  const searchInput=wrap.querySelector('[data-ms-search]'); const filterOptions=()=>{const q=(searchInput?.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); wrap.querySelectorAll('.cabw-multi-option').forEach(label=>{const txt=(label.textContent||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); label.style.display=!q||txt.includes(q)?'flex':'none';});}; searchInput?.addEventListener('input',filterOptions); searchInput?.addEventListener('click',e=>e.stopPropagation()); wrap.querySelector('[data-ms-action="contains"]')?.addEventListener('click',e=>{e.preventDefault();commitPending();});
  wrap.querySelector('[data-ms-action="all"]')?.addEventListener('click',e=>{e.preventDefault();wrap.querySelectorAll('.cabw-multi-option').forEach(label=>{if(label.style.display!=='none')label.querySelector('input').checked=true;});wrap.dataset.pending='true';});
  wrap.querySelector('[data-ms-action="clear"]')?.addEventListener('click',e=>{e.preventDefault();wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=false);wrap.dataset.pending='true';});
  updateCabwMulti(sel);
}
function updateAllCabwMultis(){document.querySelectorAll('select.cabw-native-multi-hidden').forEach(updateCabwMulti);}

function isValidOmFilterLabel(v){ const s=String(v||'').trim(); return /[A-Za-zÀ-ÿ]/.test(s) && !/^[-\d.,\s]+$/.test(s) && !/^([\d.]+)(\s*-\s*\1)?$/.test(s); }
function fillMulti(sel, vals){ if(!sel)return; const old=selected(sel); sel.multiple=true; sel.innerHTML=vals.map(v=>{const item=v&&typeof v==='object'?v:{value:v,label:v};return `<option value="${esc(item.value)}">${esc(item.label)}</option>`;}).join(''); if(old.length){old.forEach(v=>{const o=Array.from(sel.options).find(o=>o.value===v); if(o)o.selected=true;});} else {Array.from(sel.options).forEach(o=>o.selected=false);} rebuildCabwMulti(sel); }
function initFilters(){
  const d=data.digits||[], p=data.purchaseOrders||[], s=data.signatureOrders||[], all=[].concat(d,p,s), lookup=(data.lookups&&data.lookups.om)||{};
  const omOptions=unique(all.flatMap(omCodes)).map(code=>({value:code,label:lookup[code]||code})).filter(item=>isValidOmFilterLabel(item.label)).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
  fillMulti($('#creditFilterUg'),omOptions); fillMulti($('#creditFilterAcao'), unique([].concat(d.map(r=>r.acao),p.map(r=>r.acao),s.map(r=>r.acao)))); fillMulti($('#creditFilterNatureza'), unique([].concat(d.map(r=>r.natureza),p.map(r=>r.natureza),s.map(r=>r.natureza)))); fillMulti($('#creditFilterProjeto'), unique([].concat(...d.map(projectLabels),...p.map(projectLabels),...s.map(projectLabels)))); $('#applyCreditFilters')?.addEventListener('click',renderAll); $('#clearCreditFilters')?.addEventListener('click',()=>{$all('#creditFilterUg,#creditFilterAcao,#creditFilterNatureza,#creditFilterProjeto').forEach(e=>Array.from(e.options).forEach(o=>o.selected=false)); updateAllCabwMultis(); renderAll();});
}
function agg(arr, keyFn, valFn){const m=new Map(); arr.forEach(r=>{const k=keyFn(r)||'N/I'; m.set(k,(m.get(k)||0)+Number(valFn(r)||0));}); return Array.from(m,([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);}
function shortAxisLabel(v){const t=String(v==null?'':v); return t.length>20?t.slice(0,20)+'...':t;}
function addAxisTitles(el, shown, full){try{const map=new Map(shown.map((v,i)=>[v,full[i]])); setTimeout(()=>{el.querySelectorAll('.ytick text,.xtick text').forEach(t=>{const key=(t.textContent||'').trim(); const fullLabel=map.get(key); if(fullLabel&&!t.querySelector('title')){const title=document.createElementNS('http://www.w3.org/2000/svg','title'); title.textContent=fullLabel; t.appendChild(title);}});},150);}catch(e){}}
function drawBar(id, rows, title, yTitle, options={}){
  const el=$('#'+id); if(!el)return; if(!window.Plotly){el.innerHTML='<p>Plotly não carregado.</p>';return;}
  const top=rows.filter(r=>Number(r.value)>0).slice(0,20).reverse(), fullLabels=top.map(r=>String(r.label||''));
  const shownLabels=options.fullAxisLabels?fullLabels:fullLabels.map(shortAxisLabel);
  const longest=fullLabels.reduce((max,label)=>Math.max(max,label.length),0);
  const leftMargin=options.fullAxisLabels?Math.min(390,Math.max(190,longest*6.3)):130;
  Plotly.newPlot(el,[{type:'bar',orientation:'h',y:shownLabels,x:top.map(r=>r.value),customdata:fullLabels,text:top.map(r=>money(r.value)),textposition:'auto',hovertemplate:'%{customdata}<br>Valor: %{x:$,.2f}<extra></extra>',marker:{color:'#003b7a'}}],{title:{text:title,font:{size:16}},height:Math.max(360,top.length*30+120),margin:{l:leftMargin,r:30,t:60,b:50},xaxis:{title:yTitle||'US$'},yaxis:{automargin:true,tickfont:{size:11}}}, {displayModeBar:false,responsive:true}).then(()=>addAxisTitles(el, shownLabels, fullLabels));
}
function creditByOmNatureModel(digits,validSig,detailMode='natureza'){
  const rows=(digits||[]).concat(validSig||[]),groups=new Map(),categoryTotals=new Map(),byProject=detailMode==='projeto';
  rows.forEach(row=>{const om=omGroup(row).label,category=byProject?(projectLabels(row).join(', ')||'Projeto não informado'):String(row.natureza||'Natureza não informada'),value=Number(row.saldo!==undefined?row.saldo:row.valorUsd)||0;if(value<=0)return;if(!groups.has(om))groups.set(om,new Map());groups.get(om).set(category,(groups.get(om).get(category)||0)+value);categoryTotals.set(category,(categoryTotals.get(category)||0)+value);});
  const categories=Array.from(categoryTotals).sort((a,b)=>b[1]-a[1]).map(([name])=>name),oms=Array.from(groups,([label,values])=>({label,values,total:Array.from(values.values()).reduce((a,b)=>a+b,0)})).sort((a,b)=>b.total-a.total);
  return {categories,natures:categories,oms,detailMode};
}
function drawCreditByOmNature(target,digits,validSig,options={}){
  const el=typeof target==='string'?$('#'+target):target;if(!el||!window.Plotly)return Promise.resolve();const detailMode=options.detailMode||(typeof target==='string'?creditOmDetailMode:'natureza'),model=creditByOmNatureModel(digits,validSig,detailMode),oms=model.oms.slice(0,10).reverse(),profile=viewportProfile(),categoryLabel=detailMode==='projeto'?'Projeto':'Natureza';
  if(!oms.length){el.innerHTML='<p class="credit-empty-chart">Nenhum crédito disponível para os filtros aplicados.</p>';return Promise.resolve();}
  const palette=['#003b7a','#2878b8','#73b9e6','#0b7a75','#7b61a8','#d49b16','#64748b','#4f7eaa','#2e8b57','#9b6a12'];
  const traces=model.categories.map((category,index)=>({type:'bar',orientation:'h',name:category,y:oms.map(row=>row.label),x:oms.map(row=>row.values.get(category)||0),customdata:oms.map(row=>[row.label,category,row.values.get(category)||0,row.total]),marker:{color:palette[index%palette.length]},hovertemplate:`<b>%{customdata[0]}</b><br>${categoryLabel}: %{customdata[1]}<br>Valor da categoria: %{customdata[2]:$,.2f}<br>Total da OM: %{customdata[3]:$,.2f}<extra></extra>`}));
  const annotations=oms.map(row=>({xref:'paper',x:1.01,yref:'y',y:row.label,text:`<b>${money(row.total)}</b>`,showarrow:false,xanchor:'left',font:{size:profile.mobile?10:14,color:'#00265f'}}));
  const margin=profile.mobile?{l:135,r:90,t:24,b:125}:profile.compact?{l:250,r:155,t:24,b:110}:{l:365,r:195,t:24,b:110};
  const detailText=$('#creditOmDetailDescription');if(typeof target==='string'&&detailText)detailText.textContent=detailMode==='projeto'?'Barras empilhadas por projeto; o valor total de cada OM ou grupo aparece à direita.':'Barras empilhadas por natureza de despesas; o valor total de cada OM ou grupo aparece à direita.';
  $all('[data-credit-om-detail]').forEach(button=>{const active=button.dataset.creditOmDetail===detailMode;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
  return Plotly.react(el,traces,{barmode:'stack',height:Math.max(profile.mobile?600:470,oms.length*(profile.mobile?40:48)+170),margin,xaxis:{title:'Crédito disponível (US$)',automargin:true,tickfont:{size:profile.mobile?10:13},titlefont:{size:profile.mobile?11:14}},yaxis:{automargin:true,tickfont:{size:profile.mobile?10:14}},legend:{orientation:'h',x:0.5,xanchor:'center',y:-0.18,yanchor:'top',font:{size:profile.mobile?10:13}},annotations,hoverlabel:{font:{size:profile.mobile?11:14}},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff',font:{family:'Montserrat, Arial, sans-serif',color:'#244160'}},{displayModeBar:false,responsive:!options.staticPlot,staticPlot:!!options.staticPlot});
}
function executionMetrics(digits,pos,sig){
  const validSig=(sig||[]).filter(eligibleSignature),available=(digits||[]).reduce((a,r)=>a+Number(r.saldo||0),0)+validSig.reduce((a,r)=>a+Number(r.valorUsd||0),0),committed=(pos||[]).reduce((a,r)=>a+Number(r.valorUsd||0),0),liquidated=(pos||[]).reduce((a,r)=>a+Number(r.liquidadoNlUsd||0),0),received=available+committed;
  return {validSig,available,committed,liquidated,committedOpen:Math.max(0,committed-liquidated),received};
}
function executionRows(digits,pos,sig,keyFn){
  const grouped=new Map();
  const get=row=>{const label=String(keyFn(row)||'Não informado');if(!grouped.has(label))grouped.set(label,{label,available:0,committed:0,liquidatedRaw:0});return grouped.get(label);};
  (digits||[]).forEach(row=>{get(row).available+=Number(row.saldo||0);});
  (sig||[]).filter(eligibleSignature).forEach(row=>{get(row).available+=Number(row.valorUsd||0);});
  (pos||[]).forEach(row=>{const item=get(row);item.committed+=Number(row.valorUsd||0);item.liquidatedRaw+=Number(row.liquidadoNlUsd||0);});
  return Array.from(grouped.values()).map(item=>{const received=item.available+item.committed,liquidated=Math.min(item.committed,Math.max(0,item.liquidatedRaw)),committedOpen=Math.max(0,item.committed-liquidated);return {...item,received,liquidated,committedOpen,availablePct:received?item.available/received*100:0,committedOpenPct:received?committedOpen/received*100:0,liquidatedPct:received?liquidated/received*100:0};}).filter(item=>item.received>0).sort((a,b)=>b.received-a.received||a.label.localeCompare(b.label,'pt-BR'));
}
function drawExecutionPhaseChart(id,rows,limit){
  const el=$('#'+id);if(!el)return;if(!window.Plotly){el.innerHTML='<p>Plotly não carregado.</p>';return;}
  const profile=viewportProfile(),selected=(limit?rows.slice(0,limit):rows).slice().reverse();
  if(!selected.length){el.innerHTML='<p class="credit-empty-chart">Nenhum dado encontrado para os filtros aplicados.</p>';return;}
  const fullLabels=selected.map(row=>row.label),y=fullLabels.map(label=>profile.mobile?shortLabel(label,22):profile.compact?shortLabel(label,34):label);
  const phaseTrace=(name,key,pctKey,color)=>({type:'bar',orientation:'h',name,y,x:selected.map(row=>row[pctKey]),customdata:selected.map(row=>[row[key],row.received,row[pctKey],wrapHoverLabel(row.label,profile.mobile?26:42)]),text:selected.map(row=>row[pctKey]>=5?pct(row[key],row.received):''),textposition:'inside',insidetextanchor:'middle',textfont:{color:'#fff',size:profile.mobile?9:11},marker:{color},hoverlabel:{bgcolor:'#fff',bordercolor:color,font:{color:'#00265f',size:profile.mobile?10:12},align:'left',namelength:0},hovertemplate:'<b>%{customdata[3]}</b><br>'+name+': %{customdata[0]:$,.2f}<br>Participação: %{customdata[2]:.2f}%<br>Crédito recebido: %{customdata[1]:$,.2f}<extra></extra>'});
  const annotations=profile.mobile?[]:selected.map((row,index)=>({xref:'paper',x:1.01,yref:'y',y:y[index],text:'<b>'+money(row.received)+'</b>',showarrow:false,xanchor:'left',font:{size:profile.compact?9:11,color:'#00265f'}}));
  const margin=profile.mobile?{l:118,r:18,t:38,b:126}:profile.compact?{l:220,r:125,t:38,b:112}:{l:330,r:190,t:36,b:108};
  Plotly.newPlot(el,[phaseTrace('Crédito não empenhado','available','availablePct','#003b7a'),phaseTrace('Empenhado e não liquidado','committedOpen','committedOpenPct','#2878b8'),phaseTrace('Liquidado e pago','liquidated','liquidatedPct','#73b9e6')],{height:Math.max(profile.mobile?560:500,selected.length*(profile.mobile?39:43)+(profile.mobile?205:148)),barmode:'stack',margin,xaxis:{title:profile.mobile?'% do crédito recebido':'Percentual do crédito recebido',range:[0,100],ticksuffix:'%',fixedrange:true,tickfont:{size:profile.mobile?9:11},titlefont:{size:profile.mobile?10:12}},yaxis:{type:'category',tickmode:'array',tickvals:y,ticktext:y,automargin:true,categoryorder:'array',categoryarray:y,tickfont:{size:profile.mobile?9:12}},legend:{orientation:'h',x:0.5,xanchor:'center',y:profile.mobile?-0.25:-0.2,yanchor:'top',font:{size:profile.mobile?9:12},traceorder:'normal'},annotations,hovermode:'closest',paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});
}
function shortLabel(value,max=34){const text=String(value||'Não informado').replace(/\s+/g,' ').trim();return text.length>max?text.slice(0,max-3)+'...':text;}
function drawPoBalanceRanking(pos){
  const el=$('#poBalanceRankingChart');if(!el)return;if(!window.Plotly){el.innerHTML='<p>Plotly não carregado.</p>';return;}
  const profile=viewportProfile(),rows=(pos||[]).filter(row=>Number(row.empenhadoNaoLiquidadoUsd)>0).sort((a,b)=>Number(b.empenhadoNaoLiquidadoUsd)-Number(a.empenhadoNaoLiquidadoUsd)).slice(0,20).reverse();
  if(!rows.length){el.innerHTML='<p class="credit-empty-chart">Nenhuma PO com saldo não liquidado para os filtros aplicados.</p>';return;}
  const y=rows.map(row=>row.po),companies=rows.map(row=>shortLabel(row.nomeFornecedor||row.fornecedor,profile.mobile?20:31));
  const rightLabels=rows.map(row=>{const gc=gcFromDigit(row),oms=omAcronyms(row).join(', ')||'OM não informada',projects=projectLabels(row).join(', ')||'Projeto não informado';return {gc,oms,projects,html:'<b>'+shortLabel(gc,profile.compact?28:44)+'</b><br>'+shortLabel(oms,profile.compact?24:34)+' · '+shortLabel(projects,profile.compact?24:38)};});
  const ticktext=profile.mobile?companies.map((company,index)=>company+'<br><b>'+shortLabel(rightLabels[index].gc,20)+'</b><br>'+shortLabel(rightLabels[index].oms+' · '+rightLabels[index].projects,24)):companies;
  const annotations=profile.mobile?[]:rows.map((row,index)=>({xref:'paper',x:1.01,yref:'y',y:row.po,text:rightLabels[index].html,showarrow:false,xanchor:'left',align:'left',font:{size:profile.compact?9:10,color:'#24466e'}}));
  const tooltipDescription=row=>{const value=String(row.descricaoRequisicao||row.objetoResumo||'Não informada').replace(/\s+/g,' ').trim();return value.length>30?value.slice(0,30)+'...':value;};
  const custom=rows.map((row,index)=>[row.po,row.data,Number(row.valorUsd||0),(row.requisicoes||[]).join(', ')||row.requisicaoPrincipal||'Não informada',tooltipDescription(row),rightLabels[index].gc,rightLabels[index].oms,rightLabels[index].projects]);
  const margin=profile.mobile?{l:164,r:14,t:24,b:62}:profile.compact?{l:220,r:245,t:20,b:60}:{l:310,r:390,t:20,b:60};
  Plotly.newPlot(el,[{type:'bar',orientation:'h',y,x:rows.map(row=>Number(row.empenhadoNaoLiquidadoUsd||0)),customdata:custom,text:rows.map(row=>money(row.empenhadoNaoLiquidadoUsd)),textposition:'auto',cliponaxis:false,textfont:{size:profile.mobile?9:12},marker:{color:'#0e63b6'},hoverlabel:{bgcolor:'#ffffff',bordercolor:'#0e63b6',font:{color:'#00265f',size:profile.mobile?10:12},align:'left',namelength:0},hovertemplate:'<b>PO %{customdata[0]}</b><br>Data: %{customdata[1]}<br>Saldo não liquidado: %{x:$,.2f}<br>Valor total: %{customdata[2]:$,.2f}<br>Requisição: %{customdata[3]}<br>Descrição: %{customdata[4]}<br>Grande Comando: %{customdata[5]}<br>OM: %{customdata[6]}<br>Projeto: %{customdata[7]}<extra></extra>'}],{height:Math.max(profile.mobile?760:560,rows.length*(profile.mobile?58:43)+(profile.mobile?95:80)),margin,xaxis:{title:profile.mobile?'Saldo não liquidado (US$)':'Saldo da PO ainda não liquidado (US$)',automargin:true,tickfont:{size:profile.mobile?9:11},titlefont:{size:profile.mobile?10:12}},yaxis:{type:'category',tickmode:'array',tickvals:y,ticktext,automargin:true,tickfont:{size:profile.mobile?8:12}},annotations,hovermode:'closest',paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});
}
function renderExecutive(){
  if(!$('#kpiCreditAvailable')) return;
  const {digits,pos,sig}=filtered(), metrics=executionMetrics(digits,pos,sig),validSig=metrics.validSig;
  const credito=metrics.available,empenhado=metrics.committed,total=metrics.received,liquidado=metrics.liquidated,empenhadoAberto=metrics.committedOpen,assinatura=validSig.reduce((a,r)=>a+Number(r.valorUsd||0),0);
  const faturadoPo=pos.reduce((a,r)=>a+Number(r.faturadoUsd||0),0), saldoPo=pos.reduce((a,r)=>a+Number(r.saldoUsd||0),0), fornecedores=unique(pos.map(r=>r.fornecedor||r.nomeFornecedor));
  $('#kpiCreditAvailable').textContent=money(credito); $('#kpiAvailableShare')&&($('#kpiAvailableShare').textContent=pct(credito,total)+' do crédito recebido'); $('#kpiCommitted').textContent=money(empenhado); $('#kpiCommittedShare')&&($('#kpiCommittedShare').textContent=pct(empenhado,total)+' do crédito recebido'); $('#kpiLiquidated')&&($('#kpiLiquidated').textContent=money(liquidado)); $('#kpiLiquidatedShare')&&($('#kpiLiquidatedShare').textContent=pct(liquidado,total)+' do crédito recebido'); $('#kpiCommittedOpen')&&($('#kpiCommittedOpen').textContent=money(empenhadoAberto)); $('#kpiCommittedOpenShare')&&($('#kpiCommittedOpenShare').textContent=pct(empenhadoAberto,total)+' do crédito recebido'); $('#kpiSigning').textContent=money(assinatura); $('#kpiReceived').textContent=money(total); $('#kpiReceivedShare')&&($('#kpiReceivedShare').textContent='100,00% do crédito recebido'); $('#kpiPoCount')&&($('#kpiPoCount').textContent=num(pos.length)); $('#kpiSuppliersCount')&&($('#kpiSuppliersCount').textContent=num(fornecedores.length)); $('#kpiPoBilled')&&($('#kpiPoBilled').textContent=money(faturadoPo)); $('#kpiPoBalance')&&($('#kpiPoBalance').textContent=money(saldoPo));
  const summaryCell=(value,share)=>`<strong>${money(value)}</strong><small>${pct(share,total)} do crédito recebido</small>`;
  const table=$('#executiveSummaryBody'); if(table)table.innerHTML=`<tr><td>2026</td><td class="text-right">${summaryCell(total,total)}</td><td class="text-right">${summaryCell(empenhado,empenhado)}</td><td class="text-right">${summaryCell(credito,credito)}</td><td class="text-right">${summaryCell(empenhadoAberto,empenhadoAberto)}</td><td class="text-right">${summaryCell(liquidado,liquidado)}</td></tr>`;
  const topOms=creditByOmNatureModel(digits,validSig).oms.slice(0,4),topOmsList=$('#topAvailableOms');if(topOmsList)topOmsList.innerHTML=topOms.length?topOms.map((row,index)=>`<article><span class="credit-top-om__rank">${index+1}</span><strong>${esc(row.label)}</strong><b>${money(row.total)}</b></article>`).join(''):'<p>Nenhuma OM encontrada para os filtros aplicados.</p>';
  const gcRows=executionRows(digits,pos,sig,gcFromDigit),actionRows=executionRows(digits,pos,sig,r=>'Ação '+String(r.acao||'não informada'));
  drawExecutionPhaseChart('executionByGcChart',gcRows);
  drawExecutionPhaseChart('executionByActionChart',actionRows,10);
  drawPoBalanceRanking(pos);
  drawCreditByOmNature('creditByOmNatureChart',digits,validSig);
  drawBar('creditByGcChart',agg(digits.concat(validSig),gcFromDigit,r=>r.saldo!==undefined?r.saldo:r.valorUsd),'Crédito disponível por Grande Comando','Saldo + POs em assinatura',{fullAxisLabels:true});
  drawBar('poByGcChart',agg(pos,gcFromDigit,r=>r.valorUsd),'PO por Grande Comando conforme dígito','Valor empenhado',{fullAxisLabels:true}); drawBar('poByCompanyChart',agg(pos,r=>r.fornecedor||'N/I',r=>r.valorUsd),'Empenhos por empresa','Valor empenhado'); drawBar('poByProjectChart',agg(pos,r=>projectLabels(r).join(', ')||'Sem projeto',r=>r.valorUsd),'Empenhos por projeto','Valor empenhado'); renderDigitsTable(digits);
}
function renderDigitsTable(digits){const container=$('#digitsGroupedTables');if(!container)return;container.innerHTML=digitGroups(digits).map(group=>`<section class="credit-digit-group"><div class="credit-digit-group__heading"><h3>Lista de dígitos ${esc(group.label)}</h3><strong>Total: ${money(group.total)}</strong></div><div class="cabw-table-scroll"><table class="table table-striped table-sm cabw-table"><thead><tr><th>Dígito</th><th>OM</th><th>Ação</th><th>Natureza</th><th>Projeto</th><th class="text-right">Saldo disponível</th><th>Objetivo</th></tr></thead><tbody>${group.rows.map(r=>`<tr><td>${esc(r.digito)}</td><td>${esc(omLabel(r))}</td><td>${esc(r.acao)}</td><td>${esc(r.natureza)}</td><td>${esc(projectLabels(r).join(', '))}</td><td class="text-right">${money(r.saldo)}</td><td>${esc(r.objetivo)}</td></tr>`).join('')}</tbody></table></div></section>`).join('')||'<p>Nenhum dígito encontrado.</p>';}
function renderUG(){ if(!$('#ugChart') && !$('#ugTableBody'))return; const {digits}=filtered(); const rows=agg(digits, r=>r.sigla||omLabel(r), r=>r.saldo); if(window.Plotly&&$('#ugChart')) drawBar('ugChart', rows, 'Crédito disponível por OM', 'Saldo disponível'); const body=$('#ugTableBody'); if(body) body.innerHTML=rows.map(r=>`<tr><td>${esc(r.label)}</td><td class="text-right">${money(r.value)}</td></tr>`).join(''); }
function renderAction(){ if(!$('#actionChart') && !$('#actionTableBody'))return; const {digits}=filtered(); const rows=agg(digits, r=>r.acao||'Sem ação', r=>r.saldo); if(window.Plotly&&$('#actionChart')) drawBar('actionChart', rows, 'Crédito disponível por ação', 'Saldo disponível'); const body=$('#actionTableBody'); if(body) body.innerHTML=rows.map(r=>`<tr><td>${esc(r.label)}</td><td class="text-right">${money(r.value)}</td></tr>`).join(''); }
function renderDetail(){ if(!$('#detailTableBody'))return; const {digits}=filtered(); const total=digits.reduce((a,r)=>a+Number(r.saldo||0),0); $('#detailKpiCredit')&&($('#detailKpiCredit').textContent=money(total)); $('#detailKpiUgs')&&($('#detailKpiUgs').textContent=num(unique(digits.map(omLabel)).length)); $('#detailKpiActions')&&($('#detailKpiActions').textContent=num(unique(digits.map(r=>r.acao)).length)); $('#detailTableBody').innerHTML=digits.sort((a,b)=>Number(b.saldo||0)-Number(a.saldo||0)).map(r=>`<tr><td>${esc(r.digito)}</td><td>${esc(omLabel(r))}</td><td>${esc(r.acao)}</td><td>${esc(r.ptres)}</td><td>${esc(r.natureza)}</td><td>${esc(projectLabels(r).join(', '))}</td><td class="text-right">${money(r.saldo)}</td><td>${esc(r.objetivo)}</td></tr>`).join(''); }
function renderConsistency(){ if(!$('#consistencyTableBody'))return; const all=data.digits||[]; const total=all.reduce((a,r)=>a+Number(r.saldo||0),0); $('#consistencyTableBody').innerHTML=`<tr><td>Total de dígitos carregados</td><td class="text-right">${num(all.length)}</td><td>Fonte: ${esc(data.meta.sourceDigits||'digitos.xlsx')}</td></tr><tr><td>Saldo total disponível</td><td class="text-right">${money(total)}</td><td>Dígitos filtráveis por OM e projeto descritivos</td></tr>`;}

async function getPlotlyImage(id){
  const el=$('#'+id);
  if(!el || !window.Plotly || !el.data) return '';
  try{return await Plotly.toImage(el,{format:'png',width:1400,height:620,scale:1.4});}catch(e){console.warn('Falha ao capturar gráfico',id,e); return '';}
}
function selectedFiltersHtml(){
  const rows=$all('.cabw-multi-dropdown').map(w=>{const label=w.closest('label')?.querySelector('span')?.textContent?.trim()||'Filtro'; const val=w.querySelector('.cabw-multi-button')?.textContent?.trim()||'Todas as opções'; return `<tr><th>${esc(label)}</th><td>${esc(val)}</td></tr>`;});
  return rows.length?`<table class="report-filter-table"><tbody>${rows.join('')}</tbody></table>`:'<p>Sem filtros específicos selecionados.</p>';
}
function reportStyles(){return `<style>body{font-family:Arial,Helvetica,sans-serif;color:#0a2450;margin:32px;}h1{font-size:28px;margin:0 0 6px;color:#00265f;}h2{font-size:18px;color:#00265f;border-bottom:2px solid #ffd200;padding-bottom:6px;margin-top:24px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end}.table-total{font-size:14px;white-space:nowrap;color:#003b7a}p{text-align:justify;line-height:1.45}.meta{color:#52627a;margin-bottom:18px}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:18px 0}.card{border:1px solid #d9e2ef;border-radius:12px;padding:12px;background:#f8fbff}.card span{display:block;font-size:12px;color:#52627a;font-weight:700}.card strong{display:block;font-size:18px;color:#00265f;margin-top:4px}.chart{width:100%;max-width:900px;margin:12px auto;display:block;border:1px solid #e1e8f2;border-radius:8px}.report-filter-table,table{border-collapse:collapse;width:100%;font-size:12px}.report-filter-table th{width:180px;text-align:left;background:#eef3fa}th,td{border:1px solid #d9e2ef;padding:7px;vertical-align:top}thead th{background:#003b7a;color:#fff}.text-right{text-align:right}.print-actions{position:sticky;top:0;background:#fff;padding:8px 0;margin-bottom:12px}.print-actions button{background:#003b7a;color:#fff;border:0;border-radius:8px;padding:10px 14px;font-weight:700}@media print{.print-actions{display:none}.chart{page-break-inside:avoid}body{margin:18mm}.cards{grid-template-columns:repeat(2,1fr)}} </style>`;}
function omGroup(row){
  const lookup=(data.lookups&&data.lookups.om)||{},codes=unique(omCodes(row));
  const members=codes.map(code=>({code,label:String(lookup[code]||code).split(' - ',1)[0].trim()||code}));
  return {key:codes.join('|')||'__NI__',label:members.length?members.map(item=>`${item.label} (${item.code})`).join(' e '):'OM não informada'};
}
function digitGroups(digits){
  const groups=new Map();
  digits.filter(row=>Number(row.saldo||0)>0).forEach(row=>{const group=omGroup(row);if(!groups.has(group.key))groups.set(group.key,{key:group.key,label:group.label,rows:[],total:0});const item=groups.get(group.key);item.rows.push(row);item.total+=Number(row.saldo||0);});
  return Array.from(groups.values()).map(group=>({...group,rows:group.rows.slice().sort((a,b)=>Number(b.saldo||0)-Number(a.saldo||0))})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label,'pt-BR'));
}
function digitGroupTablesHtml(digits){
  return digitGroups(digits).map(group=>{
    const rows=group.rows.map(r=>`<tr><td>${esc(r.digito)}</td><td>${esc(omLabel(r))}</td><td>${esc(r.acao)}</td><td>${esc(r.natureza)}</td><td>${esc(projectLabels(r).join(', '))}</td><td class="text-right">${money(r.saldo)}</td><td>${esc(r.objetivo)}</td></tr>`).join('');
    return `<h2>Lista de dígitos ${esc(group.label)} <span class="table-total">Total: ${money(group.total)}</span></h2><table><thead><tr><th>Dígito</th><th>OM</th><th>Ação</th><th>Natureza</th><th>Projeto</th><th>Saldo disponível</th><th>Objetivo</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('')||'<p>Nenhum dígito encontrado.</p>';
}
async function reportCreditByOmImage(digits,validSig){
  if(!window.Plotly)return '';
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:1400px;height:720px';document.body.appendChild(host);
  const rows=agg((digits||[]).concat(validSig||[]),r=>omGroup(r).label,r=>r.saldo!==undefined?r.saldo:r.valorUsd).filter(r=>r.value>0).slice(0,10).reverse();
  if(!rows.length){host.remove();return '';}
  try{await drawCreditByOmNature(host,digits,validSig,{staticPlot:true});return await Plotly.toImage(host,{format:'png',width:1400,height:Math.max(620,rows.length*42+160),scale:1.3});}catch(e){console.warn('Falha ao gerar gráfico do relatório por OM',e);return '';}finally{try{Plotly.purge(host);}catch(e){}host.remove();}
}
async function generateCreditReport(){
  const {digits,pos,sig}=filtered();
  const metrics=executionMetrics(digits,pos,sig),credito=metrics.available,empenhado=metrics.committed,total=metrics.received,liquidado=metrics.liquidated,empenhadoAberto=metrics.committedOpen,assinatura=metrics.validSig.reduce((a,r)=>a+Number(r.valorUsd||0),0);
  const chartIds=['executionByGcChart','executionByActionChart','poBalanceRankingChart','creditByGcChart','poByGcChart','poByCompanyChart','poByProjectChart'];
  const imgs=(await Promise.all(chartIds.map(getPlotlyImage))).filter(Boolean),omImage=await reportCreditByOmImage(digits,metrics.validSig);
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Relatório - Visão geral da Execução</title>${reportStyles()}</head><body><div class="print-actions"><button onclick="window.print()">Imprimir / salvar PDF</button></div><h1>Relatório Gerencial - Visão geral da Execução</h1><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')} com base nos filtros aplicados no painel.</div><p>Este relatório consolida o crédito recebido, o crédito ainda não empenhado, os empenhos e as liquidações de POs de 2026 conforme os filtros aplicados.</p><h2>Filtros aplicados</h2>${selectedFiltersHtml()}<h2>Indicadores</h2><div class="cards"><div class="card"><span>Crédito total recebido</span><strong>${money(total)}</strong><small>100,00% do crédito recebido</small></div><div class="card"><span>Crédito não empenhado</span><strong>${money(credito)}</strong><small>${pct(credito,total)} do crédito recebido</small></div><div class="card"><span>Empenhos realizados</span><strong>${money(empenhado)}</strong><small>${pct(empenhado,total)} do crédito recebido</small></div><div class="card"><span>Empenhado e não liquidado</span><strong>${money(empenhadoAberto)}</strong><small>${pct(empenhadoAberto,total)} do crédito recebido</small></div><div class="card"><span>Liquidado e pago</span><strong>${money(liquidado)}</strong><small>${pct(liquidado,total)} do crédito recebido</small></div><div class="card"><span>Empenhos em assinatura</span><strong>${money(assinatura)}</strong></div><div class="card"><span>Ordens de compra emitidas</span><strong>${num(pos.length)}</strong></div><div class="card"><span>Empresas com PO</span><strong>${num(unique(pos.map(r=>r.fornecedor||r.nomeFornecedor)).length)}</strong></div></div><h2>Crédito disponível por Organização Militar e natureza de despesas</h2>${omImage?`<img class="chart" src="${omImage}">`:'<p>Sem crédito disponível no recorte.</p>'}<h2>Demais gráficos</h2>${imgs.map(src=>`<img class="chart" src="${src}">`).join('')}${digitGroupTablesHtml(digits)}</body></html>`;
  const w=window.open('','_blank'); if(!w){alert('Autorize pop-ups para gerar o relatório.'); return;} w.document.open(); w.document.write(html); w.document.close();
}
function generateSimplifiedCreditReport(){
  const {digits}=filtered();
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Relatório simplificado - Dígitos por OM</title>${reportStyles()}</head><body><div class="print-actions"><button onclick="window.print()">Imprimir / salvar PDF</button></div><h1>Relatório simplificado - Lista de dígitos por OM</h1><div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')} com base nos filtros aplicados no painel. As tabelas estão ordenadas do maior para o menor saldo agregado.</div>${digitGroupTablesHtml(digits)}</body></html>`;
  const w=window.open('','_blank');if(!w){alert('Autorize pop-ups para gerar o relatório simplificado.');return;}w.document.open();w.document.write(html);w.document.close();
}

function renderAll(){renderExecutive();renderUG();renderAction();renderDetail();renderConsistency();}
window.CABW_CREDIT_PANEL_TEST={executionMetrics,executionRows,gcFromDigit,eligibleSignature,rowMatches,filtered,viewportProfile,wrapHoverLabel,omAcronyms,drawExecutionPhaseChart,drawPoBalanceRanking,creditByOmNatureModel,omGroup,digitGroups,digitGroupTablesHtml};
document.addEventListener('DOMContentLoaded',()=>{try{initFilters();renderAll();let resizeTimer=0,lastWidth=window.innerWidth;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(Math.abs(window.innerWidth-lastWidth)<24)return;lastWidth=window.innerWidth;renderExecutive();},180);});$all('[data-credit-om-detail]').forEach(button=>button.addEventListener('click',()=>{creditOmDetailMode=button.dataset.creditOmDetail==='projeto'?'projeto':'natureza';const {digits,sig}=filtered();drawCreditByOmNature('creditByOmNatureChart',digits,(sig||[]).filter(eligibleSignature),{detailMode:creditOmDetailMode});}));const reportButton=$('#generateCreditReport');if(reportButton){reportButton.addEventListener('click',generateCreditReport);reportButton.__cabwReportBound=true;}const simplifiedButton=$('#generateSimplifiedCreditReport');if(simplifiedButton){simplifiedButton.addEventListener('click',generateSimplifiedCreditReport);simplifiedButton.__cabwReportBound=true;}}catch(e){console.error('CABW credit error',e);}});
})();
