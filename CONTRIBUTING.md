# Contribuindo para a Universidade Suri

Obrigado pelo seu interesse em contribuir para a plataforma! Siga as diretrizes abaixo para garantir qualidade e padronização no projeto.

---

## 1. Padrões de Código

- O projeto utiliza **TypeScript estrito**. Evite o uso de `any` ou `@ts-ignore` sem uma justificativa explícita documentada em comentários.
- Todos os arquivos utilizam `eslint` e `prettier`. Antes de commitar, execute o lint para correção automática.
- No backend, seguimos **Clean Architecture**. Respeite a separação entre `domain` e `infrastructure`.

## 2. Fluxo de Trabalho (Git Workflow)

1. Crie uma branch a partir de `main` com um nome descritivo:
   - `feature/nome-da-funcionalidade`
   - `fix/nome-da-correcao`
   - `refactor/nome-da-refatoracao`
2. Escreva testes para a nova funcionalidade (ou garanta que os testes antigos não quebrem).
3. Faça os commits seguindo a convenção **Conventional Commits** (ex: `feat: add user profile`, `fix: resolve login issue`).
4. Abra um Pull Request e preencha o Template do PR.

## 3. Checklist de Qualidade (Pré-PR)

Antes de abrir o seu PR, certifique-se de que os passos a seguir estão OK:

- [ ] Executei `npm run lint` no backend e frontend.
- [ ] Executei `npm run typecheck` no backend e frontend.
- [ ] Não deixei logs (`console.log`) de debug esquecidos.
- [ ] Se eu alterei o banco de dados (Prisma schema), incluí a nova pasta de migration gerada no PR.
- [ ] Se eu adicionei variáveis de ambiente, eu atualizei o arquivo `.env.example`.
- [ ] (Se aplicável) Testei as alterações de UI/UX em resoluções mobile, tablet e desktop.

## 4. Ambiente de Desenvolvimento Local

Veja o [README.md](README.md) na seção "Como Rodar o Projeto Localmente".
Dicas:
- O frontend roda na porta `5175` e espera que a API esteja em `localhost:3000`.
- Utilize o banco de dados local via `docker-compose up -d`.

---

Qualquer dúvida arquitetural, consulte a documentação na pasta `/docs`.
