# Pacote CABW atualizado

Atualização realizada com base nos arquivos Excel reenviados.

## Crédito disponível
- Fonte: `digitos(2).xlsx`, `ordem_de_compra(2).xlsx` e `Ordem_de_compra_em_assinatura.xlsx`.
- Visão Executiva recalculada como: crédito disponível + empenhos realizados em 2026 + empenhos em processo de assinatura.
- Filtros por UG, ação, natureza de despesa e projeto.
- Análise por UG usa sigla da UG, não código numérico.

## Contratos
- Fonte: `controle_financeiro_contratos.xlsx`.
- Filtros por número de contrato, empresa, unidade, grande comando, ordenador de despesas, ação, moeda, vigência e busca geral.
- Vigência classificada em: acima de 150 dias, entre 90 e 150 dias, até 90 dias, expirada ou sem data.
- Flag de risco para contratos com menos de 90 dias até o fim da vigência.
- Ordenador de despesas CABW calculado como união entre contratos com `GRAND COMANDO = CW` e a lista adicional informada pelo usuário.

## Validações
- Contratos totais: 136
- Administrativos (GC=CW): 26
- FMS (CAGE=W2525): 53
- Finalísticos: 57
- Contratos OD CABW: 46
- Dígitos carregados: 274
- Saldo disponível total nos dígitos: US$ 3,159,204.63
- Empenhos realizados em 2026: US$ 67,447,674.37
- Empenhos em assinatura: US$ 25,891,814.11
