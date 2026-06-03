import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Route, Lock, CheckCircle2, PlayCircle, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface TrailCourse {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  lessons?: any[];
}

interface Trail {
  id: string;
  name: string;
  description?: string;
  targetGroup: string;
  isActive: boolean;
  courses: TrailCourse[];
}

interface EnrollmentProgress {
  courseId: string;
  completedCount: number;
  totalModules: number;
}

export function TrailsListPage() {
  const { user } = useAuth();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [progress, setProgress] = useState<Record<string, EnrollmentProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiRequest<Trail[]>("/trails"),
      apiRequest<EnrollmentProgress[]>("/enrollments/progress"),
    ])
      .then(([trailData, progressData]) => {
        const progressMap: Record<string, EnrollmentProgress> = {};
        for (const p of progressData) {
          progressMap[p.courseId] = p;
        }
        setProgress(progressMap);
        const filtered = trailData.filter(
          (t) => t.targetGroup === "all" || t.targetGroup === user.group
        );
        setTrails(filtered);
      })
      .catch(() => {
        setTrails([]);
        toast.error("Erro ao carregar trilhas");
      })
      .finally(() => setLoading(false));
  }, [user]);

  const isCourseComplete = (courseId: string, lessonCount: number) => {
    const prog = progress[courseId];
    const total = prog?.totalModules ?? lessonCount;
    const done = prog?.completedCount ?? 0;
    return total > 0 && done >= total;
  };

  const getTrailProgress = (trail: Trail) => {
    const total = trail.courses.length;
    if (total === 0) return 0;
    const completed = trail.courses.filter((c) =>
      isCourseComplete(c.id, (c.lessons || []).length)
    ).length;
    return Math.round((completed / total) * 100);
  };

  const isCourseUnlocked = (trail: Trail, index: number) => {
    if (index === 0) return true;
    const prev = trail.courses[index - 1];
    return prev ? isCourseComplete(prev.id, (prev.lessons || []).length) : false;
  };

  if (!user) return null;

  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
          <Route className="size-7 text-primary" /> Trilhas
        </h1>
        <p className="text-muted-foreground mt-1">
          Percursos de aprendizado sequenciais para {user.group === "vip" ? "VIPs" : "Embaixadores"}.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : trails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-16 rounded-2xl bg-gradient-card border border-border flex items-center justify-center">
            <Route className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Nenhuma trilha disponível</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ainda não há trilhas cadastradas para o seu perfil.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 stagger-children">
          {trails.map((trail) => {
            const trailPct = getTrailProgress(trail);
            const completedCount = trail.courses.filter((c) =>
              isCourseComplete(c.id, (c.lessons || []).length)
            ).length;

            return (
              <div key={trail.id} className="bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-elegant">
                {/* Cabeçalho da trilha */}
                <div className="p-5 border-b border-border/40">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="font-bold text-lg text-gradient">{trail.name}</h2>
                        <Badge variant="outline" className="border-border text-xs capitalize">
                          {trail.targetGroup === "all" ? "Todos" : trail.targetGroup}
                        </Badge>
                      </div>
                      {trail.description && (
                        <p className="text-sm text-muted-foreground">{trail.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-gradient">{trailPct}%</div>
                      <div className="text-xs text-muted-foreground">
                        {completedCount}/{trail.courses.length} cursos
                      </div>
                    </div>
                  </div>
                  <Progress value={trailPct} className="h-2 mt-3" />
                </div>

                {/* Cursos da trilha */}
                {trail.courses.length === 0 ? (
                  <div className="p-5 text-sm text-muted-foreground text-center">
                    Nenhum curso nesta trilha ainda.
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {trail.courses.map((c, i) => {
                      const unlocked = isCourseUnlocked(trail, i);
                      const complete = isCourseComplete(c.id, (c.lessons || []).length);
                      const prog = progress[c.id];
                      const lessonCount = (c.lessons || []).length;
                      const progPct = prog
                        ? Math.round(
                            (prog.completedCount /
                              Math.max(prog.totalModules, lessonCount, 1)) *
                              100
                          )
                        : 0;

                      const cardInner = (
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-smooth ${
                            complete
                              ? "border-success/20 bg-success/5"
                              : unlocked
                              ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
                              : "border-border/40 bg-muted/20 opacity-60"
                          }`}
                        >
                          {/* Ícone de status */}
                          <div
                            className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                              complete
                                ? "bg-success/20 text-success"
                                : unlocked
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {complete ? (
                              <CheckCircle2 className="size-5" />
                            ) : unlocked ? (
                              <PlayCircle className="size-5" />
                            ) : (
                              <Lock className="size-4" />
                            )}
                          </div>

                          {/* Thumbnail */}
                          {c.coverUrl && (
                            <div className="size-10 rounded-lg overflow-hidden shrink-0">
                              <img
                                src={`${API_BASE_URL}${c.coverUrl}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[11px] text-muted-foreground">
                                Etapa {i + 1}
                              </span>
                              {i === 0 && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                                  Início
                                </Badge>
                              )}
                            </div>
                            <div className="font-medium text-sm truncate">{c.title}</div>
                            {c.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {c.description}
                              </div>
                            )}
                            {unlocked && !complete && lessonCount > 0 && (
                              <Progress value={progPct} className="h-1 mt-1.5" />
                            )}
                          </div>

                          {/* Status badge / contagem */}
                          <div className="shrink-0 text-right">
                            {complete ? (
                              <Badge className="bg-success/20 text-success border-0 text-xs">
                                Concluído
                              </Badge>
                            ) : unlocked ? (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <GraduationCap className="size-3.5" />
                                {lessonCount} aula{lessonCount !== 1 ? "s" : ""}
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-border text-xs text-muted-foreground"
                              >
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                        </div>
                      );

                      return unlocked ? (
                        <Link key={c.id} to={`/cursos/${c.id}`} className="block">
                          {cardInner}
                        </Link>
                      ) : (
                        <div key={c.id}>{cardInner}</div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
