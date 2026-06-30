# Correção do gráfico de linhas do painel de RP

Ajustes aplicados:

1. O gráfico de linhas do painel de Restos a Pagar passou a reconstruir a evolução mensal do saldo de RP a partir de duas bases:
   - `ordem_de_compra.xlsx`, para o saldo atual das POs emitidas de 2022 a 2025;
   - `NL_requisicao.xlsx`, para identificar as liquidações de 2026 que abateram saldo de POs inscritas em RP.

2. A regra adotada foi:
   - saldo inicial em janeiro de 2026 = saldo atual da PO + soma das liquidações de 2026 da mesma PO;
   - saldo de cada mês = saldo anterior abatido pelas NLs de liquidação daquele mês.

3. A série de POs de 2025 foi corrigida para iniciar em aproximadamente US$ 92,4 milhões, conforme esperado para o saldo inscrito no início de 2026.

4. O gráfico deixa de exibir meses futuros ainda não ocorridos. Com a base atual, são exibidos apenas o ponto inicial de janeiro e os meses com liquidações já registradas em 2026.

5. O eixo Y foi ajustado para usar autorange dinâmico. Ao ocultar uma série pela legenda, o eixo se reajusta para permitir a análise de séries com valores menores.

6. A informação complementar de liquidações 2026 passa a considerar a base reconstruída de RP, inclusive POs que já foram totalmente liquidadas em 2026.
