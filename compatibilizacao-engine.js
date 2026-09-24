(function(root){
'use strict';

const STATUS_ORDER=['M-','G-','C-','P-','I-'];
const STATUS_COLORS={
  'M-':'#2e9d57',
  'G-':'#f0bd00',
  'C-':'#f28e2b',
  'P-':'#4e9fda',
  'I-':'#8d99a8'
};

function str(value){return String(value==null?'':value).trim();}
function number(value){const n=Number(value);return Number.isFinite(n)?n:0;}
function unique(values){return Array.from(new Set((values||[]).map(str).filter(Boolean)));}
function statusPrefix(status){
  const value=str(status).toUpperCase();
  return STATUS_ORDER.find(prefix=>value.startsWith(prefix))||value.slice(0,2);
}
function priorityRank(value){
  const code=parseInt(str(value),10);
  return code>=1&&code<=5?code:9;
}
function containsAny(rowValues,selected){
  if(!selected||!selected.length)return true;
  const values=new Set((rowValues||[]).map(str));
  return selected.some(value=>values.has(str(value)));
}
function equalsAny(value,selected){return !selected||!selected.length||selected.map(str).includes(str(value));}
function textMatches(row,terms){
  if(!terms||!terms.length)return true;
  const haystack=(str(row.nomenclatura)+' '+str(row.descricao)).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return terms.some(term=>haystack.includes(str(term).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));
}
function dateOnly(value){
  const match=str(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match?Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])):NaN;
}
function mapValidity(row,referenceDate){
  if(statusPrefix(row&&row.status)!=='M-')return '';
  const opened=dateOnly(row&&row.dataAbertura),reference=dateOnly(referenceDate);
  if(!Number.isFinite(opened)||!Number.isFinite(reference))return '';
  return Math.floor((reference-opened)/86400000)<=60?'valido':'vencido';
}

function filterCredits(credits,filters){
  const f=filters||{};
  return (credits||[]).reduce((result,row)=>{
    if(!equalsAny(row.acao,f.acao)||!equalsAny(row.planoInterno,f.planoInterno)||!equalsAny(row.natureza,f.natureza)||!equalsAny(row.fonte,f.fonte)||!equalsAny(row.objetivo,f.objetivo)||!containsAny(row.projetos,f.projeto))return result;
    const originalOms=unique(row.omCodigos);const selectedOms=f.om&&f.om.length?originalOms.filter(om=>f.om.map(str).includes(om)):originalOms.slice();
    if(!selectedOms.length)return result;
    const ratio=originalOms.length?selectedOms.length/originalOms.length:0;
    result.push({...row,omCodigos:selectedOms,saldo:number(row.saldo)*ratio});
    return result;
  },[]);
}

function filterRequisitions(rows,filters){
  const f=filters||{};
  return (rows||[]).filter(row=>(
    equalsAny(row.omCodigo,f.om)&&
    equalsAny(row.projeto,f.projeto)&&
    equalsAny(row.natureza,f.natureza)&&
    equalsAny(row.prioridade,f.prioridade)&&
    equalsAny(row.status,f.situacao)&&
    equalsAny(mapValidity(row,f.dataReferencia),f.validadeMapa)&&
    equalsAny(str(row.dataAbertura).slice(0,4),f.anoCertame)&&
    textMatches(row,f.termos)
  ));
}

function buildPools(credits){
  const pools=[];
  (credits||[]).forEach(credit=>{
    const balance=Math.max(0,number(credit.saldo));
    const oms=unique(credit.omCodigos);
    if(!balance||!oms.length)return;
    const share=balance/oms.length;
    oms.forEach((om,index)=>pools.push({
      id:str(credit.digito)+'#'+om,
      digito:str(credit.digito),
      om,
      natureza:str(credit.natureza),
      projetos:unique(credit.projetos),
      acao:str(credit.acao),
      planoInterno:str(credit.planoInterno),
      fonte:str(credit.fonte),
      objetivo:str(credit.objetivo),
      original:index===oms.length-1?balance-share*(oms.length-1):share,
      remaining:index===oms.length-1?balance-share*(oms.length-1):share
    }));
  });
  return pools;
}

function poolMatchesBase(pool,req){return pool.om===str(req.omCodigo)&&pool.natureza===str(req.natureza);}
function poolMatchesProject(pool,req){return pool.projetos.includes(str(req.projeto));}
function targetMappings(catalog,req){
  return (catalog||[]).filter(credit=>(
    containsAny(credit.omCodigos,[req.omCodigo])&&
    str(credit.natureza)===str(req.natureza)&&
    containsAny(credit.projetos,[req.projeto])
  )).map(credit=>({acao:str(credit.acao),pi:str(credit.planoInterno)})).filter(item=>item.acao);
}
function candidateGroup(candidates,amount,keyFn){
  const groups=new Map();
  candidates.forEach(pool=>{const key=keyFn(pool);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(pool);});
  return Array.from(groups.values()).map(pools=>({pools,total:pools.reduce((sum,pool)=>sum+pool.remaining,0)})).filter(group=>group.total+0.005>=amount).sort((a,b)=>a.total-b.total)[0]?.pools||[];
}
function takeFromPools(candidates,amount){
  let left=amount;const sources=[];
  candidates.slice().sort((a,b)=>a.remaining-b.remaining).forEach(pool=>{
    if(left<=0)return;
    const used=Math.min(left,pool.remaining);
    if(used<=0)return;
    pool.remaining-=used;left-=used;
    sources.push({
      digito:pool.digito,valor:used,acao:pool.acao,planoInterno:pool.planoInterno,
      natureza:pool.natureza,projetos:pool.projetos.slice(),fonte:pool.fonte,objetivo:pool.objetivo
    });
  });
  return {left,sources};
}

function destinationCredits(catalog,req,source,stage){
  return (catalog||[]).filter(credit=>{
    if(!containsAny(credit.omCodigos,[req.omCodigo])||str(credit.natureza)!==str(req.natureza)||!containsAny(credit.projetos,[req.projeto]))return false;
    if(str(credit.acao)!==str(source.acao))return false;
    return !str(stage).startsWith('projeto')||str(credit.planoInterno)===str(source.planoInterno);
  }).sort((a,b)=>str(a.digito).localeCompare(str(b.digito)));
}

function planTransfers(catalog,req,sources,stage){
  return (sources||[]).map(source=>{
    const destinations=destinationCredits(catalog,req,source,stage);
    return {
      origemDigito:str(source.digito),
      destinoDigitos:unique(destinations.map(credit=>credit.digito)),
      valor:number(source.valor),
      natureza:str(req.natureza),
      origemAcao:str(source.acao),
      origemPi:str(source.planoInterno),
      origemProjetos:unique(source.projetos),
      destinoPis:unique(destinations.map(credit=>credit.planoInterno)),
      destinoProjeto:str(req.projeto)
    };
  });
}

function allocateMapApproved(credits,requests,catalog,referenceDate){
  const pools=buildPools(credits);
  const approved=(requests||[]).filter(row=>statusPrefix(row.status)==='M-').slice().sort((a,b)=>(
    priorityRank(a.prioridade)-priorityRank(b.prioridade)||
    number(a.valorUsd)-number(b.valorUsd)||
    str(a.dataAbertura).localeCompare(str(b.dataAbertura))||
    str(a.requisicao).localeCompare(str(b.requisicao))
  ));
  const plans=[];
  function allocateStage(rows,key,label,eligible,candidatesFor){
    const pending=[];
    rows.forEach(req=>{
      if(!eligible(req)){pending.push(req);return;}
      const value=Math.max(0,number(req.valorUsd));
      if(!value)return;
      const candidates=candidatesFor(req,value);
      if(candidates.reduce((sum,pool)=>sum+pool.remaining,0)+0.005<value){pending.push(req);return;}
      const result=takeFromPools(candidates,value);
      if(result.left>0.005){throw new Error('Falha de alocação: saldo elegível insuficiente após validação.');}
      const sourceActions=new Set(result.sources.map(source=>source.acao));
      const destinationPi=unique((catalog||[]).filter(credit=>(
        containsAny(credit.omCodigos,[req.omCodigo])&&str(credit.natureza)===str(req.natureza)&&containsAny(credit.projetos,[req.projeto])
        &&sourceActions.has(str(credit.acao))
      )).map(credit=>credit.planoInterno)).join(', ')||'Definir PI de destino';
      const transfers=planTransfers(catalog,req,result.sources,key);
      plans.push({
        stage:key,stageLabel:label,requisicao:req.requisicao,omCodigo:req.omCodigo,om:req.om,
        natureza:req.natureza,projeto:req.projeto,projetoLabel:req.projetoLabel,prioridade:req.prioridade,
        status:req.status,valorUsd:value,destinoPi:destinationPi,descricao:req.descricao||req.nomenclatura,
        dataAbertura:req.dataAbertura,validadeMapa:mapValidity(req,referenceDate),sources:result.sources,transfers,
        origemDigitos:unique(transfers.map(item=>item.origemDigito)),
        destinoDigitos:unique(transfers.flatMap(item=>item.destinoDigitos))
      });
    });
    return pending;
  }
  function baseAndMappings(req){
    const base=pools.filter(pool=>pool.remaining>0&&poolMatchesBase(pool,req));
    const mappings=targetMappings(catalog,req);
    return {base,targetActions:new Set(mappings.map(item=>item.acao)),targetPairs:new Set(mappings.map(item=>item.acao+'|'+item.pi))};
  }
  let remaining=approved.slice();
  remaining=allocateStage(remaining,'imediato','Empenho imediato',req=>mapValidity(req,referenceDate)==='valido',(req,value)=>{
    const {base}=baseAndMappings(req);return candidateGroup(base.filter(pool=>poolMatchesProject(pool,req)),value,pool=>pool.acao||'N/I');
  });
  remaining=allocateStage(remaining,'projeto','Empenho possível com eventual ajuste de projeto',req=>mapValidity(req,referenceDate)==='valido',(req,value)=>{
    const {base,targetPairs}=baseAndMappings(req);return candidateGroup(base.filter(pool=>targetPairs.has(pool.acao+'|'+pool.planoInterno)),value,pool=>(pool.acao||'N/I')+'|'+(pool.planoInterno||'N/I'));
  });
  remaining=allocateStage(remaining,'pi','Empenho possível com eventual ajuste de PI e/ou projeto',req=>mapValidity(req,referenceDate)==='valido',(req,value)=>{
    const {base,targetActions}=baseAndMappings(req);return candidateGroup(base.filter(pool=>targetActions.has(pool.acao)),value,pool=>pool.acao||'N/I');
  });
  remaining=allocateStage(remaining,'revalidacao','Cenário condicionado à revalidação do mapa',req=>mapValidity(req,referenceDate)==='vencido',(req,value)=>{
    const {base}=baseAndMappings(req);return candidateGroup(base.filter(pool=>poolMatchesProject(pool,req)),value,pool=>pool.acao||'N/I');
  });
  remaining=allocateStage(remaining,'projeto_vencido','Cenário de mapa vencido com ajuste de projeto',req=>mapValidity(req,referenceDate)==='vencido',(req,value)=>{
    const {base,targetPairs}=baseAndMappings(req);return candidateGroup(base.filter(pool=>targetPairs.has(pool.acao+'|'+pool.planoInterno)),value,pool=>(pool.acao||'N/I')+'|'+(pool.planoInterno||'N/I'));
  });
  remaining=allocateStage(remaining,'pi_vencido','Cenário de mapa vencido com ajuste de PI e/ou projeto',req=>mapValidity(req,referenceDate)==='vencido',(req,value)=>{
    const {base,targetActions}=baseAndMappings(req);return candidateGroup(base.filter(pool=>targetActions.has(pool.acao)),value,pool=>pool.acao||'N/I');
  });
  const uncovered=remaining.map(req=>({...req,creditoEstrutural:pools.filter(pool=>pool.remaining>0&&poolMatchesBase(pool,req)).reduce((sum,pool)=>sum+pool.remaining,0)}));
  /* Cada requisição aparece em, no máximo, uma etapa; o saldo dos dígitos é consumido entre as etapas. */
  approved.forEach(req=>{
    if(plans.some(plan=>plan.requisicao===req.requisicao)||uncovered.some(row=>row.requisicao===req.requisicao))return;
    const value=Math.max(0,number(req.valorUsd));
    if(!value)return;
    uncovered.push({...req,creditoEstrutural:0});
  });
  const financeablePlans=plans.filter(row=>row.validadeMapa==='valido');
  const potential=financeablePlans.reduce((sum,row)=>sum+number(row.valorUsd),0);
  const totalCredit=pools.reduce((sum,pool)=>sum+pool.original,0);
  return {
    pools,plans,uncovered,
    summary:{
      creditoDisponivel:totalCredit,
      potencialEmpenho:potential,
      saldoAposPotencial:Math.max(0,totalCredit-potential),
      requisicoesCobertas:financeablePlans.length,
      empenhoImediato:plans.filter(row=>row.stage==='imediato').reduce((sum,row)=>sum+row.valorUsd,0),
      revalidacaoMapa:plans.filter(row=>row.stage==='revalidacao').reduce((sum,row)=>sum+row.valorUsd,0),
      realocacaoProjetos:plans.filter(row=>row.stage==='projeto').reduce((sum,row)=>sum+row.valorUsd,0),
      realocacaoPi:plans.filter(row=>row.stage==='pi').reduce((sum,row)=>sum+row.valorUsd,0),
      ajustesMapasVencidos:plans.filter(row=>row.stage==='projeto_vencido'||row.stage==='pi_vencido').reduce((sum,row)=>sum+row.valorUsd,0)
    }
  };
}

function compatibleRequests(credits,requests,catalog){
  const pools=buildPools(credits);const byKey=new Map();
  pools.forEach(pool=>{const key=pool.om+'|'+pool.natureza+'|'+pool.acao;byKey.set(key,(byKey.get(key)||0)+pool.original);});
  return (requests||[]).filter(req=>{
    const actions=new Set(targetMappings(catalog,req).map(item=>item.acao));
    return number(req.valorUsd)>0&&Array.from(actions).some(action=>number(req.valorUsd)<=(byKey.get(str(req.omCodigo)+'|'+str(req.natureza)+'|'+action)||0)+0.005);
  });
}

function creditByOm(credits,omLabels){
  const labels=omLabels||{};const totals=new Map();
  buildPools(credits).forEach(pool=>totals.set(pool.om,(totals.get(pool.om)||0)+pool.original));
  return Array.from(totals,([omCodigo,valor])=>({omCodigo,label:labels[omCodigo]||omCodigo,valor})).sort((a,b)=>b.valor-a.valor);
}

function demandByOmStatus(rows,omLabels){
  const labels=omLabels||{};const map=new Map();
  (rows||[]).forEach(row=>{
    const om=str(row.omCodigo);if(!map.has(om))map.set(om,{omCodigo:om,label:row.om||labels[om]||om,values:{}});
    const prefix=statusPrefix(row.status);map.get(om).values[prefix]=(map.get(om).values[prefix]||0)+number(row.valorUsd);
  });
  return Array.from(map.values());
}

function omNaturezaKey(omCodigo,natureza){return str(omCodigo)+'|'+str(natureza);}

function creditByOmNatureza(credits,omLabels){
  const labels=omLabels||{};const map=new Map();
  buildPools(credits).forEach(pool=>{
    const key=omNaturezaKey(pool.om,pool.natureza);
    if(!map.has(key))map.set(key,{key,omCodigo:pool.om,natureza:pool.natureza,label:labels[pool.om]||pool.om,valor:0});
    map.get(key).valor+=pool.original;
  });
  return Array.from(map.values()).sort((a,b)=>b.valor-a.valor||a.label.localeCompare(b.label)||a.natureza.localeCompare(b.natureza));
}

function demandByOmNaturezaStatus(rows,omLabels){
  const labels=omLabels||{};const map=new Map();
  (rows||[]).forEach(row=>{
    const om=str(row.omCodigo),natureza=str(row.natureza),key=omNaturezaKey(om,natureza);
    if(!map.has(key))map.set(key,{key,omCodigo:om,natureza,label:row.om||labels[om]||om,values:{}});
    const prefix=statusPrefix(row.status);map.get(key).values[prefix]=(map.get(key).values[prefix]||0)+number(row.valorUsd);
  });
  return Array.from(map.values());
}

function analyze(data,creditFilters,requestFilters){
  const credits=filterCredits(data.creditos||[],creditFilters).filter(row=>number(row.saldo)>0);
  const requests=filterRequisitions(data.requisicoes||[],requestFilters);
  const compatible=compatibleRequests(credits,requests,data.creditos||[]);
  const referenceDate=(requestFilters||{}).dataReferencia||str((data.meta||{}).geradoEm).slice(0,10);
  const allocation=allocateMapApproved(credits,requests,data.creditos||[],referenceDate);
  const readyToCommit=requests.filter(row=>statusPrefix(row.status)==='M-'&&mapValidity(row,referenceDate)==='valido').reduce((sum,row)=>sum+number(row.valorUsd),0);
  return {
    credits,requests,compatible,allocation,
    creditByOm:creditByOm(credits,(data.lookups||{}).om||{}),
    demandByOmStatus:demandByOmStatus(compatible,(data.lookups||{}).om||{}),
    creditByOmNatureza:creditByOmNatureza(credits,(data.lookups||{}).om||{}),
    demandByOmNaturezaStatus:demandByOmNaturezaStatus(compatible,(data.lookups||{}).om||{}),
    summary:{
      ...allocation.summary,
      valorProntoEmpenho:readyToCommit,
      demandaCompativel:compatible.reduce((sum,row)=>sum+number(row.valorUsd),0),
      requisicoesCompativeis:compatible.length,
      omsAnalisadas:unique(credits.flatMap(row=>row.omCodigos)).length
    }
  };
}

root.CABW_COMPAT_ENGINE={
  STATUS_ORDER,STATUS_COLORS,statusPrefix,mapValidity,filterCredits,filterRequisitions,buildPools,
  allocateMapApproved,compatibleRequests,creditByOm,demandByOmStatus,
  omNaturezaKey,creditByOmNatureza,demandByOmNaturezaStatus,destinationCredits,planTransfers,analyze
};
})(typeof window!=='undefined'?window:globalThis);
