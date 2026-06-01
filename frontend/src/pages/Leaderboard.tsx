import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Trophy, Crown, Medal, Sparkles, Loader2, Filter } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  group: string;
  tier: string;
  xp: number;
  level: number;
  profileImage?: string;
}

export function LeaderboardPage() {
  const { user } = useAuth();
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const isAdmin = user?.group === "admin" || user?.isAdmin;

  const fetchLeaderboard = async (group?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (group && group !== "all") {
        params.group = group;
      }
      const data = await apiRequest<LeaderboardEntry[]>("/auth/leaderboard", { params });
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchLeaderboard(isAdmin ? (activeFilter === "all" ? undefined : activeFilter) : undefined);
  }, [user, activeFilter]);

  if (!user) return null;

  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  const podiumIcons = [Crown, Trophy, Medal];
  const podiumColors = ["text-secondary", "text-primary", "text-secondary/80"];

  const filters = [
    { key: "all", label: "Todos" },
    { key: "embaixador", label: "Embaixadores" },
    { key: "vip", label: "VIPs" },
  ];

  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Ranking</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? "Ranking geral da plataforma. Use os filtros para ver por grupo."
            : `Os destaques da ${user.group === "vip" ? "comunidade VIP" : "rede de Embaixadores"} desta temporada.`}
        </p>
      </header>

      {/* Admin filters */}
      {isAdmin && (
        <div className="flex gap-2 mb-6 flex-wrap items-center fade-in-up">
          <Filter className="size-4 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-smooth
                ${activeFilter === f.key
                  ? "bg-primary/20 border-primary/40 text-foreground"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <Card className="bg-gradient-card border-border p-12 text-center text-muted-foreground shadow-elegant">
          <Trophy className="size-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">Nenhum participante no ranking ainda</p>
          <p className="text-sm mt-1">Complete atividades para acumular XP e aparecer aqui.</p>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8 stagger-children">
            {podium.map((r, i) => {
              const Icon = podiumIcons[i];
              return (
                <Card key={r.id} className={`bg-gradient-card border-border p-6 text-center shadow-elegant hover-lift ${i === 0 ? "pulse-glow border-primary/40 md:order-2 md:-mt-4" : i === 1 ? "md:order-1" : "md:order-3"}`}>
                  <Icon className={`mx-auto size-8 ${podiumColors[i]}`} />
                  <div className="mt-3 size-16 rounded-full bg-gradient-hero grid place-items-center mx-auto text-lg font-bold text-snow overflow-hidden">
                    {r.avatar && r.avatar.startsWith('data:image/') ? (
                      <img src={r.avatar} alt="Avatar" className="size-full object-cover" />
                    ) : r.avatar && r.avatar.includes('<svg') ? (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: r.avatar }} />
                    ) : (
                      r.avatar?.match(/^[A-Z]{2,}$/) ? r.avatar.substring(0, 2) : (r.avatar || "👤")
                    )}
                  </div>
                  <div className="mt-3 font-bold text-gradient">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.tier}</div>
                  <div className="mt-3 text-2xl font-bold text-gradient">{r.xp.toLocaleString()} XP</div>
                  <div className="text-xs text-muted-foreground mt-1">Nível {r.level}</div>
                </Card>
              );
            })}
          </div>

          {rest.length > 0 && (
            <Card className="bg-gradient-card border-border divide-y divide-border shadow-elegant overflow-hidden">
              {rest.map((r, i) => (
                <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-smooth">
                  <div className="w-8 text-center text-muted-foreground font-bold">#{i + 4}</div>
                  <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                    {r.avatar && r.avatar.startsWith('data:image/') ? (
                      <img src={r.avatar} alt="Avatar" className="size-full object-cover" />
                    ) : r.avatar && r.avatar.includes('<svg') ? (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: r.avatar }} />
                    ) : (
                      r.avatar?.match(/^[A-Z]{2,}$/) ? r.avatar.substring(0, 2) : (r.avatar || "👤")
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.tier} · Nível {r.level}</div>
                  </div>
                  <div className="font-bold text-gradient">{r.xp.toLocaleString()} XP</div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
