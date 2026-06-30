(function(){
  const DATA=window.CABW_RP_DATA||{records:[],nlEvents:[],summary:{}};
  const records=DATA.records||[];
  const events=DATA.nlEvents||[];
  const CY=(DATA.summary&&DATA.summary.currentYear)||2026;
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>'US$ '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const num=v=>Number(v||0).toLocaleString('pt-BR');
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const uniq=a=>Array.from(new Set(a.filter(v=>v!==undefined&&v!==null&&String(v).trim()!==''))).sort((x,y)=>String(x).localeCompare(String(y),'pt-BR'));
  function selected(sel){return sel?Array.from(sel.selectedOptions).map(o=>o.value):[];}
  function labelFor(sel){const text=(sel.closest('label')?.querySelector('span')?.textContent||'opções').toLowerCase(); if(text==='ano de emissão da po')return 'Todos os anos'; if(text==='tipo de processo')return 'Todos os tipos'; return 'Todas as '+text.replace('om requisitante','OMs').replace('ug requisitante','UGs').replace('ação orçamentária','ações').replace('natureza de despesa','naturezas').replace('empresa contratada','empresas').replace('requisição atrasada','situações');}
  function updateMulti(sel){const wrap=sel.nextElementSibling; if(!wrap||!wrap.classList.contains('rp-multi'))return; const chosen=Array.from(sel.selectedOptions).map(o=>o.textContent.trim()); wrap.querySelector('.rp-multi-button').textContent=chosen.length?(chosen.length<=2?chosen.join(', '):chosen.length+' selecionados'):labelFor(sel); wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>{const opt=Array.from(sel.options).find(o=>o.value===cb.value); cb.checked=!!(opt&&opt.selected);});}
  function applyStaged(sel,wrap){const vals=new Set(Array.from(wrap.querySelectorAll('input[type="checkbox"]:checked')).map(cb=>cb.value)); Array.from(sel.options).forEach(o=>{o.selected=vals.has(o.value)}); updateMulti(sel); sel.dispatchEvent(new Event('change',{bubbles:true})); wrap.classList.remove('open');}
  function enhance(sel){
    sel.multiple=true; sel.classList.add('rp-native');
    let wrap=sel.nextElementSibling&&sel.nextElementSibling.classList.contains('rp-multi')?sel.nextElementSibling:null;
    if(!wrap){wrap=document.createElement('div'); wrap.className='rp-multi'; sel.insertAdjacentElement('afterend',wrap);}
    const opts=Array.from(sel.options);
    wrap.innerHTML='<button type="button" class="rp-multi-button"></button><div class="rp-multi-menu"><div class="rp-search-line"><input type="search" placeholder="Texto contido..."><button type="button" data-act="contains">Selecionar</button></div><div class="rp-actions"><button type="button" data-act="all">Marcar todas</button><button type="button" data-act="clear">Limpar</button></div>'+opts.map(o=>'<label class="rp-option"><input type="checkbox" value="'+esc(o.value)+'" '+(o.selected?'checked':'')+'><span>'+esc(o.textContent)+'</span></label>').join('')+'</div>';
    const btn=wrap.querySelector('.rp-multi-button');
    btn.onclick=e=>{e.preventDefault();e.stopPropagation();$$('.rp-multi.open').forEach(w=>{if(w!==wrap)w.classList.remove('open')});wrap.classList.toggle('open');wrap.classList.remove('align-right');setTimeout(()=>{const m=wrap.querySelector('.rp-multi-menu');if(m&&m.getBoundingClientRect().right>innerWidth-16)wrap.classList.add('align-right')},0);};
    wrap.querySelector('.rp-multi-menu').onclick=e=>e.stopPropagation();
    wrap.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
      const act=b.dataset.act;
      if(act==='all'){wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=true); return;}
      if(act==='clear'){wrap.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=false); return;}
      if(act==='contains'){
        const q=norm(wrap.querySelector('input[type="search"]').value).trim();
        if(q){wrap.querySelectorAll('.rp-option').forEach(l=>{const cb=l.querySelector('input'); cb.checked=norm(l.textContent).includes(q);});}
        applyStaged(sel,wrap);
      }
    });
    wrap.querySelector('input[type="search"]').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();wrap.querySelector('[data-act="contains"]').click();}};
    updateMulti(sel);
  }
  function fill(id, vals){const sel=$(id); if(!sel)return; sel.multiple=true; sel.innerHTML=vals.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join(''); Array.from(sel.options).forEach(o=>{o.selected=false; o.defaultSelected=false;}); enhance(sel); updateMulti(sel); sel.onchange=render;}
  function filters(){return {ug:selected($('#rpUg')),acao:selected($('#rpAcao')),nat:selected($('#rpNatureza')),proj:selected($('#rpProjeto')),emp:selected($('#rpEmpresa')),ano:selected($('#rpAnoPO')),tipo:selected($('#rpTipoProcesso')),atrasada:selected($('#rpAtrasada'))};}
  function filtered(){const f=filters(); return records.filter(r=>(!f.ug.length||f.ug.includes(r.ug))&&(!f.acao.length||f.acao.includes(r.acao))&&(!f.nat.length||f.nat.includes(r.natureza))&&(!f.proj.length||f.proj.includes(r.projeto)||f.proj.includes(r.projetosReq))&&(!f.emp.length||f.emp.includes(r.empresa))&&(!f.ano.length||f.ano.includes(String(r.anoEmpenho)))&&(!f.tipo.length||f.tipo.includes(r.tipoProcesso||'Varejo'))&&(!f.atrasada.length||f.atrasada.includes('TODAS')||f.atrasada.includes(r.requisicaoAtrasada)));}
  function eventsFor(rs){const pos=new Set(rs.map(r=>r.po)); return events.filter(e=>pos.has(e.po));}
  function monthSeries(rs){const pos=new Set(rs.map(r=>r.po)); const byPo={}; events.forEach(e=>{if(pos.has(e.po))(byPo[e.po]||(byPo[e.po]=[])).push(e)}); const years=[2022,2023,2024,2025]; return years.map(y=>{const yr=rs.filter(r=>r.anoEmpenho===y); const vals=[]; for(let m=1;m<=12;m++){let total=0; yr.forEach(r=>{total+=Number(r.saldoAtualUsd||0); (byPo[r.po]||[]).forEach(e=>{if(Number(e.mes)>m) total+=Number(e.valor||0);});}); vals.push(Math.max(0,total));} return {ano:y, valores:vals};});}
  function drawLineChart(rs){const el=$('#rpChart'); if(!el)return; const colors=['#14236a','#0065a8','#7d8698','#f3c500']; const traces=monthSeries(rs).map((s,i)=>({type:'scatter',mode:'lines+markers',name:String(s.ano),x:months,y:s.valores,line:{width:3,color:colors[i]},marker:{size:7},hovertemplate:'Ano %{fullData.name}<br>%{x}: %{y:$,.2f}<extra></extra>'})); if(window.Plotly){Plotly.newPlot(el,traces,{margin:{l:90,r:30,t:30,b:70},yaxis:{title:'Saldo de empenho (US$)',rangemode:'tozero',automargin:true,tickformat:'$,.2s'},xaxis:{title:'Meses de 2026'},legend:{orientation:'h',x:0,y:1.12},hovermode:'x unified',paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});} else {el.innerHTML='<p>Biblioteca de gráfico não carregada.</p>';}}
  function groupBars(rs, key, target, title){
    const map=new Map();
    rs.forEach(r=>{const k=r[key]||'Não informado'; if(!map.has(k))map.set(k,{label:k,total:0,items:[]}); const g=map.get(k); g.total+=Number(r.saldoAtualUsd||0); g.items.push(r);});
    const arr=Array.from(map.values()).sort((a,b)=>b.total-a.total).slice(0,25).reverse();
    const y=arr.map(g=>g.label); const x=arr.map(g=>g.total); const text=arr.map(g=>g.items.slice().sort((a,b)=>b.saldoAtualUsd-a.saldoAtualUsd).slice(0,12).map(r=>`${r.po}: ${money(r.saldoAtualUsd)} - ${r.objetosResumo||'sem objeto resumido'}`).join('<br>'));
    const el=$(target); if(!el)return;
    if(window.Plotly){Plotly.newPlot(el,[{type:'bar',orientation:'h',x,y,text:x.map(money),textposition:'auto',marker:{color:'#14236a'},customdata:text,hovertemplate:'<b>%{y}</b><br>Total RP: %{x:$,.2f}<br><br>%{customdata}<extra></extra>'}],{title:{text:title,font:{size:16,color:'#111b63'}},margin:{l:220,r:25,t:50,b:45},xaxis:{title:'Saldo RP (US$)',automargin:true},yaxis:{automargin:true},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});}
    else el.innerHTML='<p>Biblioteca de gráfico não carregada.</p>';
  }
  function renderYearCards(rs){const el=$('#rpYearCards'); if(!el)return; const years=[2022,2023,2024,2025]; el.innerHTML=years.map(y=>{const v=rs.filter(r=>r.anoEmpenho===y).reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0); return '<article class="rp-kpi"><span>RP '+y+'</span><strong>'+money(v)+'</strong></article>';}).join('');}

  function renderTopLiquidacoes(rs){
    const tb=$('#rpTopNlTable tbody'); if(!tb)return;
    const pos=new Set(rs.map(r=>r.po));
    const base=((DATA.topLiquidacoesMesAnterior&&DATA.topLiquidacoesMesAnterior.items)||[]).filter(i=>pos.has(i.po));
    const sorted=base.slice().sort((a,b)=>Number(b.valorLiquidado||0)-Number(a.valorLiquidado||0)).slice(0,10);
    tb.innerHTML=sorted.map(i=>'<tr><td>'+esc(i.po)+'</td><td>'+esc(i.dataPO||'')+'</td><td>'+esc(i.empresa||'')+'</td><td>'+esc(i.descricaoRequisicao||i.requisicao||'')+'</td><td class="num">'+money(i.valorLiquidado)+'</td></tr>').join('')||'<tr><td colspan="5">Nenhuma liquidação do mês anterior encontrada para as ordens de compra filtradas.</td></tr>';
  }
  function renderTable(rs){const tb=$('#rpTable tbody'); if(!tb)return; const sorted=rs.slice().sort((a,b)=>{const ds=Number(b.saldoAtualUsd||0)-Number(a.saldoAtualUsd||0); if(Math.abs(ds)>0.005)return ds; return String(a.data).localeCompare(String(b.data));}); const html=sorted.map(r=>'<tr><td>'+esc(r.po)+'</td><td>'+esc(r.data)+'</td><td class="num">'+money(r.saldoAtualUsd)+'</td><td>'+esc(r.empresa)+'</td><td>'+esc(r.ug)+'</td><td>'+esc(r.acao)+'</td><td>'+esc(r.natureza)+'</td><td>'+esc(r.projetosReq||r.projeto)+'</td><td>'+esc(r.objetosResumo||'')+'</td><td>'+esc(r.requisicaoAtrasada)+'</td></tr>').join(''); tb.innerHTML=html||'<tr><td colspan="10">Nenhuma ordem de compra encontrada.</td></tr>';}
  function render(){const rs=filtered(); const ev=eventsFor(rs); renderYearCards(rs); $('#rpSaldo').textContent=money(rs.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0)); $('#rpCount').textContent=num(rs.length); $('#rpNl').textContent=money(ev.reduce((a,e)=>a+Number(e.valor||0),0)); $('#rpEmpresas').textContent=num(uniq(rs.map(r=>r.empresa)).length); drawLineChart(rs); groupBars(rs,'empresa','#rpEmpresaChart','RP por empresa contratada'); groupBars(rs,'ug','#rpUgChart','RP por OM requisitante'); renderTopLiquidacoes(rs); renderTable(rs);}
  function report(){const rows=$('#rpTable tbody')?.innerHTML||''; const nlRows=$('#rpTopNlTable tbody')?.innerHTML||''; const w=window.open('','_blank'); w.document.write('<html><head><title>Relatório RP</title><style>body{font-family:Arial;padding:24px;color:#111b63}table{width:100%;border-collapse:collapse;font-size:10px}td,th{border:1px solid #ddd;padding:5px;vertical-align:top}th{background:#111b63;color:white}.num{text-align:right}.kpi{display:inline-block;border:1px solid #dbe3f2;border-radius:12px;padding:12px;margin:6px}</style></head><body><h1>Relatório - Restos a Pagar</h1><div class="kpi"><b>Saldo filtrado</b><br>'+$('#rpSaldo').textContent+'</div><div class="kpi"><b>Ordens de compra</b><br>'+$('#rpCount').textContent+'</div><div class="kpi"><b>Liquidações 2026</b><br>'+$('#rpNl').textContent+'</div><div class="kpi"><b>Empresas</b><br>'+$('#rpEmpresas').textContent+'</div><h2>Principais liquidações do mês anterior em RP</h2><table><thead><tr><th>PO</th><th>Data da PO</th><th>Empresa</th><th>Descrição da requisição liquidada</th><th>Valor liquidado</th></tr></thead><tbody>'+nlRows+'</tbody></table><h2>Ordens de compra filtradas</h2><table><thead><tr><th>PO</th><th>Data</th><th>Saldo RP</th><th>Empresa</th><th>OM</th><th>Ação</th><th>ND</th><th>Projetos</th><th>Objeto resumido</th><th>Atrasada</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>'); w.document.close(); setTimeout(()=>w.print(),500);}
  document.addEventListener('click',e=>{if(!e.target.closest('.rp-multi'))$$('.rp-multi.open').forEach(w=>w.classList.remove('open'))});
  document.addEventListener('DOMContentLoaded',()=>{fill('#rpUg',uniq(records.map(r=>r.ug))); fill('#rpAcao',uniq(records.map(r=>r.acao))); fill('#rpNatureza',uniq(records.map(r=>r.natureza))); fill('#rpProjeto',uniq(records.flatMap(r=>String(r.projetosReq||r.projeto).split(',').map(s=>s.trim())))); fill('#rpEmpresa',uniq(records.map(r=>r.empresa))); fill('#rpAnoPO',['2022','2023','2024','2025']); fill('#rpTipoProcesso',['Contratos','Varejo']); fill('#rpAtrasada',['SIM','NÃO']); $('#rpClear').onclick=()=>{$$('#rpUg,#rpAcao,#rpNatureza,#rpProjeto,#rpEmpresa,#rpAnoPO,#rpTipoProcesso,#rpAtrasada').forEach(s=>Array.from(s.options).forEach(o=>o.selected=false)); $$('#rpUg,#rpAcao,#rpNatureza,#rpProjeto,#rpEmpresa,#rpAnoPO,#rpTipoProcesso,#rpAtrasada').forEach(updateMulti); render();}; $('#rpReport').onclick=report; render();});
})();