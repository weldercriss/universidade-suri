import { AppShell } from "@/components/app-shell";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { apiUpload, apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { usePlatformSettings } from "@/lib/settings";

interface LogoUploaderProps {
  title: string;
  description: string;
  settingKey: string;
  currentUrl?: string | null;
}

function LogoUploader({ title, description, settingKey, currentUrl }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshSettings } = usePlatformSettings();

  useEffect(() => {
    if (currentUrl) {
      setPreviewUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", settingKey);

      const res = await apiUpload("/settings/logos", formData);
      setPreviewUrl(res.value);
      await refreshSettings();
      toast.success(`${title} atualizado com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || `Erro ao atualizar ${title}`);
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getFullUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith("http") || url.startsWith("data:") ? url : `http://localhost:3000${url}`;
  };

  return (
    <Card className="bg-gradient-card border-border shadow-elegant overflow-hidden p-6 flex flex-col">
      <h3 className="font-semibold text-gradient mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{description}</p>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] bg-muted/20 rounded-xl border border-dashed border-border mb-4 p-4">
        {previewUrl ? (
          <img
            src={getFullUrl(previewUrl)!}
            alt={title}
            className="max-h-24 max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground/50">
            <ImageIcon className="size-8 mb-2" />
            <span className="text-xs">Nenhum logotipo enviado</span>
            <span className="text-[10px]">(Usando padrão do sistema)</span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-border"
        >
          {uploading ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Upload className="size-4 mr-2" />
          )}
          {previewUrl ? "Alterar Logotipo" : "Enviar Logotipo"}
        </Button>
      </div>
    </Card>
  );
}

export function AdminLogosPage() {
  const { settings } = usePlatformSettings();

  return (
    <AppShell>
      <div className="mb-4 fade-in-up">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground pl-0">
          <Link to="/configuracoes">
            <ArrowLeft className="size-4 mr-2" /> Voltar para Configurações
          </Link>
        </Button>
      </div>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Logotipos</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as imagens e logotipos da plataforma. Se nenhuma imagem for enviada, o sistema utilizará os logotipos padrão.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <LogoUploader
          title="Logo Expandido (Claro)"
          description="Exibido no menu lateral expandido quando o tema é Snow Blue (Claro)."
          settingKey="logo_expanded_light"
          currentUrl={settings?.logo_expanded_light}
        />
        <LogoUploader
          title="Logo Expandido (Escuro)"
          description="Exibido no menu lateral expandido quando o tema é Night Blue (Escuro)."
          settingKey="logo_expanded_dark"
          currentUrl={settings?.logo_expanded_dark}
        />
        <LogoUploader
          title="Ícone Minimizado (Claro)"
          description="Exibido no menu lateral retraído e fundo d'água no tema Snow Blue (Claro)."
          settingKey="logo_collapsed_light"
          currentUrl={settings?.logo_collapsed_light}
        />
        <LogoUploader
          title="Ícone Minimizado (Escuro)"
          description="Exibido no menu lateral retraído e fundo d'água no tema Night Blue (Escuro)."
          settingKey="logo_collapsed_dark"
          currentUrl={settings?.logo_collapsed_dark}
        />
      </div>
    </AppShell>
  );
}
