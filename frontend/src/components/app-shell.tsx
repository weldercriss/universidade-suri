import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, Users, FolderKanban, User, Trophy, Settings,
  ShieldCheck, LogOut, Sparkles, Shield, Sun, Moon, Menu, X, ChevronDown,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cursos", label: "Cursos", icon: GraduationCap },
  { to: "/comunidade", label: "Comunidade", icon: Users },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/perfil", label: "Perfil", icon: User },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/admin", label: "Admin", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, switchGroup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!user) {
    return null;
  }

  const isVip = user.group === "vip";
  const isAdmin = user.group === "admin" || user.isAdmin;
  const BrandIcon = isAdmin ? ShieldCheck : (isVip ? Sparkles : Shield);
  const isLight = theme === "snow-blue";

  // Filter nav items - hide Projects for admin
  const filteredNav = nav.filter(item => {
    if (item.to === "/admin" && !isAdmin) return false;
    if (item.to === "/projetos" && isAdmin) return false;
    return true;
  });

  const sidebarWidth = sidebarCollapsed ? "w-[68px]" : "w-64";
  const mainPadding = sidebarCollapsed ? "md:pl-[68px]" : "md:pl-64";

  return (
    <div className="min-h-screen flex w-full relative overflow-x-hidden bg-background">
      {/* Watermark Flutuante Gigante no Background */}
      <img src="/totvs.svg" className="watermark-bg" alt="" aria-hidden="true" />

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 md:flex ${sidebarWidth} shrink-0 flex-col border-r border-border bg-card z-50 h-screen
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className={`px-4 py-6 flex items-center gap-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
          <div className="size-9 rounded-xl bg-gradient-hero shadow-glow grid place-items-center shrink-0">
           <img src="/src/assets/icons/totvs.svg" alt="" className="size-full" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="font-display text-lg font-semibold tracking-tight text-gradient truncate">Universidade Suri</div>
            </div>
          )}
        </div>

        <nav className={`${sidebarCollapsed ? "px-1.5" : "px-3"} flex-1 space-y-0.5`}>
          {filteredNav.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-lg text-sm transition-smooth border
                  ${active
                    ? "bg-primary/10 border-primary/20 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent"
                  }`}
              >
                <Icon className="size-4 shrink-0" />
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle - Desktop only */}
        <div className="hidden md:flex px-3 py-2 justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-muted-foreground hover:text-foreground"
            title={sidebarCollapsed ? "Expandir barra lateral" : "Minimizar barra lateral"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>

        <div className="p-3 border-t border-border mt-auto">
          <div className={`bg-background/40 border border-border rounded-xl p-3 flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-sm font-semibold relative overflow-hidden shrink-0">
              {user.avatar && user.avatar.startsWith('data:image/') ? (
                <img src={user.avatar} alt="Avatar" className="size-full object-cover" />
              ) : user.avatar && user.avatar.includes('<svg') ? (
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: user.avatar }}
                />
              ) : (
                user.avatar?.match(/^[A-Z]{2}$/) ? user.avatar.substring(0,2) : (user.avatar || "👤")
              )}
              <span className="absolute -bottom-1 -right-1 size-5 bg-card border border-border rounded-full flex items-center justify-center z-10">
                {isAdmin ? (
                  <ShieldCheck className="size-3 text-blue-500 fill-blue-500" />
                ) : isVip ? (
                  <Sparkles className="size-3 text-yellow-500 fill-yellow-500" />
                ) : (
                  <Shield className="size-3 text-emerald-500 fill-emerald-500" />
                )}
              </span>
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{isAdmin ? "ADMIN" : user.tier}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={logout} aria-label="Sair" className="hover:bg-destructive/15 hover:text-destructive">
                  <LogOut className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-10 ${mainPadding} transition-all duration-300`}>
        <header className="h-16 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>

            {isAdmin ? (
              <Badge variant="outline" className="border-border bg-transparent flex items-center gap-1 text-blue-400">
                <ShieldCheck className="size-3" />
                ADMIN
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className={`border-border bg-transparent flex items-center gap-1 ${isVip ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isVip ? <Sparkles className="size-3" /> : <Shield className="size-3" />}
                  {isVip ? "VIP" : "Embaixador"} {user.tier && `· ${user.tier}`}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Nível {user.level} - {user.xp.toLocaleString()} XP
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle button */}
            <Button
              size="icon"
              variant="outline"
              onClick={toggleTheme}
              className="border-border relative overflow-hidden group"
              aria-label={isLight ? "Mudar para Night Blue" : "Mudar para Snow Blue"}
            >
              {isLight ? (
                <Moon className="size-4 transition-transform group-hover:rotate-12" />
              ) : (
                <Sun className="size-4 transition-transform group-hover:rotate-90" />
              )}
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-8 py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
