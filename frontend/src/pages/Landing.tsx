import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { PlayCircle, ArrowRight, CheckCircle2, ChevronRight, GraduationCap, Users, Layout, Moon, Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Cursos mockados para exibir no preview da página inicial
const PREVIEW_COURSES = [
  {
    id: "1",
    title: "Gestão Ágil de Projetos",
    description: "Aprenda a aplicar Scrum e Kanban no dia a dia da sua equipe de forma prática e direta.",
    cover: "from-cyan-500 to-blue-500",
    lessons: 12,
  },
  {
    id: "2",
    title: "Liderança na Prática",
    description: "Desenvolva habilidades essenciais para liderar equipes de alta performance no mundo corporativo.",
    cover: "from-indigo-500 to-purple-500",
    lessons: 8,
  },
  {
    id: "3",
    title: "Transformação Digital",
    description: "Entenda o impacto da tecnologia e como modernizar processos e modelos de negócio.",
    cover: "from-orange-500 to-red-500",
    lessons: 15,
  },
  {
    id: "4",
    title: "Comunicação Efetiva",
    description: "Técnicas de oratória e comunicação interpessoal para se destacar no ambiente de trabalho.",
    cover: "from-emerald-500 to-teal-500",
    lessons: 10,
  },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "snow-blue";

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-gradient-hero shadow-glow grid place-items-center">
                <GraduationCap className="size-4 text-snow" />
              </div>
              <span className="font-display text-xl font-bold text-gradient tracking-tight">
                Universidade Suri
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#solucoes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Soluções</a>
              <a href="#cursos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Cursos</a>
              <a href="#plataforma" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">A Plataforma</a>
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
              <Button variant="ghost" asChild className="hidden sm:inline-flex font-semibold">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-gradient-hero text-snow border-border hover:shadow-glow font-bold">
                <Link to="/signup">Comece agora</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
          <img src="/src/assets/totvs.svg" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 w-full max-w-[1200px] pointer-events-none" alt="" aria-hidden="true" />
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-3xl fade-in-up">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
                <span className="flex size-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                A nova forma de aprender na prática
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                Transforme conhecimento em <span className="text-gradient">resultados reais.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                A plataforma completa de educação corporativa para desenvolver as habilidades 
                que o mercado mais valoriza, com metodologia eficiente e certificação oficial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-base bg-gradient-hero text-snow shadow-glow hover:shadow-lg transition-all">
                  <Link to="/signup">Criar conta grátis <ArrowRight className="ml-2 size-5" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-border bg-background/50">
                  <Link to="/login">Já tenho uma conta</Link>
                </Button>
              </div>
              <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Sem cartão de crédito</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Certificado incluso</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs - Platform Information */}
        <section id="plataforma" className="py-24 bg-muted/30 border-y border-border/50">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-up" style={{ animationDelay: '0.2s' }}>
              {PREVIEW_COURSES.map((course) => (
                <Card key={course.id} className="group flex flex-col h-full overflow-hidden border-border bg-card shadow-elegant hover:shadow-glow transition-all duration-300">
                  <div className={`h-40 w-full bg-gradient-to-br ${course.cover} relative flex items-center justify-center p-6`}>
                    <PlayCircle className="size-12 text-white/90 drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {course.description}
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
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-b from-transparent to-primary/5 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-gradient-hero rounded-3xl p-8 md:p-16 text-center shadow-glow overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('/src/assets/noise.png')] opacity-10 mix-blend-overlay"></div>
              <h2 className="text-3xl md:text-5xl font-bold text-snow mb-6 relative z-10">Pronto para dar o próximo passo?</h2>
              <p className="text-snow/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto relative z-10">
                Junte-se a milhares de profissionais que já transformaram suas carreiras com a Universidade Suri.
              </p>
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-muted font-bold text-lg h-14 px-10 relative z-10 shadow-lg">
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
              <div className="flex items-center gap-2 mb-4">
                <div className="size-6 rounded bg-primary/20 grid place-items-center">
                  <GraduationCap className="size-3 text-primary" />
                </div>
                <span className="font-display font-semibold text-foreground">Universidade Suri</span>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
