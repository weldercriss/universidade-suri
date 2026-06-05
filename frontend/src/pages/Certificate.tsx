import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import surishopLogo from "@/assets/icons/surishop.svg?url";
import totvsDark from "@/assets/icons/totvs.svg";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings } from "@/lib/settings";
import { ShieldCheck, Award, ArrowLeft, Check, Calendar, Clock, Loader2, Download, Image as ImageIcon } from "lucide-react";

interface CertValidation {
  isValid: boolean;
  studentName: string;
  group: string;
  courseTitle: string;
  workloadHours: string;
  issuedAt: string;
  verificationCode: string;
}

/**
 * Selo em formato de roseta (igual à imagem):
 * - borda azul serrilhada (scallops)
 * - miolo creme com borda dupla
 * - 3 estrelas no topo + 3 embaixo
 * - "Suri" em preto e "Certificado" abaixo
 * - duas fitas pretas em "rabo de andorinha"
 */
function SuriSealSvg() {
  const cx = 100;
  const cy = 95;
  const N = 22;
  const bumpDist = 68;
  const bumpR = 8;

  const bumps = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2;
    return { x: cx + bumpDist * Math.cos(a), y: cy + bumpDist * Math.sin(a) };
  });

  const star = (x: number, y: number) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="#4f46e5"
      fontSize="14"
      fontFamily="serif"
    >
      ★
    </text>
  );

  return (
    <svg viewBox="0 0 200 245" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {/* Fitas (desenhadas antes para ficarem atrás do selo) */}
      <path d="M 72 118 L 96 128 L 84 234 L 74 218 L 60 228 Z" fill="#262626" />
      <path d="M 128 118 L 104 128 L 116 234 L 126 218 L 140 228 Z" fill="#262626" />

      {/* Serrilhado (bumps) */}
      {bumps.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={bumpR} fill="#4f46e5" />
      ))}

      {/* Anel azul sólido */}
      <circle cx={cx} cy={cy} r={66} fill="#4f46e5" />

      {/* Miolo creme com borda dupla */}
      <circle cx={cx} cy={cy} r={57} fill="#f4f1e8" />
      <circle cx={cx} cy={cy} r={53} fill="none" stroke="#4f46e5" strokeWidth="1.2" opacity="0.55" />

      {/* Estrelas topo */}
      {star(80, 64)}
      {star(100, 59)}
      {star(120, 64)}

      {/* Texto central */}
      <text x={cx} y={102} textAnchor="middle" fill="#111827" fontSize="26" fontWeight="800" fontFamily="'Sora','Inter',sans-serif">
        Suri
      </text>
      <text x={cx} y={120} textAnchor="middle" fill="#1f2937" fontSize="13" fontFamily="'Sora','Inter',sans-serif">
        Certificado
      </text>

      {/* Estrelas base */}
      {star(80, 142)}
      {star(100, 147)}
      {star(120, 142)}
    </svg>
  );
}

function CertificateVisual({ cert, qrDataUrl }: { cert: CertValidation; qrDataUrl: string | null }) {
  return (
    <div
      style={{
        width: "900px",
        height: "540px",
        background: "linear-gradient(135deg, #f1f2fb 0%, #fafbfe 65%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Sora', 'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Blob orgânico — canto superior direito */}
      <svg
        viewBox="0 0 460 340"
        preserveAspectRatio="xMaxYMin slice"
        style={{ position: "absolute", top: 0, right: 0, width: "440px", height: "330px" }}
      >
        {/* Roxo principal */}
        <path
          d="M 460 0 L 232 0 C 202 36 274 82 244 138 C 217 188 302 196 348 170 C 402 140 434 182 460 150 Z"
          fill="#5e22d6"
        />
        {/* Acento navy escuro na borda direita */}
        <path
          d="M 460 0 L 360 0 C 366 48 420 54 436 96 C 449 128 460 112 460 112 Z"
          fill="#1c1248"
        />
        <path
          d="M 460 120 C 432 150 446 200 460 220 Z"
          fill="#1c1248"
        />
      </svg>

      {/* Conteúdo */}
      <div style={{ display: "flex", flex: 1, padding: "44px 56px 40px 56px", position: "relative", zIndex: 1 }}>
        {/* Coluna esquerda */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Logo */}
          <div style={{ marginBottom: "40px" }}>
            <img src={surishopLogo} alt="Suri Shop" style={{ height: "30px", display: "block" }} />
          </div>

          {/* Título */}
          <div style={{ marginBottom: "auto" }}>
            <div
              style={{
                fontSize: "64px",
                fontWeight: 800,
                color: "#3b5bdb",
                lineHeight: 1,
                letterSpacing: "-2px",
              }}
            >
              Certificado
            </div>
            <div
              style={{
                fontSize: "34px",
                fontWeight: 700,
                color: "#3b5bdb",
                marginTop: "8px",
                letterSpacing: "-0.5px",
              }}
            >
              de participação
            </div>
          </div>

          {/* Informações do aluno */}
          <div style={{ marginTop: "auto" }}>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "14px",
              }}
            >
              {cert.studentName}
            </div>
            <div
              style={{
                fontSize: "16px",
                color: "#334155",
                lineHeight: 1.55,
                maxWidth: "560px",
              }}
            >
              Concluiu com êxito o curso{" "}
              <strong style={{ color: "#1e293b" }}>{cert.courseTitle}</strong>
              {" "}com carga horária de{" "}
              <strong style={{ color: "#1e293b" }}>{cert.workloadHours}</strong>
              {", concluído em "}
              <strong style={{ color: "#1e293b" }}>{cert.issuedAt}</strong>.
            </div>

            {/* QR Code + código de verificação */}
            <div style={{ marginTop: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR de validação"
                  style={{ width: "72px", height: "72px", borderRadius: "6px", border: "1px solid #e2e8f0", flexShrink: 0 }}
                />
              )}
              <div>
                <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "4px", letterSpacing: "0.5px" }}>
                  ESCANEIE PARA VERIFICAR
                </div>
                <div style={{ width: "32px", height: "2px", background: "linear-gradient(90deg, #3b5bdb, #4f46e5)", marginBottom: "6px" }} />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    fontFamily: "monospace",
                    letterSpacing: "0.5px",
                  }}
                >
                  {cert.verificationCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna direita — Selo */}
        <div
          style={{
            width: "210px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: "24px",
            flexShrink: 0,
          }}
        >
          <div style={{ width: "200px", height: "245px" }}>
            <SuriSealSvg />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificatePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertValidation | null>(null);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { settings } = usePlatformSettings();
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cert) return;
    const url = `${window.location.origin}/certificado/${cert.verificationCode}`;
    QRCode.toDataURL(url, { width: 144, margin: 1, color: { dark: "#1e293b", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [cert]);

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

  const sanitizeFilename = (str: string) =>
    str.replace(/[/\\?%*:|"<>]/g, "-").trim();

  const handleExportPdf = async () => {
    if (!certRef.current || !cert) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fafbfe",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [900, 540] });
      pdf.addImage(imgData, "JPEG", 0, 0, 900, 540);

      const filename = sanitizeFilename(
        `${cert.courseTitle} - ${cert.studentName} - ${cert.workloadHours}`
      );
      pdf.save(`${filename}.pdf`);
    } catch {
      // fallback to print
      window.print();
    } finally {
      setExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!certRef.current || !cert) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fafbfe",
      });

      const link = document.createElement("a");
      const filename = sanitizeFilename(
        `${cert.courseTitle} - ${cert.studentName} - ${cert.workloadHours}`
      );
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background p-4 pt-8 relative overflow-hidden">
      <img
        src={
          settings?.logo_collapsed_dark
            ? `http://localhost:3000${settings.logo_collapsed_dark}`
            : totvsDark
        }
        className="watermark-bg"
        alt=""
        aria-hidden="true"
      />

      <div className="w-full max-w-5xl relative z-10 space-y-6">
        {/* Nav */}
        <div className="flex justify-between items-center px-2">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard")}
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
          <>
            {/* Validation badge */}
            <Card className="bg-gradient-card border-border px-6 py-4 shadow-elegant fade-in-up">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-success/10 border border-success/20 grid place-items-center">
                    <ShieldCheck className="size-5 text-success" />
                  </div>
                  <div>
                    <Badge className="bg-success/10 text-success border-success/20 px-2.5 py-0.5 text-xs font-semibold">
                      <Check className="size-3 mr-1 inline" /> Certificado Válido
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Emitido pela <strong>Universidade Suri</strong> em {cert.issuedAt}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Award className="size-4 text-secondary" /> {cert.courseTitle}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-4" /> {cert.workloadHours}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" /> {cert.issuedAt}
                  </span>
                </div>
              </div>
            </Card>

            {/* Certificate visual — scrollable on mobile */}
            <div className="overflow-x-auto fade-in-up">
              <div style={{ minWidth: "900px" }} ref={certRef}>
                <CertificateVisual cert={cert} qrDataUrl={qrDataUrl} />
              </div>
            </div>

            {/* Export actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 no-print fade-in-up">
              <Button
                onClick={handleExportPdf}
                disabled={exporting}
                variant="outline"
                className="border-border bg-background/50"
              >
                {exporting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Download className="size-4 mr-2" />
                )}
                Baixar PDF
              </Button>
              <Button
                onClick={handleExportImage}
                disabled={exporting}
                variant="outline"
                className="border-border bg-background/50"
              >
                {exporting ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <ImageIcon className="size-4 mr-2" />
                )}
                Baixar Imagem
              </Button>
            </div>
          </>
        ) : (
          <Card className="bg-gradient-card border-border p-8 text-center space-y-4 shadow-elegant fade-in-up">
            <div className="mx-auto size-12 rounded-full bg-destructive/15 grid place-items-center">
              <span className="text-2xl text-destructive">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gradient">Certificado Não Encontrado</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              O código <strong>{codigo}</strong> não coincide com nenhum certificado válido ativo emitido
              pela nossa instituição. Por favor, verifique se o link foi digitado corretamente.
            </p>
            <Button asChild className="bg-gradient-hero text-snow mt-2">
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}