import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { usePlatformSettings } from "@/lib/settings";
import { PlayCircle, ArrowRight, CheckCircle2, ChevronRight, Users, Layout, Moon, Sun, GraduationCap, FileText, MessageSquare, BookOpen, Link as LinkIcon, ArrowUp, ChevronDown, Newspaper } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/api";
import { ChangelogModal, useChangelogBadge } from "@/components/ChangelogModal";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";
import suriBlue from "@/assets/icons/suri-blue.svg";
import suriWhite from "@/assets/icons/suri-white.svg";
import fotoPh from "@/assets/img/foto-ph.png";
import noiseBg from "@/assets/noise.png";

// Gradientes de fallback usados quando o curso não possui capa cadastrada
const GRADIENT_COVERS = [
  "from-cyan-500 to-blue-500",
  "from-indigo-500 to-purple-500",
  "from-orange-500 to-red-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-yellow-500",
];

interface PreviewCourse {
  id: string;
  title: string;
  description: string;
  coverUrl?: string | null;
  lessons: number;
}

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const isLight = theme === "snow-blue";
  const [courses, setCourses] = useState<PreviewCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { latestVersion, hasNew, markSeen } = useChangelogBadge();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/courses/public`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PreviewCourse[]) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button onClick={scrollToTop} className="cursor-pointer">
                <img
                  src={isLight ? (settings?.logo_expanded_light ? `${API_BASE_URL}${settings.logo_expanded_light}` : suriBlue) : (settings?.logo_expanded_dark ? `${API_BASE_URL}${settings.logo_expanded_dark}` : suriWhite)}
                  alt="Universidade Suri"
                  className="h-8 w-auto"
                />
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#sobre" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sobre</a>
              <a href="#cursos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cursos</a>
              <a href="#instrutores" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Instrutores</a>
              
              {/* Dropdown Soluções */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-4">
                  Soluções <ChevronDown className="ml-1 size-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-[calc(100%-1rem)] left-1/2 -translate-x-1/2 w-[600px] xl:w-[700px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pt-6 z-50">
                  <Card className="flex flex-col md:flex-row overflow-hidden border-border bg-card shadow-elegant">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                      <a href="https://www.suri.ai/plataforma" target="_blank" rel="noopener noreferrer" className="group/item block space-y-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/40 flex items-center justify-center border border-border/50 group-hover/item:border-primary/50 transition-colors shadow-sm">
                          <Layout className="size-10 text-primary/60 group-hover/item:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1 group-hover/item:text-primary transition-colors">Plataforma</h4>
                          <p className="text-xs text-muted-foreground mb-2">Uma única ferramenta para centralizar e automatizar seu atendimento</p>
                          <span className="text-xs text-primary font-medium flex items-center">Saiba mais <ArrowRight className="size-3 ml-1" /></span>
                        </div>
                      </a>

                      <a href="https://www.suri.ai/integracoes" target="_blank" rel="noopener noreferrer" className="group/item block space-y-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border border-border/50 group-hover/item:shadow-glow transition-all shadow-sm">
                          <LinkIcon className="size-10 text-white/80 group-hover/item:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1 group-hover/item:text-primary transition-colors">Integrações</h4>
                          <p className="text-xs text-muted-foreground mb-2">A Suri se uniu às melhores plataformas do mercado.</p>
                          <span className="text-xs text-primary font-medium flex items-center">Saiba mais <ArrowRight className="size-3 ml-1" /></span>
                        </div>
                      </a>
                    </div>
                    <div className="w-full md:w-56 bg-muted/20 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/50">
                      <div className="space-y-4">
                        <a href="https://www.suri.ai/varejo" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-medium hover:text-primary transition-colors">
                          Varejo <ChevronRight className="size-4" />
                        </a>
                        <a href="https://www.suri.ai/servicos" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-medium hover:text-primary transition-colors">
                          Serviços <ChevronRight className="size-4" />
                        </a>
                      </div>
                      <Button variant="outline" size="sm" className="mt-8 w-full bg-background border-border hover:bg-muted" asChild>
                        <a href="https://www.suri.ai" target="_blank" rel="noopener noreferrer">Acessar Site</a>
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Dropdown Conteúdo */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-4">
                  Conteúdo <ChevronDown className="ml-1 size-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-[calc(100%-1rem)] left-1/2 -translate-x-1/2 w-[600px] xl:w-[700px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pt-6 z-50">
                  <Card className="flex flex-col md:flex-row overflow-hidden border-border bg-card shadow-elegant">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                      <a href="https://www.suri.ai/blog" target="_blank" rel="noopener noreferrer" className="group/item block space-y-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-slate-100 to-gray-50 dark:from-slate-900 dark:to-gray-900 flex items-center justify-center border border-border/50 group-hover/item:border-primary/50 transition-colors shadow-sm relative overflow-hidden">
                          <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1"><MessageSquare className="size-3 text-white" /></div>
                          <BookOpen className="size-10 text-muted-foreground/60 group-hover/item:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1 group-hover/item:text-primary transition-colors">Blog</h4>
                          <p className="text-xs text-muted-foreground mb-2">Fique por dentro das dicas, estratégias e tendências em Chatbots e IA</p>
                          <span className="text-xs text-primary font-medium flex items-center">Saiba mais <ArrowRight className="size-3 ml-1" /></span>
                        </div>
                      </a>

                      <a href="https://www.suri.ai/materiais" target="_blank" rel="noopener noreferrer" className="group/item block space-y-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-900/30 flex items-center justify-center border border-border/50 group-hover/item:border-primary/50 transition-colors shadow-sm">
                          <FileText className="size-10 text-orange-500/60 group-hover/item:scale-110 transition-transform" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1 group-hover/item:text-primary transition-colors">Materiais</h4>
                          <p className="text-xs text-muted-foreground mb-2">Materiais gratuitos para você aprender tudo sobre vendas e IA</p>
                          <span className="text-xs text-primary font-medium flex items-center">Saiba mais <ArrowRight className="size-3 ml-1" /></span>
                        </div>
                      </a>
                    </div>
                    <div className="w-full md:w-48 bg-muted/20 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/50">
                      <div className="space-y-4">
                        <a href="https://www.suri.ai/midia" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm font-medium hover:text-primary transition-colors">
                          Saiu na mídia <ChevronRight className="size-4" />
                        </a>
                      </div>
                      <Button variant="outline" size="sm" className="mt-8 w-full bg-background border-border hover:bg-muted" asChild>
                        <a href="https://www.suri.ai/conteudo" target="_blank" rel="noopener noreferrer">Ver todos</a>
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
              
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleTheme}
                className="text-foreground/70 hover:text-foreground hidden sm:flex"
              >
                {isLight ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
              <Button variant="ghost" asChild className="hidden sm:inline-flex font-semibold hover:bg-primary/10 transition-all duration-200">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-gradient-hero text-snow border-0 shadow-md hover:shadow-glow hover:scale-[1.03] font-bold transition-all duration-300">
                <Link to="/signup">Comece agora</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 min-h-screen flex items-center justify-center overflow-hidden">
          <img
            src={isLight
              ? (settings?.logo_collapsed_dark ? `${API_BASE_URL}${settings.logo_collapsed_dark}` : totvsLight)
              : (settings?.logo_collapsed_light ? `${API_BASE_URL}${settings.logo_collapsed_light}` : totvsDark)
            }
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none select-none rotate-[20deg] ${
              isLight
                ? "opacity-[0.12] max-w-[1400px]"
                : "opacity-[0.04] max-w-[1200px]"
            }`}
            alt=""
            aria-hidden="true"
          />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                Aprenda na prática com quem faz na vida real
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Transforme conhecimento em resultados reais.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 text-base bg-gradient-hero text-snow shadow-glow hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
                  <Link to="/signup">Criar conta grátis <ArrowRight className="ml-2 size-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className={`w-full sm:w-auto h-14 px-10 text-base font-semibold transition-all duration-300 hover:scale-[1.03] ${
                  isLight
                    ? "border-foreground/20 bg-white/80 text-foreground hover:bg-white hover:border-primary hover:text-primary shadow-sm hover:shadow-md"
                    : "border-border/60 bg-white/5 text-snow hover:bg-white/10 hover:border-primary/60 shadow-sm hover:shadow-md"
                }`}>
                  <Link to="/login">Já tenho uma conta</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs - Platform Information */}
        <section id="sobre" className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 fade-in-up">
              <h2 className="text-3xl font-bold text-foreground mb-4">Tudo o que você precisa em um só lugar</h2>
              <p className="text-muted-foreground text-lg">
                Explore as funcionalidades desenhadas para acelerar o aprendizado e engajar alunos e equipes.
              </p>
            </div>

            <Tabs defaultValue="alunos" className="max-w-4xl mx-auto fade-in-up" style={{ animationDelay: '0.1s' }}>
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto mb-12 p-1 bg-background/50 border border-border">
                <TabsTrigger value="alunos" className="py-3 text-base data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <GraduationCap className="size-4 mr-2" /> Para Alunos
                </TabsTrigger>
                <TabsTrigger value="empresas" className="py-3 text-base data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Users className="size-4 mr-2" /> Para Empresas
                </TabsTrigger>
                <TabsTrigger value="tecnologia" className="py-3 text-base data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Layout className="size-4 mr-2" /> A Tecnologia
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="alunos" className="mt-0 outline-none">
                <Card className="p-8 md:p-12 bg-gradient-card border-border shadow-elegant flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-2xl font-bold">Jornada de aprendizado gamificada</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Evolua na sua carreira ganhando XP, subindo de nível e desbloqueando conquistas à medida que conclui cursos. Nosso ambiente de aprendizado foi desenhado para te manter motivado do início ao fim.
                    </p>
                    <ul className="space-y-3">
                      {["Trilhas personalizadas", "Certificados de conclusão", "Comunidade para dúvidas e networking"].map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/20 p-1"><CheckCircle2 className="size-3 text-primary" /></div>
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full relative">
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-cyan-accent/20 border border-border/50 shadow-inner flex items-center justify-center">
                      <Layout className="size-16 text-primary/50" />
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="empresas" className="mt-0 outline-none">
                <Card className="p-8 md:p-12 bg-gradient-card border-border shadow-elegant flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-2xl font-bold">Gestão completa de treinamento corporativo</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Acompanhe o desenvolvimento dos seus colaboradores com painéis administrativos completos. Crie turmas, emita relatórios de engajamento e direcione o aprendizado da sua equipe de forma estratégica.
                    </p>
                    <ul className="space-y-3">
                      {["Dashboard de analytics avançado", "Controle de acessos e permissões", "Criação de trilhas obrigatórias"].map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/20 p-1"><CheckCircle2 className="size-3 text-primary" /></div>
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="tecnologia" className="mt-0 outline-none">
                <Card className="p-8 md:p-12 bg-gradient-card border-border shadow-elegant flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-2xl font-bold">Plataforma rápida, moderna e segura</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Construída com as melhores tecnologias do mercado para garantir estabilidade mesmo com milhares de acessos simultâneos. Player de vídeo otimizado e design responsivo para aprender de qualquer dispositivo.
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Course Previews */}
        <section id="cursos" className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-end justify-between mb-12 gap-6 fade-in-up">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold text-foreground mb-4">Cursos em destaque</h2>
                <p className="text-muted-foreground text-lg">
                  Conheça alguns dos conteúdos exclusivos que esperam por você na plataforma.
                </p>
              </div>
              <Button variant="outline" className="shrink-0 border-border" asChild>
                <Link to="/signup">Ver todos os cursos <ChevronRight className="ml-1 size-4" /></Link>
              </Button>
            </div>


            {loadingCourses ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="flex flex-col h-full overflow-hidden border-border bg-card shadow-elegant animate-pulse">
                    <div className="h-40 w-full bg-muted/40" />
                    <div className="p-6 flex flex-col flex-1 gap-3">
                      <div className="h-4 bg-muted/40 rounded w-3/4" />
                      <div className="h-3 bg-muted/30 rounded w-full" />
                      <div className="h-3 bg-muted/30 rounded w-2/3" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <PlayCircle className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum curso disponível no momento.</p>
                <p className="text-sm mt-1">Em breve novos conteúdos serão publicados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
                {courses.map((course, index) => (
                  <Card key={course.id} className="group flex flex-col h-full overflow-hidden border-border bg-card shadow-elegant hover:shadow-glow transition-all duration-300">
                    <div className={`h-40 w-full relative flex items-center justify-center p-6 ${course.coverUrl ? "" : `bg-gradient-to-br ${GRADIENT_COVERS[index % GRADIENT_COVERS.length]}`}`}>
                      {course.coverUrl ? (
                        <img src={`${API_BASE_URL}${course.coverUrl}`} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : null}
                      <PlayCircle className="relative size-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {course.description || "Conteúdo exclusivo da Universidade Suri."}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{course.lessons} Aulas</span>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 -mr-2" asChild>
                          <Link to="/signup">Acessar</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </section>

        {/* Instrutores */}
        <section id="instrutores" className="py-24 bg-muted/20 border-t border-border/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 fade-in-up">
              <h2 className="text-3xl font-bold text-foreground mb-4">Conheça alguns de nossos Instrutores</h2>
              <p className="text-muted-foreground text-lg">
                Aprenda com especialistas que vivenciam na prática os desafios do mercado de atendimento e IA.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  foto: fotoPh,
                  nome: "Felipe Godoy",
                  titulo: "CEO & Co-Founder da Suri",
                },
                {
                  foto: fotoPh,
                  nome: "Instrutor 2",
                  titulo: "Especialista em IA",
                },
                {
                  foto: fotoPh,
                  nome: "Instrutor 3",
                  titulo: "Head de Vendas",
                },
                {
                  foto: fotoPh,
                  nome: "Instrutor 4",
                  titulo: "Especialista em Atendimento",
                },
              ].map((instrutor, i) => (
                <Card key={i} className="group p-6 text-center border-border bg-card shadow-elegant hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                  <div className="relative size-28 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-cyan-accent to-primary opacity-60 group-hover:opacity-100 transition-opacity duration-300 blur-[2px]" />
                    <div className="relative size-28 rounded-full overflow-hidden border-2 border-background shadow-lg">
                      <img 
                        src={instrutor.foto} 
                        alt={instrutor.nome} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{instrutor.nome}</h3>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wider">{instrutor.titulo}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-b from-transparent to-primary/5 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`max-w-4xl mx-auto rounded-3xl p-8 md:p-16 text-center shadow-glow overflow-hidden relative ${isLight ? "bg-deep" : "bg-snow"}`}>
              <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: `url(${noiseBg})` }}></div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-6 relative z-10 ${isLight ? "text-snow" : "text-deep"}`}>Pronto para dar o próximo passo?</h2>
              <p className={`text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10 ${isLight ? "text-snow/80" : "text-deep/80"}`}>
                Junte-se a milhares de profissionais que já transformaram suas carreiras com a Universidade Suri.
              </p>
              <Button asChild size="lg" className={`font-bold text-lg h-14 px-10 relative z-10 shadow-lg border-0 ${isLight ? "bg-snow text-deep hover:bg-snow/90" : "bg-deep text-snow hover:bg-deep/90"}`}>
                <Link to="/signup">Comece a aprender agora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src={isLight ? (settings?.logo_expanded_light ? `${API_BASE_URL}${settings.logo_expanded_light}` : suriBlue) : (settings?.logo_expanded_dark ? `${API_BASE_URL}${settings.logo_expanded_dark}` : suriWhite)}
                  alt="Universidade Suri"
                  className="h-7 w-auto opacity-80"
                />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                A plataforma de educação corporativa pensada para resultados reais.
                Evolua sua carreira e seus negócios.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Navegação</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-primary transition-colors">Entrar</Link></li>
                <li><Link to="/signup" className="hover:text-primary transition-colors">Criar conta</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center md:text-left text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} Universidade Suri. Todos os direitos reservados.</p>
            {latestVersion && (
              <button
                onClick={() => { setChangelogOpen(true); markSeen(); }}
                className="relative inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Newspaper className="size-3.5" />
                <span>v{latestVersion}</span>
                {hasNew && (
                  <span className="absolute -top-1 -right-1 size-2 rounded-full bg-secondary ring-2 ring-background" />
                )}
              </button>
            )}
          </div>
        </div>
      </footer>

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />

      {/* Botão de voltar ao topo */}
      <Button
        size="icon"
        onClick={scrollToTop}
        className={`fixed bottom-24 right-8 z-50 rounded-full shadow-glow bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="size-5" />
      </Button>
    </div>
  );
}
