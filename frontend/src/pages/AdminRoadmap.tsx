import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Plus, Trash2, Edit, Map as MapIcon, ExternalLink, PlayCircle, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface RoadmapItem {
  id: string;
  type: "video" | "document" | "reference";
  title: string;
  url: string;
  description?: string | null;
  sortOrder: number;
}

interface Roadmap {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
  items: RoadmapItem[];
}

const TYPE_OPTIONS = [
  { value: "video", label: "Vídeo", icon: PlayCircle },
  { value: "document", label: "Documento", icon: FileText },
  { value: "reference", label: "Referência", icon: ExternalLink },
] as const;

const TYPE_BADGE: Record<string, string> = {
  video: "bg-primary/10 text-primary border-primary/20",
  document: "bg-secondary/10 text-secondary border-secondary/20",
  reference: "bg-muted/10 text-muted-foreground border-border",
};

const emptyRoadmapForm = { title: "", description: "", isActive: true, sortOrder: 0 };
type ItemFormType = { type: "video" | "document" | "reference"; title: string; url: string; description: string; sortOrder: number };
const emptyItemForm: ItemFormType = { type: "video", title: "", url: "", description: "", sortOrder: 0 };
export function AdminRoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSheet, setOpenSheet] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState<Roadmap | null>(null);
  const [roadmapForm, setRoadmapForm] = useState(emptyRoadmapForm);
  const [openAddItem, setOpenAddItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormType>(emptyItemForm);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; onConfirm: () => void; description?: string }>({
    open: false,
    title: "",
    onConfirm: () => {},
  });

  const fetchRoadmaps = () => {
    setLoading(true);
    apiRequest<Roadmap[]>("/roadmaps")
      .then((data) => setRoadmaps(data || []))
      .catch(() => setRoadmaps([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const openCreate = () => {
    setEditingRoadmap(null);
    setRoadmapForm(emptyRoadmapForm);
    setOpenSheet(true);
  };

  const openEdit = (r: Roadmap) => {
    setEditingRoadmap(r);
    setRoadmapForm({
      title: r.title,
      description: r.description || "",
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    });
    setOpenSheet(true);
  };

  const handleSaveRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRoadmap(true);
    try {
      if (editingRoadmap) {
        await apiRequest(`/roadmaps/${editingRoadmap.id}`, {
          method: "PUT",
          body: JSON.stringify(roadmapForm),
        });
        toast.success("Roadmap atualizado!");
      } else {
        await apiRequest("/roadmaps", {
          method: "POST",
          body: JSON.stringify(roadmapForm),
        });
        toast.success("Roadmap criado!");
      }
      setOpenSheet(false);
      fetchRoadmaps();
    } catch {
      toast.error("Erro ao salvar roadmap");
    } finally {
      setSavingRoadmap(false);
    }
  };

  const handleToggleActive = async (r: Roadmap) => {
    try {
      await apiRequest(`/roadmaps/${r.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      toast.success(r.isActive ? "Roadmap desativado" : "Roadmap ativado");
      fetchRoadmaps();
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDeleteRoadmap = (r: Roadmap) => {
    setConfirmState({
      open: true,
      title: "Excluir roadmap?",
      description: `O roadmap "${r.title}" e todos os seus itens serão removidos.`,
      onConfirm: async () => {
        try {
          await apiRequest(`/roadmaps/${r.id}`, { method: "DELETE" });
          toast.success("Roadmap excluído");
          fetchRoadmaps();
        } catch {
          toast.error("Erro ao excluir roadmap");
        }
      }
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openAddItem) return;
    setSavingItem(true);
    try {
      await apiRequest(`/roadmaps/${openAddItem}/items`, {
        method: "POST",
        body: JSON.stringify(itemForm),
      });
      toast.success("Item adicionado!");
      setOpenAddItem(null);
      setItemForm(emptyItemForm);
      fetchRoadmaps();
    } catch {
      toast.error("Erro ao adicionar item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await apiRequest(`/roadmaps/items/${itemId}`, { method: "DELETE" });
      toast.success("Item removido");
      fetchRoadmaps();
    } catch {
      toast.error("Erro ao remover item");
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="fade-in-up mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-2">
            <MapIcon className="size-7 text-primary" />
            Gerenciar Roadmaps
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roadmaps.length} roadmap{roadmaps.length !== 1 ? "s" : ""} cadastrado{roadmaps.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground gap-2">
          <Plus className="size-4" /> Novo Roadmap
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : roadmaps.length === 0 ? (
        <Card className="bg-gradient-card border-border p-12 text-center border-dashed">
          <MapIcon className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum roadmap criado ainda.</p>
          <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
            <Plus className="size-4" /> Criar primeiro roadmap
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {roadmaps.map((r) => (
            <Card key={r.id} className="bg-gradient-card border-border p-4">
              {/* Roadmap header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                    <MapIcon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${r.isActive ? "border-secondary/40 text-secondary bg-secondary/5" : "border-border text-muted-foreground"}`}
                      >
                        {r.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.items.length} item{r.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => {
                      setOpenAddItem(r.id);
                      setItemForm(emptyItemForm);
                    }}
                  >
                    <Plus className="size-3" /> Item
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title={r.isActive ? "Desativar" : "Ativar"}
                    onClick={() => handleToggleActive(r)}
                  >
                    {r.isActive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => openEdit(r)}
                  >
                    <Edit className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteRoadmap(r)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Items list */}
              {r.items.length > 0 && (
                <div className="mt-3 space-y-1.5 pl-12">
                  {r.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-xs"
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${TYPE_BADGE[item.type]}`}
                      >
                        {item.type === "video" ? "Vídeo" : item.type === "document" ? "Doc" : "Ref"}
                      </Badge>
                      <span className="flex-1 truncate font-medium">{item.title}</span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0"
                        title="Abrir link"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="mb-4">
            <SheetTitle>{editingRoadmap ? "Editar Roadmap" : "Novo Roadmap"}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSaveRoadmap} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rm-title">Título *</Label>
              <Input
                id="rm-title"
                placeholder="Ex: Dev Full Stack"
                value={roadmapForm.title}
                onChange={(e) => setRoadmapForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rm-desc">Descrição</Label>
              <textarea
                id="rm-desc"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                placeholder="Descrição opcional do roadmap"
                value={roadmapForm.description}
                onChange={(e) => setRoadmapForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="rm-order">Ordem</Label>
              <Input
                id="rm-order"
                type="number"
                className="w-24"
                value={roadmapForm.sortOrder}
                onChange={(e) => setRoadmapForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="rm-active"
                type="checkbox"
                className="size-4 accent-primary"
                checked={roadmapForm.isActive}
                onChange={(e) => setRoadmapForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <Label htmlFor="rm-active">Ativo (visível para usuários)</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={savingRoadmap}>
                {savingRoadmap && <Loader2 className="size-4 animate-spin mr-2" />}
                {editingRoadmap ? "Salvar alterações" : "Criar roadmap"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenSheet(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Item Dialog */}
      <Dialog open={!!openAddItem} onOpenChange={(v) => !v && setOpenAddItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = itemForm.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setItemForm((f) => ({ ...f, type: opt.value }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-smooth ${
                        active
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-title">Título *</Label>
              <Input
                id="item-title"
                placeholder="Ex: Introdução ao React"
                value={itemForm.title}
                onChange={(e) => setItemForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-url">URL *</Label>
              <Input
                id="item-url"
                type="url"
                placeholder="https://..."
                value={itemForm.url}
                onChange={(e) => setItemForm((f) => ({ ...f, url: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Descrição</Label>
              <Input
                id="item-desc"
                placeholder="Descrição opcional"
                value={itemForm.description}
                onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="item-order">Ordem</Label>
              <Input
                id="item-order"
                type="number"
                className="w-24"
                value={itemForm.sortOrder}
                onChange={(e) => setItemForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground" disabled={savingItem}>
                {savingItem && <Loader2 className="size-4 animate-spin mr-2" />}
                Adicionar
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenAddItem(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
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
