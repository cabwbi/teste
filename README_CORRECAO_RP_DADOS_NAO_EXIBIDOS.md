# Correção - Painel de RP sem exibição de dados

Correção aplicada ao pacote `17072026_risco_sf_rp_projecao`.

## Problema identificado

O painel de RP não exibia os dados porque o arquivo `rp-panel.js` chamava funções auxiliares dos cards superiores de RP sem que elas estivessem definidas no pacote entregue:

- `rpCardStats()`
- `compactMoney()`
- `pctLiquidado()`

Com isso, a execução do JavaScript era interrompida no início da renderização do painel, antes de preencher indicadores, gráficos, filtros e tabelas.

## Correção aplicada

Foram reinseridas as funções auxiliares no `rp-panel.js`, preservando as demais correções já realizadas:

- cards de RP geral, RP 2022, RP 2023, RP 2024 e RP 2025;
- cálculo de RP inscrito como saldo atual + liquidações 2026;
- percentual liquidado;
- gráfico de evolução por ano;
- gráfico de evolução total com projeção linear e projeção por DPE;
- tooltips de RP;
- tabela de principais liquidações;
- filtros sem seleção inicial.

A mesma correção foi aplicada também na cópia `assets/js/rp-panel.js`, para manter a consistência do pacote.

## Validação

Foi validado que o script volta a preencher:

- saldo total de RP;
- quantidade de ordens de compra;
- cards superiores;
- tabela de ordens de compra.
