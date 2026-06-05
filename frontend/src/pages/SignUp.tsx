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
  User,
  Phone,
  CheckCircle2,
  Newspaper,
} from "lucide-react";
import { ChangelogModal, useChangelogBadge } from "@/components/ChangelogModal";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";

export function SignUpPage() {
  const { signup } = useAuth();
  const { theme, setTheme } = useTheme();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", business: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { latestVersion, hasNew, markSeen } = useChangelogBadge();
  const isLight = theme === "snow-blue";

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ ...form, newsletter, group: "vip", tier: "VIP PLUS" });
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
          ? (settings?.logo_collapsed_light ? `http://localhost:3000${settings.logo_collapsed_light}` : totvsLight)
          : (settings?.logo_collapsed_dark ? `http://localhost:3000${settings.logo_collapsed_dark}` : totvsDark)}
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
      <div className="relative z-10 w-full max-w-3xl fade-in-up">
        <div className="login-card p-8 sm:p-10">
          {/* Horizontal layout: info left | form right */}
          <div className="flex flex-col md:flex-row md:gap-10 lg:gap-14">

            {/* ── LEFT: branding / copy ── */}
            <div className="md:w-[40%] md:border-r md:border-border/40 md:pr-10 lg:pr-14 flex flex-col justify-center mb-8 md:mb-0">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/70 bg-background/40 text-[11px] uppercase tracking-[0.18em] text-foreground/60 mb-5 self-start">
                <span className="size-1.5 rounded-full bg-gradient-brand" />
                Crie sua conta
              </div>
              <h1 className="font-display text-3xl sm:text-[1.85rem] font-bold leading-tight mb-3">
                Entre na{" "}
                <span className="text-gradient">Universidade Suri</span>
              </h1>
              <p className="text-sm text-foreground/55 leading-relaxed mb-6">
                Preencha seus dados e comece sua jornada de aprendizado.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Trilhas personalizadas por perfil",
                  "Certificados com validação oficial",
                  "Experiência gamificada com XP",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-foreground/60">
                    <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── RIGHT: form ── */}
            <div className="flex-1 flex flex-col justify-center">
              <form onSubmit={submit} className="space-y-3.5">
                {/* Nome */}
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Nome completo
                  </label>
                  <div className="field-glass">
                    <User className="field-icon size-4" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Seu nome completo"
                    />
                  </div>
                </div>

                {/* Empresa */}
                <div>
                  <label htmlFor="signup-business" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Empresa
                  </label>
                  <div className="field-glass">
                    <User className="field-icon size-4" />
                    <input
                      id="signup-business"
                      type="text"
                      required
                      autoComplete="organization"
                      value={form.business}
                      onChange={set("business")}
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="signup-email" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    E-mail corporativo
                  </label>
                  <div className="field-glass">
                    <Mail className="field-icon size-4" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="voce@empresa.com"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label htmlFor="signup-pw" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Senha
                  </label>
                  <div className="field-glass">
                    <Lock className="field-icon size-4" />
                    <input
                      id="signup-pw"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      value={form.password}
                      onChange={set("password")}
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

                {/* Telefone */}
                <div>
                  <label htmlFor="signup-phone" className="block text-xs font-medium text-foreground/70 mb-1.5">
                    Telefone{" "}
                    <span className="text-foreground/40">(WhatsApp)</span>
                  </label>
                  <div className="field-glass">
                    <Phone className="field-icon size-4" />
                    <input
                      id="signup-phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="(11) 99123-4567"
                    />
                  </div>
                </div>

                {/* Newsletter */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-0.5">
                  <span className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id="signup-newsletter"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="flex size-4 rounded border border-border/70 bg-background/40 peer-checked:bg-primary peer-checked:border-primary transition-colors items-center justify-center">
                      {newsletter && (
                        <svg viewBox="0 0 10 8" className="size-2.5 fill-none stroke-white stroke-[2] stroke-linecap-round stroke-linejoin-round">
                          <polyline points="1 4 4 7 9 1" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="text-[11px] text-foreground/55 leading-snug">
                    Quero receber notícias, dicas e materiais da Universidade Suri.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-aurora w-full inline-flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Criando conta…
                    </span>
                  ) : (
                    <>
                      Criar conta
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-foreground/60 pt-0.5">
                  Já tem conta?{" "}
                  <Link to="/login" className="font-medium text-foreground hover:text-gradient">
                    Entrar
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
