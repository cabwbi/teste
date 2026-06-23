# Atualização da área de Contratos

Este pacote atualiza a área de Contratos com a planilha `controle_financeiro_contratos(2).XLS`.

Resumo carregado:

- Total de contratos: 136
- Contratos administrativos (GRAND COMANDO = CW): 26
- Contratos FMS (CAGE = W2525): 53
- Contratos finalísticos: 57

Arquivos atualizados:

- `assets/js/contracts-data.js`
- `assets/js/contracts-panel.js`
- `assets/data/contracts-summary.json`
- cópias compatíveis na raiz
- `contratos.html`
- `contratos-administrativos.html`
- `contratos-finalisticos.html`
- `fms.html`

A tabela dos painéis também recebeu conteúdo estático de fallback, para que os dados apareçam mesmo se o navegador demorar a executar o JavaScript.
