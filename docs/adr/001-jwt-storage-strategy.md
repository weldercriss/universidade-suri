# ADR 001 — Estratégia de Armazenamento JWT

**Data:** 2025-05-26
**Status:** Aceito

---

## Contexto

A plataforma Universidade Suri precisa autenticar usuários via JWT (JSON Web Tokens). É necessário definir **onde** armazenar os tokens no frontend de forma segura, equilibrando segurança e experiência do usuário.

### Opções Consideradas

| Opção | Segurança | UX |
|---|---|---|
| `localStorage` | ❌ Vulnerável a XSS — qualquer script malicioso pode ler o token | ✅ Persiste entre abas e reloads |
| `sessionStorage` | ❌ Vulnerável a XSS | ⚠️ Perdido ao fechar aba |
| Memória (variável JS) + cookie httpOnly | ✅ Imune a XSS | ⚠️ Access token perdido ao fechar aba |

## Decisão

Adotamos a estratégia **access token em memória + refresh token em cookie httpOnly**:

- **Access Token** (15 min): armazenado em estado JavaScript (Zustand store). Nunca persiste em storage.
- **Refresh Token** (7 dias): enviado pelo backend como cookie `httpOnly`, `secure`, `sameSite: strict`.

### Fluxo

```
1. Login → Backend retorna access_token no body + refresh_token em Set-Cookie
2. Frontend guarda access_token em memória (Zustand)
3. A cada request → Authorization: Bearer <access_token>
4. Access token expira → Frontend chama POST /auth/refresh
5. Backend valida cookie → Retorna novo access_token
6. Usuário fecha aba → access_token é perdido
7. Usuário reabre → Frontend tenta POST /auth/refresh com cookie → Se válido, nova sessão
```

## Consequências

### Positivas
- **Imune a XSS**: JavaScript não consegue acessar o refresh token (httpOnly)
- **Sessão longa**: Refresh token permite manter o usuário logado por 7 dias
- **Token curto**: Access token de 15 min limita a janela de exposição em caso de vazamento

### Negativas
- **Complexidade**: Requer endpoint de refresh e lógica de renovação automática
- **Perda de sessão ao fechar aba**: Mitigado pelo refresh token no cookie
- **CSRF**: Cookie httpOnly requer proteção contra CSRF (mitigado por `sameSite: strict`)

## Referências

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- Código: `frontend/src/lib/auth.tsx` e `backend/src/infrastructure/http/controllers/auth.controller.ts`
