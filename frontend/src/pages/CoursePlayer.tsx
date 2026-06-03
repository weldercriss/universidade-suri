import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { type Course } from "@/types";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, Circle, ArrowRight, ArrowLeft, Loader2, Award, Lock,
  Heart, MessageCircle, Send, Image as ImageIcon, FileText, Link as LinkIcon, Video,
  Users, BookOpen, FolderKanban, ClipboardList, AlertTriangle,
} from "lucide-react";
import { QuizModal } from "@/components/QuizModal";
import { toast } from "sonner";

interface ProjectPost {
  id: string;
  authorName: string;
  authorTier: string;
  groupType: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
  media?: { type: string; url: string };
  likedBy?: { name: string; email: string }[];
  commentDetails?: { userName: string; userEmail: string; content: string; createdAt: string }[];
}

function extractYoutubeId(urlOrId: string) {
  if (!urlOrId) return "dQw4w9WgXcQ";
  const match = urlOrId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
  return (match?.[1] ?? urlOrId) || "dQw4w9WgXcQ";
}

function buildCompletedMap(lessonIds: string[], completedModuleIds: string[]) {
  const completedSet = new Set(completedModuleIds);
  return Object.fromEntries(lessonIds.map((id) => [id, completedSet.has(id)]));
}

export function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Course / lesson state
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [videoFinished, setVideoFinished] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"aulas" | "comunidade" | "projetos" | "prova">("aulas");

  // Quiz state
  const [quizStatus, setQuizStatus] = useState<{
    hasQuestions: boolean;
    attemptsUsed: number;
    attemptsAllowed: number;
    blocked: boolean;
    passed: boolean;
    certificateCode: string | null;
  } | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  // Community state
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [mediaData, setMediaData] = useState<{ type: string; url: string } | null>(null);

  useEffect(() => {
    if (user && (user.group === "admin" || user.isAdmin)) {
      toast.info("Administradores não realizam cursos.");
      navigate("/cursos");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!courseId || !user || user.group === "admin" || user.isAdmin) return;
    setLoading(true);
    const load = async () => {
      try {
        const [data, progressData, quizData] = await Promise.all([
          apiRequest<any>(`/courses/${courseId}`),
          apiRequest<{
            enrollmentId: string | null;
            completedModuleIds: string[];
            totalModules: number;
            completedCount: number;
          }>(`/enrollments/courses/${courseId}/progress`),
          apiRequest<{
            hasQuestions: boolean;
            attemptsUsed: number;
            attemptsAllowed: number;
            blocked: boolean;
            passed: boolean;
            certificateCode: string | null;
          }>(`/quiz/${courseId}/status`).catch(() => null),
        ]);
        if (quizData) setQuizStatus(quizData);

        if (!progressData.enrollmentId) {
          await apiRequest(`/enrollments/${courseId}/join`, { method: "POST" });
        }

        const rawLessons = [...(data.lessons || [])].sort(
          (a: { sortOrder?: number }, b: { sortOrder?: number }) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );

        const lessonIds = rawLessons.map((l: { id: string }) => l.id);
        const completedMap = buildCompletedMap(lessonIds, progressData.completedModuleIds);

        const mapped: Course = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          cover: "from-marine to-deep",
          group: data.targetGroup || data.target_group || "all",
          progress:
            progressData.totalModules > 0
              ? Math.round((progressData.completedCount / progressData.totalModules) * 100)
              : 0,
          lessons: rawLessons.map((l: any) => ({
            id: l.id,
            title: l.title,
            duration: l.duration || "10:00",
            youtubeId: extractYoutubeId(l.videoUrl || l.video_url || ""),
            done: !!completedMap[l.id],
          })),
        };

        setCourse(mapped);
        setCompleted(completedMap);
        const firstIncomplete = lessonIds.findIndex((id) => !completedMap[id]);
        setActiveIdx(firstIncomplete >= 0 ? firstIncomplete : 0);
      } catch {
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user]);

  const isLessonUnlocked = useCallback(
    (index: number) => {
      if (!course || index === 0) return true;
      const prevId = course.lessons[index - 1]?.id;
      return prevId ? !!completed[prevId] : false;
    },
    [course, completed]
  );

  // YouTube player — only initialize when on aulas tab
  useEffect(() => {
    if (activeTab !== "aulas") return;
    setVideoFinished(false);

    let player: { destroy?: () => void } | undefined;

    const onPlayerStateChange = (event: { data: number }) => {
      if (event.data === 0) setVideoFinished(true);
    };

    const win = window as Window & {
      YT?: { Player: new (id: string, opts: object) => { destroy?: () => void } };
      onYouTubeIframeAPIReady?: () => void;
    };

    const initPlayer = () => {
      if (!win.YT) return;
      player = new win.YT.Player("youtube-player", {
        events: { onStateChange: onPlayerStateChange },
      });
    };

    if (!win.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      win.onYouTubeIframeAPIReady = initPlayer;
    } else {
      setTimeout(initPlayer, 500);
    }

    return () => {
      if (player?.destroy) {
        try { player.destroy(); } catch { /* ignore */ }
      }
    };
  }, [activeIdx, courseId, activeTab]);

  // Community: load posts when tab is opened
  const fetchPosts = useCallback(async () => {
    if (!courseId) return;
    setPostsLoading(true);
    try {
      const data = await apiRequest<ProjectPost[]>(`/posts?courseId=${courseId}`);
      setPosts(data);
    } catch {
      toast.error("Erro ao carregar a comunidade");
    } finally {
      setPostsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (activeTab === "comunidade" || activeTab === "projetos") fetchPosts();
  }, [activeTab, fetchPosts]);

  const selectLesson = (index: number) => {
    if (!isLessonUnlocked(index)) {
      toast.error("Conclua a aula anterior para desbloquear esta aula.");
      return;
    }
    setActiveIdx(index);
  };

  const finish = async () => {
    if (!course) return;
    const lesson = course.lessons[activeIdx]!;
    if (!videoFinished && !completed[lesson.id]) {
      toast.error("Assista o vídeo até o final para concluir a aula.");
      return;
    }
    if (completed[lesson.id]) return;
    try {
      const res = await apiRequest<{ message: string; courseCompleted?: boolean }>(
        `/enrollments/lessons/${lesson.id}/complete`,
        { method: "POST" }
      );
      setCompleted((s) => ({ ...s, [lesson.id]: true }));
      toast.success(res.message || "Aula concluída!");
      if (res.courseCompleted) toast.success("Parabéns! Você concluiu o curso.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir a aula.");
    }
  };

  const next = () => {
    if (!course) return;
    const lesson = course.lessons[activeIdx]!;
    if (!completed[lesson.id]) {
      toast.error("Conclua a aula atual antes de avançar.");
      return;
    }
    if (activeIdx < course.lessons.length - 1 && isLessonUnlocked(activeIdx + 1)) {
      setActiveIdx(activeIdx + 1);
    }
  };

  const prev = () => {
    if (activeIdx > 0) setActiveIdx((i) => i - 1);
  };

  const refreshQuizStatus = async () => {
    try {
      const data = await apiRequest<typeof quizStatus>(`/quiz/${courseId}/status`);
      setQuizStatus(data);
    } catch { /* ignore */ }
  };

  const generateCertificate = async () => {
    try {
      setGeneratingCert(true);
      const res = await apiRequest<{ code?: string }>(`/certificates/${courseId}/generate`, { method: "POST" });
      if (res.code) {
        toast.success("Certificado gerado com sucesso!");
        navigate(`/certificado/${res.code}`);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar certificado");
    } finally {
      setGeneratingCert(false);
    }
  };

  // Community actions
  const publish = async () => {
    if (!postTitle.trim() || !postBody.trim()) return;
    setPublishing(true);
    try {
      await apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify({
          title: postTitle,
          body: postBody,
          courseId,
          ...(mediaData && { media: mediaData }),
        }),
      });
      toast.success("Projeto publicado! +100 XP");
      setPostTitle("");
      setPostBody("");
      setMediaData(null);
      fetchPosts();
    } catch {
      toast.error("Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  const handleFileUpload = (type: string) => {
    if (type === "link") {
      const url = window.prompt("Cole o link do anexo:");
      if (!url?.trim()) return;
      setMediaData({ type: "link", url: url.trim() });
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    if (type === "image") input.accept = "image/*";
    else if (type === "video") input.accept = "video/*";
    else if (type === "document") input.accept = ".pdf,.doc,.docx,.txt";
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const maxBytes = type === "image" ? 1_500_000 : 5_000_000;
      if (file.size > maxBytes) {
        toast.error(`Arquivo muito grande. Limite: ${Math.round(maxBytes / 1_000_000)}MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setMediaData({ type: type === "document" ? "document" : type, url: type === "document" ? file.name : reader.result as string });
        toast.success("Anexo pronto para publicação");
      };
      reader.onerror = () => toast.error("Não foi possível ler o arquivo");
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const like = async (postId: string) => {
    try {
      await apiRequest(`/posts/${postId}/like`, { method: "POST" });
      fetchPosts();
    } catch {
      toast.error("Erro ao curtir");
    }
  };

  const addComment = async (postId: string) => {
    if (!commentText.trim()) { toast.error("Escreva um comentário"); return; }
    try {
      await apiRequest(`/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText }),
      });
      toast.success("Comentário adicionado!");
      setCommentText("");
      await fetchPosts();
      setCommentingPostId(postId);
    } catch {
      toast.error("Erro ao comentar");
    }
  };

  // ─── Early returns ───────────────────────────────────────────────────────────

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
          <Button asChild className="mt-4 bg-gradient-hero text-snow">
            <Link to="/cursos">Voltar</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

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

  const lesson = course.lessons[activeIdx]!;
  const doneCount = Object.values(completed).filter(Boolean).length;
  const pct = course.lessons.length > 0 ? Math.round((doneCount / course.lessons.length) * 100) : 0;
  const allLessonsCompleted = doneCount === course.lessons.length;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground fade-in-up">
        <Link to="/cursos" className="hover:text-foreground hover:text-gradient transition-smooth">Cursos</Link>
        <span>/</span>
        <span className="text-foreground">{course.title}</span>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 bg-muted/30 rounded-xl w-fit border border-border">
        <button
          type="button"
          onClick={() => setActiveTab("aulas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth
            ${activeTab === "aulas" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <BookOpen className="size-4" /> Aulas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("comunidade")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth
            ${activeTab === "comunidade" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Users className="size-4" /> Comunidade
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("projetos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth
            ${activeTab === "projetos" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <FolderKanban className="size-4" /> Projetos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prova")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth relative
            ${activeTab === "prova" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ClipboardList className="size-4" /> Prova
          {quizStatus?.passed && (
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-secondary" />
          )}
        </button>
      </div>

      {/* ── AULAS tab ── */}
      {activeTab === "aulas" && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
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
                <p className="text-muted-foreground mt-3">{course.description}</p>
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
                    disabled={activeIdx === course.lessons.length - 1 || !completed[lesson.id]}
                    className="bg-gradient-hero text-snow border border-border group"
                  >
                    Próxima aula <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <div className="text-sm text-muted-foreground font-medium">Progresso do curso</div>
              <div className="text-2xl font-bold mt-1 text-gradient">{pct}%</div>
              <Progress value={pct} className="mt-3 h-1.5" />
              <div className="text-xs text-muted-foreground mt-2 mb-4">
                {doneCount} de {course.lessons.length} aulas
              </div>
              {allLessonsCompleted && (!quizStatus?.hasQuestions || quizStatus?.passed) && (
                <Button onClick={generateCertificate} disabled={generatingCert} className="w-full bg-secondary hover:bg-secondary/80 text-white shadow-glow group">
                  {generatingCert ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Award className="size-4 mr-2 group-hover:scale-110 transition-transform" />}
                  Emitir Certificado
                </Button>
              )}
              {allLessonsCompleted && quizStatus?.hasQuestions && !quizStatus?.passed && (
                <Button onClick={() => setActiveTab("prova")} variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                  <ClipboardList className="size-4 mr-2" /> Fazer a Prova
                </Button>
              )}
            </Card>
            <Card className="bg-gradient-card border-border divide-y divide-border shadow-elegant overflow-hidden">
              {course.lessons.map((l, i) => {
                const isActive = i === activeIdx;
                const isDone = completed[l.id];
                const unlocked = isLessonUnlocked(i);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectLesson(i)}
                    disabled={!unlocked}
                    className={`w-full text-left p-3 flex items-center gap-3 transition-smooth border-l-2
                      ${!unlocked ? "opacity-50 cursor-not-allowed" : ""}
                      ${isActive ? "bg-primary/15 border-primary" : unlocked ? "hover:bg-muted/40 border-transparent" : "border-transparent"}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-4 text-success shrink-0" />
                    ) : !unlocked ? (
                      <Lock className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground shrink-0" />
                    )}
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
      )}

      {/* ── COMUNIDADE tab ── */}
      {activeTab === "comunidade" && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-5 fade-in-up">
          <div className="space-y-5 stagger-children">
            {/* Composer */}
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden shrink-0">
                  {user?.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Título do projeto"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="bg-muted/30 border-border h-10"
                  />
                  <Textarea
                    placeholder="Compartilhe o que você construiu neste curso…"
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    rows={3}
                    className="bg-muted/30 border-border"
                  />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-1 text-muted-foreground">
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload("image")}><ImageIcon className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload("video")}><Video className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload("document")}><FileText className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload("link")}><LinkIcon className="size-4" /></Button>
                    </div>
                    {mediaData && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary bg-secondary/10 px-3 py-1 rounded-full max-w-[200px] overflow-hidden">
                        📎 <span className="truncate">{mediaData.type === "link" ? mediaData.url : `${mediaData.type} anexado`}</span>
                        <button type="button" onClick={() => setMediaData(null)} className="ml-1 text-secondary/70 hover:text-secondary shrink-0">×</button>
                      </div>
                    )}
                    <Button
                      onClick={publish}
                      disabled={publishing || !postTitle.trim() || !postBody.trim()}
                      className="bg-gradient-hero border border-border text-snow hover:shadow-glow group"
                    >
                      {publishing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Send className="size-4 mr-1 group-hover:translate-x-0.5 transition-transform" />}
                      Publicar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Feed */}
            {postsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center p-10 text-muted-foreground">
                Nenhum projeto publicado neste curso ainda. Seja o primeiro!
              </div>
            ) : posts.map((p) => (
              <Card key={p.id} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden shrink-0">
                    {p.authorName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.authorName}</div>
                    <div className="text-[11px] text-muted-foreground">{p.authorTier} · {new Date(p.createdAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <Badge variant="outline" className="border-border capitalize shrink-0">{p.groupType}</Badge>
                </div>

                <h3 className="mt-4 font-bold text-lg hover:text-gradient transition-smooth">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>

                {p.media && (
                  <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
                    {p.media.type === "image" && p.media.url.startsWith("data:") ? (
                      <img src={p.media.url} alt="Anexo" className="max-h-64 w-full rounded-lg object-cover" />
                    ) : p.media.type === "link" ? (
                      <a href={p.media.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-2">
                        <LinkIcon className="size-4" /> {p.media.url}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <FileText className="size-4 shrink-0" />
                        <span>Anexo ({p.media.type}): <span className="text-foreground font-medium">arquivo anexado</span></span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => like(p.id)}
                    className="flex items-center gap-1 hover:text-foreground transition-smooth group"
                  >
                    <Heart className="size-4 group-hover:scale-110 transition-transform text-secondary" /> {p.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentingPostId(commentingPostId === p.id ? null : p.id)}
                    className="flex items-center gap-1 hover:text-foreground transition-smooth"
                  >
                    <MessageCircle className="size-4" /> {p.comments}
                  </button>
                </div>

                {p.commentDetails && p.commentDetails.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-background/50 border border-border/40 text-xs space-y-3">
                    <strong className="text-foreground block mb-3">Comentários ({p.commentDetails.length})</strong>
                    {p.commentDetails.map((c, i) => (
                      <div key={i} className="pl-3 border-l-2 border-primary/40">
                        <div className="font-semibold text-foreground/80">{c.userName}</div>
                        <div className="text-muted-foreground mt-1">{c.content}</div>
                        <div className="text-muted-foreground/60 text-[10px] mt-1">{new Date(c.createdAt).toLocaleString("pt-BR")}</div>
                      </div>
                    ))}
                  </div>
                )}

                {commentingPostId === p.id && (
                  <div className="mt-3 p-4 rounded-xl bg-muted/20 border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden shrink-0">
                        {user?.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Escreva um comentário…"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="bg-background/50 border-border h-16 text-sm"
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => { setCommentingPostId(null); setCommentText(""); }}>Cancelar</Button>
                          <Button size="sm" onClick={() => addComment(p.id)} className="bg-primary hover:bg-primary/90">Comentar</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <aside className="space-y-4">
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <div className="text-sm font-semibold text-gradient">Sobre esta comunidade</div>
              <p className="mt-2 text-sm text-muted-foreground">{course.title}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                <span>{posts.length} publicações</span>
              </div>
            </Card>
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <div className="text-sm font-semibold text-gradient">Diretrizes</div>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Compartilhe projetos e aprendizados deste curso.</li>
                <li>Seja gentil ao dar feedback.</li>
                <li>Respeite a confidencialidade do grupo.</li>
              </ul>
            </Card>
          </aside>
        </div>
      )}

      {/* ── PROVA tab ── */}
      {activeTab === "prova" && (
        <div className="fade-in-up max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gradient">Prova do Curso</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Acerte 70% ou mais das questões para obter o certificado.
            </p>
          </div>

          {!quizStatus?.hasQuestions && (
            <div className="rounded-xl border border-dashed border-border bg-gradient-card p-10 text-center">
              <ClipboardList className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma prova cadastrada para este curso.</p>
              {allLessonsCompleted && (
                <p className="text-sm text-muted-foreground mt-2">
                  Você pode emitir o certificado diretamente pela aba de Aulas.
                </p>
              )}
            </div>
          )}

          {quizStatus?.hasQuestions && (
            <div className="space-y-4">
              {/* Status card */}
              <div className="rounded-xl border border-border bg-gradient-card p-5 shadow-elegant">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Tentativas utilizadas</div>
                    <div className="text-2xl font-bold text-gradient">
                      {quizStatus.attemptsUsed} / {quizStatus.attemptsAllowed}
                    </div>
                  </div>
                  {quizStatus.passed && (
                    <div className="flex items-center gap-2 text-secondary font-semibold">
                      <CheckCircle2 className="size-5" /> Aprovado
                    </div>
                  )}
                  {!quizStatus.passed && quizStatus.blocked && (
                    <div className="flex items-center gap-2 text-destructive font-semibold">
                      <AlertTriangle className="size-5" /> Bloqueado
                    </div>
                  )}
                </div>
              </div>

              {/* Aprovado */}
              {quizStatus.passed && (
                <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-6 text-center">
                  <CheckCircle2 className="size-12 text-secondary mx-auto mb-3" />
                  <p className="text-secondary font-bold text-lg">Parabéns, você passou na prova!</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Seu certificado está disponível.
                  </p>
                  <Button
                    onClick={generateCertificate}
                    disabled={generatingCert}
                    className="bg-secondary hover:bg-secondary/80 text-white shadow-glow"
                  >
                    {generatingCert ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Award className="size-4 mr-2" />}
                    Emitir Certificado
                  </Button>
                </div>
              )}

              {/* Bloqueado */}
              {!quizStatus.passed && quizStatus.blocked && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="size-6 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-destructive font-bold">Tentativas esgotadas</p>
                      <p className="text-destructive/80 text-sm mt-1">
                        Você utilizou todas as suas {quizStatus.attemptsAllowed} tentativas.
                        Entre em contato com o administrador para solicitar uma nova tentativa.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pode tentar */}
              {!quizStatus.passed && !quizStatus.blocked && (
                <div className="rounded-xl border border-border bg-gradient-card p-6 text-center">
                  {!allLessonsCompleted ? (
                    <>
                      <Lock className="size-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">Conclua todas as aulas para liberar a prova.</p>
                    </>
                  ) : (
                    <>
                      <ClipboardList className="size-10 text-primary mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">Pronto para fazer a prova?</p>
                      <p className="text-sm text-muted-foreground mb-5">
                        {quizStatus.attemptsUsed > 0
                          ? `Você ainda tem ${quizStatus.attemptsAllowed - quizStatus.attemptsUsed} tentativa(s) restante(s).`
                          : "Você tem 3 tentativas disponíveis."}
                      </p>
                      <Button
                        onClick={() => setQuizModalOpen(true)}
                        className="bg-gradient-hero text-snow border border-border"
                      >
                        <ClipboardList className="size-4 mr-2" />
                        {quizStatus.attemptsUsed > 0 ? "Tentar Novamente" : "Iniciar Prova"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PROJETOS tab ── */}
      {activeTab === "projetos" && (
        <div className="fade-in-up">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gradient">Projetos enviados</h2>
            <p className="text-sm text-muted-foreground mt-1">Vitrine dos projetos publicados neste curso.</p>
          </div>

          {postsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin size-8 text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground border border-dashed border-border rounded-xl bg-gradient-card">
              Nenhum projeto enviado neste curso ainda.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 stagger-children">
              {posts.map((p) => (
                <Card key={p.id} className="bg-gradient-card border-border p-5 hover:shadow-glow transition-smooth shadow-elegant hover-lift flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden shrink-0">
                        {p.authorName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.authorName}</div>
                        <div className="text-[11px] text-muted-foreground">{p.authorTier} · {new Date(p.createdAt).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <Badge variant="outline" className="border-border uppercase shrink-0">{p.media?.type ?? "texto"}</Badge>
                    </div>
                    <h3 className="mt-4 font-bold text-lg hover:text-gradient transition-smooth">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{p.body}</p>
                    {p.media && p.media.type === "image" && p.media.url.startsWith("data:") && (
                      <img src={p.media.url} alt="Projeto" className="mt-3 max-h-48 w-full rounded-lg object-cover" />
                    )}
                    {p.media && p.media.type === "link" && (
                      <a href={p.media.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline">
                        <LinkIcon className="size-3.5" /> {p.media.url}
                      </a>
                    )}
                  </div>
                  <div className="mt-4 flex gap-4 text-sm text-muted-foreground pt-4 border-t border-border/20">
                    <span className="flex items-center gap-1"><Heart className="size-4 text-secondary fill-secondary/20" /> {p.likes ?? 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="size-4" /> {p.comments ?? 0}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      <QuizModal
        open={quizModalOpen}
        courseId={courseId!}
        onClose={() => setQuizModalOpen(false)}
        onResult={async (res) => {
          if (res.passed) {
            toast.success("Parabéns! Você foi aprovado na prova!");
          } else if (res.blocked) {
            toast.error("Tentativas esgotadas. Contate o administrador.");
          } else {
            toast.error(`Reprovado com ${res.score.toFixed(1)}%. Tente novamente.`);
          }
          await refreshQuizStatus();
        }}
      />
    </AppShell>
  );
}
