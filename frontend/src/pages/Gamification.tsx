import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Award, MessageSquare, GraduationCap, Star, TrendingUp, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface XpRule {
  id: string;
  action: string;
  label: string;
  description?: string;
  xpValue: number;
  icon?: string;
  isActive: boolean;
}

interface GroupRule {
  id: string;
  groupType: string;
  tier: string;
  minXp: number;
  maxXp: number | null;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  MessageSquare,
  Award,
  GraduationCap,
  Star,
  Zap,
};

const LEVEL_TABLE = Array.from({ length: 10 }, (_, i) => ({
  level: i + 1,
  minXp: i * 1000,
  nextXp: (i + 1) * 1000,
}));

const GROUP_LABELS: Record<string, string> = {
  vip: "VIP",
  embaixador: "Embaixador",
};

export default function Gamification() {
  const { user } = useAuth();
  const [xpRules, setXpRules] = useState<XpRule[]>([]);
  const [groupRules, setGroupRules] = useState<GroupRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/gamification/rules")
      .then((data: any) => {
        setXpRules(data.xpRules ?? []);
        setGroupRules(data.groupRules ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const vipRules = groupRules.filter((r) => r.groupType === "vip");
  const embaixadorRules = groupRules.filter((r) => r.groupType === "embaixador");

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div data-tour="gam-header">
          <h1 className="text-2xl font-bold text-gradient flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Regras de Gamificação
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Entenda como ganhar XP, subir de nível e progredir nos tiers.
          </p>
        </div>

        {user && !user.isAdmin && (
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold">{user.xp} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">Nível {user.level}</span>
              </div>
              <Badge variant="secondary">{user.tier}</Badge>
              <span className="text-sm text-muted-foreground">
                Próximo nível em {user.nextLevelXp - user.xp} XP
              </span>
            </CardContent>
          </Card>
        )}

        {/* Como ganhar XP */}
        <Card data-tour="gam-xp" className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Como ganhar XP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="text-muted-foreground text-sm">Carregando...</div>
            ) : (
              <>
                {/* XP por ação configurável */}
                {xpRules.map((rule) => {
                  const IconComp = ICON_MAP[rule.icon ?? ""] ?? Zap;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-lg bg-background/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{rule.label}</p>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground">{rule.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                        +{rule.xpValue} XP
                      </Badge>
                    </div>
                  );
                })}

                {/* XP por curso: fixo por curso */}
                <div className="flex items-center justify-between rounded-lg bg-background/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Concluir um curso</p>
                      <p className="text-xs text-muted-foreground">
                        O XP varia por curso, definido pelo administrador
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shrink-0">
                    XP variável
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Progressão de Nível */}
        <Card data-tour="gam-niveis" className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progressão de Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              A cada 1.000 XP acumulados você sobe um nível.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {LEVEL_TABLE.map(({ level, minXp }) => {
                const isCurrentLevel = user && !user.isAdmin && user.level === level;
                return (
                  <div
                    key={level}
                    className={`rounded-lg px-3 py-2 text-center border ${
                      isCurrentLevel
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <p className={`font-bold text-sm ${isCurrentLevel ? "text-primary" : ""}`}>
                      Nível {level}
                    </p>
                    <p className="text-xs text-muted-foreground">{minXp.toLocaleString()} XP</p>
                    {isCurrentLevel && (
                      <Badge className="mt-1 text-[10px] py-0 bg-primary/20 text-primary border-primary/30">
                        Você
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tiers e Grupos */}
        {!loading && groupRules.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: "vip", rules: vipRules, icon: Star, color: "text-yellow-400" },
              { key: "embaixador", rules: embaixadorRules, icon: Users, color: "text-blue-400" },
            ].map(({ key, rules, icon: Icon, color }) =>
              rules.length > 0 ? (
                <Card key={key} className="bg-gradient-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      Grupo {GROUP_LABELS[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                          user?.tier === rule.tier
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background/40"
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">{rule.tier}</p>
                          <p className="text-xs text-muted-foreground">
                            A partir de {rule.minXp.toLocaleString()} XP
                            {rule.maxXp ? ` até ${rule.maxXp.toLocaleString()} XP` : ""}
                          </p>
                        </div>
                        {user?.tier === rule.tier && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                            Seu tier
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
