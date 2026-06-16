import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { usePlatformSettings } from "@/lib/settings";
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Newspaper,
} from "lucide-react";
import { ChangelogModal, useChangelogBadge } from "@/components/ChangelogModal";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";

export function LoginPage() {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { latestVersion, hasNew, markSeen } = useChangelogBadge();
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
      {/* Aurora background */}
      <div className="login-aurora" aria-hidden="true">
        <span />
      </div>

      <img 
        src={isLight 
          ? (settings?.logo_collapsed_light ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_light}` : totvsLight)
          : (settings?.logo_collapsed_dark ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_dark}` : totvsDark)}
        className="watermark-bg" 
        alt="" 
        aria-hidden="true" 
      />

      {/* Back to home — top left */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-foreground/60 hover:text-foreground border border-border/60 bg-background/40 backdrop-blur-sm hover:bg-background/70 hover:border-border transition-all duration-200"
        >
          <ArrowLeft className="size-3" />
          Início
        </Link>
      </div>

      {/* Theme switcher */}
      <div className="absolute top-5 right-5 z-20">
        <div className="theme-pill" role="group" aria-label="Selecionar tema">
          <button
            type="button"
            data-active={isLight}
            onClick={() => setTheme("snow-blue")}
            aria-label="Tema claro"
            title="Snow Blue"
          >
            <Sun className="size-4" />
          </button>
          <button
            type="button"
            data-active={!isLight}
            onClick={() => setTheme("night-blue")}
            aria-label="Tema escuro"
            title="Night Blue"
          >
            <Moon className="size-4" />
          </button>
        </div>
      </div>

      {/* Card horizontal */}
      <div className="relative z-10 w-full max-w-3xl fade-in">
        <div className="login-card p-8 sm:p-10">
          {/* Horizontal layout: info left | form right */}
          <div className="flex flex-col md:flex-row md:gap-10 lg:gap-14">

            {/* ── LEFT: branding / copy ── */}
            <div className="md:w-[42%] md:border-r md:border-border/40 md:pr-10 lg:pr-14 flex flex-col justify-center mb-8 md:mb-0">
              
              <h1 className="font-display text-3xl sm:text-[1.85rem] font-bold leading-tight mb-3">
                Entre na{" "}
                <span className="text-gradient">Universidade Suri</span>
              </h1>
              <p className="text-sm text-foreground/55 leading-relaxed">
                Acesse sua trilha, projetos e certificações com sua conta corporativa.
              </p>
            </div>

            {/* ── RIGHT: form ── */}
            <div className="flex-1 flex flex-col justify-center">
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
                    <Link
                      to="/esqueceu-senha"
                      className="text-[11px] text-foreground/55 hover:text-foreground transition-colors"
                    >
                      Esqueceu sua senha?
                    </Link>
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
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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

                <p className="text-center text-sm text-foreground/60 pt-1">
                  Ainda não tem conta?{" "}
                  <Link to="/signup" className="font-medium text-foreground hover:text-gradient">
                    Criar minha conta
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-[11px] text-foreground/45 flex items-center justify-center gap-3">
          <span>© Universidade Suri · Plataforma educacional da Suri</span>
          {latestVersion && (
            <button
              onClick={() => { setChangelogOpen(true); markSeen(); }}
              className="relative inline-flex items-center gap-1 hover:text-foreground/70 transition-colors"
            >
              <Newspaper className="size-3" />
              <span>v{latestVersion}</span>
              {hasNew && (
                <span className="absolute -top-1 -right-1.5 size-1.5 rounded-full bg-secondary" />
              )}
            </button>
          )}
        </div>
      </div>

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
