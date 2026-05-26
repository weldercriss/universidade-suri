import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Flame, PlayCircle, Sparkles, Trophy, Users, Shield, BookOpen, GraduationCap, Award } from "lucide-react";
import { toast } from "sonner";

import { type Course } from "@/types";



export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch real courses from API
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
      .catch(() => {
        setCourses([]);
      })
      .finally(() => setLoadingCourses(false));
  }, [user, navigate]);

  if (!user) return null;

  const isVip = user.group === "vip";
  const isAdmin = user.group === "admin" || user.isAdmin;
  const visibleCourses = courses.filter((c) => c.group === "all" || c.group === user.group);
  const feed: any[] = [];
  const groupRanking: any[] = [];

  const journeySteps = courses.map((c) => ({
    id: c.id,
    title: c.title,
  }));

  const completedSteps = 0; // In a real app, this would be calculated based on user progress

  return (
    <AppShell>
      {/* Hero & Stats */}
      <div className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Bem-vindo de volta, <span className="text-gradient" data-ph-mask="true">{user.name.split(" ")[0]}</span>!
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Painel de Administração da Plataforma Suri."
            : "Bora aprender novas coisas hoje?"}
        </p>
      </div>

      {!isAdmin && (
        <div className="mb-8 stagger-children">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <article className="bg-gradient-card rounded-lg p-5 border border-border shadow-elegant hover-lift transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                  <PlayCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aulas Concluídas</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{completedSteps}</p>
                </div>
              </div>
            </article>

            <article className="bg-gradient-card rounded-lg p-5 border border-border shadow-elegant hover-lift transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-success/10 text-success">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Certificados</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">0</p>
                </div>
              </div>
            </article>

            <article className="bg-gradient-card rounded-lg p-5 border border-border shadow-elegant hover-lift transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-secondary/10 text-secondary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">XP Acumulado</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{user.xp.toLocaleString()}</p>
                </div>
              </div>
            </article>

            <article className="bg-gradient-card rounded-lg p-5 border border-border shadow-elegant hover-lift transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nível</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{user.level}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* Journey */}
      {!isAdmin && (
        <section className="mt-10">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-semibold">Jornada educacional</h2>
            <Link to="/cursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">ver tudo →</Link>
          </div>
          <Card className="bg-gradient-card border-border p-2">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 stagger-children">
              {journeySteps.map((step, i) => {
                const done = i < completedSteps;
                const current = i === completedSteps;
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border transition-smooth hover-lift
                      ${done ? "bg-success/10 border-success/30" :
                         current ? "bg-primary/15 border-primary/40 pulse-glow" :
                         "bg-background/40 border-border"}`}
                  >
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                      Etapa {i + 1}
                    </div>
                    <div className="mt-1 text-sm font-medium leading-tight">{step.title}</div>
                    <div className="mt-3 text-[11px]">
                      {done ? <span className="text-success font-semibold">Concluído</span>
                            : current ? <span className="text-secondary font-semibold">Em andamento</span>
                            : <span className="text-muted-foreground">Bloqueado</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      )}

      {/* Continue assistindo + ranking */}
      <section className="grid lg:grid-cols-3 gap-6 mt-10">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-semibold">{isAdmin ? "Explorar Cursos" : "Continue assistindo"}</h2>
            <Link to="/cursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">ver tudo →</Link>
          </div>
          {loadingCourses ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-gradient-card border-border overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted/30" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-2 bg-muted/20 rounded w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 stagger-children">
              {visibleCourses.slice(0, 4).map((c) => {
                const cardContent = (
                  <Card className="group bg-gradient-card border-border overflow-hidden hover:shadow-glow transition-smooth hover-lift h-full flex flex-col justify-between">
                    <div>
                      <div className={`aspect-video bg-gradient-to-br ${c.cover} relative grid place-items-center`}>
                        {/* Play Button matching image: solid electric blue with white triangle */}
                        <div className="size-14 rounded-full bg-[#1E00FF] shadow-glow flex items-center justify-center group-hover:scale-110 transition-smooth border-2 border-[#1E00FF]/50 backdrop-blur-md">
                          <svg viewBox="0 0 24 24" fill="white" className="size-6 ml-1">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        {c.lessons.length > 0 && (
                          <Badge className="absolute top-3 right-3 bg-black/50 text-white border-0 text-[10px]">
                            {c.lessons.length} aulas
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="font-medium hover:text-gradient transition-smooth">{c.title}</div>
                      </div>
                    </div>
                    <div className="p-4 pt-0">
                      {!isAdmin ? (
                        <>
                          <Progress value={c.progress} className="mt-1 h-1.5" />
                          <div className="text-xs text-muted-foreground mt-2">{c.progress}% concluído</div>
                        </>
                      ) : (
                        <div className="text-xs text-amber-500 font-semibold mt-1">Modo Admin (Sem progresso)</div>
                      )}
                    </div>
                  </Card>
                );

                return isAdmin ? (
                  <div key={c.id} onClick={() => toast.info("Administradores não realizam cursos.")} className="cursor-not-allowed">
                    {cardContent}
                  </div>
                ) : (
                  <Link key={c.id} to={`/cursos/${c.id}`}>
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-semibold">Top {isAdmin ? "Usuários" : isVip ? "VIPs" : "Embaixadores"}</h2>
            <Link to="/ranking" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">tudo →</Link>
          </div>
          <Card className="bg-gradient-card border-border divide-y divide-border">
            {groupRanking.slice(0, 5).map((r, idx) => (
              <div key={r.name} className="flex items-center gap-3 p-3 hover:bg-muted/10 transition-smooth">
                <div className={`size-7 rounded-full grid place-items-center text-xs font-bold
                  ${idx === 0 ? "bg-gradient-whats text-white" :
                    idx === 1 ? "bg-secondary/20 text-secondary" :
                    idx === 2 ? "bg-amber-500/20 text-amber-500" :
                    "bg-muted/80 text-foreground"}`}>
                  {idx + 1}
                </div>
                <div className="size-9 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                  {r.avatar && r.avatar.startsWith('data:image/') ? (
                    <img src={r.avatar} alt="Avatar" className="size-full object-cover" />
                  ) : r.avatar && r.avatar.includes('<svg') ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: r.avatar }} />
                  ) : (
                    r.avatar?.match(/^[A-Z]{2,}$/) ? r.avatar.substring(0, 2) : (r.avatar || "👤")
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.tier}</div>
                </div>
                <div className="text-sm font-bold text-gradient">{r.xp.toLocaleString()}</div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* Feed preview */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold">Projetos da comunidade</h2>
          <Link to="/projetos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">ir ao feed →</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4 stagger-children">
          {feed.map((p) => (
            <Card key={p.id} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow">{p.author.avatar}</div>
                <div>
                  <div className="text-sm font-medium">{p.author.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.author.tier} · {p.createdAt}</div>
                </div>
              </div>
              <div className="mt-4 font-semibold hover:text-gradient transition-smooth">{p.title}</div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.body}</p>
              <div className="mt-4 text-xs text-muted-foreground flex gap-4">
                <span>♡ {p.likes}</span>
                <span>💬 {p.comments}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
