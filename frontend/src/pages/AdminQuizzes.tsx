import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardList, BookOpen, Plus, Upload, Download, Loader2, CheckCircle2, Edit, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface CourseOption { id: string; title: string }
interface Question { id: string; text: string; options: { id: string; text: string }[]; answer: string }
interface BlockedStudent { userId: string; name: string; email: string; tier: string; attemptsUsed: number; attemptsAllowed: number }

export function AdminQuizzesPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [blockedStudents, setBlockedStudents] = useState<BlockedStudent[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    options: [
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ],
    answer: "a",
  });

  const fetchCourses = () => {
    apiRequest<any[]>("/courses")
      .then((data) => setCourses((data || []).map((c: any) => ({ id: c.id, title: c.title }))))
      .catch(() => {});
  };

  const fetchQuestions = (courseId: string) => {
    if (!courseId) return;
    setLoadingQuestions(true);
    apiRequest<Question[]>(`/quiz/${courseId}/questions`)
      .then(setQuestions)
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQuestions(false));
  };

  const fetchBlocked = (courseId: string) => {
    if (!courseId) return;
    setLoadingBlocked(true);
    apiRequest<BlockedStudent[]>(`/quiz/${courseId}/blocked-students`)
      .then(setBlockedStudents)
      .catch(() => setBlockedStudents([]))
      .finally(() => setLoadingBlocked(false));
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    fetchQuestions(courseId);
    fetchBlocked(courseId);
  };

  const openNewQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ text: "", options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }], answer: "a" });
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({ text: q.text, options: q.options, answer: q.answer });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const nonEmpty = questionForm.options.filter((o) => o.text.trim());
    if (!questionForm.text.trim() || nonEmpty.length < 2) {
      toast.error("Preencha o enunciado e pelo menos 2 opções.");
      return;
    }
    try {
      if (editingQuestion) {
        await apiRequest(`/quiz/questions/${editingQuestion.id}`, {
          method: "PUT",
          body: JSON.stringify(questionForm),
        });
        toast.success("Questão atualizada!");
      } else {
        await apiRequest(`/quiz/${selectedCourseId}/questions`, {
          method: "POST",
          body: JSON.stringify(questionForm),
        });
        toast.success("Questão criada!");
      }
      setQuestionModalOpen(false);
      fetchQuestions(selectedCourseId);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar questão");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Remover esta questão?")) return;
    try {
      await apiRequest(`/quiz/questions/${questionId}`, { method: "DELETE" });
      toast.success("Questão removida");
      fetchQuestions(selectedCourseId);
    } catch {
      toast.error("Erro ao remover questão");
    }
  };

  const handleDownloadSample = () => {
    const sample = {
      questions: [
        {
          text: "Exemplo de pergunta: Qual é a capital do Brasil?",
          options: [
            { id: "a", text: "Rio de Janeiro" },
            { id: "b", text: "São Paulo" },
            { id: "c", text: "Brasília" },
            { id: "d", text: "Salvador" }
          ],
          answer: "c"
        }
      ]
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_questoes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourseId) return;
    e.target.value = "";
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questions)) {
        toast.error("JSON inválido: esperado array de questões");
        return;
      }
      await apiRequest(`/quiz/${selectedCourseId}/questions/import`, {
        method: "POST",
        body: JSON.stringify({ questions }),
      });
      toast.success(`${questions.length} questão(ões) importada(s) com sucesso!`);
      fetchQuestions(selectedCourseId);
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar questões");
    }
  };

  const handleGrantAttempt = async (userId: string, name: string) => {
    try {
      await apiRequest(`/quiz/${selectedCourseId}/grant-attempt/${userId}`, { method: "POST" });
      toast.success(`Nova tentativa concedida para ${name}`);
      fetchBlocked(selectedCourseId);
    } catch {
      toast.error("Erro ao conceder tentativa");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <AppShell>
      <div className="mb-4 fade-in-up">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground pl-0">
          <Link to="/configuracoes">
            <ArrowLeft className="size-4 mr-2" /> Voltar para Configurações
          </Link>
        </Button>
      </div>
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4 fade-in-up">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gradient">
            <ClipboardList className="size-8 text-primary" /> Gestão de Provas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie as questões e as provas dos cursos.</p>
        </div>
        <Badge variant="outline" className="border-border bg-gradient-card">Acesso restrito</Badge>
      </header>

      <Card className="bg-gradient-card border-border p-5 shadow-elegant mt-6">
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Curso:</span>
          </div>
          <select
            className="h-10 rounded-md border border-border bg-muted/50 px-3 text-sm min-w-[220px]"
            value={selectedCourseId}
            onChange={(e) => handleSelectCourse(e.target.value)}
          >
            <option value="">Selecione um curso…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {selectedCourseId && (
            <>
              <Button size="sm" onClick={openNewQuestion} className="bg-gradient-hero border border-border text-snow hover:shadow-glow">
                <Plus className="size-4 mr-1" /> Adicionar Questão
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept=".json" className="hidden" onChange={handleJsonImport} />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground transition-colors">
                  <Upload className="size-3.5" /> Importar JSON
                </span>
              </label>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground transition-colors"
              >
                <Download className="size-3.5" /> Baixar Modelo
              </button>
            </>
          )}
        </div>

        {!selectedCourseId && (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
            Selecione um curso para gerenciar suas questões.
          </div>
        )}

        {selectedCourseId && (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Questões ({questions.length})
                </h3>
              </div>
              {loadingQuestions ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin size-5 text-primary" /></div>
              ) : questions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
                  Nenhuma questão cadastrada. Clique em "Adicionar Questão" para começar.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-muted-foreground font-medium pt-0.5 shrink-0">Q{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground mb-2">{q.text}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.id}
                                className={`text-xs px-3 py-1.5 rounded-lg border ${
                                  opt.id === q.answer
                                    ? "border-secondary/40 bg-secondary/10 text-secondary font-semibold"
                                    : "border-border/50 text-muted-foreground"
                                }`}
                              >
                                {opt.id.toUpperCase()}) {opt.text}
                                {opt.id === q.answer && <CheckCircle2 className="size-3 inline ml-1" />}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => openEditQuestion(q)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteQuestion(q.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border/30 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Tentativas Esgotadas
                </h3>
                <Button variant="ghost" size="sm" onClick={() => fetchBlocked(selectedCourseId)} className="text-muted-foreground">
                  <RefreshCw className="size-3.5 mr-1" /> Atualizar
                </Button>
              </div>
              {loadingBlocked ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin size-5 text-muted-foreground" /></div>
              ) : blockedStudents.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum aluno com tentativas esgotadas neste curso.
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {blockedStudents.map((s) => (
                    <div key={s.userId} className="flex items-center gap-3 py-3 flex-wrap">
                      <div className="size-9 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow shrink-0">
                        {s.name?.substring(0, 2).toUpperCase() ?? "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email} · {s.tier}</div>
                        <div className="text-xs text-destructive mt-0.5">
                          {s.attemptsUsed} tentativas usadas de {s.attemptsAllowed} permitidas
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-secondary text-secondary hover:bg-secondary/10 shrink-0"
                        onClick={() => handleGrantAttempt(s.userId, s.name)}
                      >
                        <Plus className="size-3.5 mr-1" /> Autorizar Tentativa
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      <Dialog open={questionModalOpen} onOpenChange={(v) => !v && setQuestionModalOpen(false)}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Editar Questão" : "Nova Questão"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveQuestion} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Enunciado</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-border bg-muted/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Digite a pergunta…"
                value={questionForm.text}
                onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                required
              />
            </div>
            <div className="space-y-3">
              <Label>Opções de resposta</Label>
              {questionForm.options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5 uppercase">{opt.id})</span>
                  <Input
                    placeholder={`Opção ${opt.id.toUpperCase()}`}
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...questionForm.options];
                      updated[i] = { ...opt, text: e.target.value };
                      setQuestionForm({ ...questionForm, options: updated });
                    }}
                    className="bg-muted/50 border-border h-9"
                  />
                  <input
                    type="radio"
                    name="correct-answer"
                    value={opt.id}
                    checked={questionForm.answer === opt.id}
                    onChange={() => setQuestionForm({ ...questionForm, answer: opt.id })}
                    title="Marcar como resposta correta"
                    className="accent-secondary size-4 shrink-0"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Selecione o radio ao lado da opção correta.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-border" onClick={() => setQuestionModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:opacity-90">
                {editingQuestion ? "Salvar Alterações" : "Criar Questão"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
