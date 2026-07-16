from pathlib import Path
root=Path('/mnt/data/fix_filter_sort')
css='''\n<style id="cabw-dropdown-hidden-fix">\n/* CABW fix: dropdown multisselecao fechado por padrao e seletor nativo oculto */\n.detail-field > select[id^="creditFilter"],\n.detail-field > select[id^="filter"],\n.contracts-field > select[id^="filter"]{\n  display:none!important;\n  visibility:hidden!important;\n  position:absolute!important;\n  left:-99999px!important;\n  width:0!important;\n  height:0!important;\n  min-height:0!important;\n  margin:0!important;\n  padding:0!important;\n  border:0!important;\n  opacity:0!important;\n  pointer-events:none!important;\n}\n.detail-field,.contracts-field,.detail-workbench__panel,.contracts-workbench__panel,.cabw-filter-report-layout,.detail-filter-grid,.contracts-filter-grid{\n  overflow:visible!important;\n}\n.cabw-multi-dropdown{\n  position:relative!important;\n  width:100%!important;\n  max-width:100%!important;\n}\n.cabw-multi-toggle{\n  display:flex!important;\n  align-items:center!important;\n  justify-content:space-between!important;\n  gap:10px!important;\n  width:100%!important;\n  min-height:44px!important;\n  padding:10px 14px!important;\n  border:1px solid #ccd6e6!important;\n  border-radius:10px!important;\n  background:#f8fbff!important;\n  color:#001f55!important;\n  font-family:inherit!important;\n  font-weight:700!important;\n  text-align:left!important;\n  cursor:pointer!important;\n}\n.cabw-multi-dropdown .cabw-multi-menu{\n  display:none!important;\n  position:absolute!important;\n  top:calc(100% + 6px)!important;\n  left:0!important;\n  right:auto!important;\n  z-index:99999!important;\n  box-sizing:border-box!important;\n  width:100%!important;\n  min-width:100%!important;\n  max-width:min(520px, calc(100vw - 32px))!important;\n  max-height:280px!important;\n  overflow-y:auto!important;\n  overflow-x:hidden!important;\n  background:#fff!important;\n  border:1px solid #ccd6e6!important;\n  border-radius:12px!important;\n  box-shadow:0 18px 34px rgba(0,31,85,.20)!important;\n  padding:6px!important;\n}\n.cabw-multi-dropdown.is-open .cabw-multi-menu{display:block!important;}\n@media(max-width:768px){\n  .cabw-multi-dropdown .cabw-multi-menu{\n    position:fixed!important;\n    left:16px!important;\n    right:16px!important;\n    top:auto!important;\n    bottom:18px!important;\n    width:auto!important;\n    max-width:none!important;\n    max-height:56vh!important;\n  }\n}\n</style>\n'''
for p in root.glob('*.html'):
    s=p.read_text(encoding='utf-8', errors='ignore')
    if 'id="cabw-dropdown-hidden-fix"' not in s:
        if '</head>' in s:
            s=s.replace('</head>', css+'</head>', 1)
        else:
            s=css+s
        p.write_text(s, encoding='utf-8')

# Patch JS files: hide original select with !important, close other open dropdowns, sort digits table by saldo desc.
for rel in ['credit-panel.js','assets/js/credit-panel.js']:
    p=root/rel
    if not p.exists(): continue
    s=p.read_text(encoding='utf-8', errors='ignore')
    s=s.replace("sel.style.display='none';", "sel.style.setProperty('display','none','important'); sel.setAttribute('hidden','hidden'); sel.setAttribute('aria-hidden','true');")
    s=s.replace("btn.addEventListener('click',e=>{e.stopPropagation();wrap.classList.toggle('is-open')});", "btn.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.cabw-multi-dropdown.is-open').forEach(w=>{if(w!==wrap)w.classList.remove('is-open')});wrap.classList.toggle('is-open')});")
    old="if(byId('digitsListBody'))byId('digitsListBody').innerHTML=tableRows(f.digits,[{k:'digito'},{k:'om'},{k:'acao'},{k:'natureza'},{k:'projetoLabel'},{k:'saldo',num:1,f:r=>usd(r.saldo)},{k:'objetivo'}]);"
    new="const digitsBySaldo=f.digits.slice().sort((a,b)=>(+b.saldo||0)-(+a.saldo||0)); if(byId('digitsListBody'))byId('digitsListBody').innerHTML=tableRows(digitsBySaldo,[{k:'digito'},{k:'om'},{k:'acao'},{k:'natureza'},{k:'projetoLabel'},{k:'saldo',num:1,f:r=>usd(r.saldo)},{k:'objetivo'}]);"
    s=s.replace(old,new)
    old2="if(byId('detailTableBody'))byId('detailTableBody').innerHTML=tableRows(f.digits,[{k:'digito'},{k:'om'},{k:'acao'},{k:'ptres'},{k:'natureza'},{k:'projetoLabel'},{k:'saldo',num:1,f:r=>usd(r.saldo)},{k:'objetivo'}]);"
    new2="if(byId('detailTableBody'))byId('detailTableBody').innerHTML=tableRows(digitsBySaldo,[{k:'digito'},{k:'om'},{k:'acao'},{k:'ptres'},{k:'natureza'},{k:'projetoLabel'},{k:'saldo',num:1,f:r=>usd(r.saldo)},{k:'objetivo'}]);"
    s=s.replace(old2,new2)
    p.write_text(s, encoding='utf-8')

for rel in ['contracts-panel.js','assets/js/contracts-panel.js']:
    p=root/rel
    if not p.exists(): continue
    s=p.read_text(encoding='utf-8', errors='ignore')
    s=s.replace("sel.style.display='none';", "sel.style.setProperty('display','none','important'); sel.setAttribute('hidden','hidden'); sel.setAttribute('aria-hidden','true');")
    s=s.replace("btn.addEventListener('click',e=>{e.stopPropagation();wrap.classList.toggle('is-open')});", "btn.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.cabw-multi-dropdown.is-open').forEach(w=>{if(w!==wrap)w.classList.remove('is-open')});wrap.classList.toggle('is-open')});")
    p.write_text(s, encoding='utf-8')

# Add validation note
(root/'README_CORRECAO_FILTROS_ORDENACAO.md').write_text('''# Correção de filtros e ordenação\n\nCorreções aplicadas neste pacote:\n\n- Os menus multiseleção dos filtros permanecem fechados ao carregar a página.\n- O seletor nativo original fica oculto após a criação do componente customizado.\n- Ao abrir um filtro, as opções aparecem em camada sobreposta sem expandir a área dos filtros.\n- A tabela de dígitos da Visão Executiva passou a ser ordenada pelo maior saldo disponível para o menor.\n- A tabela de detalhamento também usa a mesma ordenação por saldo decrescente.\n''', encoding='utf-8')
