import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "@/lib/api";

interface QuizAttemptRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  score: number;
  passed: boolean;
  attemptNumber: number;
  createdAt: string;
}

interface MyPost {
  id: string;
  title: string;
  body: string;
  courseId: string | null;
  courseTitle: string | null;
  createdAt: string;
}

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRecord[]>([]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);

  useEffect(() => {
    if (user) {
      apiRequest<any[]>("/courses")
        .then((data) => setCourses(data))
        .catch(() => setCourses([]));

      apiRequest<{ count?: number; certificates?: any[] } | any[]>("/certificates/user")
        .then((data) => {
          if (Array.isArray(data)) {
            setCertificates(data);
          } else {
            setCertificates(data.certificates || []);
          }
        })
        .catch(() => setCertificates([]));

      apiRequest<QuizAttemptRecord[]>("/quiz/my-attempts")
        .then(setQuizAttempts)
        .catch(() => setQuizAttempts([]));

      apiRequest<MyPost[]>("/posts/mine")
        .then(setMyPosts)
        .catch(() => setMyPosts([]));
    }
  }, [user]);

  if (!user) return null;

  const isAdmin = user.group === "admin" || user.isAdmin;
  const journeySteps = courses.map((c) => ({ id: c.id, title: c.title }));
  const completed = certificates.length;

  const avatarUrl = user.profileImage
    ? (user.profileImage.startsWith("http") ? user.profileImage : `${API_BASE_URL}${user.profileImage}`)
    : null;
  const initials = user.name
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell>
      {/* Hero Profile Card */}
      <Card data-tour="perfil-hero" className="bg-gradient-hero border-border p-8 shadow-elegant relative overflow-hidden fade-in-up">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div className="size-24 rounded-full bg-primary/80 overflow-hidden shadow-lg ring-2 ring-white/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-3xl font-bold text-snow">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              {!isAdmin && (
                <Badge className="bg-snow/10 text-snow border-snow/20">{user.tier}</Badge>
              )}
              {isAdmin && (
                <Badge className="bg-snow/20 text-snow border-snow/30 flex items-center gap-1 w-max">
                  <ShieldCheck className="size-3" />
                  ADMINISTRADOR
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-snow mt-2">{user.name}</h1>
              <div className="text-snow/70 text-sm">{user.email}</div>
              {user.business && <div className="text-snow/60 text-xs mt-0.5">{user.business}</div>}
              {!isAdmin && (
                <div className="mt-4 flex gap-6 text-sm text-snow/80 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3 text-secondary" />
                    <b className="text-snow">{user.xp.toLocaleString()}</b> XP
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="size-3" />
                    <b className="text-snow font-bold">Nv {user.level}</b>
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="size-3" />
                    <b className="text-snow">{certificates.length}</b> certificados
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Progress - Only for non-admin */}
      {!isAdmin && (
        <div className="grid gap-6 mt-6 stagger-children">
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="text-sm font-semibold mb-3 text-gradient">Progresso da jornada</div>
            <Progress value={journeySteps.length > 0 ? (completed / journeySteps.length) * 100 : 0} />
            <div className="text-xs text-muted-foreground mt-2">
              {completed} de {journeySteps.length} etapas
            </div>
            <div className="mt-6 space-y-2">
              {journeySteps.slice(0, 6).map((s, i) => (
                <div
                  key={s.id}
                  className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0"
                >
                  <span className={i < completed ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {s.title}
                  </span>
                  <span className={i < completed ? "text-success font-bold" : "text-muted-foreground"}>
                    {i < completed ? "✓ Concluído" : "— Bloqueado"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Admin profile card */}
      {isAdmin && (
        <div className="mt-6 fade-in-up">
          <Card className="bg-gradient-card border-border p-6 shadow-elegant">
            <div className="text-sm font-semibold mb-3 text-gradient">Informações do Administrador</div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Tipo de acesso</span>
                <span className="font-medium">Acesso Total</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-success">Ativo</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Certificados - Only for non-admin */}
      {!isAdmin && (
        <div className="mt-6 fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Meus Certificados
            </h2>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {certificates.length} emitido{certificates.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {certificates.length === 0 ? (
            <Card className="bg-gradient-card border-border p-8 text-center shadow-elegant">
              <div className="text-4xl mb-3">🎓</div>
              <div className="text-muted-foreground text-sm">
                Você ainda não possui certificados. Conclua um curso para receber o seu!
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {certificates.map((cert: any) => (
                <Card
                  key={cert.id}
                  className="bg-gradient-card border-border p-5 shadow-elegant hover-lift flex items-center gap-4"
                >
                  <div className="size-12 rounded-xl bg-primary/15 grid place-items-center shrink-0">
                    <Award className="size-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {cert.courseTitle || cert.course?.title || "Curso"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(cert.issuedAt).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
                      #{cert.verificationCode}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-primary hover:bg-primary/10"
                    title="Ver certificado"
                    onClick={() => navigate(`/certificado/${cert.verificationCode}`)}
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico de Provas - Only for non-admin */}
      {!isAdmin && (
        <div className="mt-6 fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="size-5 text-secondary" />
              Histórico de Provas
            </h2>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {quizAttempts.length} tentativa{quizAttempts.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {quizAttempts.length === 0 ? (
            <Card className="bg-gradient-card border-border p-8 text-center shadow-elegant">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-muted-foreground text-sm">
                Você ainda não realizou nenhuma prova.
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {quizAttempts.map((a) => (
                <Card key={a.id} className="bg-gradient-card border-border p-4 shadow-elegant flex items-center gap-4">
                  <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${a.passed ? "bg-success/15" : "bg-destructive/15"}`}>
                    {a.passed
                      ? <CheckCircle2 className="size-5 text-success" />
                      : <XCircle className="size-5 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{a.courseTitle}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Tentativa {a.attemptNumber} · {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-lg font-bold ${a.passed ? "text-success" : "text-destructive"}`}>
                      {a.score.toFixed(1)}%
                    </div>
                    <div className={`text-xs font-semibold ${a.passed ? "text-success" : "text-destructive"}`}>
                      {a.passed ? "APROVADO" : "REPROVADO"}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meus projetos - Only for non-admin */}
      {!isAdmin && (
        <div className="mt-6 fade-in-up">
          <h2 className="text-lg font-semibold mb-3">Meus projetos na comunidade</h2>
          {myPosts.length === 0 ? (
            <Card className="bg-gradient-card border-border p-8 text-center text-muted-foreground shadow-elegant">
              Você ainda não publicou projetos. Compartilhe seu primeiro na comunidade.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myPosts.map((p) => (
                <Card key={p.id} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
                  <div className="font-medium hover:text-gradient transition-smooth">{p.title}</div>
                  {p.courseTitle && (
                    <div className="text-xs text-primary font-medium mt-1 flex items-center gap-1">
                      <GraduationCap className="size-3" /> {p.courseTitle}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
                  <div className="text-xs text-muted-foreground/60 mt-2">
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

    </AppShell>
  );
}
