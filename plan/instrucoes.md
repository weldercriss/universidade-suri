# Registro de Pontos & Status de Correções

## ✅ Itens Resolvidos

### 1. Comentários não visíveis após postar
**Problema:** Após submeter um comentário, o painel se fechava e não exibia os comentários feitos.

**Causa raiz:** A visibilidade dos comentários existentes estava condicionada ao `commentingPostId`, que controla o painel de input. Fechar o painel de input escondia também a lista de comentários.

**Solução aplicada em `Community.tsx`:**
- A lista de comentários agora é exibida **sempre** quando `p.commentDetails.length > 0`, completamente independente do toggle de input.
- O painel de input (textarea + botões) é controlado separadamente por `commentingPostId`.
- O `fetchPosts()` agora é aguardado (`await`) **antes** de `setCommentingPostId(id)` para garantir que os dados estejam atualizados antes do re-render.

---

### 2. Dashboard mal formatado / certificados não exibindo
**Problema:** Os cards de estatísticas quebravam em mobile e o contador de certificados não era claramente visível.

**Solução aplicada em `Dashboard.tsx`:**
- Os 4 cards de stats foram refatorados usando um array `stats[]` com ícone, label e valor — eliminando código duplicado.
- Layout usa `grid-cols-2 lg:grid-cols-4` com `gap-3 sm:gap-4`, padding adaptativo `p-4 sm:p-5`.
- O título de boas-vindas usa `text-2xl sm:text-3xl` para não extrapolar em mobile.
- A contagem de certificados continua lendo `/certificates/user` → `.count`, que retorna corretamente do backend.

---

### 3. Anexo não aparece disponível ao publicar
**Problema:** Ao publicar com anexo (imagem, vídeo, documento ou link), o badge no composer exibia o conteúdo base64 completo e imagens grandes falhavam silenciosamente.

**Soluções aplicadas:**
- **`Community.tsx`:** Badge de mídia exibe apenas o tipo (`imagem anexado`, `vídeo anexado`) ou a URL truncada para links. Botão `×` permite remover o anexo antes de publicar.
- **`backend/src/main.ts`:** Limite de body aumentado para `8mb` usando `express.json({ limit: '8mb' })` antes do roteamento NestJS (`bodyParser: false` no create). Isso suporta imagens base64 de até ~6MB.

---

### 4. Paleta de cores não seguia o padrão
**Problema:** As variáveis CSS usavam valores de `Style.md` (Marine Blue/Suri Blue) em vez do `design-system.md` (Electric Blue + Neon Green).

**Solução aplicada em `styles.css`:**

| Variável | Antes (incorreto) | Depois (design-system.md) |
|---|---|---|
| `--background` (dark) | `233 87% 5%` | `236 100% 5%` |
| `--primary` (dark) | `234 100% 30%` | `245 100% 55%` (Azul Elétrico) |
| `--secondary` (dark) | `237 100% 65%` | `130 100% 45%` (Verde Neon) |
| `--card` (dark) | `233 87% 8%` | `236 80% 10%` |
| `--border` (dark) | `233 40% 20%` | `240 70% 30%` |
| `--background` (light) | `205 100% 95%` | `205 60% 97%` |
| `--primary` (light) | `234 100% 30%` | `200 90% 36%` |
| `--secondary` (light) | `237 100% 65%` | `200 85% 50%` (Ciano) |
| `--border` (light) | `205 50% 85%` | `210 25% 87%` |

O gradiente do `body` também foi atualizado: `primary/0.15` no topo direito + `secondary/0.05` no canto inferior esquerdo.

---

### 5. Login — remoção de SSO Google e Plataforma Suri
**Problema:** A tela de Login exibia botões "Google" e "Suri SSO" que não eram funcionais (simulações).

**Solução aplicada em `Login.tsx`:**
- Removidos: funções `loginWithGoogle()` e `loginWithSuri()`
- Removidos: imports `Chrome`, `Hexagon`, `apiRequest`, `toast` (não utilizados)
- Removida: seção completa de divider + grid com os 2 botões SSO
- Mantidos: apenas o formulário de e-mail + senha corporativo

---

## 🔄 Melhorias de Responsividade

### `app-shell.tsx`
- Header mobile reduzido para `h-14` (vs `h-16` desktop)
- Padding adaptativo: `px-3 md:px-8`
- Badge de tier oculta texto em telas muito pequenas
- Main content com `px-3 sm:px-4 md:px-8` e `py-5 md:py-8`
- Botão de tema: `size-8 md:size-9`

### `styles.css`
- Fonte em telas `<480px`: `13px`
- Chips decorativos do login ocultos em mobile (`display: none`)
- `btn-aurora` e `field-glass` levemente compactos em `<640px`

### `Community.tsx`
- Grid `lg:grid-cols-[1fr_300px]` (antes `320px`)
- Header com `text-2xl sm:text-3xl`

### `CoursePlayer.tsx`
- Grid com `gap-4 lg:gap-6`

---

## 📌 Pendências Conhecidas

- Upload de vídeo via base64 ainda pode ser lento para arquivos grandes. Recomendado futuramente usar URL de YouTube/Vimeo diretamente, como já suportado pelo player.
- Documentos anexados armazenam apenas o nome do arquivo (não o conteúdo). Para suporte completo, implementar upload para storage (S3/Supabase Storage).
- A validação de e-mail corporativo no cadastro (`SignUp.tsx`) é visual — não há regra de domínio aplicada no backend.
