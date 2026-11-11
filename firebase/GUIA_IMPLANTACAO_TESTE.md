# SISCABW TESTE — preparacao do Firebase Authentication

**Estado:** preparacao somente; o login legado continua ativo. Nao ativar a nova autenticacao antes de concluir o cadastro e os testes de acesso.

## Criar projeto

1. Abra https://console.firebase.google.com/ com uma conta institucional autorizada.
2. Clique em **Adicionar projeto** e escolha um ID exclusivo, por exemplo `siscabw-teste-cabw` (se disponivel). Desative Google Analytics se nao houver necessidade institucional.
3. No projeto, acesse **Authentication > Sign-in method** e habilite **Email/Password** (nao habilitar acesso anonimo).
4. Em **Authentication > Settings > Authorized domains**, confira o dominio `cabwbi.github.io` para a futura integracao. A inclusao deve ser deliberada e restrita aos dominios necessarios.
5. Em **Project settings > Your apps**, registre um **Web app** e copie apenas a configuracao publica do SDK Web. Nao criar nem compartilhar service account JSON para esta etapa.
6. Copie `firebase-config.example.js` para um arquivo de configuracao e preencha os campos publicos; mantenha a versao ativa fora do site ate a fase de teste.

## Cadastro de contas

- O Firebase Email/Password autentica e-mail + senha, nao nome de usuario arbitrario. Para preservar a interface `CABW1` ... `CABW50`, sera preciso mapear cada identificador para um e-mail correspondente em um dominio administrado pela CABW, ou criar um backend seguro para resolver os identificadores.
- Para as quatro contas legadas, definir e validar os respectivos identificadores, e-mails e senhas **fora do repositorio**. Nao registrar as senhas em issues, commits, logs ou planilhas publicas.
- Para os 50 novos usuarios, gerar senhas fortes com um gerador criptografico, cadastrar as contas por ferramenta administrativa segura e entregar o inventario por canal restrito. A configuracao Web do Firebase nao autoriza criacao administrativa em lote.
- Nao usar o Firebase Admin SDK nem chaves privadas no navegador. A criacao em lote exige ambiente administrativo com privilegios apropriados.
- A manutencao das senhas antigas e possivel somente se forem cadastradas novamente; nao e recomendada por terem estado em codigo publico.

## Corte futuro (nao realizado)

1. Confirmar que todas as 54 contas existem e que os usuarios legados conseguem autenticar.
2. Implementar a tela de login com o SDK oficial do Firebase e a observacao de sessao autenticada (`onAuthStateChanged`).
3. Testar login, logout, credenciais incorretas, conta desativada e recuperacao de senha.
4. Trocar as referencias ao `auth.js` em todas as paginas **somente depois** da validacao.
5. Remover credenciais legadas do codigo publicado e avaliar a limpeza do historico de commits; rotacionar credenciais expostas.
6. Confirmar que o workflow de atualizacao do Drive, os indicadores e os links internos continuam funcionando.

## Limite de seguranca

Firebase Authentication protege a identidade, mas **nao protege** arquivos `.js`, `.json`, `.csv`, `.pdf` ou ZIP disponibilizados publicamente pelo GitHub Pages. O acesso aos dados so sera protegido com uma etapa posterior de entrega autenticada no servidor.

## Estado do deploy

Este diretorio nao e referenciado pelas paginas atuais. O workflow continua independente e o login anterior permanece ativo.

## Decisao atualizada: somente quatro usuarios existentes

- Nao criar CABW1 a CABW50. Migrar apenas as quatro contas ja existentes.
- O campo da interface sera **Usuario ou e-mail**. E-mail informado diretamente sera enviado ao Firebase Authentication.
- Para nome de usuario, manter uma tabela publica somente com o identificador e o e-mail correspondente, **sem senha**. Essa opcao revela os e-mails associados; usar somente com autorizacao e se nao forem sigilosos.
- Como alternativa de privacidade, usar um resolvedor autenticado no servidor; nao consultar publicamente uma base de e-mails por nome de usuario.
- Criar as quatro contas em Firebase Authentication > Users > Add user, com e-mails validos definidos pelo administrador. Para manter as senhas atuais, sera necessario defini-las no cadastro; como ja estiveram no codigo publico, recomenda-se rotaciona-las.
- Nao ativar o novo login nem remover o legado ate que as quatro contas tenham sido testadas.

## Endereco administrativo informado

- Endereco de contato institucional indicado pelo responsavel: `chf.ati.cabw@fab.mil.br`.
- **Nao** cadastrar quatro usuarios Firebase Email/Password com o mesmo e-mail: o provedor exige identificadores de e-mail unicos por conta.
- Nao criar aliases artificiais, enderecos inexistentes ou contas adicionais sem confirmacao do responsavel.
- Aguardar escolha entre (a) quatro e-mails de autenticacao exclusivos, mantendo este endereco como contato administrativo, ou (b) uma unica conta Firebase compartilhada, que nao preserva identidades e revogacao individual.
- Nenhuma alteracao no login publicado enquanto a decisao estiver pendente.
