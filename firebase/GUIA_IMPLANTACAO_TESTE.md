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

## Nova politica solicitada: acesso por dominio institucional (pendente de implementacao)

- Qualquer titular que comprove controle de endereco cujo dominio seja **exatamente** `fab.mil.br` podera acessar o painel, sem lista fechada de quatro usuarios.
- Verificar e-mail confirmado e dominio no token autenticado; nao confiar apenas no texto digitado nem em verificacao JavaScript como controle de seguranca de arquivos.
- Para fluxo sem senha, considerar Firebase Authentication Email Link e habilitar Email Link no console, com dominio autorizado e configuracao adequada de retorno ao GitHub Pages. A ativacao de Email/Password isoladamente nao habilita necessariamente Email Link.
- Firebase Authentication Email Link e autenticacao por e-mail, **nao** segundo fator apos senha. Se exigir senha + codigo por e-mail, sera necessario fluxo de backend especifico.
- Nao habilitar autocadastro indiscriminado por Email/Password sem bloqueio server-side para impedir contas fora do dominio; verificacao de dominio no frontend nao bloqueia criacao de contas externas no Firebase.
- GitHub Pages publica os arquivos estaticos; esta fase nao protege arquivos de dados por URL direta.
- Estado: politica documentada; login legado preservado; nenhuma alteracao de producao ou login ativo.

## Fluxo aprovado em 2026-11-11: primeiro acesso com verificacao, seguintes com senha

- Politica desejada: qualquer titular de email exatamente `@fab.mil.br` pode se cadastrar, apos verificar posse da caixa postal; acessos posteriores por email + senha, sem codigo por email em cada login.
- Cadastro: solicitar email e senha, criar conta com Firebase Auth, enviar verificacao de email; negar acesso ao painel ate `emailVerified === true` e dominio exato `fab.mil.br`.
- Controles apenas no cliente **nao** impedem criacao de contas Firebase com dominios externos nem acesso direto aos arquivos publicos do GitHub Pages. Para restringir o cadastro no backend, configurar bloqueio de signup via Identity Platform blocking functions (se disponivel), ou backend de cadastro controlado, e regras de autorizacao para recursos protegidos.
- Nao ativar fluxo novo sem validar requisitos, custos e configuracao server-side. Preservar login legado e workflow Drive/GitHub ate corte autorizado.

## Aprovacao formal da estrategia

O responsavel aprovou: autocadastro para titulares de e-mail exatamente `@fab.mil.br`, verificacao do e-mail no primeiro acesso e logins posteriores com e-mail e senha. Nao exige segundo fator por e-mail em cada acesso. Aprovacao da estrategia **nao** equivale a autorizacao para ativar fluxo inseguro antes de controles e testes.

### Pre-requisitos de ativacao

1. Definir implementacao server-side para restringir o cadastro ao dominio institucional e controlar abuso; Firebase Auth Email/Password isolado nao faz isso.
2. Configurar dominio autorizado e templates de e-mail de verificacao e recuperacao.
3. Implementar pagina de cadastro/login com SDK Firebase, bloqueando liberacao antes de `emailVerified`.
4. Testar e-mail institucional valido, e-mail externo, nao verificado, senha incorreta, recuperacao, logout e persistencia.
5. Fazer corte somente depois de testes e plano de reversao. O login atual continua ativo ate entao.
