# Automação de atualização do SISCABW

O workflow `.github/workflows/siscabw-data-update.yml` executa às 08:00 (America/New_York), de segunda a sexta-feira. Dois horários UTC são agendados para cobrir automaticamente horário padrão e horário de verão; a etapa inicial libera apenas a execução correspondente às 08:00 locais.

## Autenticação segura do Google Drive

Crie uma conta de serviço no Google Cloud com acesso somente de leitura ao Drive, compartilhe apenas a pasta `SISCABW - Atualização Automática` com o e-mail dessa conta e cadastre o JSON completo como secret do repositório com o nome `GDRIVE_SERVICE_ACCOUNT_JSON`. O segredo nunca deve ser convertido para Base64, incluído em commit, log, artefato ou arquivo do site.

O token padrão `GITHUB_TOKEN`, limitado a `contents: write`, realiza exclusivamente o commit dos 16 caminhos de dados listados em `automation/data_allowlist.txt`. Nenhum arquivo de HTML, CSS, layout, arte, painel, filtro, funcionalidade ou autenticação é autorizado na rotina.

## Bloqueios automáticos

A execução falha antes do commit se houver planilha ausente ou adicional, schema incompatível, total divergente, reconstrução de RP inconsistente, classificação de contrato incorreta, JSON/JavaScript inválido, cópias raiz/`assets/` divergentes ou mudança fora da allowlist. Sem alteração de dados, nenhum commit é criado. O relatório em português é salvo como artefato e também no resumo da execução.
