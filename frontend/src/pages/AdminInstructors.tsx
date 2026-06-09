import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest, apiUpload } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Loader2, Plus, Edit, Trash2, User, Upload } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", title: "", bio: "", photoUrl: "", isActive: true };

export function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; onConfirm: () => void; description?: string;
  }>({ open: false, title: "", onConfirm: () => {} });

  const fetchInstructors = () => {
    setLoading(true);
    apiRequest<any[]>("/admin/instructors")
      .then((data) => setInstructors(data))
      .catch(() => setInstructors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInstructors(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (instructor: any) => {
    setEditing(instructor);
    setForm({
      name: instructor.name,
      title: instructor.title,
      bio: instructor.bio || "",
      photoUrl: instructor.photoUrl || "",
      isActive: instructor.isActive,
    });
    setPhotoFile(null);
    setPhotoPreview(instructor.photoUrl || null);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let savedInstructorId = editing?.id;
      if (editing) {
        await apiRequest(`/admin/instructors/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
      } else {
        const res = await apiRequest<any>("/admin/instructors", {
          method: "POST",
          body: JSON.stringify(form),
        });
        savedInstructorId = res.id;
      }

      if (photoFile && savedInstructorId) {
        const formData = new FormData();
        formData.append("photo", photoFile);
        await apiUpload(`/admin/instructors/${savedInstructorId}/photo`, formData);
      }

      toast.success(editing ? "Instrutor atualizado!" : "Instrutor criado!");
      setDialogOpen(false);
      fetchInstructors();
    } catch {
      toast.error("Erro ao salvar instrutor");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = (instructor: any) => {
    setConfirmState({
      open: true,
      title: `Excluir "${instructor.name}"?`,
      description: "O instrutor será desassociado de todos os cursos.",
      onConfirm: async () => {
        try {
          await apiRequest(`/admin/instructors/${instructor.id}`, { method: "DELETE" });
          toast.success("Instrutor removido!");
          fetchInstructors();
        } catch {
          toast.error("Erro ao remover instrutor");
        }
      },
    });
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Instrutores</h1>
            <p className="text-sm text-muted-foreground">Gerencie os instrutores exibidos na plataforma</p>
          </div>
          <Button onClick={openCreate} className="ml-auto gap-2">
            <Plus className="size-4" /> Novo Instrutor
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : instructors.length === 0 ? (
          <Card className="p-12 text-center border-border bg-gradient-card">
            <User className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum instrutor cadastrado ainda.</p>
            <Button onClick={openCreate} className="mt-4 gap-2">
              <Plus className="size-4" /> Cadastrar Instrutor
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="p-4 border-border bg-gradient-card flex items-center gap-4">
                <div className="size-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {instructor.photoUrl ? (
                    <img
                      src={instructor.photoUrl}
                      alt={instructor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">
                      {instructor.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{instructor.name}</span>
                    <Badge variant={instructor.isActive ? "default" : "secondary"}>
                      {instructor.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-primary truncate">{instructor.title}</p>
                  {instructor.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{instructor.bio}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEdit(instructor)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(instructor)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Instrutor" : "Novo Instrutor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Paulo Henrique"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">Cargo / Especialidade *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Especialista em Atendimento"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio (opcional)</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Breve descrição do instrutor"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Foto do Instrutor (opcional)</Label>
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full overflow-hidden bg-muted border flex shrink-0 items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recomendado: 400x400px (JPG/PNG)</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label htmlFor="isActive">Ativo (visível na landing page)</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {editing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onOpenChange={(v) => { if (!v) setConfirmState((s) => ({ ...s, open: false })) }}
      />
    </AppShell>
  );
}
