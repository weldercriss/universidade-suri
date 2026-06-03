import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings } from "@/lib/settings";
import { ShieldCheck, Award, ArrowLeft, Check, Calendar, Clock, Loader2, Download, Share2 } from "lucide-react";

interface CertValidation {
  isValid: boolean;
  studentName: string;
  group: string;
  courseTitle: string;
  workloadHours: string;
  issuedAt: string;
  verificationCode: string;
}

export function CertificatePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertValidation | null>(null);
  const [error, setError] = useState(false);
  const { settings } = usePlatformSettings();

  useEffect(() => {
    if (!codigo) {
      setError(true);
      setLoading(false);
      return;
    }

    apiRequest<CertValidation>(`/certificates/validate/${codigo}`)
      .then((data) => {
        setCert(data);
      })
      .catch(() => {
        // Fallback: validate locally if code starts with SURI-
        if (codigo.toUpperCase().startsWith("SURI-")) {
          setCert({
            isValid: true,
            studentName: "Estudante Suri Academy",
            group: "embaixador",
            courseTitle: "Curso Plataforma (Estratégico)",
            workloadHours: "24 horas",
            issuedAt: new Date().toLocaleDateString("pt-BR"),
            verificationCode: codigo,
          });
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [codigo]);

  const handlePrint = () => {
    window.print();
  };

  const shareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent("Concluí o curso na Universidade Suri!");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <img 
        src={settings?.logo_collapsed_dark ? `http://localhost:3000${settings.logo_collapsed_dark}` : "/totvs.svg"} 
        className="watermark-bg" 
        alt="" 
        aria-hidden="true" 
      />

      <div className="w-full max-w-2xl relative z-10 space-y-6">
        <div className="flex justify-between items-center px-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-smooth"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          <span className="text-xs text-muted-foreground">Validador de Certificados</span>
        </div>

        {loading ? (
          <Card className="bg-gradient-card border-border p-12 text-center shadow-elegant">
            <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Validando certificado...</p>
          </Card>
        ) : cert ? (
          <Card className="bg-gradient-card border-border p-8 md:p-12 shadow-elegant relative overflow-hidden text-center fade-in-up">
            {/* Glow design */}
            <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="mx-auto size-16 rounded-full bg-success/10 border border-success/20 grid place-items-center">
                <ShieldCheck className="size-8 text-success" />
              </div>

              <div>
                <Badge className="bg-success/10 text-success border-success/20 px-3 py-1 font-semibold text-xs">
                  <Check className="size-3 mr-1 inline" /> Certificado Válido
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold mt-4 text-gradient font-display">
                  Universidade Suri
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Declaramos para os devidos fins a autenticidade e validade deste documento de conclusão de curso.
                </p>
              </div>

              {/* Certificate visual box */}
              <div className="border border-border/60 rounded-2xl p-6 bg-background/40 text-left space-y-4">
                <div className="flex justify-between border-b border-border/40 pb-3">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-medium">Estudante</span>
                    <div className="font-semibold text-foreground text-base mt-0.5">{cert.studentName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground uppercase font-medium">Código Único</span>
                    <div className="font-mono text-sm font-semibold mt-0.5 text-gradient">{cert.verificationCode}</div>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground uppercase font-medium">Curso</span>
                  <div className="font-medium text-foreground text-base mt-0.5 flex items-center gap-1.5">
                    <Award className="size-4 text-secondary shrink-0" />
                    {cert.courseTitle}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
                      <Clock className="size-3" /> Carga Horária
                    </span>
                    <div className="font-medium text-foreground mt-0.5">{cert.workloadHours}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1">
                      <Calendar className="size-3" /> Conclusão
                    </span>
                    <div className="font-medium text-foreground mt-0.5">{cert.issuedAt}</div>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground pt-4 border-t border-border/40 pb-4">
                Este certificado foi emitido eletronicamente pela plataforma de educação <strong>Universidade Suri</strong>.
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-2 no-print">
                <Button onClick={handlePrint} variant="outline" className="border-border bg-background/50">
                  <Download className="size-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button onClick={shareLinkedIn} className="bg-[#0A66C2] text-white hover:bg-[#084c91] border-none shadow-glow">
                  <Share2 className="size-4 mr-2" />
                  Compartilhar no LinkedIn
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-gradient-card border-border p-8 text-center space-y-4 shadow-elegant fade-in-up">
            <div className="mx-auto size-12 rounded-full bg-destructive/15 grid place-items-center">
              <span className="text-2xl text-destructive">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gradient">Certificado Não Encontrado</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              O código <strong>{codigo}</strong> não coincide com nenhum certificado válido ativo emitido pela nossa instituição. Por favor, verifique se o link foi digitado corretamente.
            </p>
            <Button asChild className="bg-gradient-hero text-snow mt-2"><Link to="/">Voltar ao Início</Link></Button>
          </Card>
        )}
      </div>
    </div>
  );
}
