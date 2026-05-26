import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Award, Sparkles, ShieldCheck, Edit2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

const allBadges = [
  { id: "b_first", label: "Primeiro Login", icon: "👋" },
  { id: "b_course_1", label: "Curso Concluído", icon: "🎓" },
  { id: "b_proj_1", label: "Projeto Enviado", icon: "🚀" }
];

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (user) {
      apiRequest<any[]>("/courses")
        .then((data) => setCourses(data))
        .catch(() => setCourses([]));
    }
  }, [user]);

  if (!user) return null;

  const isAdmin = user.group === "admin" || user.isAdmin;
  const mine: any[] = [];
  const journeySteps = courses.map((c) => ({
    id: c.id,
    title: c.title,
  }));
  const completed = 0;

  const handleEditClick = () => {
    setEditName(user.name);
    setEditAvatar(user.avatar || "");
    setIsEditing(true);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: editName, avatar: editAvatar }),
      });
      await refreshProfile();
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      {/* Hero Profile Card */}
      <Card className="bg-gradient-hero border-border p-8 shadow-elegant relative overflow-hidden fade-in-up">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="size-24 rounded-2xl bg-snow/10 border border-snow/20 grid place-items-center text-3xl font-bold text-snow overflow-hidden shrink-0">
              {user.avatar && user.avatar.startsWith('data:image/') ? (
                <img src={user.avatar} alt="Avatar" className="size-full object-cover" />
              ) : user.avatar && user.avatar.includes('<svg') ? (
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: user.avatar }}
                />
              ) : (
                user.avatar?.match(/^[A-Z]{2}$/) ? user.avatar.substring(0,2) : (user.avatar || "👤")
              )}
            </div>
            <div className="flex-1">
              {!isAdmin && (
                <Badge className="bg-snow/10 text-snow border-snow/20">
                  {user.tier}
                </Badge>
              )}
              {isAdmin && (
                <Badge className="bg-blue-500/20 text-blue-100 border-blue-500/30 flex items-center gap-1 w-max">
                  <ShieldCheck className="size-3" />
                  ADMINISTRADOR
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-snow mt-2">{user.name}</h1>
              <div className="text-snow/70 text-sm">{user.email}</div>
              {!isAdmin && (
                <div className="mt-4 flex gap-6 text-sm text-snow/80 flex-wrap">
                  <span className="flex items-center gap-1"><Sparkles className="size-3 text-amber-400" /><b className="text-snow">{user.xp.toLocaleString()}</b> XP</span>
                  <span className="flex items-center gap-1"><GraduationCap className="size-3" /><b className="text-snow font-bold">Nv {user.level}</b></span>
                  <span className="flex items-center gap-1"><Award className="size-3" /><b className="text-snow">{user.projectsSent}</b> projetos</span>
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleEditClick} variant="outline" className="bg-snow/10 text-snow border-snow/20 hover:bg-snow/20 shrink-0">
            <Edit2 className="size-4 mr-2" /> Editar Perfil
          </Button>
        </div>
      </Card>

      {/* Progress and badges - Only for non-admin */}
      {!isAdmin && (
        <div className="grid lg:grid-cols-3 gap-6 mt-6 stagger-children">
          <Card className="bg-gradient-card border-border p-5 lg:col-span-2 shadow-elegant">
            <div className="text-sm font-semibold mb-3 text-gradient">Progresso da jornada</div>
            <Progress value={journeySteps.length > 0 ? (completed / journeySteps.length) * 100 : 0} />
            <div className="text-xs text-muted-foreground mt-2">{completed} de {journeySteps.length} etapas</div>

            <div className="mt-6 space-y-2">
              {journeySteps.slice(0, 6).map((s, i) => (
                <div key={s.id} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                  <span className={i < completed ? "text-foreground font-medium" : "text-muted-foreground"}>{s.title}</span>
                  <span className={i < completed ? "text-success font-bold" : "text-muted-foreground"}>
                    {i < completed ? "✓ Concluído" : "— Bloqueado"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="text-sm font-semibold mb-3 text-gradient">Conquistas</div>
            <div className="grid grid-cols-3 gap-3">
              {allBadges.map((b) => {
                const owned = user.badges.includes(b.id);
                return (
                  <div key={b.id} className={`rounded-xl p-3 text-center border transition-smooth hover-lift ${owned ? "border-primary/40 bg-primary/10" : "border-border bg-background/30 opacity-50"}`}>
                    <div className="text-2xl">{b.icon}</div>
                    <div className="text-[10px] mt-1 text-muted-foreground leading-tight font-medium">{b.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Admin profile card */}
      {isAdmin && (
        <div className="mt-6 fade-in-up">
          <Card className="bg-gradient-card border-border p-6 shadow-elegant">
            <div className="text-sm font-semibold mb-3 text-gradient">Informações do Administrador</div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Tipo de acesso</span>
                <span className="font-medium">Acesso Total</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/40">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-success">Ativo</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* My projects - Only for non-admin */}
      {!isAdmin && (
        <div className="mt-6 fade-in-up">
          <h2 className="text-lg font-semibold mb-3">Meus projetos</h2>
          {mine.length === 0 ? (
            <Card className="bg-gradient-card border-border p-8 text-center text-muted-foreground shadow-elegant">
              Você ainda não enviou projetos. Compartilhe seu primeiro na comunidade.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {mine.map((p) => (
                <Card key={p.id} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
                  <div className="font-medium hover:text-gradient transition-smooth">{p.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-gradient-card border-border shadow-elegant overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-lg">Editar Perfil</h3>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Avatar / Foto (Base64 ou Link)</Label>
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {editAvatar && editAvatar.startsWith('data:image/') ? (
                      <img src={editAvatar} alt="Preview" className="size-full object-cover" />
                    ) : editAvatar && editAvatar.includes('<svg') ? (
                      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: editAvatar }} />
                    ) : (
                      editAvatar?.match(/^[A-Z]{2}$/) ? editAvatar : <ImageIcon className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input 
                      placeholder="Link da imagem, SVG ou Iniciais"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                    />
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
