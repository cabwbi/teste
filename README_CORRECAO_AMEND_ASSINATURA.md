# Correção de Empenhos em Processo de Assinatura

Atualização aplicada conforme orientação: no cálculo de **Empenhos em Processo de Assinatura**, foram desconsideradas as ordens de compra da planilha `Ordem_de_compra_em_assinatura.xlsx` cuja coluna **ALTERAÇÃO** inicia com `AMEND`.

## Resultado da correção

- Registros originais em assinatura: 9
- Registros desconsiderados por `ALTERAÇÃO` iniciando com `AMEND`: 3
- Registros considerados no cálculo: 6
- Valor desconsiderado: US$ 285,768.87
- Novo total de empenhos em processo de assinatura: US$ 25,606,045.24

A regra foi aplicada nos dados embutidos das páginas de Crédito Disponível / Visão Executiva e nos arquivos `credit-data.js` em raiz e em `assets/js/`.