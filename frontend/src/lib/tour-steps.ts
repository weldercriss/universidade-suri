import type { Step } from "react-joyride";

/**
 * Registro de tours por tela. Cada chave é um `pageId` resolvido a partir da rota
 * (ver `pageIdFromPath`). Cada tela tem seu próprio tour, disparado pelo botão "?"
 * contextual no header do AppShell.
 *
 * Cada step de boas-vindas/encerramento usa `target: "body"` + `placement: "center"`
 * (sempre funciona). Os demais steps apontam para `[data-tour='...']` de elementos que
 * SEMPRE renderizam naquela tela para o usuário (header/hero/abas/cards fixos), evitando
 * que o tour trave em elementos condicionais. Não ancore em elementos que só aparecem
 * após carregamento, em estados vazios, ou que ficam ocultos no mobile (ex.: a sidebar).
 */
export const pageTours: Record<string, Step[]> = {
  dashboard: [
    {
      target: "body",
      placement: "center",
      title: "Bem-vindo à Universidade Suri! 🎓",
      content:
        "Vamos fazer um tour rápido pelo seu painel. Cada tela da plataforma tem seu próprio guia — sempre que vir o botão '?' no topo, clique para conhecer aquela área. Use 'Próximo' para avançar e 'Pular' para sair quando quiser.",
    },
    {
      target: "[data-tour='dash-hero']",
      placement: "bottom",
      title: "Seu ponto de partida",
      content:
        "Aqui ficam suas boas-vindas e um resumo da sua jornada. É o primeiro lugar que você vê ao entrar — pense nele como a sua 'tela inicial' de aprendizado.",
    },
    {
      target: "[data-tour='dash-stats']",
      placement: "bottom",
      title: "Seus números",
      content:
        "Acompanhe num relance seu XP acumulado, seu nível atual, os cursos já concluídos e os certificados conquistados. Esses indicadores crescem conforme você avança na plataforma.",
    },
    {
      target: "[data-tour='xp-bar']",
      placement: "bottom",
      title: "Nível e XP sempre à vista",
      content:
        "No topo de qualquer tela você vê seu nível e seu total de XP. Você ganha XP concluindo aulas, cursos, provas e participando da comunidade — quanto mais XP, mais alto o seu nível e o seu tier.",
    },
    {
      target: "[data-tour='dash-journey']",
      placement: "auto",
      title: "Sua jornada educacional",
      content:
        "Esta trilha mostra, etapa por etapa, por onde você está passando. Cada bloco indica se a etapa está concluída, em andamento ou ainda bloqueada — siga a ordem para evoluir de forma estruturada.",
    },
    {
      target: "[data-tour='dash-continue']",
      placement: "auto",
      title: "Continue de onde parou",
      content:
        "Aqui aparecem os cursos que você começou mas ainda não terminou, ao lado de um resumo do ranking. É o atalho mais rápido para voltar a aprender sem precisar procurar o curso de novo.",
    },
    {
      target: "body",
      placement: "center",
      title: "Pronto para começar! 🚀",
      content:
        "Use o menu lateral (ou o botão de menu no celular) para navegar entre Cursos, Trilhas, Roadmap, Ranking e mais. E lembre-se: o botão '?' no topo abre um tour específico de cada tela sempre que precisar.",
    },
  ],
  cursos: [
    {
      target: "body",
      placement: "center",
      title: "Cursos & Jornada 📚",
      content:
        "Esta é a sua biblioteca de cursos. Aqui ficam todos os conteúdos disponíveis para o seu grupo — inscreva-se, assista às aulas e acompanhe seu progresso até concluir.",
    },
    {
      target: "[data-tour='cursos-header']",
      placement: "bottom",
      title: "Buscar um curso",
      content:
        "Clique no ícone de lupa para pesquisar um curso pelo nome. Útil quando o catálogo cresce e você quer ir direto ao ponto.",
    },
    {
      target: "[data-tour='cursos-tabs']",
      placement: "bottom",
      title: "Meus Cursos x Catálogo",
      content:
        "Na aba 'Meus Cursos' ficam os cursos em que você já está inscrito; em 'Catálogo' você encontra todos os cursos disponíveis para o seu grupo. O número ao lado mostra quantos cursos há em cada lista.",
    },
    {
      target: "body",
      placement: "center",
      title: "Como funciona cada card",
      content:
        "Cada card de curso mostra a capa, o título e uma barra de progresso. Clique para abrir o curso, inscrever-se (se ainda não estiver) e começar a assistir às aulas.",
    },
    {
      target: "body",
      placement: "center",
      title: "Conclua e seja recompensado 🏅",
      content:
        "Ao concluir um curso você ganha XP e, quando aplicável, um certificado. Os cursos concluídos passam a contar nos seus números do painel e te ajudam a subir no ranking.",
    },
  ],
  "curso-player": [
    {
      target: "body",
      placement: "center",
      title: "Player do curso 🎬",
      content:
        "É aqui que a aprendizagem acontece: você assiste às aulas, conversa com a comunidade, envia projetos e faz a prova final. Vamos conhecer cada parte.",
    },
    {
      target: "[data-tour='player-hero']",
      placement: "bottom",
      title: "Capa e ações do curso",
      content:
        "No topo você vê a capa, o título, os instrutores e sua barra de progresso. Use 'Assistir' / 'Continuar' para ir direto à aula, ou 'Detalhes' para ler a descrição completa do curso.",
    },
    {
      target: "[data-tour='player-tabs']",
      placement: "bottom",
      title: "Navegação por abas",
      content:
        "Por estas abas você alterna entre Aulas, Comunidade, Projetos, Prova e Detalhes. Todo o conteúdo do curso está organizado aqui — vamos ver o que há em cada uma.",
    },
    {
      target: "[data-tour='player-tabs']",
      placement: "bottom",
      title: "Aba Aulas ▶️",
      content:
        "É onde você assiste aos vídeos. A lista de aulas fica ao lado, e seu progresso é marcado automaticamente conforme você avança. Assista na ordem para não perder nada.",
    },
    {
      target: "[data-tour='player-tabs']",
      placement: "bottom",
      title: "Comunidade & Projetos 💬",
      content:
        "Na aba 'Comunidade' você troca ideias e tira dúvidas com outros alunos. Em 'Projetos' você envia os trabalhos práticos do curso para colocar o que aprendeu em ação.",
    },
    {
      target: "[data-tour='player-tabs']",
      placement: "bottom",
      title: "Prova final 📝",
      content:
        "Depois de concluir as aulas, faça a prova na aba 'Prova'. Ao ser aprovado você libera o certificado do curso e ganha o XP correspondente. Um indicador aparece na aba quando você já passou.",
    },
    {
      target: "body",
      placement: "center",
      title: "Bom curso! ✨",
      content:
        "Avance pelas aulas no seu ritmo, participe da comunidade e não esqueça da prova ao final. Seu progresso é salvo automaticamente — você pode voltar quando quiser.",
    },
  ],
  trilhas: [
    {
      target: "body",
      placement: "center",
      title: "Trilhas de Aprendizado 🛤️",
      content:
        "Trilhas reúnem vários cursos numa jornada sequencial e temática. São o caminho recomendado para dominar uma área do começo ao fim, sem ter que montar a sequência sozinho.",
    },
    {
      target: "[data-tour='trilhas-header']",
      placement: "bottom",
      title: "O que são as trilhas",
      content:
        "Cada trilha é um percurso curado especialmente para o seu grupo. Você avança curso a curso, na ordem definida, construindo conhecimento de forma progressiva.",
    },
    {
      target: "[data-tour='trilhas-tabs']",
      placement: "bottom",
      title: "Minhas Trilhas x Catálogo",
      content:
        "Em 'Minhas Trilhas' ficam as trilhas em que você já se inscreveu; em 'Catálogo' você explora e se inscreve em novas trilhas disponíveis. O contador mostra quantas há em cada lista.",
    },
    {
      target: "body",
      placement: "center",
      title: "Conclusão e exame final 🎓",
      content:
        "Para concluir uma trilha você precisa finalizar todos os cursos dela e ser aprovado no exame final. Ao passar, você recebe o certificado da trilha — uma conquista de peso no seu perfil.",
    },
    {
      target: "body",
      placement: "center",
      title: "Escolha sua trilha",
      content:
        "Comece pelo catálogo, inscreva-se na trilha que combina com seus objetivos e siga os cursos na ordem. Conte com a trilha para te guiar — é só avançar.",
    },
  ],
  roadmap: [
    {
      target: "body",
      placement: "center",
      title: "Roadmaps 🗺️",
      content:
        "Roadmaps são rotas de aprendizado curadas que mostram, passo a passo, por onde seguir em cada área. Diferente das trilhas (que são cursos da plataforma), o roadmap aponta também conteúdos e referências externas.",
    },
    {
      target: "[data-tour='roadmap-header']",
      placement: "bottom",
      title: "Escolha um roadmap",
      content:
        "Selecione o roadmap da área que você quer desenvolver. Ao abrir, ele se transforma num mapa vertical com etapas numeradas, do 'Início' até a etapa 'Concluído'.",
    },
    {
      target: "body",
      placement: "center",
      title: "Siga os nós na ordem",
      content:
        "Cada nó do roadmap é uma etapa recomendada. Avance de cima para baixo, na sequência sugerida, para evoluir de forma estruturada e sem pular bases importantes.",
    },
    {
      target: "body",
      placement: "center",
      title: "Tipos de conteúdo",
      content:
        "As etapas têm tipos diferentes — vídeo, documento ou referência — identificados por cor e ícone. Ao clicar em uma etapa, o conteúdo abre em uma nova aba para você estudar.",
    },
    {
      target: "body",
      placement: "center",
      title: "Trace sua rota",
      content:
        "Use os roadmaps como um mapa de estudos complementar aos cursos e trilhas. Escolha uma área, siga a rota e volte sempre que quiser conferir o próximo passo.",
    },
  ],
  ranking: [
    {
      target: "body",
      placement: "center",
      title: "Ranking 🏆",
      content:
        "O ranking mostra como você se compara aos outros membros do seu grupo em XP. É uma forma divertida de acompanhar sua evolução e se motivar a aprender mais.",
    },
    {
      target: "[data-tour='ranking-header']",
      placement: "bottom",
      title: "A temporada atual",
      content:
        "Aqui você vê os destaques da sua comunidade nesta temporada. A pontuação é baseada no XP que cada pessoa acumulou com suas atividades na plataforma.",
    },
    {
      target: "body",
      placement: "center",
      title: "O pódio 🥇🥈🥉",
      content:
        "Os três primeiros colocados aparecem em destaque no pódio, com avatar, tier, XP e nível. É o lugar de honra de quem mais se dedicou no período.",
    },
    {
      target: "body",
      placement: "center",
      title: "A classificação completa",
      content:
        "Abaixo do pódio vem a lista com as demais posições. Para subir, é simples: conclua cursos, passe em provas, participe da comunidade — cada ação rende XP e te impulsiona no ranking.",
    },
    {
      target: "body",
      placement: "center",
      title: "Bora subir? 📈",
      content:
        "O ranking é atualizado conforme você acumula XP. Mantenha o ritmo de estudos e acompanhe sua escalada a cada temporada.",
    },
  ],
  gamificacao: [
    {
      target: "body",
      placement: "center",
      title: "Regras de Gamificação ⚡",
      content:
        "A plataforma usa XP, níveis e tiers para reconhecer seu progresso. Esta tela é o seu manual: aqui você entende exatamente como cada coisa funciona e como evoluir mais rápido.",
    },
    {
      target: "[data-tour='gam-header']",
      placement: "bottom",
      title: "Seu resumo de gamificação",
      content:
        "No topo você confere seu XP atual, seu nível, seu tier e quanto falta para o próximo nível. É o ponto de referência da sua evolução.",
    },
    {
      target: "[data-tour='gam-xp']",
      placement: "auto",
      title: "Como ganhar XP",
      content:
        "Esta seção lista todas as ações que rendem pontos e o valor de cada uma — concluir aulas, cursos, provas e mais. Cada curso também concede um XP definido pelo administrador.",
    },
    {
      target: "[data-tour='gam-niveis']",
      placement: "auto",
      title: "Progressão de nível",
      content:
        "A cada 1.000 XP acumulados você sobe um nível. A tabela mostra a faixa de XP de cada nível e destaca em qual você está agora.",
    },
    {
      target: "body",
      placement: "center",
      title: "Tiers e grupos",
      content:
        "Além do nível, você evolui em tiers conforme acumula XP dentro do seu grupo (VIP ou Embaixador). Os blocos de tiers mostram a faixa de XP de cada um e destacam o seu tier atual.",
    },
    {
      target: "body",
      placement: "center",
      title: "Use como referência",
      content:
        "Sempre que quiser saber como acelerar sua evolução, volte aqui. Foque nas ações que valem mais XP e acompanhe seu avanço de nível e tier.",
    },
  ],
  perfil: [
    {
      target: "body",
      placement: "center",
      title: "Seu Perfil 👤",
      content:
        "Este é o seu espaço pessoal na Universidade Suri. Aqui ficam reunidos seus dados, sua evolução e suas conquistas — é a sua identidade dentro da plataforma.",
    },
    {
      target: "[data-tour='perfil-hero']",
      placement: "bottom",
      title: "Seu cartão de identidade",
      content:
        "No topo ficam seu avatar, nome, tier e os principais números: XP, nível e certificados. Um resumo rápido de quem você é na plataforma.",
    },
    {
      target: "[data-tour='perfil-jornada']",
      placement: "auto",
      title: "Progresso da jornada",
      content:
        "Acompanhe aqui o avanço da sua jornada educacional: quantas etapas você já concluiu e quais ainda estão pela frente. Uma visão clara do seu caminho.",
    },
    {
      target: "[data-tour='perfil-certificados']",
      placement: "auto",
      title: "Seus certificados",
      content:
        "Todos os certificados que você conquistou em cursos e trilhas ficam reunidos nesta seção. Eles são a prova das suas conquistas — e acumulam com o tempo.",
    },
    {
      target: "body",
      placement: "center",
      title: "Personalize quando quiser",
      content:
        "Para alterar sua foto, seus dados ou sua senha, vá em Configurações. Seu perfil reflete automaticamente tudo que você conquista pela plataforma.",
    },
  ],
  configuracoes: [
    {
      target: "body",
      placement: "center",
      title: "Configurações ⚙️",
      content:
        "Aqui você personaliza sua conta e suas preferências na Universidade Suri. Vamos ver o que dá para ajustar.",
    },
    {
      target: "[data-tour='config-header']",
      placement: "bottom",
      title: "Central de preferências",
      content:
        "Esta é a área onde você gerencia tudo que diz respeito à sua conta — de forma simples e segura.",
    },
    {
      target: "[data-tour='config-foto']",
      placement: "auto",
      title: "Foto de perfil",
      content:
        "Envie ou troque sua foto de perfil (JPG, PNG ou WEBP, até 5 MB). A imagem é recortada em círculo e aparece no seu perfil, no ranking e na comunidade.",
    },
    {
      target: "[data-tour='config-conta']",
      placement: "auto",
      title: "Informações pessoais",
      content:
        "Atualize seu nome e sua empresa por aqui. O e-mail é o seu identificador de acesso e não pode ser alterado. Não esqueça de clicar em 'Salvar'.",
    },
    {
      target: "[data-tour='config-notificacoes']",
      placement: "auto",
      title: "Notificações",
      content:
        "Escolha sobre o que você quer ser avisado: novas aulas, atualizações da jornada, atividade na comunidade e conquistas. Ative ou desative cada tipo como preferir.",
    },
    {
      target: "body",
      placement: "center",
      title: "Tudo no seu controle",
      content:
        "Quando terminar de ajustar, suas preferências já valem para toda a plataforma. Para encerrar a sessão, use 'Sair da Conta' na seção Conta.",
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
