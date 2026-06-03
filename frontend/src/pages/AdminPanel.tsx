import { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Loader2, Plus, Edit, Lock, Unlock, UserCheck, UserX, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function AdminPanelPage() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [openUsersModal, setOpenUsersModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", group: "", tier: "", level: 1, business: "" });
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive">("all");



  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchFilter =
        userFilter === "all" ? true :
        userFilter === "active" ? u.isActive :
        !u.isActive;
      return matchSearch && matchFilter;
    });
  }, [allUsers, userSearch, userFilter]);

  const activeCount = allUsers.filter(u => u.isActive).length;
  const inactiveCount = allUsers.filter(u => !u.isActive).length;

  const fetchUsers = () => {
    setLoadingUsers(true);
    apiRequest<any[]>("/auth/users")
      .then((data) => setAllUsers(data || []))
      .catch(() => setAllUsers([]))
      .finally(() => setLoadingUsers(false));
  };

  const handleToggleUserActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/auth/users/${id}/toggle-active`, { method: "PATCH" });
      toast.success(currentStatus ? "Usuário desabilitado!" : "Usuário habilitado!");
      fetchUsers();
    } catch {
      toast.error("Erro ao alterar status do usuário");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiRequest(`/auth/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editUserForm.name, group: editUserForm.group, tier: editUserForm.tier, level: editUserForm.level, business: editUserForm.business })
      });
      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Erro ao atualizar usuário");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
            <Users className="size-8 text-primary" /> Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários da plataforma.</p>
        </div>
        <Badge variant="outline" className="border-border bg-gradient-card">Acesso restrito</Badge>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 stagger-children">
        {[
          { label: "Total", value: allUsers.length, icon: Users, color: "text-secondary" },
          { label: "Ativos", value: activeCount, icon: UserCheck, color: "text-success" },
          { label: "Inativos", value: inactiveCount, icon: UserX, color: "text-destructive" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
              <Icon className={`size-5 ${s.color}`} />
              <div className="mt-3 text-2xl font-bold text-gradient">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-card border-border p-5 shadow-elegant mt-6">
        <div className="flex flex-col gap-3 mb-5">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 bg-muted/30 border-border h-10"
              />
            </div>
            <Dialog open={openUsersModal} onOpenChange={setOpenUsersModal}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-hero border border-border text-snow hover:shadow-glow"><Plus className="size-4 mr-2"/> Cadastrar Usuário</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Gerenciamento de Acessos</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="direct" className="mt-4">
                  <TabsList className="grid grid-cols-2 bg-muted/40 border border-border">
                    <TabsTrigger value="direct">Cadastrar Direto</TabsTrigger>
                    <TabsTrigger value="invite">Gerar Link</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="direct" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input placeholder="Ex: John Doe" className="bg-muted/50 border-border" id="reg-name" />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input type="email" placeholder="john@example.com" className="bg-muted/50 border-border" id="reg-email" />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha Inicial</Label>
                      <Input type="password" placeholder="••••••••" className="bg-muted/50 border-border" id="reg-password" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nível / Nivelamento</Label>
                      <select className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm" id="reg-group">
                        <option value="embaixador">Embaixador</option>
                        <option value="vip">VIP</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:opacity-90" onClick={() => {
                      const name = (document.getElementById("reg-name") as HTMLInputElement)?.value;
                      const email = (document.getElementById("reg-email") as HTMLInputElement)?.value;
                      const password = (document.getElementById("reg-password") as HTMLInputElement)?.value;
                      const group = (document.getElementById("reg-group") as HTMLSelectElement)?.value;
                      if (!name || !email || !password) {
                        toast.error("Preencha todos os campos!");
                        return;
                      }
                      apiRequest("/auth/signup", {
                        method: "POST",
                        body: JSON.stringify({ name, email, password, group, tier: group === "vip" ? "VIP PLUS" : group === "admin" ? "admin" : "Embaixador Elite" })
                      }).then(() => {
                        toast.success("Usuário cadastrado com sucesso!");
                        (document.getElementById("reg-name") as HTMLInputElement).value = "";
                        (document.getElementById("reg-email") as HTMLInputElement).value = "";
                        (document.getElementById("reg-password") as HTMLInputElement).value = "";
                        setOpenUsersModal(false);
                        fetchUsers();
                      }).catch((err) => {
                        toast.error(err.message || "Erro ao cadastrar usuário");
                      });
                    }}>Salvar e Registrar</Button>
                  </TabsContent>
                  
                  <TabsContent value="invite" className="space-y-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      Crie um link de convite rápido para que o próprio usuário se cadastre na plataforma selecionando o seu grupo.
                    </div>
                    <div className="space-y-2">
                      <Label>Grupo do Convite</Label>
                      <select className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm" id="inv-group">
                        <option value="embaixador">Embaixador</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>
                    <Button className="w-full bg-secondary text-snow hover:opacity-90" onClick={() => {
                      const group = (document.getElementById("inv-group") as HTMLSelectElement)?.value;
                      const link = `${window.location.origin}/signup?group=${group}`;
                      navigator.clipboard.writeText(link);
                      toast.success(`Link de convite para ${group.toUpperCase()} copiado!`);
                      setOpenUsersModal(false);
                    }}>Gerar e Copiar Link</Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtrar:</span>
            {([
              { key: "all", label: "Todos", count: allUsers.length },
              { key: "active", label: "Ativos", count: activeCount },
              { key: "inactive", label: "Inativos", count: inactiveCount },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setUserFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                  userFilter === f.key
                    ? f.key === "active" ? "bg-success/15 border-success/40 text-success"
                      : f.key === "inactive" ? "bg-destructive/15 border-destructive/40 text-destructive"
                      : "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/30 border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                {f.key === "active" && <span className="size-1.5 rounded-full bg-success inline-block" />}
                {f.key === "inactive" && <span className="size-1.5 rounded-full bg-destructive inline-block" />}
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  userFilter === f.key ? "bg-current/10" : "bg-muted/50"
                }`}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>
        
        {loadingUsers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin size-6 text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {userSearch ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado."}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredUsers.map((u) => (
              <div key={u.email || u.name} className="flex items-center gap-3 py-3 hover:bg-muted/5 transition-smooth rounded-lg px-2">
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-gradient-brand grid place-items-center text-xs font-semibold text-white">
                    {u.name.split(" ").map((p: any) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                    u.isActive ? "bg-success" : "bg-destructive"
                  }`} title={u.isActive ? "Ativo" : "Inativo"} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    <span className="truncate">{u.name}</span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                        u.isActive
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {u.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}{u.business ? ` · ${u.business}` : ""} · {u.tier}</div>
                </div>
                <Badge variant="outline" className="border-border capitalize shrink-0">{u.group}</Badge>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Button variant="ghost" size="icon" title="Editar usuário" onClick={() => {
                    setEditingUser(u);
                    setEditUserForm({ name: u.name, group: u.group, tier: u.tier, level: u.level, business: u.business || "" });
                  }}>
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={u.isActive ? "Desativar usuário" : "Ativar usuário"}
                    className={u.isActive ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-success hover:text-success hover:bg-success/10"}
                    onClick={() => handleToggleUserActive(u.id, u.isActive)}
                  >
                    {u.isActive ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-[425px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} required className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Grupo</Label>
                <select className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm" value={editUserForm.group} onChange={e => setEditUserForm({...editUserForm, group: e.target.value})}>
                  <option value="embaixador">Embaixador</option>
                  <option value="vip">VIP</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tier</Label>
                <Input value={editUserForm.tier} onChange={e => setEditUserForm({...editUserForm, tier: e.target.value})} className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Nível</Label>
                <Input type="number" value={editUserForm.level} onChange={e => setEditUserForm({...editUserForm, level: parseInt(e.target.value) || 1})} className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input value={editUserForm.business} onChange={e => setEditUserForm({...editUserForm, business: e.target.value})} placeholder="Nome da empresa" className="bg-muted/50 border-border" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Alterações</Button>
            </form>
          </DialogContent>
        </Dialog>
      </Card>


    </AppShell>
  );
}
