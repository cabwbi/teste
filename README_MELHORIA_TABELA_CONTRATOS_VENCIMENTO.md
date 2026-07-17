# Melhoria da tabela de contratos - vencimentos e Grande Comando

Pacote atualizado para melhorar a leitura da tabela de contratos nos painéis de Contratos Administrativos, Contratos Finalísticos e FMS.

## Alterações aplicadas

1. A tabela de contratos passou a ser ordenada pelo vencimento mais próximo, facilitando a identificação dos contratos vencidos ou próximos do fim da vigência.
2. Foi incluída a coluna **Dias p/ vencer**, com indicação visual por etiqueta.
3. A coluna **Grande Comando** foi mantida e destacada por chip visual para facilitar a leitura.
4. A coluna **Vigência** foi renomeada visualmente para **Situação**, mantendo a mesma regra de classificação:
   - Vigência expirada;
   - Vencimento em até 90 dias;
   - Vencimento entre 90 e 150 dias;
   - Vencimento acima de 150 dias;
   - Sem data final.
5. As linhas de contratos vencidos ou próximos do vencimento receberam destaque visual:
   - vencidos: destaque em vermelho claro;
   - até 90 dias: destaque amarelo;
   - entre 90 e 150 dias: destaque amarelo suave.
6. O relatório gerado pelo painel também recebeu a nova coluna **Dias p/ vencer** e passou a listar os contratos na mesma ordem de criticidade.

## Arquivos alterados

- `contracts-panel.js`
- `assets/js/contracts-panel.js`
- `contratos-administrativos.html`
- `contratos-finalisticos.html`
- `fms.html`
- `style.css`
- `css/style.css`

As demais correções já aplicadas no pacote foram preservadas.
