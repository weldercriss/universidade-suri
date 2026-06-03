import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProjectsPage() {
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      try {
        const data = await apiRequest("/posts");
        setList(data);
      } catch (e) {
        toast.error("Erro ao consultar projetos");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  if (!user) return null;

  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Projetos enviados</h1>
        <p className="text-muted-foreground mt-1">Vitrine dos projetos da sua comunidade.</p>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin size-8 text-muted-foreground" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground border border-dashed border-border rounded-xl bg-gradient-card">
          Nenhum projeto enviado na sua comunidade ainda.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 stagger-children">
          {list.map((p) => {
            const authorName = p.authorName || p.author?.name || "Usuário";
            const authorInitials = authorName.substring(0, 2).toUpperCase();
            const authorTier = p.authorTier || p.author?.tier || "Membro";
            const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "";
            
            return (
              <Card key={p.id} className="bg-gradient-card border-border p-5 hover:shadow-glow transition-smooth shadow-elegant hover-lift flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                        {authorInitials}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{authorName}</div>
                      <div className="text-[11px] text-muted-foreground">{authorTier} · {dateStr}</div>
                    </div>
                    <Badge variant="outline" className="border-border uppercase">{p.media?.type ?? "texto"}</Badge>
                  </div>
                  <h3 className="mt-4 font-bold text-lg hover:text-gradient transition-smooth">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{p.body}</p>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-muted-foreground pt-4 border-t border-border/20">
                  <span className="flex items-center gap-1"><Heart className="size-4 text-secondary fill-secondary/20" /> {p.likes ?? 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="size-4" /> {p.comments ?? 0}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
