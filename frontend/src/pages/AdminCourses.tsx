import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { apiRequest, apiUpload, API_BASE_URL } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GraduationCap, Loader2, Plus, Video, Trash2, Edit, Image as ImageIcon, Upload, X as XIcon } from "lucide-react";
import { toast } from "sonner";

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [courseForm, setCourseForm] = useState({ title: "", targetGroup: "all", description: "", xpReward: 50, workloadHours: 0 });
  const [lessonForm, setLessonForm] = useState({ title: "", videoUrl: "", duration: "10:00" });
  const [openCourse, setOpenCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [openLessonFor, setOpenLessonFor] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  // Cover image for create/edit course forms
  const [newCourseCoverFile, setNewCourseCoverFile] = useState<File | null>(null);
  const [newCourseCoverPreview, setNewCourseCoverPreview] = useState<string | null>(null);
  const [editCourseCoverFile, setEditCourseCoverFile] = useState<File | null>(null);
  const [editCourseCoverPreview, setEditCourseCoverPreview] = useState<string | null>(null);
  const newCoverInputRef = useRef<HTMLInputElement>(null);
  const editCoverInputRef = useRef<HTMLInputElement>(null);

  // Cover upload
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCoverFor, setUploadingCoverFor] = useState<string | null>(null);
  const [coverTargetId, setCoverTargetId] = useState<string | null>(null);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; onConfirm: () => void; description?: string }>({
    open: false,
    title: "",
    onConfirm: () => {},
  });

  const fetchCourses = () => {
    setLoadingCourses(true);
    apiRequest<any[]>("/courses")
      .then((data) => setCourses(data))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCoverUpload = async (courseId: string, file: File) => {
    setUploadingCoverFor(courseId);
    try {
      const fd = new FormData();
      fd.append("cover", file);
      await apiUpload(`/courses/${courseId}/cover`, fd);
      toast.success("Capa do curso atualizada!");
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar capa");
    } finally {
      setUploadingCoverFor(null);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest<{ id: string }>("/courses", { method: "POST", body: JSON.stringify(courseForm) });
      if (newCourseCoverFile && created?.id) {
        const fd = new FormData();
        fd.append("cover", newCourseCoverFile);
        await apiUpload(`/courses/${created.id}/cover`, fd);
      }
      toast.success("Curso criado com sucesso!");
      setOpenCourse(false);
      setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50, workloadHours: 0 });
      setNewCourseCoverFile(null);
      setNewCourseCoverPreview(null);
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
      setLessonForm({ title: "", videoUrl: "", duration: "10:00" });
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
        body: JSON.stringify({ title: courseForm.title, targetGroup: courseForm.targetGroup, description: courseForm.description, xpReward: courseForm.xpReward, workloadHours: courseForm.workloadHours })
      });
      if (editCourseCoverFile) {
        const fd = new FormData();
        fd.append("cover", editCourseCoverFile);
        await apiUpload(`/courses/${editingCourse.id}/cover`, fd);
      }
      toast.success("Curso atualizado com sucesso!");
      setEditingCourse(null);
      setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50, workloadHours: 0 });
      setEditCourseCoverFile(null);
      setEditCourseCoverPreview(null);
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
        body: JSON.stringify({ title: lessonForm.title, videoUrl: lessonForm.videoUrl, duration: lessonForm.duration })
      });
      toast.success("Aula atualizada com sucesso!");
      setEditingLesson(null);
      setLessonForm({ title: "", videoUrl: "", duration: "10:00" });
      fetchCourses();
    } catch {
      toast.error("Erro ao atualizar aula");
    }
  };

  const handleDeleteCourse = (id: string) => {
    setConfirmState({
      open: true,
      title: "Tem certeza que deseja excluir este curso?",
      description: "Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          await apiRequest(`/courses/${id}`, { method: "DELETE" });
          toast.success("Curso excluído!");
          fetchCourses();
        } catch {
          toast.error("Erro ao excluir curso");
        }
      }
    });
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

  const handleDeleteLesson = (id: string) => {
    setConfirmState({
      open: true,
      title: "Tem certeza que deseja excluir esta aula?",
      description: "A aula será removida do curso.",
      onConfirm: async () => {
        try {
          await apiRequest(`/courses/lessons/${id}`, { method: "DELETE" });
          toast.success("Aula excluída!");
          fetchCourses();
        } catch {
          toast.error("Erro ao excluir aula");
        }
      }
    });
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gradient">
            <GraduationCap className="size-6 text-primary" /> Gerenciar Cursos
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{courses.length} curso(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setOpenCourse(true)} className="bg-gradient-hero border border-border text-snow hover:shadow-glow" size="sm">
          <Plus className="size-4 mr-1.5" /> Novo Curso
        </Button>
      </div>

      <Sheet open={openCourse} onOpenChange={(open) => {
        setOpenCourse(open);
        if (!open) { setNewCourseCoverFile(null); setNewCourseCoverPreview(null); setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50, workloadHours: 0 }); }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border flex flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-gradient text-xl">Criar Novo Curso</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreateCourse} className="flex-1 overflow-y-auto space-y-6 py-6 pr-1">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Capa do Curso</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                  onClick={() => newCoverInputRef.current?.click()}
                >
                  {newCourseCoverPreview ? (
                    <img src={newCourseCoverPreview} alt="Capa" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="size-6" />
                      <span className="text-[10px]">Adicionar</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => newCoverInputRef.current?.click()}>
                    <Upload className="size-3 mr-2" /> Selecionar imagem
                  </Button>
                  {newCourseCoverFile && (
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{newCourseCoverFile.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Recomendado 16:9.</p>
                </div>
              </div>
              <input ref={newCoverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewCourseCoverFile(file);
                  setNewCourseCoverPreview(URL.createObjectURL(file));
                }
                e.target.value = "";
              }} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Título do Curso <span className="text-destructive">*</span></Label>
              <Input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required placeholder="Ex: Estratégias de Vendas Avançadas" className="bg-muted/50 border-border h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descrição</Label>
              <textarea
                value={courseForm.description}
                onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Ex: Etapa 1 - Trilha Embaixador. Descreva o conteúdo e objetivos do curso."
                rows={4}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Público Alvo</Label>
                <select className="w-full h-11 rounded-md border border-border bg-muted/50 px-3 text-sm" value={courseForm.targetGroup} onChange={e => setCourseForm({...courseForm, targetGroup: e.target.value})}>
                  <option value="all">Todos</option>
                  <option value="vip">Apenas VIP</option>
                  <option value="embaixador">Apenas Embaixadores</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">XP de Conclusão</Label>
                <Input type="number" value={courseForm.xpReward} onChange={e => setCourseForm({...courseForm, xpReward: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Carga Horária (em horas)</Label>
              <Input type="number" value={courseForm.workloadHours} onChange={e => setCourseForm({...courseForm, workloadHours: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border h-11" />
            </div>

            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold">
              <Plus className="size-4 mr-2" /> Criar Curso
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {loadingCourses ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-16 rounded-2xl bg-gradient-card border border-border flex items-center justify-center">
            <GraduationCap className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold">Nenhum curso ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie o primeiro curso clicando em "Novo Curso".</p>
          </div>
          <Button onClick={() => setOpenCourse(true)} className="bg-gradient-hero border border-border text-snow hover:shadow-glow">
            <Plus className="size-4 mr-2" /> Criar primeiro curso
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses.map((c: any) => (
            <div key={c.id} className="rounded-lg border border-border bg-card overflow-hidden hover-lift shadow-elegant flex flex-row h-[320px]">
              <div
                className="relative w-[280px] shrink-0 bg-gradient-brand cursor-pointer group"
                onClick={() => { setCoverTargetId(c.id); coverInputRef.current?.click(); }}
                title="Clique para trocar a capa"
              >
                {c.coverUrl ? (
                  <img src={`${API_BASE_URL}${c.coverUrl}`} alt="capa" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <ImageIcon className="size-7 text-white/30" />
                    <span className="text-[10px] text-white/40">Sem capa</span>
                  </div>
                )}
                <Badge className={`absolute top-1.5 right-1.5 text-[10px] border-0 ${c.isPublished ? "bg-success text-white" : "bg-black/70 text-white"}`}>
                  {c.isPublished ? "Liberado" : "Bloqueado"}
                </Badge>
                <Badge className="absolute top-1.5 left-1.5 text-[10px] border-0 bg-primary/80 text-white">
                  {(c.targetGroup || c.target_group || c.group) === 'all' ? 'Todos' :
                   (c.targetGroup || c.target_group || c.group) === 'vip' ? 'VIP' : 'Embaixador'}
                </Badge>
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                  {uploadingCoverFor === c.id ? (
                    <Loader2 className="size-4 text-white animate-spin" />
                  ) : (
                    <>
                      <Upload className="size-4 text-white" />
                      <span className="text-[10px] text-white">Trocar capa</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 flex flex-col gap-2 min-w-0 overflow-hidden">
                <div>
                  <h3 className="font-semibold text-base leading-snug line-clamp-1">{c.title}</h3>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Video className="size-3.5 text-primary" />
                  <span>{(c.lessons || []).length} módulo(s)</span>
                </div>

                {c.lessons?.length > 0 && (
                  <div className="rounded-md border border-border/40 overflow-hidden divide-y divide-border/20 overflow-y-auto flex-1">
                    {c.lessons.map((l: any, i: number) => (
                      <div key={l.id} className="flex items-center justify-between text-xs px-3 py-1.5 hover:bg-muted/30 group/lesson">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-muted-foreground shrink-0 w-3">{i + 1}.</span>
                          <span className="truncate text-foreground/80">{l.title}</span>
                        </div>
                        <div className="flex opacity-0 group-hover/lesson:opacity-100 transition-opacity shrink-0 gap-0.5">
                          <Button variant="ghost" size="icon" className="size-5 rounded" onClick={() => {
                            setLessonForm({ title: l.title, videoUrl: l.videoUrl || l.video_url || "", duration: l.duration || "10:00" });
                            setEditingLesson(l);
                          }}>
                            <Edit className="size-2.5 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-5 rounded text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLesson(l.id)}>
                            <Trash2 className="size-2.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-0.5 pt-1 border-t border-border/40 mt-auto">
                  <Button variant="ghost" size="icon" className="size-7" title="Editar curso"
                    onClick={() => {
                      setCourseForm({ title: c.title, targetGroup: c.targetGroup || c.group || 'all', description: c.description || "", xpReward: c.xpReward ?? c.xp_reward ?? 50, workloadHours: c.workloadHours ?? c.workload_hours ?? 0 });
                      setEditingCourse(c);
                    }}>
                    <Edit className="size-3 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" title="Adicionar módulo"
                    onClick={() => { setOpenLessonFor(c.id); setLessonForm({ title: "", videoUrl: "", duration: "10:00" }); }}>
                    <Plus className="size-3 text-muted-foreground" />
                  </Button>
                  <div className="ml-auto flex items-center gap-0.5">
                    <Button variant="ghost" size="sm"
                      onClick={() => handleTogglePublish(c.id, !!c.isPublished)}
                      className={`text-[11px] h-7 px-2 ${c.isPublished ? "text-secondary hover:bg-secondary/10" : "text-success hover:bg-success/10"}`}>
                      {c.isPublished ? "Bloquear" : "Liberar"}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive" title="Excluir"
                      onClick={() => handleDeleteCourse(c.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!openLessonFor} onOpenChange={(open) => {
        setOpenLessonFor(open ? openLessonFor : null);
        if (!open) setLessonForm({ title: "", videoUrl: "", duration: "10:00" });
      }}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Adicionar Módulo{openLessonFor ? `: ${courses.find((c: any) => c.id === openLessonFor)?.title || ''}` : ''}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLesson} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título do Módulo/Aula</Label>
              <Input value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required className="bg-muted/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label>ID do Vídeo do YouTube</Label>
              <Input value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} placeholder="Ex: dQw4w9WgXcQ" required className="bg-muted/50 border-border" />
              <p className="text-[10px] text-muted-foreground">Em youtube.com/watch?v=12345, o ID é 12345</p>
            </div>
            <div className="space-y-2">
              <Label>Duração do Módulo</Label>
              <Input value={lessonForm.duration} onChange={e => setLessonForm({...lessonForm, duration: e.target.value})} placeholder="Ex: 10:00" required className="bg-muted/50 border-border" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Módulo</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <Sheet open={!!editingCourse} onOpenChange={(open) => {
        if (!open) {
          setEditingCourse(null);
          setCourseForm({ title: "", targetGroup: "all", description: "", xpReward: 50, workloadHours: 0 });
          setEditCourseCoverFile(null);
          setEditCourseCoverPreview(null);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-card border-l border-border flex flex-col">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-gradient text-xl">Editar Curso</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleUpdateCourse} className="flex-1 overflow-y-auto space-y-6 py-6 pr-1">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Capa do Curso</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors shrink-0"
                  onClick={() => editCoverInputRef.current?.click()}
                >
                  {editCourseCoverPreview ? (
                    <img src={editCourseCoverPreview} alt="Capa" className="w-full h-full object-cover" />
                  ) : editingCourse?.coverUrl ? (
                    <img src={`${API_BASE_URL}${editingCourse.coverUrl}`} alt="Capa atual" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <ImageIcon className="size-6" />
                      <span className="text-[10px]">Trocar</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => editCoverInputRef.current?.click()}>
                    <Upload className="size-3 mr-2" /> {editingCourse?.coverUrl ? "Trocar capa" : "Selecionar imagem"}
                  </Button>
                  {editCourseCoverFile && (
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{editCourseCoverFile.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WebP. Recomendado 16:9.</p>
                </div>
              </div>
              <input ref={editCoverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setEditCourseCoverFile(file);
                  setEditCourseCoverPreview(URL.createObjectURL(file));
                }
                e.target.value = "";
              }} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Título do Curso <span className="text-destructive">*</span></Label>
              <Input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required className="bg-muted/50 border-border h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Descrição</Label>
              <textarea
                value={courseForm.description}
                onChange={e => setCourseForm({...courseForm, description: e.target.value})}
                placeholder="Ex: Etapa 1 - Trilha Embaixador."
                rows={4}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Público Alvo</Label>
                <select className="w-full h-11 rounded-md border border-border bg-muted/50 px-3 text-sm" value={courseForm.targetGroup} onChange={e => setCourseForm({...courseForm, targetGroup: e.target.value})}>
                  <option value="all">Todos</option>
                  <option value="vip">Apenas VIP</option>
                  <option value="embaixador">Apenas Embaixadores</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">XP de Conclusão</Label>
                <Input type="number" value={courseForm.xpReward} onChange={e => setCourseForm({...courseForm, xpReward: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Carga Horária (em horas)</Label>
              <Input type="number" value={courseForm.workloadHours} onChange={e => setCourseForm({...courseForm, workloadHours: parseInt(e.target.value) || 0})} className="bg-muted/50 border-border h-11" />
            </div>

            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold">
              Salvar Alterações
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={!!editingLesson} onOpenChange={(open) => {
        if (!open) {
          setEditingLesson(null);
          setLessonForm({ title: "", videoUrl: "", duration: "10:00" });
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
            <div className="space-y-2">
              <Label>Duração do Módulo</Label>
              <Input value={lessonForm.duration} onChange={e => setLessonForm({...lessonForm, duration: e.target.value})} placeholder="Ex: 10:00" required className="bg-muted/50 border-border" />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">Salvar Alterações</Button>
          </form>
        </DialogContent>
      </Dialog>

      <input
        ref={coverInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && coverTargetId) handleCoverUpload(coverTargetId, file);
          e.target.value = "";
        }}
      />
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState({ ...confirmState, open })}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
      />
    </AppShell>
  );
}
