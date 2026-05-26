# 💼 Regras de Negócio & Fluxos de Processo

A **Universidade Suri** possui uma lógica de negócios estruturada para promover o engajamento através da gamificação, mantendo a integridade do progresso educacional, segurança robusta e um visual premium corporativo.

---

## 👥 1. Acesso Unificado & Tiers (VIP vs Embaixador)

O ecossistema é projetado com igualdade de oportunidades de aprendizado, mas com diferenciação estética e prestígio social:

### A. Divisão de Grupos e Tiers
*   **VIP (`vip`)**: Níveis focados em parceiros especiais e alta gerência.
    *   **Tiers**: `VIP BLUE`, `VIP CORE`, `VIP PLUS`.
    *   **Identidade Visual**: Tag e ícones com gradiente dourado/azul metálico (`Sparkles` ou `Star`).
*   **Embaixador (`embaixador`)**: Níveis voltados a influenciadores técnicos e membros ativos da marca.
    *   **Tiers**: `Embaixador Voice`, `Embaixador Elite`, `Embaixador Icon`.
    *   **Identidade Visual**: Tag e brasões em tons verde/azul neon (`Shield` ou `Trophy`).

### B. Criação e Nível Inicial
*   Durante a criação de conta ou envio de convites pelo administrador, é obrigatório definir o **tier** e o **nível inicial (Level)** do usuário.
*   Isso determina os bônus de XP base e o estilo visual de destaque na leaderboard.
*   **Avatar Customizado**: O sistema permite a geração ou inserção de avatares baseados em iniciais coloridas ou URLs personalizadas para garantir a expressão de identidade do aluno.

---

## 🛡️ 2. Controle de Acesso & Restrições de Segurança

Para proteger a integridade dos conteúdos educacionais e ações críticas:
1.  **Restrições Administrativas (Server-Side)**:
    *   Rotas críticas (como criação de cursos, exclusão, moderação e emissão manual de certificados) são protegidas no NestJS através de guardas JWT (`@UseGuards(AuthGuard('jwt'))`).
    *   O backend verifica explicitamente se o campo `isAdmin` é verdadeiro. Tentativas de acesso não autorizadas retornam `403 Forbidden`.
2.  **Segregação de Cursos (Target Group)**:
    *   Cada curso possui um atributo `targetGroup` (`'all'`, `'vip'`, `'embaixador'`).
    *   O aluno só consegue visualizar no seu catálogo e iniciar cursos permitidos para o seu grupo de perfil.
    *   A API backend valida essa correspondência antes de servir as aulas do curso.

---

## 📈 3. Aprendizado Linear e Antifraude (Aulas Sequenciais)

Garantia de que o processo de aprendizado seja consistente e verdadeiro:
1.  **Bloqueio de Módulos**:
    *   As aulas/módulos de um curso são ordenadas via `sortOrder`.
    *   O aluno só pode assistir à aula $N$ caso tenha marcado a aula $N-1$ como concluída no banco de dados (`module_progress`).
2.  **Validação de Presença/Estudo**:
    *   O botão **"Concluir Aula"** possui travas visuais no player.
    *   Ao clicar, a requisição envia o `enrollmentId` e `moduleId`, gerando o registro correspondente.
    *   Admins têm o poder de adicionar, editar e excluir aulas e módulos diretamente na aba de Cursos no Painel Administrativo.

---

## 💬 4. Comunidade Social e Submissão de Projetos

O engajamento social é impulsionado por um feed segmentado e dinâmico:
1.  **Feed Segmentado**:
    *   Os membros do grupo **VIP** interagem em um feed reservado de VIPs, enquanto **Embaixadores** possuem seu próprio feed exclusivo, isolados dinamicamente via `user.group` no banco de dados.
2.  **Curtidas e Comentários**:
    *   Os posts de projetos da comunidade contam com botões interativos de **Curtidas (Likes)** e contagem de **Comentários**.
    *   Cada publicação de projeto realizada com sucesso concede **+100 XP** ao usuário para gamificação.
3.  **Tratamento de Campos Vazios e Projetos**:
    *   A interface e a API tratam rigorosamente campos de entrega sem resposta. Projetos pendentes ou sem feedback de aprovação são exibidos de forma clara, aguardando avaliação no Painel Admin.

---

## 🎓 5. Sistema de Certificação Premium

Emissão segura com valor de mercado:
1.  **Emissão Automática**:
    *   Ocorre quando o progresso do aluno atinge **100%** de conclusão (aulas completadas = total de aulas da trilha).
    *   Gera um hash único alfanumérico estruturado (`SURI-AC-[HEX]`).
2.  **Emissão Manual (Substituição)**:
    *   No Painel Administrativo, o administrador pode clicar em **"Emitir Certificado"** manualmente para qualquer estudante matriculado (mesmo com progresso parcial). A interface altera dinamicamente para "Ver Certificado".
3.  **Compartilhamento e PDF**:
    *   Possibilidade de exportar em PDF formatado premium com as assinaturas da Universidade Suri.
    *   Integração direta com o botão de compartilhamento no **LinkedIn**.
4.  **Validação Pública**:
    *   Disponível via endpoint aberto `/certificates/validate/:code` e rota pública `/certificado/:code`. Qualquer recrutador pode verificar o nome do aluno, curso, carga horária e a data de emissão.

---

## 🏢 6. Identidade Visual (Padrão TOTVS) e Mobile

*   **Tema Claro (Snow Blue)** e **Tema Escuro (Night Blue)** integrados harmoniosamente.
*   **Estilo Corporativo TOTVS**: Inclusão de marcas d'água gigantes no background (`totvs.svg`) com baixa opacidade (`0.02` a `0.04`), rotação de `15deg` e transição suave, alinhada à paleta corporativa de azul e verde.
*   **Design Totalmente Responsivo**: Layouts e componentes estruturados com Tailwind flexbox/grid para adaptação perfeita a dispositivos móveis, barras de menu retráteis e fontes adaptativas de `13.5px` a `15px`.

---

## 📖 7. Documentação Técnica (Swagger)

*   A API backend expõe documentação autogerada via **Swagger** no caminho `/api-docs` (quando habilitado no bootstrap do NestJS).
*   Todos os DTOs, controladores de autenticação (`/auth`), cursos (`/courses`), matrículas (`/enrollments`) e certificados (`/certificates`) devem estar devidamente anotados com decoradores `@ApiTags`, `@ApiOperation` e `@ApiResponse`.
