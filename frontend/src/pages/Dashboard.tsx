import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { useCachedRequest } from "@/hooks/useCachedRequest";
import { usePlatformSettings } from "@/lib/settings";
import { UserAvatar } from "@/components/UserAvatar";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Flame, PlayCircle, Sparkles, Trophy, Users, Shield, BookOpen, GraduationCap, Award } from "lucide-react";
import { toast } from "sonner";

import { type Course } from "@/types";

interface LeaderboardEntry {
  id: string;
  name: string;
  group: string;
  tier: string;
  xp: number;
  level: number;
  profileImage?: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings } = usePlatformSettings();
  const showUserPhotos = settings.show_user_photos !== "false";

  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState(0);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const { data: leaderboardData } = useCachedRequest<LeaderboardEntry[]>(
    user && !user.isAdmin ? "/auth/leaderboard" : null,
    120,
  );

  const groupRanking: LeaderboardEntry[] = leaderboardData ?? [];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    Promise.all([
      apiRequest<{ count?: number; certificates?: unknown[] } | unknown[]>("/certificates/user").catch(() => ({ count: 0 })),
      apiRequest<any[]>("/courses").catch(() => []),
      apiRequest<any[]>("/enrollments/progress").catch(() => [])
    ]).then(([certData, coursesData, progressData]) => {
      const count = Array.isArray(certData)
        ? certData.length
        : (certData as any).count ?? (certData as any).certificates?.length ?? 0;
      setCertificates(count);

      const progressMap = new Map();
      progressData.forEach((p: any) => {
        progressMap.set(p.courseId, p);
      });

      const mapped: Course[] = coursesData.map((c: any) => {
        const prog = progressMap.get(c.id);
        const totalMod = prog?.totalModules || (c.lessons || []).length || 0;
        const completedCount = prog?.completedCount || 0;
        const progressPct = totalMod > 0 ? Math.round((completedCount / totalMod) * 100) : 0;

        return {
          id: c.id,
          title: c.title,
          description: c.description || "",
          cover: c.coverUrl || "from-marine to-deep",
          group: c.targetGroup || c.target_group || "all",
          progress: progressPct,
          lessons: (c.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            duration: l.duration || "10:00",
            youtubeId: l.videoUrl || "",
            done: prog?.completedModuleIds?.includes(l.id) || false,
          })),
        };
      });
      setCourses(mapped);
      setLoadingCourses(false);
    });
  }, [user, navigate]);

  if (!user) return null;

  const isVip = user.group === "vip";
  const isAdmin = user.group === "admin" || user.isAdmin;
  const isFirstLogin = user.isFirstLogin === true;
  const visibleCourses = courses.filter((c) => c.group === "all" || c.group === user.group);

  const journeySteps = courses.map((c) => ({
    id: c.id,
    title: c.title,
    progress: c.progress,
  }));

  const completedSteps = certificates;

  const stats = [
    {
      label: "Aulas Concluídas",
      value: completedSteps,
      icon: PlayCircle,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Certificados",
      value: certificates,
      icon: Award,
      color: "bg-success/10 text-success",
    },
    {
      label: "XP Acumulado",
      value: user.xp.toLocaleString(),
      icon: Sparkles,
      color: "bg-secondary/10 text-secondary",
    },
    {
      label: "Nível",
      value: user.level,
      icon: Flame,
      color: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <AppShell>
      {/* Hero & Stats */}
      <div className="mb-6 fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {isFirstLogin ? "Bem-vindo," : "Bem-vindo de volta,"}{" "}
          <span className="text-gradient" data-ph-mask="true">
            {user.name.split(" ")[0]}
          </span>
          !
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Painel de Administração da Plataforma Suri."
            : isFirstLogin
            ? "Comece sua jornada explorando os cursos disponíveis."
            : "Bora aprender novas coisas hoje?"}
        </p>
      </div>

      {!isAdmin && (
        <div className="mb-8 stagger-children">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((s) => (
              <article
                key={s.label}
                className="bg-gradient-card rounded-xl p-4 sm:p-5 border border-border shadow-elegant hover-lift transition-smooth"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}
                  >
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
                      {s.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                      {s.value}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Journey */}
      {!isAdmin && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-semibold">Jornada educacional</h2>
            <div className="flex items-center gap-3">
              <Link to="/roadmap" className="text-sm text-primary hover:text-primary/80 transition-smooth font-medium">
                🗺️ Ver Roadmap
              </Link>
              <Link to="/cursos" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">ver tudo →</Link>
            </div>
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
                            : current ? (
                                step.progress > 0
                                  ? <span className="text-secondary font-semibold">Em andamento</span>
                                  : <span className="text-primary font-semibold">Iniciar curso</span>
                              )
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
      <section className="grid lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {isAdmin ? "Explorar Cursos" : isFirstLogin ? "Comece por aqui" : "Continue assistindo"}
            </h2>
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
              {visibleCourses.filter(c => c.progress < 100).slice(0, 4).length > 0
                ? visibleCourses.filter(c => c.progress < 100).slice(0, 4).map((c) => {
                    const cardContent = (
                      <Card className="group bg-gradient-card border-border overflow-hidden hover:shadow-glow transition-smooth hover-lift h-full flex flex-col justify-between">
                        <div>
                          <div className={`aspect-video bg-gradient-to-br from-marine to-deep relative grid place-items-center overflow-hidden`}>
                            {c.cover && (c.cover.startsWith("http") || c.cover.startsWith("/")) ? (
                              <img src={c.cover.startsWith("http") ? c.cover : `${API_BASE_URL}${c.cover}`} alt={c.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                            ) : (
                              <div className={`absolute inset-0 bg-gradient-to-br ${c.cover} opacity-80`} />
                            )}
                            <div className="size-14 rounded-full bg-primary shadow-glow flex items-center justify-center group-hover:scale-110 transition-smooth border-2 border-primary/50 backdrop-blur-md relative z-10">
                              <svg viewBox="0 0 24 24" fill="white" className="size-6 ml-1">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                            {c.lessons.length > 0 && (
                              <Badge className="absolute top-3 right-3 bg-muted text-foreground border-0 text-[10px] relative z-10">
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
                            <div className="text-xs text-secondary font-semibold mt-1">Modo Admin (Sem progresso)</div>
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
                  })
                : visibleCourses.slice(0, 4).map((c) => {
                  const cardContent = (
                    <Card className="group bg-gradient-card border-border overflow-hidden hover:shadow-glow transition-smooth hover-lift h-full flex flex-col justify-between">
                      <div>
                        <div className={`aspect-video bg-gradient-to-br from-marine to-deep relative grid place-items-center overflow-hidden`}>
                          {c.cover && (c.cover.startsWith("http") || c.cover.startsWith("/")) ? (
                            <img src={c.cover.startsWith("http") ? c.cover : `${API_BASE_URL}${c.cover}`} alt={c.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${c.cover} opacity-80`} />
                          )}
                          <div className="size-14 rounded-full bg-primary shadow-glow flex items-center justify-center group-hover:scale-110 transition-smooth border-2 border-primary/50 backdrop-blur-md relative z-10">
                            <svg viewBox="0 0 24 24" fill="white" className="size-6 ml-1">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                          {c.lessons.length > 0 && (
                            <Badge className="absolute top-3 right-3 bg-muted text-foreground border-0 text-[10px] relative z-10">
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
                          <div className="text-xs text-secondary font-semibold mt-1">Modo Admin (Sem progresso)</div>
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
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-semibold">Top {isAdmin ? "Usuários" : isVip ? "VIPs" : "Embaixadores"}</h2>
            <Link to="/ranking" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">tudo →</Link>
          </div>
          <Card className="bg-gradient-card border-border divide-y divide-border">
            {groupRanking.slice(0, 5).map((r, idx) => (
              <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-muted/10 transition-smooth">
                <div className={`size-7 rounded-full grid place-items-center text-xs font-bold shrink-0
                  ${idx === 0 ? "bg-gradient-whats text-white" :
                    idx === 1 ? "bg-secondary/20 text-secondary" :
                    idx === 2 ? "bg-primary/20 text-primary" :
                    "bg-muted/80 text-foreground"}`}>
                  {idx + 1}
                </div>
                <UserAvatar
                  name={r.name}
                  profileImage={r.profileImage}
                  showPhoto={showUserPhotos}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{r.tier}</div>
                </div>
                <div className="text-sm font-bold text-gradient">{r.xp.toLocaleString()}</div>
              </div>
            ))}
            {groupRanking.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <Trophy className="size-6 mx-auto mb-2 opacity-40" />
                <Link to="/ranking" className="hover:text-foreground transition-smooth">Ver ranking completo →</Link>
              </div>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
