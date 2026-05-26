import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { AvatarCreator, AvatarOptions } from "@/components/AvatarCreator";

const AVATARS = ["👨‍💻", "👩‍💻", "🚀", "🌟", "🎓", "💡", "🎯", "🦁", "🦊", "🤖"];

export function SettingsPage() {
  const { user, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [saving, setSaving] = useState(false);
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOptions | undefined>(undefined);

  if (!user) return null;

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await apiRequest("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name, avatar })
      });
      await refreshProfile();
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    { key: "snow-blue" as const, label: "Snow Blue", desc: "Tema claro com tons de azul neve", icon: Sun, gradient: "bg-gradient-to-br from-blue-100 to-cyan-50" },
    { key: "night-blue" as const, label: "Night Blue", desc: "Tema escuro premium com azul profundo", icon: Moon, gradient: "bg-gradient-to-br from-blue-950 to-indigo-950" },
  ];

  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências.</p>
      </header>

      <div className="space-y-6 max-w-3xl stagger-children">
        {/* Perfil */}
        <Card className="bg-gradient-card border-border p-6 shadow-elegant">
          <h2 className="font-semibold mb-4 text-gradient">Perfil</h2>
          
          <div className="mb-6 space-y-3">
            <Label>Avatar / Ícone</Label>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2 mr-4">
                {avatar && avatar.startsWith("data:image/") ? (
                  <img src={avatar} alt="Avatar" className="size-16 rounded-full border-2 border-primary object-cover" />
                ) : avatar && avatar.includes("<svg") ? (
                  <div 
                    className="size-16 rounded-full bg-white border-2 border-primary shadow-sm overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: avatar }}
                  />
                ) : (
                  <div className="size-16 text-2xl font-bold rounded-full grid place-items-center bg-primary/20 border-2 border-primary text-snow">
                    {avatar?.match(/^[A-Z]{2}$/) ? avatar.substring(0,2) : (avatar || "👤")}
                  </div>
                )}
                <Button 
                  onClick={() => setIsAvatarCreatorOpen(true)}
                  variant="outline"
                  className="h-16 border-primary/20 hover:border-primary text-primary font-semibold"
                >
                  Criar Avatar
                </Button>
              </div>
              
              <div className="w-full h-px bg-border/50 my-2" />
              
              <div className="w-full flex items-center gap-2 mb-2">
                <Label className="cursor-pointer text-sm font-semibold text-primary hover:text-primary/80 transition-smooth">
                  Carregar imagem do computador (Máx 1MB)
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1024 * 1024) {
                        toast.error("A imagem deve ter no máximo 1MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setAvatar(ev.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </Label>
              </div>

              <div className="text-sm text-muted-foreground w-full mb-2">Ou escolha um emoji:</div>
              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  className={`size-12 text-2xl rounded-full grid place-items-center transition-all ${
                    avatar === emoji
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted/30 border border-transparent hover:bg-muted/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-muted/30 border-border h-11" />
            </div>
            <div className="space-y-2">
              <Label>Email (não pode ser alterado)</Label>
              <Input disabled value={user.email} className="bg-muted/30 border-border h-11 opacity-50" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="mt-4 bg-gradient-hero border border-border text-snow hover:shadow-glow">
            {saving ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
            Salvar
          </Button>
        </Card>

        {/* Notificações */}
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

        {/* Conta */}
        <Card className="bg-gradient-card border-border p-6 shadow-elegant">
          <h2 className="font-semibold mb-2 text-gradient">Conta</h2>
          <p className="text-sm text-muted-foreground mb-4">Encerre sua sessão atual.</p>
          <Button variant="destructive" onClick={logout} className="hover:shadow-glow">Sair</Button>
        </Card>
      </div>

      {isAvatarCreatorOpen && (
        <AvatarCreator 
          initialOptions={avatarOptions}
          onClose={() => setIsAvatarCreatorOpen(false)}
          onSave={(options, svg) => {
            setAvatarOptions(options);
            setAvatar(svg);
            setIsAvatarCreatorOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}
