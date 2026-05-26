import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff, Sun, Moon, ArrowRight, Chrome, Hexagon } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      navigate("/");
    } catch {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    // Simulated Google Login for demo purposes since no ClientID is available
    // In production, use @react-oauth/google or similar to get the credential token
    const email = window.prompt("Simulação Google Login: Digite seu e-mail do Google (ex: user@gmail.com)");
    if (!email) return;
    const name = email.split("@")[0];
    
    setLoading(true);
    try {
      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ token: "fake_google_token", name, email })
      });
      // Set auth context (simulated since useAuth doesn't expose a manual token setter yet, 
      // wait, useAuth's `login` handles local storage, but for google we need to adapt it. 
      // Actually, we can just use localstorage directly and refresh)
      localStorage.setItem("suri_token", data.token);
      localStorage.setItem("nimbus_user", JSON.stringify(data.user));
      window.location.href = "/";
    } catch (err: any) {
      toast.error("Erro no login com Google");
      setLoading(false);
    }
  };

  const loginWithSuri = () => {
    toast.info("Integração com Plataforma Suri (SSO) em desenvolvimento.");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative overflow-hidden">
      <img src="/src/assets/totvs.svg" className="watermark-bg" alt="" aria-hidden="true" />

      {/* Brand panel - Inspired by RD Station login gradient */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 login-brand-gradient overflow-hidden border-r border-border">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 80% 60%, hsl(180 85% 55% / 0.15), transparent 50%)'
        }} />

        {/* Theme toggle */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-10 rounded-xl bg-white/10 border border-white/20 grid place-items-center backdrop-blur-sm">
              <img src="/src/assets/icons/totvs.svg" alt="Logo Totvs" />
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
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { icon: "✓", text: "Conteúdos práticos e atualizados" },
              { icon: "✓", text: "Metodologia simples e eficiente" },
              { icon: "✓", text: "Certificado com a marca Suri" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-foreground/80">
                <span className="size-6 rounded-full bg-cyan-accent/20 text-cyan-accent grid place-items-center text-xs font-bold">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-foreground/40 text-xs">
          © Universidade Suri · Plataforma de educação
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-md p-8 bg-gradient-card border-border shadow-elegant fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="size-9 rounded-xl bg-gradient-hero shadow-glow grid place-items-center">
              <GraduationCap className="size-5 text-snow" />
            </div>
            <span className="font-display text-lg font-semibold text-gradient">Universidade Suri</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gradient">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use suas credenciais para acessar a plataforma.
            </p>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <Button variant="outline" className="w-full h-11 border-border bg-background/50 hover:bg-muted/50" onClick={loginWithGoogle}>
              <Chrome className="size-4 mr-2 text-red-500" />
              Continuar com Google
            </Button>
            <Button variant="outline" className="w-full h-11 border-border bg-background/50 hover:bg-muted/50" onClick={loginWithSuri}>
              <Hexagon className="size-4 mr-2 text-blue-500" />
              Entrar com Plataforma Suri
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">ou acesse com e-mail</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="bg-muted/30 border-border h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-pw">Senha</Label>
              <div className="relative">
                <Input
                  id="login-pw"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex justify-end">
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-smooth">
                Esqueceu sua senha?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-hero text-snow border-border hover:shadow-glow font-semibold text-sm group"
              disabled={loading}
            >
              {loading ? "Entrando…" : (
                <>Login <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-foreground hover:underline font-medium hover:text-gradient">Criar conta</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
