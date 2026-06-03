import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit, Route, X as XIcon } from "lucide-react";
import { toast } from "sonner";

export function AdminTrailsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [trails, setTrails] = useState<any[]>([]);
  const [loadingTrails, setLoadingTrails] = useState(true);
  const [openTrail, setOpenTrail] = useState(false);
  const [editingTrail, setEditingTrail] = useState<any>(null);
  const [trailForm, setTrailForm] = useState({ name: "", description: "", targetGroup: "all" });
  const [openAddCourseToTrail, setOpenAddCourseToTrail] = useState<string | null>(null);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState("");

  const fetchCourses = () => {
    apiRequest<any[]>("/courses")
      .then((data) => setCourses(data))
      .catch(() => setCourses([]));
  };

  const fetchTrails = () => {
    setLoadingTrails(true);
    apiRequest<any[]>("/trails")
      .then((data) => setTrails(data || []))
      .catch(() => setTrails([]))
      .finally(() => setLoadingTrails(false));
  };

  useEffect(() => {
    fetchCourses();
    fetchTrails();
  }, []);

  const handleCreateTrail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/trails", { method: "POST", body: JSON.stringify(trailForm) });
      toast.success("Trilha criada com sucesso!");
      setOpenTrail(false);
      setTrailForm({ name: "", description: "", targetGroup: "all" });
      fetchTrails();
    } catch {
      toast.error("Erro ao criar trilha");
    }
  };

  const handleUpdateTrail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrail) return;
    try {
      await apiRequest(`/trails/${editingTrail.id}`, { method: "PUT", body: JSON.stringify(trailForm) });
      toast.success("Trilha atualizada!");
      setEditingTrail(null);
      setTrailForm({ name: "", description: "", targetGroup: "all" });
      fetchTrails();
    } catch {
      toast.error("Erro ao atualizar trilha");
    }
  };

  const handleDeleteTrail = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta trilha?")) return;
    try {
      await apiRequest(`/trails/${id}`, { method: "DELETE" });
      toast.success("Trilha excluída!");
      fetchTrails();
    } catch {
      toast.error("Erro ao excluir trilha");
    }
  };

  const handleAddCourseToTrail = async (trailId: string) => {
    if (!selectedCourseToAdd) { toast.error("Selecione um curso"); return; }
    try {
      await apiRequest(`/trails/${trailId}/courses`, {
        method: "POST",
        body: JSON.stringify({ courseId: selectedCourseToAdd, sortOrder: 0 })
      });
      toast.success("Curso adicionado à trilha!");
      setOpenAddCourseToTrail(null);
      setSelectedCourseToAdd("");
      fetchTrails();
    } catch {
      toast.error("Erro ao adicionar curso");
    }
  };

  const handleRemoveCourseFromTrail = async (trailId: string, courseId: string) => {
    try {
      await apiRequest(`/trails/${trailId}/courses/${courseId}`, { method: "DELETE" });
      toast.success("Curso removido da trilha");
      fetchTrails();
    } catch {
      toast.error("Erro ao remover curso da trilha");
    }
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gradient">
            <Route className="size-8 text-primary" /> Gerenciar Trilhas
          </h1>
          <p className="text-muted-foreground mt-1">{trails.length} trilha(s) cadastrada(s)</p>
        </div>
        <Button onClick={() => setOpenTrail(true)} className="bg-gradient-hero border border-border text-snow hover:shadow-glow">
          <Plus className="size-4 mr-2" /> Nova Trilha
        </Button>
      </div>

      <Sheet open={openTrail} onOpenChange={(open) => {
        setOpenTrail(open);
        if (!open) setTrailForm({ name: "", description: "", targetGroup: "all" });
      }}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border flex flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-gradient text-xl">Criar Nova Trilha</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreateTrail} className="flex-1 overflow-y-auto space-y-6 py-6 pr-1">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome da Trilha <span className="text-destructive">*</span></Label>
              <Input value={trailForm.name} onChange={e => setTrailForm({...trailForm, name: e.target.value})} required placeholder="Ex: Trilha Embaixador 1" className="bg-muted/50 border-border h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descrição</Label>
              <textarea
                value={trailForm.description}
                onChange={e => setTrailForm({...trailForm, description: e.target.value})}
                placeholder="Descreva o objetivo e o público desta trilha de aprendizado."
                rows={4}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Público Alvo</Label>
              <select className="w-full h-11 rounded-md border border-border bg-muted/50 px-3 text-sm" value={trailForm.targetGroup} onChange={e => setTrailForm({...trailForm, targetGroup: e.target.value})}>
                <option value="all">Todos</option>
                <option value="embaixador">Embaixadores</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold">
              <Plus className="size-4 mr-2" /> Criar Trilha
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {loadingTrails ? (
        <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : trails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-16 rounded-2xl bg-gradient-card border border-border flex items-center justify-center">
            <Route className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Nenhuma trilha ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie a primeira trilha clicando em "Nova Trilha".</p>
          </div>
          <Button onClick={() => setOpenTrail(true)} className="bg-gradient-hero border border-border text-snow hover:shadow-glow">
            <Plus className="size-4 mr-2" /> Criar primeira trilha
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {trails.map((trail: any) => (
            <div key={trail.id} className="border border-border/40 rounded-xl p-4 bg-background/30 hover:bg-muted/5 transition-smooth">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-lg">{trail.name}</span>
                    <Badge variant="outline" className={trail.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted/30 text-muted-foreground border-border"}>
                      {trail.isActive ? "Ativa" : "Desativada (sem cursos)"}
                    </Badge>
                    <Badge variant="outline" className="border-border capitalize text-xs">
                      {trail.targetGroup === "all" ? "Todos" : trail.targetGroup}
                    </Badge>
                  </div>
                  {trail.description && <p className="text-sm text-muted-foreground mt-1">{trail.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{(trail.courses || []).length} curso(s) na trilha</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingTrail(trail);
                    setTrailForm({ name: trail.name, description: trail.description || "", targetGroup: trail.targetGroup });
                  }}>
                    <Edit className="size-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTrail(trail.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                  <Dialog open={openAddCourseToTrail === trail.id} onOpenChange={(o) => { setOpenAddCourseToTrail(o ? trail.id : null); setSelectedCourseToAdd(""); }}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <Plus className="size-3 mr-1" /> Adicionar Curso
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px] bg-card border-border">
                      <DialogHeader><DialogTitle>Adicionar curso à trilha</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-4">
                        <select
                          className="w-full h-10 rounded-md border border-border bg-muted/50 px-3 text-sm"
                          value={selectedCourseToAdd}
                          onChange={e => setSelectedCourseToAdd(e.target.value)}
                        >
                          <option value="">Selecione um curso...</option>
                          {courses
                            .filter(c => !(trail.courses || []).some((tc: any) => tc.id === c.id))
                            .map((c: any) => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        <Button className="w-full bg-primary text-primary-foreground" onClick={() => handleAddCourseToTrail(trail.id)}>
                          Adicionar à Trilha
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {(trail.courses || []).length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-border/40 space-y-2">
                  {trail.courses.map((tc: any, i: number) => (
                    <div key={tc.id || i} className="flex items-center justify-between text-sm group bg-muted/20 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                        <span className="font-medium">{tc.title}</span>
                        {i > 0 && <Badge className="text-[10px] px-1 py-0 bg-muted/30 text-muted-foreground border-0">🔒 Sequencial</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveCourseFromTrail(trail.id, tc.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!editingTrail} onOpenChange={(o) => {
        if (!o) { setEditingTrail(null); setTrailForm({ name: "", description: "", targetGroup: "all" }); }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border flex flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-gradient text-xl">Editar Trilha</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleUpdateTrail} className="flex-1 overflow-y-auto space-y-6 py-6 pr-1">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome da Trilha <span className="text-destructive">*</span></Label>
              <Input value={trailForm.name} onChange={e => setTrailForm({...trailForm, name: e.target.value})} required className="bg-muted/50 border-border h-11" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descrição</Label>
              <textarea
                value={trailForm.description}
                onChange={e => setTrailForm({...trailForm, description: e.target.value})}
                placeholder="Descreva o objetivo desta trilha."
                rows={4}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Público Alvo</Label>
              <select className="w-full h-11 rounded-md border border-border bg-muted/50 px-3 text-sm" value={trailForm.targetGroup} onChange={e => setTrailForm({...trailForm, targetGroup: e.target.value})}>
                <option value="all">Todos</option>
                <option value="embaixador">Embaixadores</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold">
              Salvar Alterações
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
