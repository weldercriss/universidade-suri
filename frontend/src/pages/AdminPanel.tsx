import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, GraduationCap, FolderKanban, ShieldCheck, Loader2, Plus, Video, Trash2, Edit, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export function AdminPanelPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const projects: any[] = [];

  const [courseForm, setCourseForm] = useState({ title: "", targetGroup: "all", description: "", xpReward: 50 });
  const [lessonForm, setLessonForm] = useState({ title: "", videoUrl: "" });
  const [openCourse, setOpenCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [openLessonFor, setOpenLessonFor] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [openUsersModal, setOpenUsersModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ name: "", group: "", tier: "", xp: 0, level: 1 });

  const fetchCourses = () => {
    setLoadingCourses(true);
    apiRequest<any[]>("/courses")
      .then((data) => setCourses(data))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  };

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
        body: JSON.stringify(editUserForm)
      });
      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      fetchUsers();
    } catch {
      toast.error("Erro ao atualizar usuário");
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchUsers();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/courses", { method: "POST", body: JSON.stringify(courseForm) });
      toast.success("Curso criado com sucesso!");
      setOpenCourse(false);
      setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50 });
      fetchCourses();
    } catch {
      toast.error("Erro ao criar curso");
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openLessonFor) return;
    try {
      await apiRequest(`/courses/${openLessonFor}/lessons`, { 
        method: "POST", 
        body: JSON.stringify({ ...lessonForm, sortOrder: 0 }) 
      });
      toast.success("Aula adicionada com sucesso!");
      setOpenLessonFor(null);
      setLessonForm({ title: "", videoUrl: "" });
      fetchCourses();
    } catch {
      toast.error("Erro ao adicionar aula");
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await apiRequest(`/courses/${editingCourse.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: courseForm.title, targetGroup: courseForm.targetGroup, description: courseForm.description, xpReward: courseForm.xpReward })
      });
      toast.success("Curso atualizado com sucesso!");
      setEditingCourse(null);
      setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50 });
      fetchCourses();
    } catch {
      toast.error("Erro ao atualizar curso");
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;
    try {
      await apiRequest(`/courses/lessons/${editingLesson.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: lessonForm.title, videoUrl: lessonForm.videoUrl })
      });
      toast.success("Aula atualizada com sucesso!");
      setEditingLesson(null);
      setLessonForm({ title: "", videoUrl: "" });
      fetchCourses();
    } catch {
      toast.error("Erro ao atualizar aula");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    try {
      await apiRequest(`/courses/${id}`, { method: "DELETE" });
      toast.success("Curso excluído!");
      fetchCourses();
    } catch {
      toast.error("Erro ao excluir curso");
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest(`/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished: !currentStatus })
      });
      toast.success(currentStatus ? "Curso bloqueado com sucesso!" : "Curso liberado com sucesso!");
      fetchCourses();
    } catch {
      toast.error("Erro ao alterar status do curso");
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;
    try {
      await apiRequest(`/courses/lessons/${id}`, { method: "DELETE" });
      toast.success("Aula excluída!");
      fetchCourses();
    } catch {
      toast.error("Erro ao excluir aula");
    }
  };

  return (
    <AppShell>
      <header className="mb-8 flex items-end justify-between flex-wrap gap-4 fade-in-up">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gradient">
            <ShieldCheck className="size-6 text-primary" /> Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie usuários, cursos e projetos.</p>
        </div>
        <Badge variant="outline" className="border-border bg-gradient-card">Acesso restrito</Badge>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
        {[
          { label: "Usuários", value: allUsers.length, icon: Users, color: "text-blue-400" },
          { label: "Cursos", value: courses.length, icon: GraduationCap, color: "text-cyan-400" },
          { label: "Projetos", value: projects.length, icon: FolderKanban, color: "text-emerald-400" },
          { label: "Pendentes", value: 3, icon: ShieldCheck, color: "text-amber-400" },
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

      <Tabs defaultValue="courses">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="invites">Pendentes</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
              <Input placeholder="Buscar usuário…" className="max-w-xs bg-muted/30 border-border h-10" />
              <Dialog open={openUsersModal} onOpenChange={setOpenUsersModal}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-hero border border-border text-snow hover:shadow-glow"><Plus className="size-4 mr-2"/> Gerenciar Usuários</Button>
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
                        // Hit direct registration API
                        apiRequest("/auth/signup", {
                          method: "POST",
                          body: JSON.stringify({ name, email, password, group, tier: group === "vip" ? "VIP PLUS" : group === "admin" ? "admin" : "Embaixador Elite" })
                        }).then(() => {
                          toast.success("Usuário cadastrado com sucesso!");
                          // Clear fields
                          (document.getElementById("reg-name") as HTMLInputElement).value = "";
                          (document.getElementById("reg-email") as HTMLInputElement).value = "";
                          (document.getElementById("reg-password") as HTMLInputElement).value = "";
                          setOpenUsersModal(false); // CLOSE modal!
                          fetchUsers(); // Refresh list!
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
                        setOpenUsersModal(false); // CLOSE modal!
                      }}>Gerar e Copiar Link</Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin size-6 text-primary" />
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {allUsers.map((u) => (
                  <div key={u.email || u.name} className="flex items-center gap-3 py-3 hover:bg-muted/5 transition-smooth rounded-lg px-2">
                    <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow">
                      {u.avatar || u.name.split(" ").map((p: any) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {u.name}
                        {!u.isActive && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Desativado</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email} · {u.tier}</div>
                    </div>
                    <Badge variant="outline" className="border-border capitalize">{u.group}</Badge>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingUser(u);
                        setEditUserForm({ name: u.name, group: u.group, tier: u.tier, xp: u.xp, level: u.level });
                      }}>
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className={u.isActive ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"} onClick={() => handleToggleUserActive(u.id, u.isActive)}>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>XP</Label>
                      <Input type="number" value={editUserForm.xp} onChange={e => setEditUserForm({...editUserForm, xp: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nível</Label>
                      <Input type="number" value={editUserForm.level} onChange={e => setEditUserForm({...editUserForm, level: parseInt(e.target.value) || 1})} className="bg-muted/50 border-border" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Alterações</Button>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="mt-6">
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="text-sm text-muted-foreground mb-3">Aprove ou recuse convites pendentes.</div>
            <div className="text-center py-8 text-muted-foreground">Nenhuma pendência encontrada.</div>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-gradient">Gerenciar Cursos e Trilhas</h2>
              <Dialog open={openCourse} onOpenChange={setOpenCourse}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-hero border border-border text-snow hover:shadow-glow"><Plus className="size-4 mr-2" /> Novo curso</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card border-border">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Curso</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateCourse} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Título do Curso</Label>
                      <Input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required className="bg-muted/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição (Trilha)</Label>
                      <Input value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Ex: Etapa 1 - Trilha Embaixador" className="bg-muted/50 border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Público Alvo</Label>
                        <select className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm" value={courseForm.targetGroup} onChange={e => setCourseForm({...courseForm, targetGroup: e.target.value})}>
                          <option value="all">Todos</option>
                          <option value="vip">Apenas VIP</option>
                          <option value="embaixador">Apenas Embaixadores</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>XP de Conclusão</Label>
                        <Input type="number" value={courseForm.xpReward} onChange={e => setCourseForm({...courseForm, xpReward: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Curso</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {loadingCourses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum curso cadastrado ainda.</div>
            ) : (
              <div className="space-y-4">
                {courses.map((c: any) => (
                  <div key={c.id} className="border border-border/40 rounded-xl p-4 bg-background/30 hover:bg-muted/5 transition-smooth">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="font-semibold hover:text-gradient transition-smooth">{c.title}</div>
                          <Badge variant="outline" className={c.isPublished ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
                            {c.isPublished ? "Liberado" : "Bloqueado"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 mb-2">
                          {c.description && <span className="mr-2 text-foreground/80 font-medium">{c.description}</span>}
                          {(c.targetGroup || c.target_group || c.group) === 'all' ? 'Todos' :
                           (c.targetGroup || c.target_group || c.group) === 'vip' ? 'VIP' : 'Embaixador'}
                        </div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <Video className="size-4 text-primary" /> {(c.lessons || []).length} módulos
                        </div>
                      </div>
                      
                      <div className="flex gap-2 items-center">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setCourseForm({ title: c.title, targetGroup: c.targetGroup || c.group || 'all', description: c.description || "", xpReward: c.xpReward ?? c.xp_reward ?? 50 });
                          setEditingCourse(c);
                        }}>
                          <Edit className="size-4 text-primary" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleTogglePublish(c.id, !!c.isPublished)}
                          className={c.isPublished ? "border-amber-500/20 text-amber-500 hover:bg-amber-500/10" : "border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"}
                        >
                          {c.isPublished ? "Bloquear" : "Liberar"}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCourse(c.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                        <Dialog open={openLessonFor === c.id} onOpenChange={(open) => {
                          setOpenLessonFor(open ? c.id : null);
                          if (!open) setLessonForm({ title: "", videoUrl: "" });
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20"><Plus className="size-4 mr-1"/> Adicionar Módulo (Vídeo)</Button>
                          </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-card border-border">
                          <DialogHeader>
                            <DialogTitle>Adicionar Aula: {c.title}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateLesson} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Título do Módulo/Aula</Label>
                              <Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required className="bg-muted/50 border-border" />
                            </div>
                            <div className="space-y-2">
                              <Label>ID do Vídeo do YouTube</Label>
                              <Input value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} placeholder="Ex: dQw4w9WgXcQ" required className="bg-muted/50 border-border" />
                              <p className="text-[10px] text-muted-foreground">Ex: Em youtube.com/watch?v=12345, o ID é 12345</p>
                            </div>
                            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Aula</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      </div>
                    </div>
                    {c.lessons?.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-border/40 space-y-2">
                        {c.lessons.map((l: any, i: number) => (
                          <div key={l.id} className="text-sm flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                              <span className="font-medium text-foreground/90">{l.title}</span>
                              <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">YT: {l.videoUrl || l.video_url}</span>
                            </div>
                            <div className="flex">
                              <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 text-primary hover:bg-primary/10" onClick={() => {
                                setLessonForm({ title: l.title, videoUrl: l.videoUrl || l.video_url || "" });
                                setEditingLesson(l);
                              }}>
                                <Edit className="size-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteLesson(l.id)}>
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <Dialog open={!!editingCourse} onOpenChange={(open) => {
              if (!open) {
                setEditingCourse(null);
                setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50 });
              }
            }}>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Editar Curso</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateCourse} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Título do Curso</Label>
                    <Input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required className="bg-muted/50 border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição (Trilha)</Label>
                    <Input value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} placeholder="Ex: Etapa 1 - Trilha Embaixador" className="bg-muted/50 border-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Público Alvo</Label>
                      <select className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm" value={courseForm.targetGroup} onChange={e => setCourseForm({...courseForm, targetGroup: e.target.value})}>
                        <option value="all">Todos</option>
                        <option value="vip">Apenas VIP</option>
                        <option value="embaixador">Apenas Embaixadores</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>XP de Conclusão</Label>
                      <Input type="number" value={courseForm.xpReward} onChange={e => setCourseForm({...courseForm, xpReward: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Alterações</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={!!editingLesson} onOpenChange={(open) => {
              if (!open) {
                setEditingLesson(null);
                setLessonForm({ title: "", videoUrl: "" });
              }
            }}>
              <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Editar Aula</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateLesson} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Título do Módulo/Aula</Label>
                    <Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required className="bg-muted/50 border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>ID do Vídeo do YouTube</Label>
                    <Input value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} placeholder="Ex: dQw4w9WgXcQ" required className="bg-muted/50 border-border" />
                    <p className="text-[10px] text-muted-foreground">Ex: Em youtube.com/watch?v=12345, o ID é 12345</p>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Alterações</Button>
                </form>
              </DialogContent>
            </Dialog>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <Card className="bg-gradient-card border-border p-5 divide-y divide-border/40 shadow-elegant overflow-hidden">
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum projeto enviado.</div>
            ) : projects.map((p) => (
              <div key={p.id} className="py-3 hover:bg-muted/5 transition-smooth rounded-lg px-2">
                <div className="text-sm font-medium hover:text-gradient transition-smooth">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.author.name} · {p.group === 'vip' ? 'VIP' : 'Embaixador'}</div>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
