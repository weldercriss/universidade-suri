import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { usePlatformSettings } from "@/lib/settings";
import { Sun, Moon, ArrowLeft, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

export function ForgotPasswordPage() {
  const { theme, setTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const isLight = theme === "snow-blue";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      toast.error("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="login-aurora" aria-hidden="true">
        <span />
      </div>

      <img
        src={
          isLight
            ? settings?.logo_collapsed_light
              ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_light}`
              : totvsLight
            : settings?.logo_collapsed_dark
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_dark}`
            : totvsDark
        }
        className="watermark-bg"
        alt=""
        aria-hidden="true"
      />

      <div className="absolute top-5 left-5 z-20">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-foreground/60 hover:text-foreground border border-border/60 bg-background/40 backdrop-blur-sm hover:bg-background/70 hover:border-border transition-all duration-200"
        >
          <ArrowLeft className="size-3" />
          Voltar ao login
        </Link>
      </div>

      <div className="absolute top-5 right-5 z-20">
        <div className="theme-pill" role="group" aria-label="Selecionar tema">
          <button type="button" data-active={isLight} onClick={() => setTheme("snow-blue")} aria-label="Tema claro">
            <Sun className="size-4" />
          </button>
          <button type="button" data-active={!isLight} onClick={() => setTheme("night-blue")} aria-label="Tema escuro">
            <Moon className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md fade-in-up">
        <div className="login-card p-8 sm:p-10">
          {sent ? (
            <div className="text-center">
              <div className="size-16 rounded-2xl bg-secondary/10 border border-secondary/20 grid place-items-center mx-auto mb-5">
                <CheckCircle2 className="size-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-gradient mb-3">Solicitação enviada</h2>
              <p className="text-sm text-foreground/60 leading-relaxed mb-6">
                Se o e-mail <strong className="text-foreground">{email}</strong> estiver cadastrado, um link de redefinição será disponibilizado pelo administrador.
              </p>
              <p className="text-xs text-foreground/45 mb-6">
                Entre em contato com o administrador da plataforma para receber o link de redefinição.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-background/40 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-4 self-start">
                  <span className="size-1.5 rounded-full bg-gradient-brand" />
                  Recuperar acesso
                </div>
                <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold leading-tight mb-2">
                  Redefinir <span className="text-gradient">senha</span>
                </h1>
                <p className="text-sm text-foreground/55 leading-relaxed">
                  Informe seu e-mail corporativo para solicitar um link de redefinição de senha.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    E-mail corporativo
                  </label>
                  <div className="field-glass">
                    <Mail className="field-icon size-4" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-aurora w-full inline-flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Enviando…
                    </span>
                  ) : (
                    <>
                      Solicitar redefinição
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-foreground/60 pt-1">
                  Lembrou a senha?{" "}
                  <Link to="/login" className="font-medium text-foreground hover:text-gradient">
                    Entrar
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>

        <div className="mt-5 text-center text-[11px] text-foreground/45">
          © Universidade Suri · Plataforma educacional da Suri
        </div>
      </div>
    </div>
  );
}
