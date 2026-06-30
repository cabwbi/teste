# Correção de OM requisitante no painel de RP e tabela de liquidações

Alterações realizadas:

1. A OM requisitante das ordens de compra do painel de RP passou a ser identificada pelo prefixo de dois caracteres da requisição vinculada à PO, com tradução pela planilha `descricao_OM.xlsx`.
2. O filtro, o gráfico e a tabela passaram a exibir **OM Requisitante** com base nessa regra, evitando uso indevido da unidade registrada diretamente na ordem de compra.
3. Foi incluída uma tabela abaixo dos gráficos de barras e acima da tabela de PO com as principais liquidações do mês anterior (`05/2026`), usando `NL_requisicao.xlsx`.
4. A tabela mostra até 10 itens, com PO, data da PO, empresa contratada, descrição da requisição liquidada e valor liquidado, ordenados do maior para o menor valor.
5. A tabela de liquidações respeita os filtros aplicados no painel de RP.

Registros com OM recalculada: 282.
