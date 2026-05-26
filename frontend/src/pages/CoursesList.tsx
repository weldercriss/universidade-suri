import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { type Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlayCircle, Lock, CheckCircle2, Search, Filter } from "lucide-react";
import { toast } from "sonner";

export function CoursesListPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "newest" | "popular" | "free">("all");

  useEffect(() => {
    if (!user) return;
    apiRequest<any[]>("/courses")
      .then((data) => {
        const mapped: Course[] = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description || "",
          cover: "from-marine to-deep",
          group: c.targetGroup || c.target_group || "all",
          progress: 0,
          lessons: (c.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            duration: "10:00",
            youtubeId: l.videoUrl || "",
            done: false,
          })),
        }));
        setCourses(mapped);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const isAdmin = user.group === "admin" || user.isAdmin;

  const visible = courses
    .filter((c) => c.group === "all" || c.group === user.group)
    .filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  const completed = 0;
  const journeySteps = courses.map((c) => ({
    id: c.id,
    title: c.title,
    type: "curso",
  }));

  const filters = [
    { key: "all", label: "Todos" },
    { key: "newest", label: "Mais novo" },
    { key: "popular", label: "Popular" },
    { key: "free", label: "Gratuito" },
  ] as const;

  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Cursos & Jornada</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? "Catálogo de cursos cadastrados na plataforma." : `Trilha completa para ${user.group === "vip" ? "VIPs" : "Embaixadores"}.`}
        </p>
      </header>

      {/* Jornada */}
      {!isAdmin && (
        <section className="fade-in-up">
          <h2 className="text-lg font-semibold mb-4">Sua trilha</h2>
          <div className="space-y-2 stagger-children">
            {journeySteps.map((step, i) => {
              const done = i < completed;
              const current = i === completed;
              return (
                <Card key={step.id} className="bg-gradient-card border-border p-4 flex items-center gap-4 shadow-elegant hover-lift">
                  <div className={`size-10 rounded-full grid place-items-center
                    ${done ? "bg-success/20 text-success" : current ? "bg-primary/30 text-snow shadow-glow" : "bg-muted text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="size-5" /> : current ? <PlayCircle className="size-5" /> : <Lock className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Etapa {i + 1}</div>
                    <div className="font-medium">{step.title}</div>
                  </div>
                  <Badge variant="outline" className="capitalize border-border">{step.type}</Badge>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Grid de cursos */}
      <section className="mt-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold">Todos os cursos</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cursos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-muted/30 border-border h-10 w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border
                ${activeFilter === f.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground hover:bg-muted/50 border-border"}`}
            >
              {f.label}
              {f.key === "all" && <span className="ml-1.5 text-xs opacity-80">({courses.length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-gradient-card border-border p-5 animate-pulse">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-16 h-16 bg-muted/30 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-4 bg-muted/30 rounded w-1/3" />
                    <div className="h-3 bg-muted/20 rounded w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4 stagger-children">
            {visible.map((c) => {
              const cardContent = (
                <Card className="group bg-gradient-card border-border p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-200 shadow-elegant">
                  <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 min-w-0">
                      <div className={`w-16 h-16 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br ${c.cover} relative overflow-hidden`}>
                        <PlayCircle className="size-8 text-white/80 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate">{c.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 truncate">{c.description || "Aprenda e domine este conteúdo completo."}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.group !== "all" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 uppercase">
                              {c.group}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                            {c.lessons.length} aulas
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                      {!isAdmin ? (
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="hidden md:block text-right w-24">
                            <div className="text-sm font-medium text-foreground">{c.progress}%</div>
                            <Progress value={c.progress} className="h-1.5 mt-1" />
                          </div>
                          <button className="flex-1 md:flex-none cursor-pointer rounded-lg font-bold transition-colors duration-200 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 text-sm whitespace-nowrap">
                            {c.progress > 0 ? "Continuar" : "Detalhes"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <span className="text-sm font-medium text-amber-500 whitespace-nowrap">Modo Admin</span>
                          <button disabled className="flex-1 md:flex-none cursor-not-allowed opacity-50 rounded-lg font-bold bg-muted text-muted-foreground px-4 py-2.5 text-sm whitespace-nowrap">
                            Detalhes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );

              return isAdmin ? (
                <div key={c.id} onClick={() => toast.info("Administradores não realizam cursos.")}>
                  {cardContent}
                </div>
              ) : (
                <Link key={c.id} to={`/cursos/${c.id}`} className="block">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <Card className="bg-gradient-card border-border p-12 text-center text-muted-foreground shadow-elegant">
            <Search className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">Nenhum curso encontrado</p>
            <p className="text-sm mt-1">Tente outro termo de busca ou verifique os filtros.</p>
          </Card>
        )}
      </section>
    </AppShell>
  );
}
