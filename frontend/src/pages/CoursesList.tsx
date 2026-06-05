import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { type Course } from "@/types";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlayCircle, Lock, CheckCircle2, Search, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EnrollmentProgress {
  courseId: string;
  completedCount: number;
  totalModules: number;
}

export function CoursesListPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, EnrollmentProgress>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"meus" | "catalogo">("meus");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchProgress = async () => {
    const progressList = await apiRequest<EnrollmentProgress[]>("/enrollments/progress");
    const progressMap: Record<string, EnrollmentProgress> = {};
    for (const p of progressList) {
      progressMap[p.courseId] = p;
    }
    return progressMap;
  };

  useEffect(() => {
    if (!user) return;

    const isAdminUser = user.group === "admin" || user.isAdmin;

    Promise.all([
      apiRequest<any[]>("/courses"),
      isAdminUser ? Promise.resolve([] as EnrollmentProgress[]) : apiRequest<EnrollmentProgress[]>("/enrollments/progress"),
    ])
      .then(([data, progressList]) => {
        const progressMap: Record<string, EnrollmentProgress> = {};
        for (const p of progressList) {
          progressMap[p.courseId] = p;
        }
        setCourseProgress(progressMap);

        const mapped: Course[] = data.map((c: any) => {
          const totalLessons = (c.lessons || []).length;
          const prog = progressMap[c.id];
          const completedCount = prog?.completedCount ?? 0;
          const progressPct =
            totalLessons > 0
              ? Math.round((completedCount / totalLessons) * 100)
              : prog && prog.totalModules > 0
                ? Math.round((prog.completedCount / prog.totalModules) * 100)
                : 0;

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
              done: false,
            })),
          };
        });
        setCourses(mapped);
      })
      .catch(() => {
        setCourses([]);
        setCourseProgress({});
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await apiRequest(`/enrollments/${courseId}/join`, { method: "POST" });
      toast.success("Inscrição realizada! Acesse em Meus Cursos.");
      const progressMap = await fetchProgress();
      setCourseProgress(progressMap);
      setActiveTab("meus");
    } catch {
      toast.error("Erro ao realizar inscrição.");
    } finally {
      setEnrollingId(null);
    }
  };

  if (!user) return null;

  const isAdmin = user.group === "admin" || user.isAdmin;

  const groupFiltered = courses.filter((c) => c.group === "all" || c.group === user.group);
  const enrolledCourses = groupFiltered.filter((c) => courseProgress[c.id] !== undefined);
  const catalogCourses = groupFiltered.filter((c) => courseProgress[c.id] === undefined);



  const filteredEnrolled = enrolledCourses.filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCatalog = catalogCourses.filter(
    (c) => !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  const CourseCardInner = ({ c }: { c: Course }) => (
    <Card className="group bg-gradient-card border-border p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-200 shadow-elegant">
      <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-marine to-deep relative overflow-hidden">
            {c.cover && (c.cover.startsWith("http") || c.cover.startsWith("/")) ? (
              <img
                src={c.cover.startsWith("http") ? c.cover : `${API_BASE_URL}${c.cover}`}
                alt={c.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${c.cover} opacity-80`} />
            )}
            <PlayCircle className="size-8 text-white/80 group-hover:scale-110 transition-transform relative z-10" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
              {c.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {c.description || "Aprenda e domine este conteúdo completo."}
            </p>
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
          <div className="hidden md:block text-right w-24">
            <div className="text-sm font-medium text-foreground">{c.progress}%</div>
            <Progress value={c.progress} className="h-1.5 mt-1" />
          </div>
          <button className="flex-1 md:flex-none cursor-pointer rounded-lg font-bold transition-colors duration-200 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-4 py-2.5 text-sm whitespace-nowrap">
            {c.progress === 100 ? "Acessar" : c.progress > 0 ? "Continuar" : "Iniciar"}
          </button>
        </div>
      </div>
    </Card>
  );

  return (
    <AppShell>
      <header className="mb-6 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Cursos & Jornada</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Catálogo de cursos cadastrados na plataforma."
            : `Trilha completa para ${user.group === "vip" ? "VIPs" : "Embaixadores"}.`}
        </p>
      </header>

      {/* Tabs — somente para usuários */}
      {!isAdmin && (
        <>
          <div className="flex gap-1 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab("meus")}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "meus"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Meus Cursos
              {enrolledCourses.length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({enrolledCourses.length})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === "catalogo"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Catálogo
              {catalogCourses.length > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({catalogCourses.length})</span>
              )}
            </button>
          </div>

          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar cursos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/30 border-border h-10"
            />
          </div>
        </>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gradient-card border-border p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted/30 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted/30 rounded w-1/3" />
                  <div className="h-3 bg-muted/20 rounded w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : isAdmin ? (
        /* Vista do admin: todos os cursos */
        <div className="space-y-4 stagger-children">
          {courses.map((c) => (
            <div key={c.id} onClick={() => toast.info("Administradores não realizam cursos.")}>
              <Card className="group bg-gradient-card border-border p-5 hover:border-primary/50 transition-all duration-200 shadow-elegant cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-marine to-deep relative overflow-hidden">
                    {c.cover && (c.cover.startsWith("http") || c.cover.startsWith("/")) ? (
                      <img
                        src={c.cover.startsWith("http") ? c.cover : `${API_BASE_URL}${c.cover}`}
                        alt={c.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${c.cover} opacity-80`} />
                    )}
                    <PlayCircle className="size-8 text-white/80 relative z-10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-0.5 truncate">{c.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{c.description}</p>
                  </div>
                  <span className="text-sm font-medium text-secondary whitespace-nowrap">Modo Admin</span>
                </div>
              </Card>
            </div>
          ))}
          {courses.length === 0 && (
            <Card className="bg-gradient-card border-border p-12 text-center text-muted-foreground shadow-elegant">
              <BookOpen className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">Nenhum curso cadastrado</p>
            </Card>
          )}
        </div>
      ) : activeTab === "meus" ? (
        /* Meus Cursos */
        enrolledCourses.length === 0 ? (
          <Card className="bg-gradient-card border-border p-12 text-center shadow-elegant fade-in-up">
            <BookOpen className="size-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium text-foreground">Você ainda não está inscrito em nenhum curso</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Explore o catálogo e inscreva-se para começar sua jornada.
            </p>
            <Button onClick={() => setActiveTab("catalogo")} className="bg-primary text-primary-foreground">
              Explorar Catálogo
            </Button>
          </Card>
        ) : (
          <>


            {/* Grid de cursos inscritos */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Todos os meus cursos</h2>
              <div className="space-y-4 stagger-children">
                {filteredEnrolled.map((c) => (
                  <Link key={c.id} to={`/cursos/${c.id}`} className="block">
                    <CourseCardInner c={c} />
                  </Link>
                ))}
                {filteredEnrolled.length === 0 && search && (
                  <Card className="bg-gradient-card border-border p-8 text-center text-muted-foreground shadow-elegant">
                    <Search className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm">Nenhum curso encontrado para "{search}"</p>
                  </Card>
                )}
              </div>
            </section>
          </>
        )
      ) : (
        /* Catálogo */
        catalogCourses.length === 0 ? (
          <Card className="bg-gradient-card border-border p-12 text-center shadow-elegant fade-in-up">
            <CheckCircle2 className="size-10 mx-auto mb-3 text-success/70" />
            <p className="font-medium text-foreground">Você está inscrito em todos os cursos disponíveis!</p>
            <p className="text-sm text-muted-foreground mt-1">Continue sua jornada em Meus Cursos.</p>
          </Card>
        ) : (
          <div className="space-y-4 stagger-children">
            {filteredCatalog.map((c) => (
              <Card
                key={c.id}
                className="group bg-gradient-card border-border p-5 hover:border-primary/50 hover:shadow-glow transition-all duration-200 shadow-elegant"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-marine to-deep relative overflow-hidden">
                      {c.cover && (c.cover.startsWith("http") || c.cover.startsWith("/")) ? (
                        <img
                          src={c.cover.startsWith("http") ? c.cover : `${API_BASE_URL}${c.cover}`}
                          alt={c.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${c.cover} opacity-80`} />
                      )}
                      <PlayCircle className="size-8 text-white/80 group-hover:scale-110 transition-transform relative z-10" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                        {c.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2 truncate">
                        {c.description || "Aprenda e domine este conteúdo completo."}
                      </p>
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
                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    <Button
                      onClick={() => handleEnroll(c.id)}
                      disabled={enrollingId === c.id}
                      className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {enrollingId === c.id ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" /> Inscrevendo...
                        </>
                      ) : (
                        "Inscrever-se"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredCatalog.length === 0 && search && (
              <Card className="bg-gradient-card border-border p-8 text-center text-muted-foreground shadow-elegant">
                <Search className="size-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">Nenhum curso encontrado para "{search}"</p>
              </Card>
            )}
          </div>
        )
      )}
    </AppShell>
  );
}
