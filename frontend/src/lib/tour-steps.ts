import type { Step } from "react-joyride";

/**
 * Registro de tours por tela. Cada chave é um `pageId` resolvido a partir da rota
 * (ver `pageIdFromPath`). Cada tela tem seu próprio tour, disparado pelo botão "?"
 * contextual no header do AppShell.
 *
 * Cada step de boas-vindas usa `target: "body"` + `placement: "center"` (sempre funciona).
 * Os demais steps apontam para `[data-tour='...']` de elementos que sempre renderizam
 * naquela tela (header/hero/abas), evitando que o tour trave em elementos condicionais.
 */
export const pageTours: Record<string, Step[]> = {
  dashboard: [
    {
      target: "body",
      placement: "center",
      title: "Bem-vindo à Universidade Suri! 🎓",
      content:
        "Este é o seu painel. Cada tela tem seu próprio guia rápido — sempre que vir o botão '?' no topo, clique para conhecer aquela parte da plataforma.",
    },
    {
      target: "[data-tour='dash-hero']",
      placement: "bottom",
      title: "Seu ponto de partida",
      content:
        "Aqui você vê um resumo da sua jornada e atalhos para continuar de onde parou.",
    },
    {
      target: "[data-tour='dash-stats']",
      placement: "bottom",
      title: "Seus números",
      content:
        "Acompanhe seu XP, nível, cursos concluídos e certificados conquistados num relance.",
    },
  ],
  cursos: [
    {
      target: "body",
      placement: "center",
      title: "Cursos & Jornada 📚",
      content:
        "Aqui ficam todos os cursos disponíveis para o seu grupo. Inscreva-se e comece a aprender.",
    },
    {
      target: "[data-tour='cursos-header']",
      placement: "bottom",
      title: "Buscar cursos",
      content:
        "Use o ícone de lupa para pesquisar um curso pelo nome rapidamente.",
    },
    {
      target: "[data-tour='cursos-tabs']",
      placement: "bottom",
      title: "Meus Cursos x Catálogo",
      content:
        "Alterne entre os cursos em que já está inscrito e o catálogo completo disponível para você.",
    },
  ],
  "curso-player": [
    {
      target: "body",
      placement: "center",
      title: "Player do curso 🎬",
      content:
        "É aqui que você assiste às aulas, acompanha seu progresso e faz a prova ao final.",
    },
    {
      target: "[data-tour='player-hero']",
      placement: "bottom",
      title: "Capa do curso",
      content:
        "Use 'Assistir' / 'Continuar' para ir direto à aula, ou 'Detalhes' para ver a descrição completa.",
    },
    {
      target: "[data-tour='player-tabs']",
      placement: "bottom",
      title: "Aulas, Comunidade, Projetos e Prova",
      content:
        "Navegue entre as aulas, converse na comunidade, envie projetos e faça a prova final do curso por estas abas.",
    },
  ],
  trilhas: [
    {
      target: "body",
      placement: "center",
      title: "Trilhas de Aprendizado 🛤️",
      content:
        "Trilhas agrupam cursos numa jornada sequencial. Conclua todos os cursos e passe no exame final para receber um certificado.",
    },
    {
      target: "[data-tour='trilhas-tabs']",
      placement: "bottom",
      title: "Minhas trilhas x Catálogo",
      content:
        "Veja as trilhas em que está inscrito ou explore novas trilhas disponíveis para o seu grupo.",
    },
  ],
  roadmap: [
    {
      target: "body",
      placement: "center",
      title: "Roadmaps 🗺️",
      content:
        "Rotas de aprendizado curadas que mostram, passo a passo, por onde seguir em cada área.",
    },
    {
      target: "[data-tour='roadmap-header']",
      placement: "bottom",
      title: "Siga a rota",
      content:
        "Escolha um roadmap e avance pelos nós na ordem sugerida para evoluir de forma estruturada.",
    },
  ],
  ranking: [
    {
      target: "body",
      placement: "center",
      title: "Ranking 🏆",
      content:
        "Acompanhe sua posição no ranking de XP entre os membros do seu grupo. Quanto mais você aprende, mais sobe.",
    },
    {
      target: "[data-tour='ranking-header']",
      placement: "bottom",
      title: "Os destaques",
      content:
        "O pódio mostra os três primeiros colocados; a lista abaixo traz a classificação completa da temporada.",
    },
  ],
  gamificacao: [
    {
      target: "body",
      placement: "center",
      title: "Regras de Gamificação ⚡",
      content:
        "Entenda como ganhar XP, subir de nível e progredir nos tiers. Cada ação na plataforma tem um valor!",
    },
    {
      target: "[data-tour='gam-header']",
      placement: "bottom",
      title: "Como pontuar",
      content:
        "Aqui estão todas as regras de XP e a progressão de tiers — use como referência para evoluir mais rápido.",
    },
  ],
  perfil: [
    {
      target: "body",
      placement: "center",
      title: "Seu Perfil 👤",
      content:
        "Veja seus dados, conquistas e certificados. É a sua identidade dentro da Universidade Suri.",
    },
    {
      target: "[data-tour='perfil-hero']",
      placement: "bottom",
      title: "Seu cartão",
      content:
        "Avatar, tier, XP e nível ficam reunidos aqui no topo do seu perfil.",
    },
  ],
  configuracoes: [
    {
      target: "body",
      placement: "center",
      title: "Configurações ⚙️",
      content:
        "Gerencie sua conta, foto de perfil, tema e senha. Personalize a plataforma do seu jeito.",
    },
    {
      target: "[data-tour='config-header']",
      placement: "bottom",
      title: "Suas preferências",
      content:
        "Atualize sua foto, dados da conta e a senha de acesso por aqui, com segurança.",
    },
  ],
};

/**
 * Mapeia o pathname da rota atual para o `pageId` do tour correspondente.
 * Retorna `null` quando a tela não possui tour cadastrado (o botão "?" não aparece).
 */
export function pageIdFromPath(pathname: string): string | null {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/cursos") return "cursos";
  if (pathname.startsWith("/cursos/")) return "curso-player";
  if (pathname === "/trilhas") return "trilhas";
  if (pathname === "/roadmap") return "roadmap";
  if (pathname === "/ranking") return "ranking";
  if (pathname === "/gamificacao") return "gamificacao";
  if (pathname === "/perfil") return "perfil";
  if (pathname === "/configuracoes") return "configuracoes";
  return null;
}
