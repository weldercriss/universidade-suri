import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { type Course } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, CheckCircle2, Search, BookOpen, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

interface EnrollmentProgress {
  courseId: string;
  completedCount: number;
  totalModules: number;
}

function Coursecover({ c, className }: { c: Course; className?: string }) {
  const hasImage = c.cover && (c.cover.startsWith("http") || c.cover.startsWith("/"));
  const src = c.cover?.startsWith("/") ? `${API_BASE_URL}${c.cover}` : c.cover;

  if (hasImage) {
    return (
      <img
        src={src}
        alt={c.title}
        className={className ?? "absolute inset-0 w-full h-full object-cover"}
      />
    );
  }
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${c.cover || "from-primary to-secondary"} opacity-90 ${className ?? ""}`}
    />
  );
}

function PosterCard({
  c,
  isAdmin,
  onEnroll,
  enrolling,
  enrolled,
}: {
  c: Course;
  isAdmin?: boolean;
  onEnroll?: (id: string) => void;
  enrolling?: boolean;
  enrolled?: boolean;
}) {
  const progress = c.progress ?? 0;
  const label = progress === 100 ? "Acessar" : progress > 0 ? "Continuar" : "Iniciar";

  return (
    <div className="group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer shadow-elegant transition-all duration-300 hover:scale-105 hover:shadow-glow hover:z-10">
      {/* Cover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-secondary/60">
        <Coursecover c={c} />
      </div>

      {/* Admin badge */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <ShieldCheck className="size-3" />
          ADMIN
        </div>
      )}

      {/* Progress bar (enrolled courses) */}
      {enrolled && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 z-10">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Default overlay — rodapé com título */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-3 px-3 transition-all duration-300 group-hover:opacity-0">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{c.title}</p>
        <p className="text-white/60 text-[10px] mt-0.5">{c.lessons.length} aulas</p>
      </div>

      {/* Hover overlay completo */}
      <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 p-3">
        <p className="text-white text-sm font-bold line-clamp-2 leading-tight mb-1">{c.title}</p>
        {c.description && (
          <p className="text-white/70 text-[11px] line-clamp-2 mb-2">{c.description}</p>
        )}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-white/60 text-[10px]">{c.lessons.length} aulas</span>
          {c.group !== "all" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/30 text-primary uppercase">
              {c.group}
            </span>
          )}
        </div>
        {enrolled && progress > 0 && (
          <div className="mb-2">
            <div className="flex justify-between text-[10px] text-white/60 mb-0.5">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
        {isAdmin ? (
          <div className="text-center text-xs text-white/50 py-1">Modo Administrador</div>
        ) : enrolled ? (
          <button className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <PlayCircle className="size-3.5" />
            {label}
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnroll?.(c.id);
            }}
            disabled={enrolling}
            className="w-full flex items-center justify-center gap-1.5 bg-white/20 border border-white/40 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-60"
          >
            {enrolling ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {enrolling ? "Inscrevendo..." : "Inscrever-se"}
          </button>
        )}
      </div>
    </div>
  );
}

export function CoursesListPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, EnrollmentProgress>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
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
            cover: c.coverUrl || "from-primary to-secondary",
            group: c.targetGroup || c.target_group || "all",
            progress: progressPct,
            lessons: (c.lessons || []).map((l: any) => ({
              id: l.id,
              title: l.title,
              duration: l.duration || "",
              videoProvider: "youtube" as const,
              videoEmbedUrl: "",
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

  const gridClass = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4";

  return (
    <AppShell>
      {/* Header */}
      <header className="flex items-start justify-between mb-6 fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Cursos & Jornada</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isAdmin
              ? "Catálogo de cursos cadastrados na plataforma."
              : `Trilha completa para ${user.group === "vip" ? "VIPs" : "Embaixadores"}.`}
          </p>
        </div>
        {/* Search toggle */}
        <div className="flex items-center gap-2 mt-1">
          {searchOpen && (
            <div className="relative fade-in">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Pesquisar cursos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9 w-48 sm:w-64 bg-muted/30 border-border text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setSearch("");
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <Search className="size-5" />
          </button>
        </div>
      </header>

      {/* Tabs — somente para usuários */}
      {!isAdmin && (
        <div className="flex gap-0 mb-6 border-b border-border">
          {(["meus", "catalogo"] as const).map((tab) => {
            const label = tab === "meus" ? "Meus Cursos" : "Catálogo";
            const count = tab === "meus" ? enrolledCourses.length : catalogCourses.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px relative ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs ${activeTab === tab ? "text-primary/70" : "opacity-50"}`}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className={gridClass}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : isAdmin ? (
        /* Vista admin */
        courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <BookOpen className="size-10 mb-3 opacity-50" />
            <p className="font-medium">Nenhum curso cadastrado</p>
          </div>
        ) : (
          <div className={gridClass}>
            {courses.map((c) => (
              <div key={c.id} onClick={() => toast.info("Administradores não realizam cursos.")}>
                <PosterCard c={c} isAdmin />
              </div>
            ))}
          </div>
        )
      ) : activeTab === "meus" ? (
        /* Meus Cursos */
        enrolledCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground fade-in-up">
            <BookOpen className="size-10 mb-3 opacity-50" />
            <p className="font-medium text-foreground">Você ainda não está inscrito em nenhum curso</p>
            <p className="text-sm mt-1 mb-5">Explore o catálogo e comece sua jornada.</p>
            <Button onClick={() => setActiveTab("catalogo")} className="bg-primary text-primary-foreground">
              Explorar Catálogo
            </Button>
          </div>
        ) : filteredEnrolled.length === 0 && search ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Search className="size-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum curso encontrado para "{search}"</p>
          </div>
        ) : (
          <div className={`${gridClass} stagger-children`}>
            {filteredEnrolled.map((c) => (
              <Link key={c.id} to={`/cursos/${c.id}`}>
                <PosterCard c={c} enrolled />
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Catálogo */
        catalogCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground fade-in-up">
            <CheckCircle2 className="size-10 mb-3 text-success/70" />
            <p className="font-medium text-foreground">Você está inscrito em todos os cursos disponíveis!</p>
            <p className="text-sm mt-1">Continue sua jornada em Meus Cursos.</p>
          </div>
        ) : filteredCatalog.length === 0 && search ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Search className="size-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum curso encontrado para "{search}"</p>
          </div>
        ) : (
          <div className={`${gridClass} stagger-children`}>
            {filteredCatalog.map((c) => (
              <PosterCard
                key={c.id}
                c={c}
                enrolled={false}
                onEnroll={handleEnroll}
                enrolling={enrollingId === c.id}
              />
            ))}
          </div>
        )
      )}
    </AppShell>
  );
}
