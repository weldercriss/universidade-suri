import type { Step } from "react-joyride";

export const tourSteps: Step[] = [
  {
    target: "body",
    placement: "center",
    title: "Bem-vindo à Universidade Suri! 🎓",
    content:
      "Este guia rápido vai te mostrar os principais recursos da plataforma. Você pode fechar a qualquer momento e reabrir pelo botão '?' na barra lateral.",
  },
  {
    target: "[data-tour='sidebar-nav']",
    placement: "right",
    title: "Navegação",
    content:
      "Use o menu lateral para acessar todas as seções: Cursos, Trilhas, Roadmap, Ranking, Perfil e Configurações.",
  },
  {
    target: "[data-tour='nav-cursos']",
    placement: "right",
    title: "Cursos",
    content:
      "Aqui você encontra todos os cursos disponíveis para o seu grupo. Clique para se inscrever e começar a aprender.",
  },
  {
    target: "[data-tour='nav-trilhas']",
    placement: "right",
    title: "Trilhas de Aprendizado",
    content:
      "Trilhas agrupam cursos em uma jornada completa. Ao concluir todos os cursos de uma trilha e passar no exame final, você recebe um certificado.",
  },
  {
    target: "[data-tour='nav-ranking']",
    placement: "right",
    title: "Ranking",
    content:
      "Acompanhe sua posição no ranking de XP entre os membros do seu grupo. Quanto mais você aprender, mais XP você acumula.",
  },
  {
    target: "[data-tour='gamification-link']",
    placement: "right",
    title: "Regras de Gamificação",
    content:
      "Clique aqui para ver como ganhar XP, progredir nos tiers e subir de nível. Cada ação na plataforma tem um valor em XP!",
  },
  {
    target: "[data-tour='xp-bar']",
    placement: "bottom",
    title: "Seu progresso",
    content:
      "Aqui você acompanha seu XP atual, nível e tier. Complete cursos, publique posts e passe nos exames de trilha para subir!",
  },
  {
    target: "[data-tour='tour-btn']",
    placement: "right",
    title: "Rever o Tour",
    content:
      "Sempre que precisar, clique neste botão '?' para ver o tour novamente. Bons estudos! 🚀",
  },
];
