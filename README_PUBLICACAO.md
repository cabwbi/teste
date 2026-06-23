# Publicação no GitHub Pages - Painel CABW

Este pacote foi gerado com o CSS visual crítico embutido diretamente nos arquivos HTML. Assim, a página de entrada não deve aparecer com fundo branco mesmo que o navegador demore a carregar `css/style.css`.

## Como publicar

1. Apague o conteúdo antigo do repositório/pasta publicada.
2. Extraia este ZIP.
3. Envie o conteúdo interno diretamente para a raiz publicada do GitHub Pages.
4. A estrutura esperada é:

```text
index.html
css/style.css
assets/img/hero_aircraft_clean.png
assets/img/hero_eagle.png
assets/icons/home-credit.png
assets/js/contracts-data.js
```

Não publique uma pasta contendo esses arquivos; publique os arquivos na raiz.

## Teste

Depois da publicação, abra:

```text
https://cabwbi.github.io/siscab/CHECK_PUBLICACAO.html
```

Todos os itens devem aparecer como OK. Se algum item falhar, o arquivo não foi enviado no caminho correto.

## Observação

A identidade visual foi preservada com os arquivos e classes do site de referência, e o CSS foi também embutido nos HTMLs para evitar tela branca causada por ausência ou cache de `css/style.css`.
