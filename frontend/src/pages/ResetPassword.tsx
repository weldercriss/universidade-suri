import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTheme } from "@/lib/theme";
import { usePlatformSettings } from "@/lib/settings";
import { Sun, Moon, ArrowLeft, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";

export function ResetPasswordPage() {
  const { theme, setTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const isLight = theme === "snow-blue";

  useEffect(() => {
    if (!token) {
      toast.error("Token inválido. Solicite um novo link de redefinição.");
    }
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      toast.error(err.message || "Token inválido ou expirado. Solicite um novo link.");
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
          {!token ? (
            <div className="text-center">
              <div className="size-16 rounded-2xl bg-destructive/10 border border-destructive/20 grid place-items-center mx-auto mb-5">
                <AlertTriangle className="size-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Link inválido</h2>
              <p className="text-sm text-foreground/60 mb-6">
                Este link de redefinição é inválido ou não contém um token. Solicite um novo link.
              </p>
              <Link to="/esqueceu-senha" className="btn-aurora inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                Solicitar novo link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="size-16 rounded-2xl bg-secondary/10 border border-secondary/20 grid place-items-center mx-auto mb-5">
                <CheckCircle2 className="size-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-gradient mb-3">Senha redefinida!</h2>
              <p className="text-sm text-foreground/60 leading-relaxed mb-2">
                Sua senha foi alterada com sucesso.
              </p>
              <p className="text-xs text-foreground/45 mb-6">Redirecionando para o login…</p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                <ArrowLeft className="size-4" />
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-background/40 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-4">
                  <span className="size-1.5 rounded-full bg-gradient-brand" />
                  Nova senha
                </div>
                <h1 className="font-display text-2xl sm:text-[1.7rem] font-bold leading-tight mb-2">
                  Criar nova <span className="text-gradient">senha</span>
                </h1>
                <p className="text-sm text-foreground/55 leading-relaxed">
                  Escolha uma senha segura com pelo menos 6 caracteres.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="reset-pw" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Nova senha
                  </label>
                  <div className="field-glass">
                    <Lock className="field-icon size-4" />
                    <input
                      id="reset-pw"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="field-action"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-confirm" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Confirmar nova senha
                  </label>
                  <div className="field-glass">
                    <Lock className="field-icon size-4" />
                    <input
                      id="reset-confirm"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (!!confirm && password !== confirm)}
                  className="btn-aurora w-full inline-flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Salvando…
                    </span>
                  ) : (
                    <>
                      Redefinir senha
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
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
