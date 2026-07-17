(function(){
  const DATA=window.CABW_RP_DATA||{records:[],nlEvents:[],summary:{}};
  const records=(DATA.records||[]).filter(r=>Number(r.saldoAtualUsd||0)>=-0.004);
  const events=DATA.nlEvents||[];
  const CY=(DATA.summary&&DATA.summary.currentYear)||2026;
  const months=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>'US$ '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const num=v=>Number(v||0).toLocaleString('pt-BR');
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function rpTipWrap(s,max=76){const words=String(s||'').replace(/\s+/g,' ').trim().split(' '); const lines=[]; let line=''; words.forEach(w=>{if((line+' '+w).trim().length>max&&line){lines.push(line); line=w;} else line=(line+' '+w).trim();}); if(line)lines.push(line); return esc(lines.join('\n')).replace(/\n/g,'<br>');}
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
  function evolutionFiltered(){
    const f=filters();
    const items=((DATA.rpEvolution&&DATA.rpEvolution.items)||[]).filter(r=>Number(r.saldoAtualUsd||0)>=-0.004);
    const splitVals=v=>String(v||'').split(/[,;]/).map(s=>s.trim()).filter(Boolean);
    return items.filter(r=>
      (!f.ug.length||f.ug.includes(r.ug))&&
      (!f.acao.length||f.acao.includes(String(r.acao||'')))&&
      (!f.nat.length||f.nat.includes(String(r.natureza||'')))&&
      (!f.proj.length||splitVals(r.projeto).some(p=>f.proj.includes(p)))&&
      (!f.emp.length||f.emp.includes(r.empresa))&&
      (!f.ano.length||f.ano.includes(String(r.anoEmpenho)))&&
      (!f.tipo.length||f.tipo.includes(r.tipoProcesso||'Varejo'))&&
      (!f.atrasada.length||f.atrasada.includes('TODAS')||f.atrasada.includes(r.requisicaoAtrasada||'NÃO'))
    );
  }
  function monthSeries(rs){
    const evo=(DATA.rpEvolution&&DATA.rpEvolution.items&&DATA.rpEvolution.items.length)?evolutionFiltered():null;
    if(!evo){const pos=new Set(rs.map(r=>r.po)); const byPo={}; events.forEach(e=>{if(pos.has(e.po))(byPo[e.po]||(byPo[e.po]=[])).push(e)}); const years=[2022,2023,2024,2025]; return {x:months,series:years.map(y=>{const yr=rs.filter(r=>r.anoEmpenho===y); const vals=[]; for(let m=1;m<=12;m++){let total=0; yr.forEach(r=>{total+=Number(r.saldoAtualUsd||0); (byPo[r.po]||[]).forEach(e=>{if(Number(e.mes)>m) total+=Number(e.valor||0);});}); vals.push(Math.max(0,total));} return {ano:y,valores:vals};})};}
    const maxMonth=Math.max(1,Math.min(12,Number(DATA.rpEvolution.maxMonth||new Date().getMonth()+1)));
    const x=['Início Jan'].concat(months.slice(0,maxMonth));
    const years=[2022,2023,2024,2025];
    const series=years.map(y=>{
      const yr=evo.filter(r=>Number(r.anoEmpenho)===y);
      const liqByMonth=Array.from({length:12},(_,i)=>yr.reduce((a,r)=>a+Number((r.liquidacoes2026||[])[i]||0),0));
      const current=yr.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0);
      let saldo=current+liqByMonth.slice(0,maxMonth).reduce((a,v)=>a+v,0);
      const vals=[Math.max(0,saldo)];
      for(let m=0;m<maxMonth;m++){saldo-=liqByMonth[m]; vals.push(Math.max(0,saldo));}
      return {ano:y,valores:vals};
    });
    return {x,series};
  }
  function drawLineChart(rs){
    const el=$('#rpChart'); if(!el)return;
    const colors=['#14236a','#0065a8','#7d8698','#f3c500'];
    const ms=monthSeries(rs);
    const traces=ms.series.map((s,i)=>({type:'scatter',mode:'lines+markers',name:String(s.ano),x:ms.x,y:s.valores,line:{width:3,color:colors[i]},marker:{size:7},connectgaps:false,hovertemplate:'PO %{fullData.name}<br>%{x}: %{y:$,.2f}<extra></extra>'}));
    if(window.Plotly){
      Plotly.newPlot(el,traces,{margin:{l:90,r:30,t:30,b:70},yaxis:{title:'Saldo de RP (US$)',rangemode:'tozero',autorange:true,automargin:true,tickformat:'$,.2s'},xaxis:{title:'Evolução em 2026',automargin:true},legend:{orientation:'h',x:0,y:1.12},hovermode:'x unified',paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});
      if(el.on){['plotly_legendclick','plotly_legenddoubleclick'].forEach(evt=>el.on(evt,()=>setTimeout(()=>Plotly.relayout(el,{'yaxis.autorange':true}),80)));}
    } else {el.innerHTML='<p>Biblioteca de gráfico não carregada.</p>';}
  }
  function wrapHoverText(s, maxLen){
    const words=String(s||'').replace(/\s+/g,' ').trim().split(' ');
    const lines=[]; let line='';
    words.forEach(w=>{ if((line+' '+w).trim().length>maxLen){ if(line)lines.push(line); line=w; } else { line=(line+' '+w).trim(); } });
    if(line)lines.push(line);
    return esc(lines.join('\n')).replace(/\n/g,'<br>');
  }
  function rpTooltipItem(r){
    const obj=wrapHoverText(r.objetosResumo||'sem objeto resumido',72);
    const emp=wrapHoverText(r.empresa||'',64);
    return '<b>PO '+esc(r.po)+'</b> — '+money(r.saldoAtualUsd)+'<br><b>Empresa:</b> '+emp+'<br><b>Objeto:</b> '+obj;
  }
  function wrapTextHtml(value, maxLen=68){
    const words=String(value||'').split(/\s+/); let lines=[], line='';
    words.forEach(w=>{ if((line+' '+w).trim().length>maxLen){ if(line)lines.push(line); line=w; } else line=(line+' '+w).trim(); });
    if(line)lines.push(line); return esc(lines.join('\n')).replace(/\n/g,'<br>');
  }
  function rpTooltipHtml(group, total, items){
    const rows=items.slice().sort((a,b)=>Number(b.saldoAtualUsd||0)-Number(a.saldoAtualUsd||0)).slice(0,10).map(r=>
      '<div class="rp-tip-item"><b>PO:</b> '+esc(r.po)+' &nbsp; <b>Saldo:</b> '+money(r.saldoAtualUsd)+'<br><b>Empresa:</b> '+wrapTextHtml(r.empresa,72)+'<br><b>Objeto:</b> '+wrapTextHtml(r.objetosResumo||'sem objeto resumido',86)+'</div>'
    ).join('');
    const more=items.length>10?'<div class="rp-tip-more">+'+(items.length-10)+' PO(s) adicionais no grupo.</div>':'';
    return '<div class="rp-readable-tip"><h3>'+wrapTextHtml(group,78)+'</h3><div><b>Total RP:</b> '+money(total)+'</div>'+rows+more+'</div>';
  }
  function ensureRpTooltip(){
    let t=document.getElementById('rpReadableTooltip');
    if(!t){t=document.createElement('div'); t.id='rpReadableTooltip'; t.style.cssText='position:fixed;display:none;z-index:99999;max-width:min(760px,calc(100vw - 32px));max-height:min(70vh,620px);overflow:auto;background:#fff;border:1px solid #cbd6ea;border-radius:14px;box-shadow:0 22px 48px rgba(2,27,70,.28);padding:14px 16px;color:#111b63;font:12px/1.35 Arial,Helvetica,sans-serif;pointer-events:none;white-space:normal;text-align:left;'; document.body.appendChild(t);}
    return t;
  }
  function showRpTooltip(html, ev){
    const t=ensureRpTooltip(); t.innerHTML=html; t.style.display='block';
    const x=(ev&&ev.clientX?ev.clientX:window.innerWidth/2)+16; const y=(ev&&ev.clientY?ev.clientY:window.innerHeight/2)+16;
    t.style.left=Math.max(8,Math.min(x, window.innerWidth-t.offsetWidth-16))+'px'; t.style.top=Math.max(8,Math.min(y, window.innerHeight-t.offsetHeight-16))+'px';
  }
  function hideRpTooltip(){const t=document.getElementById('rpReadableTooltip'); if(t)t.style.display='none';}
  function groupBars(rs, key, target, title){
    const map=new Map();
    rs.forEach(r=>{const k=r[key]||'Não informado'; if(!map.has(k))map.set(k,{label:k,total:0,items:[]}); const g=map.get(k); g.total+=Number(r.saldoAtualUsd||0); g.items.push(r);});
    const arr=Array.from(map.values()).sort((a,b)=>b.total-a.total).slice(0,25).reverse();
    const y=arr.map(g=>g.label); const x=arr.map(g=>g.total);
    const details=arr.map(g=>g.items.slice().sort((a,b)=>Number(b.saldoAtualUsd||0)-Number(a.saldoAtualUsd||0)).slice(0,14).map(r=>{
      const empresa=rpTipWrap(r.empresa||'',72); const objeto=rpTipWrap(r.objetosResumo||'sem objeto resumido',72);
      return '<b>PO '+esc(r.po)+'</b> · '+money(r.saldoAtualUsd)+'<br>Empresa: '+empresa+'<br>Objeto: '+objeto;
    }).join('<br><br>'));
    const el=$(target); if(!el)return;
    if(window.Plotly){Plotly.newPlot(el,[{type:'bar',orientation:'h',x,y,text:x.map(money),textposition:'auto',marker:{color:'#14236a'},customdata:details,hoverlabel:{align:'left',bgcolor:'#fff',bordercolor:'#14236a',font:{size:13,color:'#111b63'},namelength:-1},hovertemplate:'<b>%{y}</b><br>Total RP: %{x:$,.2f}<br><br>%{customdata}<extra></extra>'}],{title:{text:title,font:{size:16,color:'#111b63'}},margin:{l:260,r:40,t:50,b:45},xaxis:{title:'Saldo RP (US$)',automargin:true},yaxis:{automargin:true},hovermode:'closest',paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});}
    else el.innerHTML='<p>Biblioteca de gráfico não carregada.</p>';
  }

  function drawProjectionChart(rs){
    const el=$('#rpProjectionChart'); if(!el)return;
    const evo=(DATA.rpEvolution&&DATA.rpEvolution.items&&DATA.rpEvolution.items.length)?evolutionFiltered():[];
    const maxMonth=Math.max(1,Math.min(12,Number(DATA.rpEvolution&&DATA.rpEvolution.maxMonth||new Date().getMonth()+1)));
    const xFull=['Início Jan'].concat(months);
    const liqByMonth=Array.from({length:12},(_,i)=>evo.reduce((a,r)=>a+Number((r.liquidacoes2026||[])[i]||0),0));
    const dpeByMonth=Array.from({length:12},(_,i)=>evo.reduce((a,r)=>a+Number((r.projecaoDpe2026||[])[i]||0),0));
    const current=evo.length?evo.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0):rs.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0);
    const initial=current+liqByMonth.reduce((a,v)=>a+v,0);
    let actual=initial; const xActual=['Início Jan']; const yActual=[Math.max(0,actual)];
    for(let m=0;m<maxMonth;m++){actual-=liqByMonth[m]; xActual.push(months[m]); yActual.push(Math.max(0,actual));}
    const linearTarget=initial*0.20; const yLinear=[]; for(let m=0;m<=12;m++){yLinear.push(Math.max(0,initial-(initial-linearTarget)*(m/12)));}
    let dpe=initial; const yDpe=[Math.max(0,dpe)]; for(let m=0;m<12;m++){dpe-=dpeByMonth[m]; yDpe.push(Math.max(0,dpe));}
    const traces=[
      {type:'scatter',mode:'lines+markers',name:'RP total apurado',x:xActual,y:yActual,line:{width:4,color:'#003b7a'},marker:{size:7,color:'#003b7a'},hovertemplate:'%{x}<br>RP apurado: %{y:$,.2f}<extra></extra>'},
      {type:'scatter',mode:'lines',name:'Projeção linear',x:xFull,y:yLinear,line:{width:3,color:'#c9d1d9',dash:'dash'},hovertemplate:'%{x}<br>Projeção linear: %{y:$,.2f}<extra></extra>'},
      {type:'scatter',mode:'lines+markers',name:'Projeção por prazo de entrega',x:xFull,y:yDpe,line:{width:3,color:'#f3c500'},marker:{size:6,color:'#f3c500'},hovertemplate:'%{x}<br>Projeção por DPE: %{y:$,.2f}<extra></extra>'}
    ];
    if(window.Plotly){Plotly.newPlot(el,traces,{margin:{l:90,r:35,t:30,b:70},yaxis:{title:'Saldo de RP (US$)',rangemode:'tozero',autorange:true,automargin:true,tickformat:'$,.2s'},xaxis:{title:'2026',automargin:true},legend:{orientation:'h',x:0,y:1.16},hovermode:'x unified',paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'#fff'}, {displayModeBar:false,responsive:true});}
    else el.innerHTML='<p>Biblioteca de gráfico não carregada.</p>';
  }


  function compactMoney(v){
    const n=Number(v||0);
    if(Math.abs(n)>=1000000) return 'US$ '+(n/1000000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' mi';
    if(Math.abs(n)>=1000) return 'US$ '+(n/1000).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+' mil';
    return money(n);
  }
  function pctLiquidado(liq, inicial){
    const base=Number(inicial||0);
    if(!base) return '0,0%';
    return (Number(liq||0)/base*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
  }
  function rpCardStats(rs){
    const years=[2022,2023,2024,2025];
    const out={};
    years.forEach(y=>out[y]={atual:0,liquidado:0,inscrito:0});
    const evo=(DATA.rpEvolution&&DATA.rpEvolution.items&&DATA.rpEvolution.items.length)?evolutionFiltered():null;
    if(evo){
      years.forEach(y=>{
        const yr=evo.filter(r=>Number(r.anoEmpenho)===y);
        const atual=yr.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0);
        const liquidado=yr.reduce((a,r)=>a+(r.liquidacoes2026||[]).reduce((b,v)=>b+Number(v||0),0),0);
        out[y]={atual,liquidado,inscrito:atual+liquidado};
      });
    } else {
      const ev=eventsFor(rs);
      const liqByPo=new Map();
      ev.forEach(e=>liqByPo.set(e.po,(liqByPo.get(e.po)||0)+Number(e.valor||0)));
      years.forEach(y=>{
        const yr=rs.filter(r=>Number(r.anoEmpenho)===y);
        const atual=yr.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0);
        const liquidado=yr.reduce((a,r)=>a+Number(liqByPo.get(r.po)||0),0);
        out[y]={atual,liquidado,inscrito:atual+liquidado};
      });
    }
    out.geral=years.reduce((acc,y)=>({
      atual:acc.atual+out[y].atual,
      liquidado:acc.liquidado+out[y].liquidado,
      inscrito:acc.inscrito+out[y].inscrito
    }),{atual:0,liquidado:0,inscrito:0});
    return out;
  }

  function renderYearCards(rs){
    const el=$('#rpYearCards'); if(!el)return;
    const stats=rpCardStats(rs);
    const card=(titulo,st)=>'<article class="rp-kpi rp-year-kpi"><span>'+esc(titulo)+'</span><strong>'+money(st.atual)+'</strong><small>RP total inscrito: <b>'+compactMoney(st.inscrito)+'</b></small><small>% liquidado: <b>'+pctLiquidado(st.liquidado,st.inscrito)+'</b></small></article>';
    el.innerHTML=card('RP geral',stats.geral)+[2022,2023,2024,2025].map(y=>card('RP '+y,stats[y])).join('');
  }

  function renderTopLiquidacoes(rs){
    const tb=$('#rpTopNlTable tbody'); if(!tb)return;
    const pos=new Set(rs.map(r=>r.po));
    const base=((DATA.topLiquidacoesMesAnterior&&DATA.topLiquidacoesMesAnterior.items)||[]).filter(i=>pos.has(i.po));
    const sorted=base.slice().sort((a,b)=>Number(b.valorLiquidado||0)-Number(a.valorLiquidado||0)).slice(0,10);
    tb.innerHTML=sorted.map(i=>'<tr><td>'+esc(i.po)+'</td><td>'+esc(i.dataPO||'')+'</td><td>'+esc(i.empresa||'')+'</td><td>'+esc(i.descricaoRequisicao||i.requisicao||'')+'</td><td class="num">'+money(i.valorLiquidado)+'</td></tr>').join('')||'<tr><td colspan="5">Nenhuma liquidação do mês anterior encontrada para as ordens de compra filtradas.</td></tr>';
  }
  function renderTable(rs){const tb=$('#rpTable tbody'); if(!tb)return; const current=rs.filter(r=>Number(r.saldoAtualUsd||0)>0.004); const sorted=current.slice().sort((a,b)=>{const ds=Number(b.saldoAtualUsd||0)-Number(a.saldoAtualUsd||0); if(Math.abs(ds)>0.005)return ds; return String(a.data).localeCompare(String(b.data));}); const html=sorted.map(r=>'<tr><td>'+esc(r.po)+'</td><td>'+esc(r.data)+'</td><td class="num">'+money(r.saldoAtualUsd)+'</td><td>'+esc(r.empresa)+'</td><td>'+esc(r.ug)+'</td><td>'+esc(r.acao)+'</td><td>'+esc(r.natureza)+'</td><td>'+esc(r.projetosReq||r.projeto)+'</td><td>'+esc(r.objetosResumo||'')+'</td><td>'+esc(r.requisicaoAtrasada)+'</td></tr>').join(''); tb.innerHTML=html||'<tr><td colspan="10">Nenhuma ordem de compra com saldo positivo encontrada.</td></tr>';}
  function render(){const rs=filtered(); const currentRs=rs.filter(r=>Number(r.saldoAtualUsd||0)>0.004); const ev=eventsFor(rs); const evo=evolutionFiltered(); const liqTotal=evo.length?evo.reduce((a,r)=>a+(r.liquidacoes2026||[]).reduce((b,v)=>b+Number(v||0),0),0):ev.reduce((a,e)=>a+Number(e.valor||0),0); renderYearCards(rs); $('#rpSaldo').textContent=money(currentRs.reduce((a,r)=>a+Number(r.saldoAtualUsd||0),0)); $('#rpCount').textContent=num(currentRs.length); $('#rpNl').textContent=money(liqTotal); $('#rpEmpresas').textContent=num(uniq(currentRs.map(r=>r.empresa)).length); drawLineChart(rs); drawProjectionChart(rs); groupBars(currentRs,'empresa','#rpEmpresaChart','RP por empresa contratada'); groupBars(currentRs,'ug','#rpUgChart','RP por OM requisitante'); renderTopLiquidacoes(rs); renderTable(rs);}
  function report(){const rows=$('#rpTable tbody')?.innerHTML||''; const nlRows=$('#rpTopNlTable tbody')?.innerHTML||''; const w=window.open('','_blank'); w.document.write('<html><head><title>Relatório RP</title><style>body{font-family:Arial;padding:24px;color:#111b63}table{width:100%;border-collapse:collapse;font-size:10px}td,th{border:1px solid #ddd;padding:5px;vertical-align:top}th{background:#111b63;color:white}.num{text-align:right}.kpi{display:inline-block;border:1px solid #dbe3f2;border-radius:12px;padding:12px;margin:6px}</style></head><body><h1>Relatório - Restos a Pagar</h1><div class="kpi"><b>Saldo filtrado</b><br>'+$('#rpSaldo').textContent+'</div><div class="kpi"><b>Ordens de compra</b><br>'+$('#rpCount').textContent+'</div><div class="kpi"><b>Liquidações 2026</b><br>'+$('#rpNl').textContent+'</div><div class="kpi"><b>Empresas</b><br>'+$('#rpEmpresas').textContent+'</div><h2>Principais liquidações do mês anterior em RP</h2><table><thead><tr><th>PO</th><th>Data da PO</th><th>Empresa</th><th>Descrição da requisição liquidada</th><th>Valor liquidado</th></tr></thead><tbody>'+nlRows+'</tbody></table><h2>Ordens de compra filtradas</h2><table><thead><tr><th>PO</th><th>Data</th><th>Saldo RP</th><th>Empresa</th><th>OM</th><th>Ação</th><th>ND</th><th>Projetos</th><th>Objeto resumido</th><th>Atrasada</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>'); w.document.close(); setTimeout(()=>w.print(),500);}
  document.addEventListener('click',e=>{if(!e.target.closest('.rp-multi'))$$('.rp-multi.open').forEach(w=>w.classList.remove('open'))});
  document.addEventListener('DOMContentLoaded',()=>{fill('#rpUg',uniq(records.map(r=>r.ug))); fill('#rpAcao',uniq(records.map(r=>r.acao))); fill('#rpNatureza',uniq(records.map(r=>r.natureza))); fill('#rpProjeto',uniq(records.flatMap(r=>String(r.projetosReq||r.projeto).split(',').map(s=>s.trim())))); fill('#rpEmpresa',uniq(records.map(r=>r.empresa))); fill('#rpAnoPO',['2022','2023','2024','2025']); fill('#rpTipoProcesso',['Contratos','Varejo']); fill('#rpAtrasada',['SIM','NÃO']); $('#rpClear').onclick=()=>{$$('#rpUg,#rpAcao,#rpNatureza,#rpProjeto,#rpEmpresa,#rpAnoPO,#rpTipoProcesso,#rpAtrasada').forEach(s=>Array.from(s.options).forEach(o=>o.selected=false)); $$('#rpUg,#rpAcao,#rpNatureza,#rpProjeto,#rpEmpresa,#rpAnoPO,#rpTipoProcesso,#rpAtrasada').forEach(updateMulti); render();}; $('#rpReport').onclick=report; render();});
})();