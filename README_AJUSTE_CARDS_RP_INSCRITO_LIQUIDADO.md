# Ajuste dos cards superiores do painel de RP

Foram atualizados os indicadores acima dos filtros do painel de Restos a Pagar.

## Alterações

- Inclusão do card **RP geral**.
- Cards de RP por ano de emissão da PO: 2022, 2023, 2024 e 2025.
- Cada card apresenta:
  - RP atual;
  - RP total inicialmente inscrito;
  - percentual liquidado em 2026.

## Regra de cálculo

O RP total inicialmente inscrito é reconstruído por PO como:

`RP inscrito = saldo atual de RP + liquidações de 2026 constantes da NL_requisicao.xlsx`

O percentual liquidado é calculado como:

`% liquidado = liquidações de 2026 / RP inscrito`

Os cards respeitam os filtros aplicados no painel de RP.
