import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff, Sun, Moon, ArrowRight, Phone } from "lucide-react";
const AMB_TIERS = [
  "Embaixador Voice", "Embaixador Elite", "Embaixador Icon",
  "VIP BLUE", "VIP CORE", "VIP PLUS"
] as const;
type AmbTier = typeof AMB_TIERS[number];

export function SignUpPage() {
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [tier, setTier] = useState<AmbTier>("Embaixador Voice");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isLight = theme === "snow-blue";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ ...form, group: "vip", tier: "VIP PLUS" });
      navigate("/");
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden">
      <img src="/totvs.svg" className="watermark-bg" alt="" aria-hidden="true" />

      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 login-brand-gradient overflow-hidden border-r border-border">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 80% 60%, hsl(180 85% 55% / 0.15), transparent 50%)'
        }} />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-white/10 border border-white/20 grid place-items-center backdrop-blur-sm">
              <GraduationCap className="size-5 text-foreground" />
            </div>
            <span className="font-display text-lg font-semibold text-foreground">Universidade Suri</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="text-foreground/70 hover:text-foreground"
          >
            {isLight ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight text-foreground">
            Educação e prática de verdade, ao seu alcance.
          </h1>
          <p className="text-foreground/70 mt-4 max-w-md text-lg">
            Inscreva-se e aprenda com quem lidera o mercado.
          </p>
        </div>

        <div className="relative z-10 text-foreground/40 text-xs">© Universidade Suri · Plataforma de educação</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 relative z-10 overflow-y-auto">
        <Card className="w-full max-w-md p-8 bg-gradient-card border-border shadow-elegant fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="size-9 rounded-xl bg-gradient-hero shadow-glow grid place-items-center">
              <GraduationCap className="size-5 text-snow" />
            </div>
            <span className="font-display text-lg font-semibold text-gradient">Universidade Suri</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gradient">Criar conta</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha seus dados para acessar a plataforma.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">cadastre-se com email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Seu nome completo"
                className="bg-muted/30 border-border h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="voce@empresa.com"
                className="bg-muted/30 border-border h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-muted/30 border-border pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefone (de preferência WhatsApp)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(11) 99123-4567"
                  className="bg-muted/30 border-border pl-10 h-11"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" id="signup-newsletter" className="mt-1 accent-primary" />
              <label htmlFor="signup-newsletter" className="text-xs text-muted-foreground leading-tight">
                Eu gostaria de receber notícias, dicas e materiais promocionais.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-hero text-snow border-border hover:shadow-glow font-semibold text-sm group"
              disabled={loading}
            >
              {loading ? "Criando conta…" : (
                <>Criar conta <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground text-center leading-tight mt-2">
              Ao preencher o formulário, você aceita receber conteúdos de acordo com seus interesses.
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-foreground hover:underline font-medium hover:text-gradient">Entrar</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
