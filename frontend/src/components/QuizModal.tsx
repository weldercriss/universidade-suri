import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Award, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}

interface SubmitResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  attemptNumber: number;
  attemptsUsed: number;
  attemptsAllowed: number;
  blocked: boolean;
  certificateCode: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onResult: (result: SubmitResult) => void;
}

export function QuizModal({ open, onClose, courseId, onResult }: Props) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    if (!open) {
      setQuestions([]);
      setAnswers({});
      setResult(null);
      return;
    }
    setLoading(true);
    apiRequest<Question[]>(`/quiz/${courseId}/questions`)
      .then(setQuestions)
      .catch(() => toast.error("Erro ao carregar questões"))
      .finally(() => setLoading(false));
  }, [open, courseId]);

  const allAnswered = questions.length > 0 && questions.every((q) => !!answers[q.id]);

  const submit = async () => {
    if (!allAnswered) {
      toast.error("Responda todas as questões antes de enviar.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));
      const res = await apiRequest<SubmitResult>(`/quiz/${courseId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setResult(res);
      onResult(res);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar prova");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setLoading(true);
    apiRequest<Question[]>(`/quiz/${courseId}/questions`)
      .then(setQuestions)
      .catch(() => toast.error("Erro ao carregar questões"))
      .finally(() => setLoading(false));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-gradient text-xl">Prova do Curso</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Questões */}
        {!loading && !result && questions.length > 0 && (
          <div className="space-y-6 mt-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{questions.length} questões · mínimo 70% para aprovação</span>
              <Badge variant="outline" className="border-border">
                {Object.keys(answers).length}/{questions.length} respondidas
              </Badge>
            </div>
            <Progress value={(Object.keys(answers).length / questions.length) * 100} className="h-1.5" />

            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-border bg-background/40 p-5">
                <div className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">
                  Questão {idx + 1}
                </div>
                <p className="font-medium text-foreground mb-4">{q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-150
                          ${selected
                            ? "border-primary bg-primary/15 text-foreground font-medium"
                            : "border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                          }`}
                      >
                        <span className="font-semibold mr-2 uppercase">{opt.id})</span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-2 border-t border-border/30">
              <Button variant="outline" onClick={onClose} className="border-border">
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={!allAnswered || submitting}
                className="bg-gradient-hero text-snow border border-border"
              >
                {submitting ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  "Enviar Prova"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="mt-4 text-center space-y-5">
            {result.passed ? (
              <CheckCircle2 className="size-16 text-secondary mx-auto" />
            ) : (
              <XCircle className="size-16 text-destructive mx-auto" />
            )}

            <div>
              <div className={`text-3xl font-bold ${result.passed ? "text-secondary" : "text-destructive"}`}>
                {result.score.toFixed(1)}%
              </div>
              <div className="text-muted-foreground mt-1">
                {result.correct} de {result.total} questões corretas
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-sm px-4 py-1 border ${result.passed ? "border-secondary text-secondary" : "border-destructive text-destructive"}`}
            >
              {result.passed ? "APROVADO" : "REPROVADO"}
            </Badge>

            <p className="text-sm text-muted-foreground">
              Tentativa {result.attemptsUsed} de {result.attemptsAllowed}
            </p>

            {result.passed && result.certificateCode && (
              <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4">
                <p className="text-secondary font-semibold mb-3">Parabéns! Certificado disponível.</p>
                <Button
                  onClick={() => navigate(`/certificado/${result.certificateCode}`)}
                  className="bg-secondary hover:bg-secondary/80 text-white shadow-glow"
                >
                  <Award className="size-4 mr-2" /> Ver Certificado
                </Button>
              </div>
            )}

            {!result.passed && !result.blocked && (
              <div className="rounded-xl border border-border bg-background/40 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Você ainda tem {result.attemptsAllowed - result.attemptsUsed} tentativa(s) restante(s).
                </p>
                <Button onClick={handleRetry} variant="outline" className="border-border">
                  <RefreshCw className="size-4 mr-2" /> Tentar Novamente
                </Button>
              </div>
            )}

            {!result.passed && result.blocked && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3 text-left">
                <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-destructive font-semibold text-sm">Tentativas esgotadas</p>
                  <p className="text-destructive/80 text-sm mt-1">
                    Entre em contato com o administrador para solicitar uma nova tentativa.
                  </p>
                </div>
              </div>
            )}

            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
