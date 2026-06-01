import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  Trophy,
  GraduationCap,
} from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isLight = theme === "snow-blue";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Aurora background — adapts to both themes via design tokens */}
      <div className="login-aurora" aria-hidden="true">
        <span />
      </div>
      <div className="login-grid" aria-hidden="true" />
      <img
        src="/totvs.svg"
        className="watermark-bg"
        alt=""
        aria-hidden="true"
      />

      {/* Theme switcher — top right */}
      <div className="absolute top-5 right-5 z-20">
        <div className="theme-pill" role="group" aria-label="Selecionar tema">
          <button
            type="button"
            data-active={isLight}
            onClick={() => setTheme("snow-blue")}
            aria-label="Tema claro Snow Blue"
            title="Snow Blue"
          >
            <Sun className="size-4" />
          </button>
          <button
            type="button"
            data-active={!isLight}
            onClick={() => setTheme("night-blue")}
            aria-label="Tema escuro Night Blue"
            title="Night Blue"
          >
            <Moon className="size-4" />
          </button>
        </div>
      </div>

      {/* Brand mark — top left */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
        <div className="size-9 rounded-xl grid place-items-center bg-gradient-brand shadow-glow">
          <GraduationCap className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground">
            Universidade <span className="text-gradient">Suri</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            Plataforma educacional
          </div>
        </div>
      </div>

      {/* Floating decorative chips (md+) */}
      <div className="hidden md:block">
        <div
          className="login-chip delay-1"
          style={{ left: "10%", top: "22%" }}
        >
          <span className="chip-dot" />
          <Sparkles className="size-3.5 text-foreground/70" />
          +2.500 alunos certificados
        </div>
        <div
          className="login-chip delay-2"
          style={{ right: "9%", top: "28%" }}
        >
          <span className="chip-dot" />
          <ShieldCheck className="size-3.5 text-foreground/70" />
          Antifraude por aulas sequenciais
        </div>
        <div
          className="login-chip delay-3"
          style={{ left: "12%", bottom: "18%" }}
        >
          <span className="chip-dot" />
          <Trophy className="size-3.5 text-foreground/70" />
          Gamificação com XP &amp; Níveis
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md fade-in-up">
        <div className="login-card p-7 sm:p-9">
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-background/40 text-[11px] uppercase tracking-[0.18em] text-foreground/60">
              <span className="size-1.5 rounded-full bg-gradient-brand" />
              Bem-vindo de volta
            </div>
            <h1 className="font-display text-3xl sm:text-[1.95rem] font-bold mt-3 leading-tight">
              Entre na <span className="text-gradient">Universidade Suri</span>
            </h1>
            <p className="text-sm text-foreground/60 mt-2">
              Acesse sua trilha, projetos e certificações com sua conta
              corporativa.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-foreground/70 mb-1.5"
              >
                E-mail corporativo
              </label>
              <div className="field-glass">
                <Mail className="field-icon size-4" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@empresa.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-pw"
                  className="block text-xs font-medium text-foreground/70"
                >
                  Senha
                </label>
                <button
                  type="button"
                  className="text-[11px] text-foreground/55 hover:text-foreground transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="field-glass">
                <Lock className="field-icon size-4" />
                <input
                  id="login-pw"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={
                    showPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
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
                  Entrando…
                </span>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            Ainda não tem conta?{" "}
            <Link
              to="/signup"
              className="font-medium text-foreground hover:text-gradient"
            >
              Criar minha conta
            </Link>
          </p>
        </div>

        <div className="mt-5 text-center text-[11px] text-foreground/45">
          © Universidade Suri ·{" "}
          <span className="text-foreground/60">Padrão TOTVS</span> ·
          Plataforma de educação corporativa
        </div>
      </div>
    </div>
  );
}
