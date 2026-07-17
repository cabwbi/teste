# Correção do painel de RP sem dados

Correção aplicada no pacote de 17/07/2026 para restaurar a exibição dos dados no painel de Restos a Pagar.

O problema foi causado pela ausência, no `rp-panel.js` publicado, das funções auxiliares usadas pelos cards superiores de RP (`rpCardStats`, `compactMoney` e `pctLiquidado`). Como essas funções eram chamadas antes da renderização dos gráficos e tabelas, o JavaScript era interrompido e os dados não apareciam no painel.

Ajustes aplicados:

- restauradas as funções auxiliares dos cards de RP;
- mantido o cálculo de RP atual, RP inscrito e percentual liquidado;
- preservado o gráfico de evolução por ano e o novo gráfico de evolução mensal/projeções;
- mantidas as correções anteriores de filtros, OM requisitante, tipo de processo, liquidações e tooltips.
