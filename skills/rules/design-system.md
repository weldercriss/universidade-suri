# 🎨 Design System & Identidade Visual

O design da **Universidade Suri** é moderno, imersivo, fluido e altamente responsivo. Ele utiliza elementos de alta fidelidade para criar uma experiência cativante (wow-factor) para os estudantes, mesclando tons profundos de azul marinho com gradientes neon, efeitos de vidro (Glassmorphism) e micro-animações.

---

## 🎨 1. Temas Dinâmicos e Cores (HSL & Hex)

Todas as cores principais são declaradas de forma modular no arquivo global de estilos `frontend/src/styles.css`, utilizando o formato **HSL** para controle dinâmico de opacidades. Há suporte completo ao chaveamento de temas salvos em `localStorage`:

### A. Tema Escuro (Night Blue) — Padrão (:root)
Projetado para ambientes de baixa luminosidade, oferecendo um contraste futurista premium.
*   **Fundo da Aplicação (`--background`)**: `236 100% 5%` (Azul marinho ultra profundo).
*   **Texto Principal (`--foreground`)**: `0 0% 100%` (Branco Puro).
*   **Destaque Primário (`--primary`)**: `245 100% 55%` (Azul elétrico vibrante).
*   **Destaque Secundário (`--secondary`)**: `130 100% 45%` (Verde neon / WhatsApp).
*   **Fundo dos Cartões (`--card`)**: `236 80% 10%` (Translucidez azul escura).
*   **Bordas (`--border`)**: `240 70% 30%` (Azul de contraste).

### B. Tema Claro (Snow Blue) — (:root.light)
Projetado para ambientes iluminados, com tons suaves e descansados.
*   **Fundo da Aplicação (`--background`)**: `205 60% 97%` (Azul gélido suave).
*   **Texto Principal (`--foreground`)**: `220 30% 15%` (Azul escuro corporativo).
*   **Destaque Primário (`--primary`)**: `200 90% 36%` (Azul clássico).
*   **Destaque Secundário (`--secondary`)**: `200 85% 50%` (Ciano luminoso).
*   **Fundo dos Cartões (`--card`)**: `0 0% 100%` (Branco sólido).
*   **Bordas (`--border`)**: `210 25% 87%` (Cinza claro suave).

---

## ✍️ 2. Tipografia e Escala de Fonte Inteligente

*   **Fonte Principal**: `'Sora', sans-serif`. Importada do Google Fonts, oferece traços geométricos arredondados perfeitos para interfaces modernas de tecnologia.
*   **Densidade Visual Responsiva**:
    *   Para maximizar a densidade de dados apresentados nos dashboards administrativos e de cursos, a escala base do elemento `html` é fixada em **`13.5px`** por padrão (zoom global de `~85%`).
    *   Em telas de altíssima resolução (`min-width: 1536px`), a escala é expandida para **`15px`** para garantir conforto ocular e total legibilidade.

```css
html {
  font-size: 13.5px;
}

@media (min-width: 1536px) {
  html {
    font-size: 15px;
  }
}
```

---

## 🔮 3. Classes de Efeito Premium e Gradientes

O arquivo de estilos global disponibiliza utilitários Tailwind customizados para manter a consistência visual:

1.  **Fundo Gradiente Radial (`body`)**:
    *   Gradiente radial superior direito (`hsl(245 100% 50% / 0.15)`) combinado a um gradiente inferior esquerdo (`hsl(130 100% 45% / 0.05)`) estáticos e fixos no plano de fundo.
2.  **Cards Glassmorphism (`.bg-gradient-card`)**:
    *   Combina gradientes inclinados de fundo a um filtro de desfoque (`backdrop-filter: blur(16px)`) e bordas semitransparentes, simulando placas de vidro flutuantes.
3.  **Gradientes de Texto (`.text-gradient`)**:
    *   Texto dourado/esbranquiçado no tema escuro e azul profundo elegante no tema claro.
4.  **Elevação de Hover (`.hover-lift`)**:
    *   Transição suave tridimensional de transformação que eleva levemente o card (`translateY(-4px)`) e adiciona uma sombra neon cintilante (`shadow-glow`).

---

## 🏢 4. Marca d'Água Corporativa (TOTVS)

Para integrar a plataforma à identidade corporativa TOTVS de forma discreta e elegante:
*   **Especificações da Marca d'Água (`.watermark-bg`)**:
    *   Utiliza a logo `/totvs.svg` fixada no canto inferior direito (`bottom: -5%`, `right: -5%`).
    *   Carga visual de altíssima sutileza: **opacidade de `0.025`** para não interferir na leitura de textos.
    *   **Rotação de `15deg`** no eixo Z.
    *   **Animação de Carregamento**: Efeito suave de *fade-in* (`watermark-fade-in`) de `2.5s` ao abrir cada página.

---

## 🛡️ 5. Biblioteca de Ícones

*   Uso exclusivo de **`lucide-react`**, que oferece ícones vetoriais limpos e consistentes com bordas arredondadas que combinam com o design da tipografia Sora.
