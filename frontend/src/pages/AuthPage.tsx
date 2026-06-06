import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { usePlatformSettings } from "@/lib/settings";
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Newspaper,
} from "lucide-react";
import { ChangelogModal, useChangelogBadge } from "@/components/ChangelogModal";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";
import suriWhite from "@/assets/icons/suri-white.svg";

export function AuthPage() {
  const { login, signup } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = theme === "snow-blue";

  const [isSignUp, setIsSignUp] = useState(location.pathname === "/signup");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", business: "" });
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const [changelogOpen, setChangelogOpen] = useState(false);
  const { latestVersion, hasNew, markSeen } = useChangelogBadge();

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate("/dashboard");
    } catch {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpLoading(true);
    try {
      await signup({ ...form, newsletter, group: "vip", tier: "VIP PLUS" });
      navigate("/dashboard");
    } catch {
      setSignUpLoading(false);
    }
  };

  const toggleMode = () => setIsSignUp((v) => !v);

  const logoSrc = isLight
    ? settings?.logo_collapsed_light
      ? `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${settings.logo_collapsed_light}`
      : totvsLight
    : settings?.logo_collapsed_dark
    ? `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${settings.logo_collapsed_dark}`
    : totvsDark;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Aurora background */}
      <div className="login-aurora" aria-hidden="true">
        <span />
      </div>

      {/* Watermark */}
      <img src={logoSrc} className="watermark-bg" alt="" aria-hidden="true" />

      {/* Back to home */}
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
          <button type="button" data-active={isLight} onClick={() => setTheme("snow-blue")} aria-label="Tema claro" title="Snow Blue">
            <Sun className="size-4" />
          </button>
          <button type="button" data-active={!isLight} onClick={() => setTheme("night-blue")} aria-label="Tema escuro" title="Night Blue">
            <Moon className="size-4" />
          </button>
        </div>
      </div>

      {/* Auth container */}
      <div className="relative z-10 w-full flex flex-col items-center fade-in">
        <div className={`auth-split-container${isSignUp ? " active" : ""}`}>

          {/* ── Sign In Form ── */}
          <div className="auth-form-panel auth-sign-in">
            <form onSubmit={handleLogin} className="auth-form">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-background/40 text-[10px] uppercase tracking-[0.18em] text-foreground/60 mb-5 self-start">
                <span className="size-1.5 rounded-full bg-gradient-brand" />
                Bem-vindo de volta
              </div>

              <h1 className="font-display text-[1.7rem] font-bold leading-tight mb-1 self-start">
                Entre na{" "}
                <span className="text-gradient">Universidade Suri</span>
              </h1>
              <p className="text-xs text-foreground/50 leading-relaxed mb-6 self-start">
                Acesse sua trilha, projetos e certificações com sua conta corporativa.
              </p>

              <div className="w-full space-y-3">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    E-mail corporativo
                  </label>
                  <div className="field-glass">
                    <Mail className="field-icon size-4" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="voce@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-pw" className="block text-xs font-medium text-foreground/70">
                      Senha
                    </label>
                    <Link to="/esqueceu-senha" className="text-[11px] text-foreground/50 hover:text-foreground transition-colors">
                      Esqueceu sua senha?
                    </Link>
                  </div>
                  <div className="field-glass">
                    <Lock className="field-icon size-4" />
                    <input
                      id="login-pw"
                      type={showLoginPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button type="button" className="field-action" onClick={() => setShowLoginPw((s) => !s)} aria-label={showLoginPw ? "Ocultar senha" : "Mostrar senha"}>
                      {showLoginPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loginLoading} className="btn-aurora w-full inline-flex items-center justify-center mt-5">
                {loginLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Entrando…
                  </span>
                ) : "Entrar"}
              </button>

              {/* Mobile toggle */}
              <p className="md:hidden text-center text-sm text-foreground/60 mt-5">
                Ainda não tem conta?{" "}
                <button type="button" onClick={toggleMode} className="font-semibold text-primary">
                  Criar minha conta
                </button>
              </p>
            </form>
          </div>

          {/* ── Sign Up Form ── */}
          <div className="auth-form-panel auth-sign-up">
            <form onSubmit={handleSignUp} className="auth-form">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-background/40 text-[10px] uppercase tracking-[0.18em] text-foreground/60 mb-4 self-start">
                <span className="size-1.5 rounded-full bg-gradient-brand" />
                Crie sua conta
              </div>

              <h1 className="font-display text-[1.55rem] font-bold leading-tight mb-4 self-start">
                Entre na{" "}
                <span className="text-gradient">Universidade Suri</span>
              </h1>

              <div className="w-full space-y-2.5">
                <div className="field-glass">
                  <User className="field-icon size-4" />
                  <input type="text" required autoComplete="name" value={form.name} onChange={set("name")} placeholder="Nome completo" />
                </div>

                <div className="field-glass">
                  <User className="field-icon size-4" />
                  <input type="text" required autoComplete="organization" value={form.business} onChange={set("business")} placeholder="Empresa" />
                </div>

                <div className="field-glass">
                  <Mail className="field-icon size-4" />
                  <input type="email" required autoComplete="email" value={form.email} onChange={set("email")} placeholder="voce@empresa.com" />
                </div>

                <div className="field-glass">
                  <Lock className="field-icon size-4" />
                  <input
                    type={showSignUpPw ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Senha"
                  />
                  <button type="button" className="field-action" onClick={() => setShowSignUpPw((s) => !s)} aria-label={showSignUpPw ? "Ocultar senha" : "Mostrar senha"}>
                    {showSignUpPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                <div className="field-glass">
                  <Phone className="field-icon size-4" />
                  <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="(11) 99123-4567 (WhatsApp)" />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer mt-3 w-full">
                <span className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="peer sr-only" />
                  <span className="flex size-4 rounded border border-border/70 bg-background/40 peer-checked:bg-primary peer-checked:border-primary transition-colors items-center justify-center">
                    {newsletter && (
                      <svg viewBox="0 0 10 8" className="size-2.5 fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round">
                        <polyline points="1 4 4 7 9 1" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="text-[11px] text-foreground/55 leading-snug">
                  Quero receber novidades da Universidade Suri.
                </span>
              </label>

              <button type="submit" disabled={signUpLoading} className="btn-aurora w-full inline-flex items-center justify-center mt-4">
                {signUpLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Criando…
                  </span>
                ) : "Criar conta"}
              </button>

              {/* Mobile toggle */}
              <p className="md:hidden text-center text-sm text-foreground/60 mt-5">
                Já tem conta?{" "}
                <button type="button" onClick={toggleMode} className="font-semibold text-primary">
                  Entrar
                </button>
              </p>
            </form>
          </div>

          {/* ── Toggle Panel (desktop only) ── */}
          <div className="auth-toggle-container">
            <div className="auth-toggle">

              {/* Left — visible in signup mode (panel slid to left) */}
              <div className="auth-toggle-panel auth-toggle-left">
                <img src={suriWhite} className="auth-toggle-logo" alt="Universidade Suri" />
                <div className="auth-toggle-badge">
                  <span className="size-1.5 rounded-full bg-white/80" />
                  Bem-vindo de volta
                </div>
                <h2 className="font-display text-[1.55rem] font-bold text-white leading-tight mb-3 text-center">
                  Entre na Universidade Suri
                </h2>
                <p className="text-white/70 text-[0.82rem] leading-relaxed mb-7 text-center">
                  Já tem uma conta? Acesse sua trilha e certificações
                </p>
                <button type="button" onClick={toggleMode} className="auth-toggle-btn">
                  Entrar
                </button>
              </div>

              {/* Right — visible in signin mode (default) */}
              <div className="auth-toggle-panel auth-toggle-right">
                <img src={suriWhite} className="auth-toggle-logo" alt="Universidade Suri" />
                <div className="auth-toggle-badge">
                  <span className="size-1.5 rounded-full bg-white/80" />
                  Crie sua conta
                </div>
                <h2 className="font-display text-[1.55rem] font-bold text-white leading-tight mb-3 text-center">
                  Olá, amigo! Bem-vindo
                </h2>
                <p className="text-white/70 text-[0.82rem] leading-relaxed mb-7 text-center">
                  Registre seus dados para aproveitar trilhas, certificados e muito mais
                </p>
                <button type="button" onClick={toggleMode} className="auth-toggle-btn">
                  Criar conta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 text-center text-[11px] text-foreground/45 flex items-center justify-center gap-3">
          <span>© Universidade Suri · Plataforma educacional da Suri</span>
          {latestVersion && (
            <button
              onClick={() => { setChangelogOpen(true); markSeen(); }}
              className="relative inline-flex items-center gap-1 hover:text-foreground/70 transition-colors"
            >
              <Newspaper className="size-3" />
              <span>v{latestVersion}</span>
              {hasNew && <span className="absolute -top-1 -right-1.5 size-1.5 rounded-full bg-secondary" />}
            </button>
          )}
        </div>
      </div>

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
