# SISCABW — guia único de operação, atualização e publicação

## Ajuste de 24/09/2026 — seletor de OM da prestação de contas

- A opção técnica “Não informado” foi removida dos botões do gráfico do segundo slide porque não possuía dados úteis para gráfico, indicadores ou tabela.
- Os registros sem OM classificada continuam contabilizados na visão consolidada “Todas OM”.
- Os dados foram regenerados com as planilhas de 23/09/2026; o arquivo de volumes foi preservado da remessa anterior por não ter sido reenviado.

## Ajustes de 23/09/2026 — prestação de contas e Suprimento de Fundos

- No segundo slide da consolidação para prestação de contas, a linha da média do ano corrente passou a ser azul.
- A seleção de OM sincroniza o gráfico, o saldo empenhado a liquidar, a média mensal e a tabela de POs/liquidações.
- A escala do gráfico permanece fixa na escala de “Todas OM”, permitindo comparar visualmente CABW, ADIAE-EUA e demais organizações.
- No relatório de Suprimento de Fundos, o crédito disponível SF é exibido apenas quando nenhum filtro está aplicado.

Este repositório contém o painel estático de Business Intelligence da Comissão Aeronáutica Brasileira em Washington (CABW). Todo o processamento é executado na geração do pacote; depois de publicado no GitHub Pages, o site funciona somente com HTML, CSS e JavaScript, sem depender do ChatGPT ou de um servidor de aplicação.

## Conteúdo do painel

- **CABW em Números:** visão executiva de crédito, restos a pagar, contratos, requisições, finanças e suprimento de fundos.
- **Gestão de Crédito:** visão do crédito disponível e compatibilização entre créditos e processos.
- **Contratos:** contratos administrativos, finalísticos e casos FMS, com filtros, relatórios e consolidação contínua para prestação de contas.
- **Requisições:** materiais/publicações e reparos, incluindo situação, fluxo logístico, indicadores, gráficos e listas detalhadas.
- **Governança e ARC:** restos a pagar, calendário, PAAC, PTA e indicadores de governança.
- **Finanças:** acesso ao painel externo de pagamentos.
- **Suprimento de Fundos:** crédito, empenho, liquidação e pessoas atendidas.

## Fontes obrigatórias

Cada atualização utiliza nove planilhas. O gerador aceita `.xls` ou `.xlsx`, desde que as colunas obrigatórias sejam preservadas.

| Arquivo canônico | Uso principal |
|---|---|
| `controle_financeiro_contratos.xlsx` | contratos, classificação, vigência e execução financeira |
| `descricao_OM.xlsx` | nomes e siglas das organizações militares |
| `descricao_projetos.xlsx` | descrição dos projetos |
| `Ordem_de_compra_em_assinatura.xlsx` | valores de PO ainda em assinatura |
| `digitos.xlsx` | dotação, saldo, ação, ND, PI, fonte, projeto e objetivo |
| `NL_requisicao.xlsx` | pagamentos, faturas e liquidações por PO |
| `ordem_de_compra.xlsx` | ordens de compra, versões, valores, fornecedor, faturamento e saldo |
| `requisicoes.xlsx` | requisições, certame, cotação, situação, datas, itens e reparos |
| `volumes.xlsx` | volumes, pedidos, PAG e manifesto |

O arquivo `requisicoes` é a referência temporal da publicação. A data exibida no painel usa, nesta ordem: metadado interno da planilha; `modifiedTime` do manifesto de download; ou data/hora de upload do arquivo. A apresentação usa o fuso de Washington (`America/New_York`) e nunca a hora em que o gerador foi executado.

## Regras de negócio essenciais

### Contratos

- Administrativos: Grande Comando `CW`.
- FMS: fornecedor/CAGE `W2525`.
- Finalísticos: contratos restantes, sem duplicidade.
- A última versão de cada PO é a versão financeira vigente; o saldo empenhado a liquidar corresponde à soma dos saldos não liquidados dessas versões vigentes.
- O faturamento e o histórico mensal são associados por PO e NL.
- A consolidação para prestação de contas empilha todos os contratos da categoria, independentemente dos filtros correntes.
- Na visualização em tela, cada contrato ocupa duas páginas navegáveis: informações gerais e execução financeira na primeira; histórico, saldo empenhado a liquidar, média mensal e liquidações na segunda. A tabela apresenta todas as POs vinculadas ao contrato, por PAG da PO ou pela correspondência entre a cotação da requisição e o identificador do contrato, incluindo as POs sem liquidação. As liquidações usam todo o histórico de NL, são agrupadas por mês e, dentro de cada mês, por OM da requisição, sempre apresentando a CABW (`CW`) antes das demais unidades. A pesquisa dos filtros apenas reduz a lista de opções: somente os contratos marcados são aplicados.
- A média mensal de liquidações considera todos os meses já encerrados no exercício da base, inclusive meses sem liquidação, e exclui o mês corrente.
- A lista de liquidações apresenta inicialmente os dois meses mais recentes e pode ser expandida; na impressão ou geração de PDF, todo o histórico é exibido automaticamente.
- Vigência em vermelho: menos de 90 dias, incluindo contratos vencidos. Vigência em amarelo: de 90 a 150 dias.
- No relatório consolidado, o histórico mensal usa cinza para o ano anterior e azul para o ano atual; o rótulo fica sobre a barra e a tooltip relaciona as faturas do mês. A tabela de faturamento é ordenada da NL mais recente para a mais antiga e separada por mês.

### Requisições

- O certame considerado é o **certame SILOMS**, proveniente do ComprAer.
- Materiais/publicações do ComprAer exigem cotação e certame SILOMS preenchidos.
- Reparos do ComprAer exigem cotação e certame SILOMS preenchidos e quarto caractere `R` no número da requisição.
- Requisições cujo quarto caractere não seja `R` não pertencem ao painel de reparos.
- O ano é obtido da data de abertura.
- Mapa aprovado é válido por 60 dias contados da data de abertura.
- Requisição atrasada de material/publicação: situação `Empenho aprovado` e DPE anterior à data de referência dos dados.
- Economia da licitação: valor de referência menos valor total, com valor absoluto e percentual.

### Compatibilização de crédito e processos

- Compatibilidade sempre exige a mesma natureza de despesa entre crédito e requisição.
- Organização Militar e natureza de despesas possuem filtros únicos, aplicados simultaneamente aos créditos e às requisições.
- Empenho imediato exige OM, ND, projeto e mapa válido compatíveis.
- Ajustes de projeto ou PI preservam OM e ND e respeitam o saldo finito de cada dígito.
- Mapas vencidos aparecem apenas como cenário informativo de revalidação, não como valor financiável.

### Restos a pagar

- A OM requisitante é priorizada; UG é apenas fallback.
- RP inicialmente inscrito = saldo atual + liquidações do exercício.
- A projeção é distribuída por DPE.
- Os KPI de 2022 a 2025 são botões: ao selecionar um ano, todos os gráficos, liquidações e a tabela de POs adotam o mesmo filtro. `RP geral` limpa apenas o filtro anual.

### Crédito, finanças e suprimento de fundos

- Crédito disponível = saldo dos dígitos + PO em assinatura que não seja `AMEND`.
- Empenhos liquidados do exercício = soma das NL de liquidação vinculadas a ordens de compra iniciadas por `26T` (ou pelo ano corrente equivalente após atualização).
- A página **Visão geral da Execução** apresenta a composição do crédito recebido em três fases: não empenhado, empenhado e não liquidado, e liquidado/pago. Os gráficos por Grande Comando, ação e o ranking de saldos de PO obedecem aos filtros do painel.
- Crédito total recebido = crédito disponível + empenhos realizados.
- Fornecedores pagos qualificados devem estar ligados a contrato ou a requisição com certame SILOMS.
- Suprimento de fundos usa projeto `SF` para crédito, empenho e saldo não liquidado.
- A compatibilização limita automaticamente as requisições ao ano da atualização e ao ano anterior; a janela avança com a data dos novos dados.
- O relatório de compatibilização reproduz os dois gráficos do painel conforme os filtros aplicados.
- O painel de Suprimento de Fundos gera relatório detalhado para impressão/PDF com filtros, KPI, gráficos e ordens de compra.

### Relatórios e escopos

- A consolidação administrativa usa exclusivamente contratos com Grande Comando `CW`.
- A consolidação finalística exclui contratos `CW` e contratos FMS do fornecedor `W2525`.
- Materiais e Publicações dispõe de filtro de validade do mapa comparativo, calculada em 60 dias desde a data de abertura.
- Nos gráficos, filtros, tabelas e relatórios por empresa, o fornecedor é consolidado pelo CAGE e exibe também o nome obtido das ordens de compra; o eixo limita o nome a 20 caracteres e mantém a identificação integral na tooltip. Quando o CAGE ainda não possui nome em nenhuma ordem da base, o painel informa explicitamente `Nome não cadastrado na base`.

## Arquivos gerados

- `contracts-data.js` e `contracts-summary.json`
- `credit-data.js` e arquivos `credit-*.json`
- `processos-data.js`
- `compatibilizacao-data.js`
- `rp-data.js`
- `suprimento-data.js`
- `home-data.js`
- `data-update-status.json`

Os dados mantêm os aliases exigidos pelas páginas legadas, incluindo `contracts`, `records` e `data` em contratos, e `pos`/`purchaseOrders` e `signing`/`signatureOrders` em crédito.

## Atualização dos dados

1. Coloque as nove planilhas em uma pasta de entrada usando os nomes canônicos ou os mesmos nomes com extensão `.xls`.
2. Decodifique o gerador versionado:

   ```bash
   base64 -d automation/generate_data.py.gz.b64 | gzip -d > /tmp/generate_data.py
   ```

3. Execute a geração:

   ```bash
   python /tmp/generate_data.py --inputs /caminho/entrada --repo /caminho/repositorio
   ```

4. Execute as verificações abaixo antes de compactar ou publicar.

O script `automation/download_drive.py` pode preparar as fontes e o `input_manifest.json` em fluxos automatizados. O manifesto preserva o nome original e o `modifiedTime`, usado como referência temporal quando a planilha não contém metadado interno legível.

## Validação obrigatória

- Confirmar a presença e o schema das nove fontes.
- Validar sintaxe de todos os JavaScript com `node --check` e validar os JSON.
- Reconciliar totais de contratos, crédito, requisições, RP, pagamentos e suprimento.
- Confirmar aliases de compatibilidade e a data/hora da fonte `requisicoes`.
- Testar filtros, links, relatórios e comportamento responsivo.
- Executar o gerador do pacote em uma cópia limpa e comparar os dados gerados.
- Compactar o conteúdo na raiz do ZIP, sem pasta intermediária.
- Publicar primeiro em teste e homologar o conteúdo servido pelo GitHub Pages.

As páginas `CHECK_DADOS.html`, `CHECK_COMPATIBILIZACAO.html`, `CHECK_PUBLICACAO.html` e `CHECK_VISUAL_LINKS.html` apoiam a inspeção local. `MANIFESTO_ARQUIVOS.txt` documenta o pacote.

## Estado desta versão

- 139 contratos: 26 administrativos, 60 finalísticos e 53 FMS.
- Valor contratado: US$ 1.125.778.828,19.
- Valor empenhado em contratos: US$ 657.263.613,50.
- Valor faturado em contratos: US$ 550.741.202,30.
- Crédito recebido: US$ 129.578.964,84; disponível: US$ 2.564.134,13.
- Restos a pagar: 905 registros e saldo atual de US$ 36.456.736,12.
- Requisições homologadas em 2026: 491 de materiais/publicações e 69 de reparo.
- Pagamentos em 2026: 2.426 NL, no valor de US$ 105.387.982,85.
- Data de referência: 17/09/2026 às 22:39:54, baseada no upload de `requisicoes`.

## Ajuste visual da prestação de contas — 23/09/2026

- O relatório consolidado ganhou maior largura útil, preservando o comportamento responsivo e a impressão em PDF.
- No primeiro slide, as barras da execução financeira ficaram mais espessas e os rótulos, categorias e valores ganharam maior legibilidade.
- No segundo slide, as categorias e os rótulos de valores do histórico mensal foram ampliados; os rótulos de valores usam peso normal para evitar sobreposição.
- A seleção dos contratos administrativos segue a sequência operacional informada nas referências visuais. A referência ao contrato Dumonde 016/2021 não integra a base vigente; por isso, não foi criado registro sem fonte. Contratos atuais sem correspondência explícita nas imagens permanecem na lista antes do bloco final de transporte e logística.
- Contratos da mesma empresa foram mantidos em sequência no seletor, incluindo CELLCO, SAHOURI, BARIC, MILCLEAN e NORVIK.
- O gráfico mensal do segundo slide voltou a ocupar somente a largura disponível da tela, sem largura mínima por coluna e sem barra de rolagem horizontal em zoom de 100%.
- Os rótulos monetários desse gráfico usam apenas o símbolo `$`, com fonte ampliada e peso normal; as tooltips preservam o valor completo em `US$`.

## Publicação no GitHub Pages

### Correção do filtro de pessoas no Suprimento de Fundos — 23/09/2026

- O texto digitado no multisseletor passou a servir exclusivamente para pesquisar e reduzir as opções visíveis.
- O botão `Aplicar seleção` confirma somente as caixas efetivamente marcadas, sem acrescentar automaticamente outros nomes que contenham o mesmo texto.
- A ação `Marcar visíveis` atua apenas nas opções apresentadas pela pesquisa atual.
- A filtragem dos dados continua usando correspondência exata do rótulo selecionado.

### Médias e filtro por OM na prestação de contas — 23/09/2026

- O gráfico mensal do segundo slide apresenta uma linha de média sobre as 12 colunas do exercício anterior e outra sobre as colunas do exercício atual.
- A média do exercício atual considera exclusivamente os meses encerrados na data de atualização; a média do exercício anterior considera os 12 meses.
- A legenda inferior identifica `Média de 2025` e `Média de 2026` e mostra o valor correspondente conforme o contrato e a OM selecionada.
- Botões no canto superior direito permitem alternar entre todas as liquidações e cada OM identificada pela requisição da PO.
- As barras, tooltips e médias são recalculadas para a OM selecionada; a tabela inferior e os indicadores consolidados permanecem integrais.


Extraia o ZIP e publique seu conteúdo diretamente na raiz da branch configurada para o GitHub Pages. Faça primeiro a publicação em `cabwbi/teste`; após a homologação funcional e visual, replique os mesmos arquivos aprovados em `cabwbi/SISCABW`.

Não publique planilhas-fonte, credenciais ou segredos no repositório. O acesso ao Google Drive deve permanecer apenas no GitHub Secrets.
