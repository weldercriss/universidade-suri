import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest, API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Loader2, Route, Lock, CheckCircle2, PlayCircle, GraduationCap,
  BookOpen, Trophy, AlertCircle, X, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface TrailCourse {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  workloadHours?: number;
  sortOrder: number;
  modulesTotal?: number;
  modulesCompleted?: number;
  modules?: any[];
  lessons?: any[];
}

interface Trail {
  id: string;
  name: string;
  description?: string;
  targetGroup: string;
  isActive: boolean;
  isEnrolled: boolean;
  courses: TrailCourse[];
}

interface MyTrail {
  enrollmentId: string;
  enrolledAt: string;
  trailId: string;
  trailName: string;
  trailDescription?: string;
  targetGroup: string;
  totalCourses: number;
  completedCourses: number;
  progress: number;
  allCoursesComplete: boolean;
  certificateCode: string | null;
  courses: TrailCourse[];
}

interface ExamStatus {
  canTakeExam: boolean;
  allCoursesComplete: boolean;
  availableQuestions: number;
  attemptsUsed: number;
  attemptsAllowed: number;
  blocked: boolean;
  passed: boolean;
  certificateCode: string | null;
}

interface ExamQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

interface ExamResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  blocked: boolean;
  certificateCode: string | null;
  autoPassed?: boolean;
}

// ─── Modal de Exame ───────────────────────────────────────────────────────────

function TrailExamModal({
  trailId,
  trailName,
  onClose,
  onPass,
}: {
  trailId: string;
  trailName: string;
  onClose: () => void;
  onPass: (code: string) => void;
}) {
  const [step, setStep] = useState<"loading" | "status" | "exam" | "result">("loading");
  const [examStatus, setExamStatus] = useState<ExamStatus | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  useEffect(() => {
    apiRequest<ExamStatus>(`/trails/${trailId}/exam/status`)
      .then((s) => {
        setExamStatus(s);
        setStep("status");
      })
      .catch(() => {
        toast.error("Erro ao carregar status do exame");
        onClose();
      });
  }, [trailId]);

  const startExam = async () => {
    setStep("loading");
    try {
      const qs = await apiRequest<ExamQuestion[]>(`/trails/${trailId}/exam/questions`);
      setQuestions(qs);
      setAnswers({});
      setStep("exam");
    } catch {
      toast.error("Erro ao carregar questões do exame");
      setStep("status");
    }
  };

  const submitExam = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Responda todas as questões (${unanswered.length} pendente${unanswered.length > 1 ? "s" : ""})`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id],
      }));
      const res = await apiRequest<ExamResult>(`/trails/${trailId}/exam/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setResult(res);
      setStep("result");
      if (res.passed && res.certificateCode) {
        onPass(res.certificateCode);
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar respostas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-elegant my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/40">
          <div>
            <h2 className="font-bold text-lg text-gradient">Prova da Trilha</h2>
            <p className="text-sm text-muted-foreground">{trailName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-smooth">
            <X className="size-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          {step === "loading" && (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {step === "status" && examStatus && (
            <div className="space-y-4">
              {examStatus.passed ? (
                <div className="text-center space-y-3 py-4">
                  <div className="size-14 mx-auto rounded-full bg-success/10 border border-success/20 grid place-items-center">
                    <Trophy className="size-7 text-success" />
                  </div>
                  <h3 className="font-bold text-lg">Você já passou nesta prova!</h3>
                  {examStatus.certificateCode && (
                    <p className="text-sm text-muted-foreground">
                      Código do certificado:{" "}
                      <Link
                        to={`/certificado/${examStatus.certificateCode}`}
                        className="text-primary font-mono hover:underline"
                        onClick={onClose}
                      >
                        {examStatus.certificateCode}
                      </Link>
                    </p>
                  )}
                </div>
              ) : examStatus.blocked ? (
                <div className="text-center space-y-3 py-4">
                  <div className="size-14 mx-auto rounded-full bg-destructive/10 border border-destructive/20 grid place-items-center">
                    <AlertCircle className="size-7 text-destructive" />
                  </div>
                  <h3 className="font-bold text-lg">Tentativas esgotadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Você usou todas as {examStatus.attemptsAllowed} tentativas. Entre em contato com o administrador.
                  </p>
                </div>
              ) : !examStatus.allCoursesComplete ? (
                <div className="text-center space-y-3 py-4">
                  <div className="size-14 mx-auto rounded-full bg-warning/10 border border-warning/20 grid place-items-center">
                    <Lock className="size-7 text-warning" />
                  </div>
                  <h3 className="font-bold text-lg">Conclua todos os cursos primeiro</h3>
                  <p className="text-sm text-muted-foreground">
                    A prova fica disponível após você concluir 100% de todos os cursos da trilha.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                    <h3 className="font-semibold">Pronto para começar?</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• {examStatus.availableQuestions} questão{examStatus.availableQuestions !== 1 ? "s" : ""} no exame</li>
                      <li>• Aprovação com ≥ 70% de acerto</li>
                      <li>• Tentativa {examStatus.attemptsUsed + 1} de {examStatus.attemptsAllowed}</li>
                    </ul>
                  </div>
                  <Button onClick={startExam} className="w-full bg-gradient-hero text-snow">
                    Iniciar Prova <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === "exam" && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {questions.map((q, qi) => (
                <div key={q.id} className="space-y-2">
                  <p className="font-medium text-sm">
                    <span className="text-primary font-bold">{qi + 1}.</span> {q.text}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-smooth ${
                          answers[q.id] === opt.id
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border bg-muted/20 hover:bg-muted/40"
                        }`}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <Button
                onClick={submitExam}
                disabled={submitting}
                className="w-full bg-gradient-hero text-snow sticky bottom-0"
              >
                {submitting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Trophy className="size-4 mr-2" />
                )}
                Enviar Respostas
              </Button>
            </div>
          )}

          {step === "result" && result && (
            <div className="text-center space-y-4 py-4">
              <div
                className={`size-16 mx-auto rounded-full grid place-items-center ${
                  result.passed
                    ? "bg-success/10 border border-success/20"
                    : "bg-destructive/10 border border-destructive/20"
                }`}
              >
                {result.passed ? (
                  <Trophy className="size-8 text-success" />
                ) : (
                  <AlertCircle className="size-8 text-destructive" />
                )}
              </div>

              <div>
                <h3 className="font-bold text-xl">
                  {result.passed ? "Parabéns! Você passou!" : "Não foi dessa vez"}
                </h3>
                {result.total > 0 && (
                  <p className="text-muted-foreground mt-1">
                    {result.correct}/{result.total} acertos — {result.score}%
                  </p>
                )}
              </div>

              {result.passed && result.certificateCode && (
                <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">Seu certificado de trilha:</p>
                  <Link
                    to={`/certificado/${result.certificateCode}`}
                    className="text-primary font-mono text-sm hover:underline font-bold"
                    onClick={onClose}
                  >
                    {result.certificateCode}
                  </Link>
                </div>
              )}

              {!result.passed && !result.blocked && (
                <Button onClick={startExam} variant="outline" className="w-full border-border">
                  Tentar Novamente
                </Button>
              )}

              <Button onClick={onClose} variant="outline" className="w-full border-border">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card de trilha (catálogo) ────────────────────────────────────────────────

function TrailCatalogCard({ trail, onEnroll }: { trail: Trail; onEnroll: (id: string) => void }) {
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await onEnroll(trail.id);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border rounded-2xl overflow-hidden shadow-elegant">
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
          <div className="text-right shrink-0 text-sm text-muted-foreground">
            <GraduationCap className="size-4 inline mr-1" />
            {trail.courses.length} curso{trail.courses.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {trail.courses.length > 0 && (
        <div className="p-4 space-y-1.5">
          {trail.courses.slice(0, 3).map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-5 rounded-full bg-border/40 grid place-items-center text-[10px] font-bold shrink-0">
                {i + 1}
              </span>
              <span className="truncate">{c.title}</span>
            </div>
          ))}
          {trail.courses.length > 3 && (
            <p className="text-xs text-muted-foreground pl-7">
              +{trail.courses.length - 3} curso{trail.courses.length - 3 > 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      <div className="p-4 pt-0">
        <Button
          onClick={handleEnroll}
          disabled={enrolling}
          className="w-full bg-gradient-hero text-snow"
        >
          {enrolling ? <Loader2 className="size-4 mr-2 animate-spin" /> : <BookOpen className="size-4 mr-2" />}
          Inscrever-se
        </Button>
      </div>
    </Card>
  );
}

// ─── Card de trilha (inscrita) ────────────────────────────────────────────────

function MyTrailCard({
  trail,
  onExam,
}: {
  trail: MyTrail;
  onExam: (trailId: string, trailName: string) => void;
}) {
  const isCourseComplete = (c: TrailCourse) => {
    const total = c.modulesTotal ?? (c.modules?.length ?? c.lessons?.length ?? 0);
    const done = c.modulesCompleted ?? 0;
    return total > 0 && done >= total;
  };

  return (
    <div className="bg-gradient-card border border-border rounded-2xl overflow-hidden shadow-elegant">
      {/* Cabeçalho */}
      <div className="p-5 border-b border-border/40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-bold text-lg text-gradient">{trail.trailName}</h2>
              <Badge variant="outline" className="border-border text-xs capitalize">
                {trail.targetGroup === "all" ? "Todos" : trail.targetGroup}
              </Badge>
              {trail.certificateCode && (
                <Badge className="bg-success/20 text-success border-0 text-xs">
                  <Trophy className="size-3 mr-1" /> Certificado
                </Badge>
              )}
            </div>
            {trail.trailDescription && (
              <p className="text-sm text-muted-foreground">{trail.trailDescription}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-gradient">{trail.progress}%</div>
            <div className="text-xs text-muted-foreground">
              {trail.completedCourses}/{trail.totalCourses} cursos
            </div>
          </div>
        </div>
        <Progress value={trail.progress} className="h-2 mt-3" />
      </div>

      {/* Cursos */}
      {trail.courses.length === 0 ? (
        <div className="p-5 text-sm text-muted-foreground text-center">
          Nenhum curso nesta trilha ainda.
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {trail.courses.map((c, i) => {
            const complete = isCourseComplete(c);
            const unlocked = i === 0 || isCourseComplete(trail.courses[i - 1]!);
            const totalModules = c.modulesTotal ?? 0;
            const doneModules = c.modulesCompleted ?? 0;
            const progPct = totalModules > 0 ? Math.round((doneModules / totalModules) * 100) : 0;

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

                {c.coverUrl && (
                  <div className="size-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={c.coverUrl.startsWith("http") ? c.coverUrl : `${API_BASE_URL}${c.coverUrl}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] text-muted-foreground">Etapa {i + 1}</span>
                    {i === 0 && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                        Início
                      </Badge>
                    )}
                  </div>
                  <div className="font-medium text-sm truncate">{c.title}</div>
                  {c.description && (
                    <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                  )}
                  {unlocked && !complete && totalModules > 0 && (
                    <Progress value={progPct} className="h-1 mt-1.5" />
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {complete ? (
                    <Badge className="bg-success/20 text-success border-0 text-xs">Concluído</Badge>
                  ) : unlocked ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="size-3.5" />
                      {totalModules} aula{totalModules !== 1 ? "s" : ""}
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">
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

      {/* Ação do exame */}
      {trail.allCoursesComplete && !trail.certificateCode && (
        <div className="p-4 pt-0">
          <Button
            onClick={() => onExam(trail.trailId, trail.trailName)}
            className="w-full bg-gradient-hero text-snow"
          >
            <Trophy className="size-4 mr-2" /> Fazer Prova Final da Trilha
          </Button>
        </div>
      )}

      {trail.certificateCode && (
        <div className="p-4 pt-0">
          <Button asChild variant="outline" className="w-full border-success/40 text-success hover:bg-success/10">
            <Link to={`/certificado/${trail.certificateCode}`}>
              <Trophy className="size-4 mr-2" /> Ver Certificado
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export function TrailsListPage() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"mine" | "catalog">("mine");
  const [allTrails, setAllTrails] = useState<Trail[]>([]);
  const [myTrails, setMyTrails] = useState<MyTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [examState, setExamState] = useState<{ trailId: string; trailName: string } | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [trailsData, myEnrollments] = await Promise.all([
        apiRequest<Trail[]>("/trails"),
        apiRequest<MyTrail[]>("/trails/my-enrollments"),
      ]);
      setAllTrails(trailsData);
      setMyTrails(myEnrollments);
    } catch {
      toast.error("Erro ao carregar trilhas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleEnroll = async (trailId: string) => {
    try {
      await apiRequest(`/trails/${trailId}/enroll`, { method: "POST" });
      toast.success("Inscrição realizada com sucesso!");
      await fetchData();
      setActiveTab("mine");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao se inscrever na trilha");
    }
  };

  const handleExamPass = async () => {
    await fetchData();
  };

  if (!user) return null;

  const catalogTrails = allTrails.filter((t) => !t.isEnrolled);

  return (
    <AppShell>
      <header className="mb-6 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient flex items-center gap-2">
          <Route className="size-7 text-primary" /> Trilhas
        </h1>
        <p className="text-muted-foreground mt-1">
          Percursos de aprendizado sequenciais para {user.group === "vip" ? "VIPs" : "Embaixadores"}.
        </p>
      </header>

      {/* Abas */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("mine")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
            activeTab === "mine"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Minhas Trilhas
          {myTrails.length > 0 && (
            <Badge className="ml-2 bg-primary/20 text-primary border-0 text-xs px-1.5">
              {myTrails.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
            activeTab === "catalog"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Catálogo
          {catalogTrails.length > 0 && (
            <Badge className="ml-2 bg-muted text-muted-foreground border-0 text-xs px-1.5">
              {catalogTrails.length}
            </Badge>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "mine" ? (
        myTrails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-16 rounded-2xl bg-gradient-card border border-border flex items-center justify-center">
              <Route className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Nenhuma trilha inscrita</p>
              <p className="text-sm text-muted-foreground mt-1">
                Explore o catálogo e inscreva-se em uma trilha.
              </p>
            </div>
            <Button onClick={() => setActiveTab("catalog")} variant="outline" className="border-border">
              <BookOpen className="size-4 mr-2" /> Ver Catálogo
            </Button>
          </div>
        ) : (
          <div className="space-y-6 stagger-children">
            {myTrails.map((trail) => (
              <MyTrailCard
                key={trail.trailId}
                trail={trail}
                onExam={(id, name) => setExamState({ trailId: id, trailName: name })}
              />
            ))}
          </div>
        )
      ) : (
        catalogTrails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-16 rounded-2xl bg-gradient-card border border-border flex items-center justify-center">
              <CheckCircle2 className="size-8 text-success" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Você está inscrito em todas as trilhas!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Continue seu progresso nas suas trilhas.
              </p>
            </div>
            <Button onClick={() => setActiveTab("mine")} variant="outline" className="border-border">
              <Route className="size-4 mr-2" /> Minhas Trilhas
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-children">
            {catalogTrails.map((trail) => (
              <TrailCatalogCard key={trail.id} trail={trail} onEnroll={handleEnroll} />
            ))}
          </div>
        )
      )}

      {/* Modal de exame */}
      {examState && (
        <TrailExamModal
          trailId={examState.trailId}
          trailName={examState.trailName}
          onClose={() => setExamState(null)}
          onPass={(code) => {
            handleExamPass();
            refreshProfile();
            toast.success(`Certificado emitido! +100 XP — Código: ${code}`);
          }}
        />
      )}
    </AppShell>
  );
}
