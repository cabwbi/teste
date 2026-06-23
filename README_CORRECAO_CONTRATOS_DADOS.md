# Correção dos dados de contratos

Correção aplicada sem alterar HTML, CSS ou scripts de front-end.

Ajuste realizado:
- `contracts-data.js` e `assets/js/contracts-data.js` passaram a incluir a chave `records`, além das chaves já existentes.
- Cada contrato passou a conter o alias `category`, compatível com o `contracts-panel.js` atual.

Motivo:
- O painel de contratos utiliza `window.CABW_CONTRACTS_DATA.records` e o campo `category` para filtrar as categorias `administrativos`, `finalisticos` e `fms`.
- Os dados atualizados estavam apenas em `contracts` e com o campo `categoria`, o que fazia os cards e tabelas aparecerem zerados.

Front-end preservado.
