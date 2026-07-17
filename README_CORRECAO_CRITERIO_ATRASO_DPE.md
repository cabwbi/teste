# Correção do critério de requisição atrasada no painel de RP

Esta versão corrige a documentação e consolida o critério usado no painel de RP para o filtro **Requisição atrasada**.

## Regra correta

O campo `DSCPT` não deve ser utilizado como parâmetro para atraso de DPE.

A marcação **SIM** em `requisicaoAtrasada` passa a ser mantida exclusivamente quando a ordem de compra em RP possuir requisição vinculada com DPE identificada como atrasada/vencida na base de requisições.

## Validação desta versão

- Registros de RP marcados como SIM: 131
- Registros de RP marcados como NÃO: 783

A atualização não altera layout, filtros, gráficos, tooltips, classificação de contratos, cards da página inicial ou demais correções já aplicadas.
