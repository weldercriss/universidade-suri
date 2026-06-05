import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, User, Trophy, Settings,
  ShieldCheck, LogOut, Sparkles, Shield, Sun, Moon, Menu, X,
  PanelLeftClose, PanelLeftOpen, Route, Users, Layers, BarChart3, Map as MapIcon, MessageCircle, Newspaper, Zap, HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlatformSettings } from "@/lib/settings";
import { ChangelogModal, useChangelogBadge } from "@/components/ChangelogModal";
import { GuidedTour } from "@/components/GuidedTour";
import { useTour } from "@/lib/tour";
import totvsW from "@/assets/icons/totvs.svg";
import totvsD from "@/assets/icons/totvs-dark.svg";
import totvsLilac from "@/assets/icons/totvs-lilac.svg";
import suriWhite from "@/assets/icons/suri-white.svg";
import suriBlue from "@/assets/icons/suri-blue.svg";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { to: "/cursos", label: "Cursos", icon: GraduationCap, adminOnly: false },
  { to: "/trilhas", label: "Trilhas", icon: Route, adminOnly: false },
  { to: "/roadmap", label: "Roadmap", icon: MapIcon, adminOnly: false },
  { to: "/ranking", label: "Ranking", icon: Trophy, adminOnly: false },
  { to: "/gamificacao", label: "Gamificação", icon: Zap, adminOnly: false },
  { to: "/perfil", label: "Perfil", icon: User, adminOnly: false },
  { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: false },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, switchGroup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    const saved = localStorage.getItem('suri_sidebar_collapsed');
    return saved ? JSON.parse(saved) : true;
  });

  const setSidebarCollapsed = (value: boolean) => {
    setSidebarCollapsedState(value);
    localStorage.setItem('suri_sidebar_collapsed', JSON.stringify(value));
  };
  const { settings } = usePlatformSettings();
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { latestVersion, hasNew, markSeen } = useChangelogBadge();
  const { startTour } = useTour();

  if (!user) {
    return null;
  }

  const isVip = user.group === "vip";
  const isAdmin = user.group === "admin" || user.isAdmin;
  const BrandIcon = isAdmin ? ShieldCheck : (isVip ? Sparkles : Shield);
  const isLight = theme === "snow-blue";

  const filteredNav = nav.filter(item => {
    if ((item as any).adminOnly) return isAdmin;
    return true;
  });

  const sidebarWidth = sidebarCollapsed ? "md:w-[68px]" : "md:w-64";
  const mainPadding = sidebarCollapsed ? "md:pl-[68px]" : "md:pl-64";

  return (
    <div className="min-h-screen flex w-full relative overflow-x-hidden bg-background pb-[72px] md:pb-0">
      {/* Watermark Flutuante Gigante no Background */}
      {pathname !== "/admin" && (
        <img 
          src={isLight 
            ? (settings?.logo_collapsed_light ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_light}` : totvsD)
            : (settings?.logo_collapsed_dark ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_dark}` : totvsW)} 
          className="watermark-bg" 
          alt="" 
          aria-hidden="true" 
        />
      )}

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className={`
        hidden md:flex fixed inset-y-0 left-0 z-50 h-screen shrink-0 flex-col border-r border-border bg-card
        transition-all duration-300 ease-in-out ${sidebarWidth}
      `}>
        {/* Logo */}
        <div className="px-3 py-4 flex items-center justify-center shrink-0">
          {sidebarCollapsed ? (
            <img 
              src={isLight 
                ? (settings?.logo_collapsed_light ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_light}` : totvsD) 
                : (settings?.logo_collapsed_dark ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_dark}` : totvsLilac)} 
              alt="SURI" 
              className="block" 
              style={{ height: "38px", width: "auto" }} 
            />
          ) : (
            <img 
              src={isLight 
                ? (settings?.logo_expanded_light ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_expanded_light}` : suriBlue) 
                : (settings?.logo_expanded_dark ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_expanded_dark}` : suriWhite)} 
              alt="Universidade SURI" 
              className="block mx-auto" 
              style={{ height: "28px", width: "auto" }} 
            />
          )}
        </div>

        {/* Navigation */}
        <nav data-tour="sidebar-nav" className={`flex-1 space-y-0.5 ${sidebarCollapsed ? "px-1.5" : "px-3"}`}>
          {filteredNav.map((item) => {
            const to = item.to === "/cursos" && isAdmin ? "/admin/cursos"
              : item.to === "/trilhas" && isAdmin ? "/admin/trilhas"
              : item.to === "/roadmap" && isAdmin ? "/admin/roadmap"
              : item.to === "/gamificacao" && isAdmin ? "/admin/gamificacao"
              : item.to;
            let active = false;
            if (item.to === "/configuracoes" && isAdmin && pathname.startsWith("/admin") && !pathname.startsWith("/admin/cursos") && !pathname.startsWith("/admin/trilhas") && !pathname.startsWith("/admin/roadmap")) {
              active = true;
            } else {
              active = to.includes("?") ? (pathname + location.search) === to : pathname === to || pathname.startsWith(`${to}/`);
            }
            const Icon = item.icon;

            const dataTourAttr = item.to === "/cursos" ? "nav-cursos"
              : item.to === "/trilhas" ? "nav-trilhas"
              : item.to === "/ranking" ? "nav-ranking"
              : item.to === "/gamificacao" ? "gamification-link"
              : undefined;

            return (
              <Link
                key={item.to}
                to={to}
                title={sidebarCollapsed ? item.label : undefined}
                data-tour={dataTourAttr}
                className={`flex items-center gap-3 py-2.5 rounded-lg text-sm transition-smooth border w-full
                  ${sidebarCollapsed ? "justify-center px-2" : "px-3"}
                  ${active
                    ? "bg-primary/10 border-primary/20 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border-transparent"
                  }`}
              >
                <Icon className={`shrink-0 ${sidebarCollapsed ? 'size-5' : 'size-4'} ${active && !sidebarCollapsed ? 'text-primary' : ''}`} />
                {!sidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="flex px-3 py-2 justify-end shrink-0">
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

        {/* Changelog / Version + Tour */}
        <div className={`px-3 pb-1 shrink-0 flex items-center gap-1 ${sidebarCollapsed ? "justify-center flex-col" : ""}`}>
          <button
            onClick={() => { setChangelogOpen(true); markSeen(); }}
            title="Novidades da plataforma"
            className={`relative flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg py-1.5 flex-1
              ${sidebarCollapsed ? "justify-center px-2 flex-initial" : "px-2"}`}
          >
            <Newspaper className="size-4 shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-medium">{latestVersion ? `v${latestVersion}` : "Changelog"}</span>
            )}
            {hasNew && (
              <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-secondary ring-2 ring-card" />
            )}
          </button>
          {!isAdmin && (
            <button
              data-tour="tour-btn"
              onClick={startTour}
              title="Tour do produto — clique para conhecer a plataforma"
              className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1.5"
            >
              <HelpCircle className="size-4" />
            </button>
          )}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-border mt-auto shrink-0">
          <div className={`bg-background/40 border border-border rounded-xl p-3 flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="size-10 rounded-full bg-gradient-brand grid place-items-center text-sm font-semibold text-white relative overflow-hidden shrink-0">
              {user.profileImage && (user.profileImage.startsWith('data:image/') || user.profileImage.startsWith('http') || user.profileImage.startsWith('/uploads')) ? (
                <img
                  src={user.profileImage.startsWith('data:image/') || user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}`}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : user.profileImage && user.profileImage.includes('<svg') ? (
                <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: user.profileImage }} />
              ) : (
                user.profileImage?.match(/^[A-Z]{2}$/) ? user.profileImage.substring(0,2) : (user.profileImage || "👤")
              )}
              <span className="absolute -bottom-1 -right-1 size-5 bg-card border border-border rounded-full flex items-center justify-center z-10">
                {isAdmin ? <ShieldCheck className="size-3 text-primary fill-primary" /> : isVip ? <Sparkles className="size-3 text-secondary fill-secondary" /> : <Shield className="size-3 text-success fill-success" />}
              </span>
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  {user.business && <div className="text-[11px] font-medium text-muted-foreground truncate">{user.business}</div>}
                  <div className="text-[11px] text-muted-foreground/80 truncate">{isAdmin ? "ADMIN" : user.tier}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={logout} aria-label="Sair" className="hover:bg-destructive/15 hover:text-destructive shrink-0">
                  <LogOut className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav (Hidden on Desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full h-[68px] border-t border-border bg-card/95 backdrop-blur-md z-50 flex flex-row items-center justify-around px-2 pb-safe">
        {filteredNav.map((item) => {
          const to = item.to === "/cursos" && isAdmin ? "/admin/cursos"
            : item.to === "/trilhas" && isAdmin ? "/admin/trilhas"
            : item.to === "/roadmap" && isAdmin ? "/admin/roadmap"
            : item.to;
          let active = false;
          if (item.to === "/configuracoes" && isAdmin && pathname.startsWith("/admin") && !pathname.startsWith("/admin/cursos") && !pathname.startsWith("/admin/trilhas") && !pathname.startsWith("/admin/roadmap")) {
            active = true;
          } else {
            active = to.includes("?") ? (pathname + location.search) === to : pathname === to || pathname.startsWith(`${to}/`);
          }
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={to}
              className={`relative flex flex-col items-center justify-center gap-1 py-1 flex-1 min-w-0 transition-smooth
                ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
            >
              {active && <span className="absolute top-0 right-1/2 translate-x-3.5 size-1.5 rounded-full bg-primary" />}
              <Icon className="size-6 shrink-0" />
              <span className="text-[11px] font-medium truncate w-full text-center leading-none px-0.5">
                {item.label === "Configurações" ? "Ajustes" : item.label === "Dashboard" ? "Início" : item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-10 ${mainPadding} transition-all duration-300`}>
        <header className="h-14 md:h-16 px-3 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/30">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Mobile Mini Avatar */}
            <div className="md:hidden size-8 rounded-full bg-gradient-brand grid place-items-center text-xs font-semibold text-white relative overflow-hidden shrink-0">
              {user.profileImage && (user.profileImage.startsWith('data:image/') || user.profileImage.startsWith('http') || user.profileImage.startsWith('/uploads')) ? (
                <img
                  src={user.profileImage.startsWith('data:image/') || user.profileImage.startsWith('http')
                    ? user.profileImage
                    : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${user.profileImage}`}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : user.profileImage && user.profileImage.includes('<svg') ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: user.profileImage }}
                />
              ) : (
                user.profileImage?.match(/^[A-Z]{2}$/) ? user.profileImage.substring(0,2) : (user.profileImage || "👤")
              )}
            </div>

            {isAdmin ? (
              <Badge variant="outline" className="border-border bg-transparent flex items-center gap-1 text-primary shrink-0">
                <ShieldCheck className="size-3" />
                ADMIN
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className={`border-border bg-transparent flex items-center gap-1 shrink-0 ${isVip ? 'text-secondary' : 'text-success'}`}>
                  {isVip ? <Sparkles className="size-3" /> : <Shield className="size-3" />}
                  <span className="hidden xs:inline">{isVip ? "VIP" : "Embaixador"}</span>
                  {user.tier && <span className="hidden sm:inline">· {user.tier}</span>}
                </Badge>
                <span data-tour="xp-bar" className="text-xs text-muted-foreground truncate">
                  Nível {user.level} · {user.xp.toLocaleString()} XP
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="icon"
              variant="outline"
              onClick={() => (document.querySelector('.__talkjs_launcher') as HTMLElement)?.click()}
              className="md:hidden border-border size-8"
              aria-label="Abrir chat de suporte"
            >
              <MessageCircle className="size-4" />
            </Button>
            {!isAdmin && (
              <Button
                data-tour="tour-btn"
                size="icon"
                variant="outline"
                onClick={startTour}
                className="md:hidden border-border size-8"
                aria-label="Tour do produto"
                title="Tour do produto"
              >
                <HelpCircle className="size-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="outline"
              onClick={toggleTheme}
              className="border-border relative overflow-hidden group size-8 md:size-9"
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
        <main className="flex-1 px-3 sm:px-4 md:px-8 py-5 md:py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      {!isAdmin && <GuidedTour />}
    </div>
  );
}
