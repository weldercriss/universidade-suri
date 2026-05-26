import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { type Course } from "@/types";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Loader2, Award } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [videoFinished, setVideoFinished] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (user.group === "admin" || user.isAdmin)) {
      toast.info("Administradores não realizam cursos.");
      navigate("/cursos");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!courseId) return;

    const extractYoutubeId = (urlOrId: string) => {
      if (!urlOrId) return "dQw4w9WgXcQ";
      const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
      return match ? match[1] : urlOrId;
    };

    apiRequest<any>(`/courses/${courseId}`)
      .then((data) => {
        const mapped: Course = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          cover: "from-marine to-deep",
          group: data.targetGroup || data.target_group || "all",
          progress: 0,
          lessons: (data.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            duration: l.duration || "10:00",
            youtubeId: extractYoutubeId(l.videoUrl || l.video_url),
            done: false,
          })),
        };
        setCourse(mapped);
        setCompleted(Object.fromEntries(mapped.lessons.map((l) => [l.id, !!l.done])));
      })
      .catch(() => {
        setCourse(null);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    setVideoFinished(false);
    
    let player: any;
    
    const onPlayerStateChange = (event: any) => {
      // YT.PlayerState.ENDED is 0
      if (event.data === 0) {
        setVideoFinished(true);
      }
    };

    const initPlayer = () => {
      if (!window.YT) return;
      player = new window.YT.Player('youtube-player', {
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      setTimeout(initPlayer, 500);
    }

    return () => {
      if (player && player.destroy) {
        try { player.destroy(); } catch {}
      }
    };
  }, [activeIdx, courseId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <div className="text-center py-20 fade-in-up">
          <p className="text-muted-foreground text-lg">Curso não encontrado.</p>
          <Button asChild className="mt-4 bg-gradient-hero text-snow"><Link to="/cursos">Voltar</Link></Button>
        </div>
      </AppShell>
    );
  }

  const lesson = course.lessons[activeIdx];
  const doneCount = Object.values(completed).filter(Boolean).length;
  const pct = course.lessons.length > 0 ? Math.round((doneCount / course.lessons.length) * 100) : 0;

  const finish = async () => {
    if (!videoFinished && !completed[lesson.id]) {
      toast.error("Assista o vídeo até o final para concluir a aula.");
      return;
    }
    try {
      await apiRequest(`/enrollments/lessons/${lesson.id}/complete`, { method: "POST" });
    } catch { /* proceed anyway */ }
    setCompleted((s) => ({ ...s, [lesson.id]: true }));
    toast.success("Aula concluída! +50 XP");
  };

  const next = () => {
    if (activeIdx < course.lessons.length - 1) setActiveIdx((i) => i + 1);
  };
  const prev = () => activeIdx > 0 && setActiveIdx((i) => i - 1);

  const generateCertificate = async () => {
    try {
      setGeneratingCert(true);
      const res = await apiRequest(`/certificates/${courseId}/generate`, { method: "POST" });
      if (res.code) {
        toast.success("Certificado gerado com sucesso!");
        navigate(`/certificado/${res.code}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar certificado");
    } finally {
      setGeneratingCert(false);
    }
  };

  if (course.lessons.length === 0) {
    return (
      <AppShell>
        <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground fade-in-up">
          <Link to="/cursos" className="hover:text-foreground hover:text-gradient transition-smooth">Cursos</Link>
          <span>/</span>
          <span className="text-foreground">{course.title}</span>
        </div>
        <Card className="bg-gradient-card border-border p-12 text-center shadow-elegant">
          <p className="text-muted-foreground">Este curso ainda não possui aulas cadastradas.</p>
          <Button asChild className="mt-4 bg-gradient-hero text-snow"><Link to="/cursos">Voltar</Link></Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground fade-in-up">
        <Link to="/cursos" className="hover:text-foreground hover:text-gradient transition-smooth">Cursos</Link>
        <span>/</span>
        <span className="text-foreground">{course.title}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="fade-in-up">
          <Card className="bg-gradient-card border-border overflow-hidden shadow-elegant">
            <div className="aspect-video bg-black relative">
              <iframe
                id="youtube-player"
                title={lesson.title}
                src={`https://www.youtube.com/embed/${lesson.youtubeId}?enablejsapi=1&rel=0`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                    Aula {activeIdx + 1} de {course.lessons.length}
                  </div>
                  <h1 className="text-2xl font-bold mt-1 text-gradient">{lesson.title}</h1>
                </div>
                <Badge variant="outline" className="border-border">{lesson.duration}</Badge>
              </div>
              <p className="text-muted-foreground mt-3">
                {course.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="outline" onClick={prev} disabled={activeIdx === 0} className="border-border">
                  <ArrowLeft className="size-4 mr-1" /> Anterior
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={finish} 
                  disabled={completed[lesson.id] || (!videoFinished && !completed[lesson.id])} 
                  className="bg-muted hover:bg-muted/80 text-foreground"
                >
                  {completed[lesson.id] ? "✓ Concluída" : (!videoFinished ? "Assista até o fim..." : "Concluir aula")}
                </Button>
                <Button 
                  onClick={next} 
                  disabled={activeIdx === course.lessons.length - 1 || (!completed[lesson.id] && !videoFinished)} 
                  className="bg-gradient-hero text-snow border border-border group"
                >
                  Próxima aula <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar de aulas */}
        <aside className="space-y-4">
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="text-sm text-muted-foreground font-medium">Progresso do curso</div>
            <div className="text-2xl font-bold mt-1 text-gradient">{pct}%</div>
            <Progress value={pct} className="mt-3 h-1.5" />
            <div className="text-xs text-muted-foreground mt-2 mb-4">
              {doneCount} de {course.lessons.length} aulas
            </div>
            {pct === 100 && (
              <Button onClick={generateCertificate} disabled={generatingCert} className="w-full bg-amber-500 hover:bg-amber-600 text-white shadow-glow group">
                {generatingCert ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Award className="size-4 mr-2 group-hover:scale-110 transition-transform" />} Emitir Certificado
              </Button>
            )}
          </Card>
          <Card className="bg-gradient-card border-border divide-y divide-border shadow-elegant overflow-hidden">
            {course.lessons.map((l, i) => {
              const isActive = i === activeIdx;
              const isDone = completed[l.id];
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left p-3 flex items-center gap-3 transition-smooth border-l-2
                    ${isActive ? "bg-primary/15 border-primary" : "hover:bg-muted/40 border-transparent"}`}
                >
                  {isDone ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate font-medium">{l.title}</div>
                    <div className="text-[11px] text-muted-foreground">{l.duration}</div>
                  </div>
                </button>
              );
            })}
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
