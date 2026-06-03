import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layers, Plus, Edit, Trash2, Loader2, Users, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface GroupRule {
  id: string;
  groupType: string;
  tier: string;
  minXp: number;
  maxXp: number | null;
}

interface GroupUser {
  id: string;
  name: string;
  email: string;
  groupType: string;
  tier: string;
  xp: number;
  level: number;
  isActive: boolean;
  business: string;
}

interface Distribution {
  groupType: string;
  tier: string;
  count: number;
}

const VIP_TIERS = ["VIP PLUS", "VIP GOLD", "VIP PLATINUM"];
const EMB_TIERS = ["Embaixador Voice", "Embaixador Elite", "Embaixador Icon"];

export function AdminGroupsPage() {
  const [rules, setRules] = useState<GroupRule[]>([]);
  const [users, setUsers] = useState<GroupUser[]>([]);
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterGroup, setFilterGroup] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GroupRule | null>(null);
  const [ruleForm, setRuleForm] = useState({ groupType: "vip", tier: "VIP PLUS", minXp: 0, maxXp: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([
        apiRequest<GroupRule[]>("/admin/groups/rules").catch(() => []),
        apiRequest<Distribution[]>("/admin/groups/distribution").catch(() => []),
      ]);
      setRules(r);
      setDistribution(d);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams();
    if (filterGroup) params.append("groupType", filterGroup);
    if (filterTier) params.append("tier", filterTier);
    const data = await apiRequest<GroupUser[]>(`/admin/groups/users?${params.toString()}`).catch(() => []);
    setUsers(data);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchUsers(); }, [filterGroup, filterTier]);

  const openNewRule = () => {
    setEditingRule(null);
    setRuleForm({ groupType: "vip", tier: "VIP PLUS", minXp: 0, maxXp: "" });
    setRuleModalOpen(true);
  };

  const openEditRule = (r: GroupRule) => {
    setEditingRule(r);
    setRuleForm({ groupType: r.groupType, tier: r.tier, minXp: r.minXp, maxXp: r.maxXp?.toString() ?? "" });
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      groupType: ruleForm.groupType,
      tier: ruleForm.tier,
      minXp: Number(ruleForm.minXp),
      maxXp: ruleForm.maxXp !== "" ? Number(ruleForm.maxXp) : null,
    };
    try {
      if (editingRule) {
        await apiRequest(`/admin/groups/rules/${editingRule.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Regra atualizada!");
      } else {
        await apiRequest("/admin/groups/rules", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Regra criada!");
      }
      setRuleModalOpen(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar regra");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Remover esta regra?")) return;
    try {
      await apiRequest(`/admin/groups/rules/${id}`, { method: "DELETE" });
      toast.success("Regra removida");
      fetchAll();
    } catch {
      toast.error("Erro ao remover regra");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tierOptions = ruleForm.groupType === "vip" ? VIP_TIERS : EMB_TIERS;

  return (
    <AppShell>
      <div className="mb-4 fade-in-up">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground pl-0">
          <Link to="/configuracoes">
            <ArrowLeft className="size-4 mr-2" /> Voltar para Configurações
          </Link>
        </Button>
      </div>
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4 fade-in-up">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gradient">
            <Layers className="size-8 text-primary" /> Grupos e Níveis
          </h1>
          <p className="text-muted-foreground mt-1">Defina regras de XP e filtre usuários por grupo e subgrupo.</p>
        </div>
        <Button onClick={openNewRule} className="bg-gradient-hero border border-border text-snow hover:shadow-glow">
          <Plus className="size-4 mr-2" /> Nova Regra
        </Button>
      </header>

      {/* Distribuição */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 stagger-children">
        {distribution.map((d) => (
          <Card key={`${d.groupType}-${d.tier}`} className="bg-gradient-card border-border p-4 text-center hover-lift shadow-elegant">
            <div className="text-2xl font-bold text-gradient">{d.count}</div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{d.tier}</div>
            <Badge variant="outline" className="mt-1 text-[9px] border-border capitalize">{d.groupType}</Badge>
          </Card>
        ))}
        {distribution.length === 0 && !loading && (
          <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
            Nenhuma distribuição encontrada.
          </div>
        )}
      </div>

      {/* Regras de XP */}
      <Card className="bg-gradient-card border-border p-5 shadow-elegant mb-6">
        <h2 className="text-lg font-bold text-gradient mb-4">Regras de XP por Subgrupo</h2>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin size-5 text-primary" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl text-sm">
            Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{r.tier}</span>
                    <Badge variant="outline" className="border-border text-xs capitalize">{r.groupType}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    XP: {r.minXp.toLocaleString()} – {r.maxXp != null ? r.maxXp.toLocaleString() : "∞"}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEditRule(r)}>
                  <Edit className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRule(r.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Filtro de Usuários */}
      <Card className="bg-gradient-card border-border p-5 shadow-elegant">
        <div className="flex items-center gap-2 mb-4">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-bold text-gradient">Usuários por Grupo</h2>
        </div>
        <div className="flex gap-3 flex-wrap mb-4">
          <select
            className="h-9 rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={filterGroup}
            onChange={(e) => { setFilterGroup(e.target.value); setFilterTier(""); }}
          >
            <option value="">Todos os grupos</option>
            <option value="vip">VIP</option>
            <option value="embaixador">Embaixador</option>
          </select>
          <select
            className="h-9 rounded-md border border-border bg-muted/50 px-3 text-sm"
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            disabled={!filterGroup}
          >
            <option value="">Todos os subgrupos</option>
            {filterGroup === "vip" && VIP_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            {filterGroup === "embaixador" && EMB_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-border h-9"
            />
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhum usuário encontrado.
            </div>
          ) : filteredUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-3">
              <div className="size-9 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow shrink-0">
                {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{u.name}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}{u.business ? ` · ${u.business}` : ""}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-semibold">{u.tier}</div>
                <div className="text-[10px] text-muted-foreground">{u.xp.toLocaleString()} XP · Nv {u.level}</div>
              </div>
              <Badge variant="outline" className={`border-border text-[10px] shrink-0 ${u.isActive ? "text-success" : "text-destructive"}`}>
                {u.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de Regra */}
      <Dialog open={ruleModalOpen} onOpenChange={(v) => !v && setRuleModalOpen(false)}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Grupo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRule} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Grupo</Label>
              <select
                className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm"
                value={ruleForm.groupType}
                onChange={(e) => setRuleForm({ ...ruleForm, groupType: e.target.value, tier: e.target.value === "vip" ? "VIP PLUS" : "Embaixador Voice" })}
              >
                <option value="vip">VIP</option>
                <option value="embaixador">Embaixador</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subgrupo (Tier)</Label>
              <select
                className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm"
                value={ruleForm.tier}
                onChange={(e) => setRuleForm({ ...ruleForm, tier: e.target.value })}
              >
                {tierOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>XP Mínimo</Label>
                <Input
                  type="number"
                  min={0}
                  value={ruleForm.minXp}
                  onChange={(e) => setRuleForm({ ...ruleForm, minXp: Number(e.target.value) })}
                  className="bg-muted/50 border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>XP Máximo <span className="text-muted-foreground text-xs">(vazio = ∞)</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={ruleForm.maxXp}
                  onChange={(e) => setRuleForm({ ...ruleForm, maxXp: e.target.value })}
                  placeholder="sem limite"
                  className="bg-muted/50 border-border"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-border" onClick={() => setRuleModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:opacity-90">
                {editingRule ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
