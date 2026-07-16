# Correção da atualização de dados do Painel_CABW

Este pacote parte da última versão publicada e reaplica as correções anteriores que haviam sido perdidas na atualização apenas dos dados.

## Correções reaplicadas

- Contratos administrativos novamente restritos aos contratos cujo **Grande Comando é CW**.
- Contratos FMS classificados pelo fornecedor/CAGE **W2525**.
- Demais contratos classificados como finalísticos.
- Classificação de **Ordenação de Despesas pela CABW** versus **OM Requisitante** preservada da versão corrigida anterior para todos os contratos já existentes.
- Números das faturas restaurados no detalhamento do gráfico de faturamento mensal por PO, usando o campo `FATURA` da planilha `NL_requisicao.xlsx`.
- Demais arquivos de dados atualizados da última rodada foram mantidos.

## Validação

- Total de contratos: 136
- Administrativos (GC=CW): 28
- Finalísticos: 55
- FMS: 53
- Itens de faturamento mensal com fatura preenchida: 2388 de 2388

Para publicar, envie o conteúdo interno deste ZIP diretamente para a raiz do repositório GitHub Pages.
