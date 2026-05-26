import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Image as ImageIcon, FileText, Link as LinkIcon, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectPost {
  id: string;
  authorName: string;
  authorTier: string;
  authorAvatar: string;
  groupType: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  createdAt: string;
  media?: { type: string; url: string };
  likedBy?: { name: string; email: string }[];
  commentDetails?: { userName: string; userEmail: string; content: string; createdAt: string }[];
}

export function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const fetchPosts = async () => {
    try {
      const data = await apiRequest("/posts");
      setPosts(data);
    } catch (e) {
      toast.error("Erro ao carregar os posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (!user) return null;

  const publish = async () => {
    if (!title.trim() || !body.trim()) return;
    setPublishing(true);
    try {
      await apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify({ title, body })
      });
      toast.success("Projeto publicado! +100 XP");
      setTitle("");
      setBody("");
      fetchPosts();
    } catch (e) {
      toast.error("Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  const like = async (id: string) => {
    try {
      await apiRequest(`/posts/${id}/like`, { method: "POST" });
      fetchPosts();
    } catch (e) {
      toast.error("Erro ao curtir");
    }
  };

  return (
    <AppShell>
      <header className="mb-8 fade-in-up">
        <h1 className="text-3xl font-bold text-gradient">Comunidade</h1>
        <p className="text-muted-foreground mt-1">
          Feed exclusivo de {user.group === "vip" ? "VIPs" : "Embaixadores"}.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 stagger-children">
          {/* Composer */}
          {(!user.isAdmin && user.group !== 'admin') ? (
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                  {user.avatar && user.avatar.startsWith('data:image/') ? (
                    <img src={user.avatar} alt="Avatar" className="size-full object-cover" />
                  ) : user.avatar && user.avatar.includes('<svg') ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: user.avatar }} />
                  ) : (
                    user.avatar?.match(/^[A-Z]{2,}$/) ? user.avatar.substring(0, 2) : (user.avatar || "👤")
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <Input placeholder="Título do projeto" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/30 border-border h-10" />
                  <Textarea placeholder="Compartilhe o que você construiu…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="bg-muted/30 border-border" />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-1 text-muted-foreground">
                      <Button variant="ghost" size="icon"><ImageIcon className="size-4" /></Button>
                      <Button variant="ghost" size="icon"><Video className="size-4" /></Button>
                      <Button variant="ghost" size="icon"><FileText className="size-4" /></Button>
                      <Button variant="ghost" size="icon"><LinkIcon className="size-4" /></Button>
                    </div>
                    <Button onClick={publish} disabled={publishing} className="bg-gradient-hero border border-border text-snow hover:shadow-glow group">
                      {publishing ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Send className="size-4 mr-1 group-hover:translate-x-0.5 transition-transform" />} Publicar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-gradient-card border-border p-5 shadow-elegant flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                  {user.avatar && user.avatar.startsWith('data:image/') ? (
                    <img src={user.avatar} alt="Avatar" className="size-full object-cover" />
                  ) : user.avatar && user.avatar.includes('<svg') ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: user.avatar }} />
                  ) : (
                    user.avatar?.match(/^[A-Z]{2,}$/) ? user.avatar.substring(0, 2) : (user.avatar || "👤")
                  )}
                </div>
              <p className="text-sm text-muted-foreground">
                Administradores acompanham a comunidade. Você pode interagir curtindo e visualizando os projetos!
              </p>
            </Card>
          )}

          {/* Feed */}
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">Nenhum projeto publicado na sua comunidade ainda. Seja o primeiro!</div>
          ) : posts.map((p) => (
            <Card key={p.id} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                  {p.authorAvatar && p.authorAvatar.startsWith('data:image/') ? (
                    <img src={p.authorAvatar} alt="Avatar" className="size-full object-cover" />
                  ) : p.authorAvatar && p.authorAvatar.includes('<svg') ? (
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: p.authorAvatar }} />
                  ) : (
                    (p.authorAvatar || p.authorName?.substring(0,2).toUpperCase())?.match(/^[A-Z]{2,}$/) ? (p.authorAvatar || p.authorName?.substring(0,2).toUpperCase()).substring(0, 2) : (p.authorAvatar || p.authorName?.substring(0,2).toUpperCase() || "👤")
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{p.authorName}</div>
                  <div className="text-[11px] text-muted-foreground">{p.authorTier} · {new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <Badge variant="outline" className="border-border capitalize">{p.groupType}</Badge>
              </div>
              <h3 className="mt-4 font-bold text-lg hover:text-gradient transition-smooth">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              {p.media && (
                <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 flex items-center gap-3 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  Anexo: {p.media.type.toUpperCase()}
                </div>
              )}
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <button onClick={() => like(p.id)} className="flex items-center gap-1 hover:text-foreground hover:text-gradient transition-smooth group">
                  <Heart className="size-4 group-hover:scale-110 transition-transform text-pink-500" /> {p.likes}
                </button>
                <button className="flex items-center gap-1 hover:text-foreground transition-smooth">
                  <MessageCircle className="size-4" /> {p.comments}
                </button>
              </div>
              {(user.isAdmin || user.group === 'admin') && ((p.likedBy && p.likedBy.length > 0) || (p.commentDetails && p.commentDetails.length > 0)) && (
                <div className="mt-4 p-4 rounded-xl bg-background/50 border border-border/40 text-xs">
                  {p.likedBy && p.likedBy.length > 0 && (
                    <div className="mb-2">
                      <strong className="text-foreground">Curtido por:</strong> {p.likedBy.map(l => l.name).join(", ")}
                    </div>
                  )}
                  {p.commentDetails && p.commentDetails.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <strong className="text-foreground">Comentários:</strong>
                      {p.commentDetails.map((c, i) => (
                        <div key={i} className="pl-2 border-l-2 border-primary/40">
                          <span className="font-semibold text-foreground/80">{c.userName}</span>: <span className="text-muted-foreground">{c.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        <aside className="space-y-4">
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="text-sm font-semibold text-gradient">Diretrizes da comunidade</div>
            <ul className="mt-3 text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Compartilhe projetos, aprendizados e cases reais.</li>
              <li>Seja gentil ao dar feedback.</li>
              <li>Confidencialidade dentro do grupo.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
