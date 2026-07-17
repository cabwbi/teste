# Recorreção e atualização - Painel_CABW 16/07/2026

Pacote gerado a partir da última versão corrigida, preservando a estrutura visual e funcional da versão validada de 06/07/2026 e reaplicando correções específicas que haviam regredido.

Correções aplicadas nesta rodada:

1. Painel de RP: tooltip dos gráficos de RP por empresa e por OM requisitante reformatado com quebras de linha, alinhamento à esquerda e detalhamento legível de PO, empresa, objeto resumido e valor de RP.
2. Painel de RP: identificação de requisições atrasadas corrigida. O marcador agora considera somente requisição com DPE vencida/registrada como atrasada na requisição vinculada à PO. O campo `DSCPT` não é parâmetro para atraso de DPE.
3. Página inicial: cards de entrada passaram a apresentar indicadores macro:
   - Crédito Disponível: crédito total disponível (US$ 3,2 mi);
   - Contratos: 28 Administrativos, 53 FMS e 55 Finalísticos;
   - Governança: RP total atual (US$ 47,1 mi).
4. A classificação de contratos administrativos foi preservada como somente contratos com Grande Comando `CW`.
5. Mantidas as correções anteriores do RP: ano da PO, tipo de processo, cards com RP inscrito/liquidado, gráfico de linhas reconstruído pelas liquidações da NL, OM requisitante por prefixo da requisição e tabela de liquidações do mês anterior.

Validação rápida:
- Requisições em RP marcadas como atrasadas: 131.
- Requisições em RP marcadas como não atrasadas: 783.
- RP atual total: US$ 47,1 mi.

Publicação: enviar o conteúdo interno do ZIP diretamente para a raiz do repositório GitHub Pages.
