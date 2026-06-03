import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Loader2, Upload, ZoomIn, ZoomOut, Move, Check, X, Camera, User2, ShieldCheck, Users, Layers, BarChart3, LogOut, Image as ImageIcon, ClipboardList } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest, apiUpload } from "@/lib/api";
import { toast } from "sonner";

// ─── Avatar Editor ───────────────────────────────────────────────────────────
interface AvatarEditorProps {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

function AvatarEditor({ src, onConfirm, onCancel }: AvatarEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const SIZE = 280;

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Center image initially
      const scale = Math.max(SIZE / img.width, SIZE / img.height) * zoom;
      setOffset({ x: 0, y: 0 });
      draw(img, zoom, { x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  const draw = useCallback((img: HTMLImageElement, z: number, off: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Circular clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = Math.max(SIZE / img.width, SIZE / img.height) * z;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = SIZE / 2 - w / 2 + off.x;
    const y = SIZE / 2 - h / 2 + off.y;

    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Border ring
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "hsl(237 90% 65% / 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (imgRef.current) draw(imgRef.current, zoom, offset);
  }, [zoom, offset, draw]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const onMouseUp = () => setDragging(false);

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const t = e.touches[0];
    if (!t) return;
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
  };

  return (
    <div className="flex flex-col items-center gap-5 p-5">
      <p className="text-sm text-muted-foreground text-center">
        Arraste para reposicionar · use o zoom para ajustar
      </p>

      {/* Canvas */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="rounded-full cursor-grab active:cursor-grabbing shadow-glow"
          style={{ display: "block" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        />
        <div className="absolute inset-0 rounded-full ring-2 ring-primary/40 pointer-events-none" />
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 w-full max-w-[280px]">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomOut className="size-4" />
        </button>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
          className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ZoomIn className="size-4" />
        </button>
      </div>

      {/* Move hint */}
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Move className="size-3" /> Arraste a imagem para centralizar o rosto
      </p>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-[280px]">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-border">
          <X className="size-4 mr-1.5" /> Cancelar
        </Button>
        <Button onClick={handleConfirm} className="flex-1 bg-gradient-hero border border-border text-white hover:shadow-glow">
          <Check className="size-4 mr-1.5" /> Confirmar
        </Button>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  // Avatar states
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isLight = theme === "snow-blue";
  const isAdmin = user.group === "admin" || user.isAdmin;

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await apiRequest("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      await refreshProfile();
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setEditingSrc(url);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleAvatarConfirm = async (blob: Blob) => {
    try {
      setAvatarUploading(true);
      setEditingSrc(null);
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");
      await apiUpload("/auth/me/avatar", formData);
      await refreshProfile();
      toast.success("Foto de perfil atualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Current avatar display
  const avatarSrc = user.profileImage
    ? (user.profileImage.startsWith("data:") || user.profileImage.startsWith("http")
      ? user.profileImage
      : `http://localhost:3000${user.profileImage}`)
    : null;



  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl w-full">
        <div className="lg:col-span-2 space-y-6 stagger-children">

        {/* ── Foto de Perfil ── */}
        <Card className="bg-gradient-card border-border shadow-elegant overflow-hidden">
          <div className="p-6">
            <h2 className="font-semibold mb-1 text-gradient">Foto de Perfil</h2>
            <p className="text-xs text-muted-foreground mb-5">
              JPG, PNG ou WEBP · máx. 5 MB · será recortado em círculo
            </p>

            {editingSrc ? (
              /* ── Editor mode ── */
              <AvatarEditor
                src={editingSrc}
                onConfirm={handleAvatarConfirm}
                onCancel={() => setEditingSrc(null)}
              />
            ) : (
              /* ── Preview mode ── */
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar preview */}
                <div className="relative shrink-0">
                  <div className="size-28 rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-background overflow-hidden bg-muted/40 grid place-items-center">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <User2 className="size-12 text-muted-foreground/50" />
                    )}
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-background/70 rounded-full grid place-items-center">
                        <Loader2 className="size-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  {/* Camera badge */}
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 size-9 rounded-full bg-primary text-white grid place-items-center shadow-glow border-2 border-background hover:scale-110 transition-transform disabled:opacity-50"
                    title="Alterar foto"
                  >
                    <Camera className="size-4" />
                  </button>
                </div>

                {/* Info + button */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-medium text-sm mb-1">{user.name}</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {user.tier} · {user.email}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      disabled={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-border text-sm"
                      id="btn-upload-avatar"
                    >
                      <Upload className="size-4 mr-2" />
                      {avatarSrc ? "Trocar foto" : "Enviar foto"}
                    </Button>
                    {avatarSrc && (
                      <Button
                        variant="ghost"
                        disabled={avatarUploading}
                        onClick={async () => {
                          try {
                            setAvatarUploading(true);
                            await apiRequest("/auth/me", {
                              method: "PUT",
                              body: JSON.stringify({ profileImage: null }),
                            });
                            await refreshProfile();
                            toast.success("Foto removida.");
                          } catch {
                            toast.error("Erro ao remover foto.");
                          } finally {
                            setAvatarUploading(false);
                          }
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-sm"
                      >
                        <X className="size-4 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </Card>

        {/* ── Perfil ── */}
        <Card className="bg-gradient-card border-border p-6 shadow-elegant">
          <h2 className="font-semibold mb-4 text-gradient">Informações Pessoais</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted/30 border-border h-11" />
            </div>
            <div className="space-y-2">
              <Label>Email (não pode ser alterado)</Label>
              <Input disabled value={user.email} className="bg-muted/30 border-border h-11 opacity-50" />
            </div>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-4 bg-gradient-hero border border-border text-snow hover:shadow-glow"
          >
            {saving ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
            Salvar
          </Button>
        </Card>



        {/* ── Notificações ── */}
        <Card className="bg-gradient-card border-border p-6 shadow-elegant">
          <h2 className="font-semibold mb-4 text-gradient">Notificações</h2>
          {[
            "Novas aulas disponíveis",
            "Atualizações da jornada",
            "Atividade na comunidade",
            "Conquistas e badges",
          ].map((n) => (
            <div key={n} className="flex items-center justify-between py-3 border-t border-border/40 first:border-0">
              <span className="text-sm font-medium">{n}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </Card>

        </div>

        <div className="space-y-6 stagger-children">
          {/* ── Admin ── */}
          {isAdmin && (
            <Card className="bg-gradient-card border-border p-6 shadow-elegant">
              <h2 className="font-semibold mb-4 text-gradient flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" /> Administração
              </h2>
              <p className="text-sm text-muted-foreground mb-5">Gerencie os recursos da plataforma.</p>
              <div className="space-y-3">
                <Link to="/admin" className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium">
                  <Users className="size-5" />
                  Usuários
                </Link>
                <Link to="/admin/grupos" className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium">
                  <Layers className="size-5" />
                  Grupos
                </Link>
                <Link to="/admin/relatorios" className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium">
                  <BarChart3 className="size-5" />
                  Relatórios
                </Link>
                <Link to="/admin/logotipos" className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium">
                  <ImageIcon className="size-5" />
                  Logotipos
                </Link>
                <Link to="/admin/provas" className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-colors font-medium">
                  <ClipboardList className="size-5" />
                  Gestão de Provas
                </Link>
              </div>
            </Card>
          )}

          {/* ── Conta ── */}
          <Card className="bg-gradient-card border-border p-6 shadow-elegant">
            <h2 className="font-semibold mb-2 text-gradient flex items-center gap-2">
              <LogOut className="size-5 text-destructive" /> Conta
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Encerre sua sessão atual na plataforma.</p>
            <Button variant="destructive" onClick={logout} className="w-full hover:shadow-glow font-medium">
              Sair da Conta
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
