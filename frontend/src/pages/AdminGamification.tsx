import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Edit2, Save, X, Loader2, ArrowLeft, Award, MessageSquare, GraduationCap, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
  Zap,
};

export function AdminGamificationPage() {
  const [xpRules, setXpRules] = useState<XpRule[]>([]);
  const [groupRules, setGroupRules] = useState<GroupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { xpValue: string; label: string; description: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    apiRequest("/gamification/rules")
      .then((data: any) => {
        setXpRules(data.xpRules ?? []);
        setGroupRules(data.groupRules ?? []);
      })
      .catch(() => toast.error("Erro ao carregar regras de gamificação"))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(rule: XpRule) {
    setEditingId(rule.id);
    setEditValues((prev) => ({
      ...prev,
      [rule.id]: {
        xpValue: String(rule.xpValue),
        label: rule.label,
        description: rule.description ?? "",
      },
    }));
  }

  function updateField(id: string, field: keyof { xpValue: string; label: string; description: string }, value: string) {
    setEditValues((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, [field]: value } };
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveRule(rule: XpRule) {
    const vals = editValues[rule.id];
    if (!vals) return;
    const xpValue = parseInt(vals.xpValue, 10);
    if (isNaN(xpValue) || xpValue < 0) {
      toast.error("Valor de XP deve ser um número positivo");
      return;
    }
    setSaving(rule.id);
    try {
      const updated = await apiRequest(`/admin/gamification/rules/${rule.id}`, {
        method: "PUT",
        body: JSON.stringify({ xpValue, label: vals.label, description: vals.description }),
      });
      setXpRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, ...updated } : r)));
      setEditingId(null);
      toast.success("Regra atualizada com sucesso");
    } catch {
      toast.error("Erro ao salvar regra");
    } finally {
      setSaving(null);
    }
  }

  const vipRules = groupRules.filter((r) => r.groupType === "vip");
  const embRules = groupRules.filter((r) => r.groupType === "embaixador");

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Gamificação — Gerenciar Regras
            </h1>
            <p className="text-muted-foreground text-sm">Configure os valores de XP por ação e visualize os tiers.</p>
          </div>
        </div>

        {/* Regras de XP configuráveis */}
        <Card className="bg-gradient-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valores de XP por Ação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <>
                {xpRules.map((rule) => {
                  const isEditing = editingId === rule.id;
                  const vals = editValues[rule.id];
                  const IconComp = ICON_MAP[rule.icon ?? ""] ?? Zap;

                  return (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-border bg-background/40 p-4"
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <IconComp className="h-5 w-5 text-primary shrink-0" />
                            <Input
                              value={vals?.label ?? rule.label}
                              onChange={(e) => updateField(rule.id, "label", e.target.value)}
                              className="font-medium"
                              placeholder="Nome da ação"
                            />
                          </div>
                          <Input
                            value={vals?.description ?? ""}
                            onChange={(e) => updateField(rule.id, "description", e.target.value)}
                            placeholder="Descrição (opcional)"
                            className="text-sm"
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-yellow-400" />
                              <Input
                                type="number"
                                min={0}
                                value={vals?.xpValue ?? String(rule.xpValue)}
                                onChange={(e) => updateField(rule.id, "xpValue", e.target.value)}
                                className="w-24"
                                placeholder="XP"
                              />
                              <span className="text-sm text-muted-foreground">XP</span>
                            </div>
                            <div className="flex gap-2 ml-auto">
                              <Button
                                size="sm"
                                onClick={() => saveRule(rule)}
                                disabled={saving === rule.id}
                              >
                                {saving === rule.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                Salvar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComp className="h-5 w-5 text-primary shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{rule.label}</p>
                              {rule.description && (
                                <p className="text-xs text-muted-foreground">{rule.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              +{rule.xpValue} XP
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEdit(rule)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Curso — informativo, não editável aqui */}
                <div className="rounded-lg border border-border bg-background/40 p-4 flex items-center justify-between opacity-70">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Concluir um curso</p>
                      <p className="text-xs text-muted-foreground">
                        Configurado individualmente em cada curso
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Por curso</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tiers — só visualização, edição em /admin/grupos */}
        {!loading && groupRules.length > 0 && (
          <Card className="bg-gradient-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tiers por Grupo (referência)</CardTitle>
              <Link to="/admin/grupos">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Editar tiers
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "VIP", rules: vipRules },
                  { label: "Embaixador", rules: embRules },
                ].map(({ label, rules }) =>
                  rules.length > 0 ? (
                    <div key={label}>
                      <p className="text-sm font-semibold mb-2 text-muted-foreground">{label}</p>
                      <div className="space-y-1">
                        {rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex justify-between items-center rounded px-3 py-2 bg-background/40 text-sm"
                          >
                            <span>{rule.tier}</span>
                            <span className="text-muted-foreground text-xs">
                              {rule.minXp.toLocaleString()} XP
                              {rule.maxXp ? ` – ${rule.maxXp.toLocaleString()} XP` : "+"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
