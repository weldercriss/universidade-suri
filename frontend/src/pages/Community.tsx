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
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [mediaData, setMediaData] = useState<{ type: string; url: string } | null>(null);

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
        body: JSON.stringify({ 
          title, 
          body,
          ...(mediaData && { media: mediaData })
        })
      });
      toast.success("Projeto publicado! +100 XP");
      setTitle("");
      setBody("");
      setMediaData(null);
      fetchPosts();
    } catch (e) {
      toast.error("Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  const handleFileUpload = (type: string) => {
    if (type === "link") {
      const url = window.prompt("Cole o link do anexo:");
      if (!url?.trim()) return;
      setMediaData({ type: "link", url: url.trim() });
      return;
    }

    const input = document.createElement("input");
    input.type = "file";

    switch (type) {
      case "image":
        input.accept = "image/jpeg,image/png,image/webp,image/svg+xml";
        break;
      case "video":
        input.accept = "video/*";
        break;
      case "document":
        input.accept = ".pdf,.doc,.docx,.txt";
        break;
      default:
        input.accept = "*";
    }

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const maxBytes = type === "image" ? 1_500_000 : 5_000_000;
      if (file.size > maxBytes) {
        toast.error(`Arquivo muito grande. Limite: ${Math.round(maxBytes / 1_000_000)}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setMediaData({
          type: type === "document" ? "document" : type,
          url: type === "document" ? file.name : result,
        });
        toast.success("Anexo pronto para publicação");
      };
      reader.onerror = () => toast.error("Não foi possível ler o arquivo");
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const like = async (id: string) => {
    try {
      await apiRequest(`/posts/${id}/like`, { method: "POST" });
      fetchPosts();
    } catch (e) {
      toast.error("Erro ao curtir");
    }
  };

  const comment = async (id: string) => {
    if (!commentText.trim()) {
      toast.error("Escreva um comentário");
      return;
    }
    try {
      await apiRequest(`/posts/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText })
      });
      toast.success("Comentário adicionado!");
      setCommentText("");
      await fetchPosts();
      setCommentingPostId(id);
    } catch (e) {
      toast.error("Erro ao comentar");
    }
  };

  return (
    <AppShell>
      <header className="mb-6 fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Comunidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Feed exclusivo de {user.group === "vip" ? "VIPs" : "Embaixadores"}.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-6 stagger-children">
          {/* Composer */}
          {(!user.isAdmin && user.group !== 'admin') ? (
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden">
                  {user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 space-y-3">
                  <Input placeholder="Título do projeto" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-muted/30 border-border h-10" />
                  <Textarea placeholder="Compartilhe o que você construiu…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="bg-muted/30 border-border" />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-1 text-muted-foreground">
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload('image')}><ImageIcon className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload('video')}><Video className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload('document')}><FileText className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleFileUpload('link')}><LinkIcon className="size-4" /></Button>
                    </div>
                    {mediaData && (
                      <div className="flex items-center gap-1.5 text-xs text-secondary bg-secondary/10 px-3 py-1 rounded-full max-w-[200px] overflow-hidden">
                        📎 <span className="truncate">
                          {mediaData.type === "link" ? mediaData.url : `${mediaData.type} anexado`}
                        </span>
                        <button type="button" onClick={() => setMediaData(null)} className="ml-1 text-secondary/70 hover:text-secondary shrink-0">×</button>
                      </div>
                    )}
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
                  {user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
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
                  {p.authorName.substring(0, 2).toUpperCase()}
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
                <div className="mt-4 rounded-xl border border-border bg-background/40 p-4 text-sm">
                  {p.media.type === "image" && p.media.url.startsWith("data:") ? (
                    <img src={p.media.url} alt="Anexo" className="max-h-64 w-full rounded-lg object-cover" />
                  ) : p.media.type === "link" ? (
                    <a href={p.media.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-2">
                      <LinkIcon className="size-4" /> {p.media.url}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <FileText className="size-4 shrink-0" />
                      <span>
                        Anexo ({p.media.type}):{" "}
                        <span className="text-foreground font-medium">{p.media.url.replace(/^data:[^;]+;base64,/, "").length > 80 ? "arquivo anexado" : p.media.url}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <button onClick={() => like(p.id)} className="flex items-center gap-1 hover:text-foreground hover:text-gradient transition-smooth group">
                  <Heart className="size-4 group-hover:scale-110 transition-transform text-secondary" /> {p.likes}
                </button>
                <button
                  onClick={() => setCommentingPostId(commentingPostId === p.id ? null : p.id)}
                  className="flex items-center gap-1 hover:text-foreground transition-smooth"
                >
                  <MessageCircle className="size-4" /> {p.comments}
                </button>
              </div>

              {/* Sempre exibe comentários existentes independente do toggle */}
              {p.commentDetails && p.commentDetails.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-background/50 border border-border/40 text-xs space-y-3">
                  <strong className="text-foreground block mb-3">
                    Comentários ({p.commentDetails.length})
                  </strong>
                  {p.commentDetails.map((c, i) => (
                    <div key={i} className="pl-3 border-l-2 border-primary/40">
                      <div className="font-semibold text-foreground/80">{c.userName}</div>
                      <div className="text-muted-foreground mt-1">{c.content}</div>
                      <div className="text-muted-foreground/60 text-[10px] mt-1">
                        {new Date(c.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Painel de input de novo comentário (toggle independente) */}
              {commentingPostId === p.id && (
                <div className="mt-3 p-4 rounded-xl bg-muted/20 border border-border space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow overflow-hidden shrink-0">
                      {user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Escreva um comentário…"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="bg-background/50 border-border h-16 text-sm"
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setCommentingPostId(null); setCommentText(""); }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => comment(p.id)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Comentar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {(user.isAdmin || user.group === 'admin') && (p.likedBy && p.likedBy.length > 0) && (
                <div className="mt-4 p-4 rounded-xl bg-background/50 border border-border/40 text-xs">
                  {p.likedBy && p.likedBy.length > 0 && (
                    <div className="mb-2">
                      <strong className="text-foreground">Curtido por:</strong> {p.likedBy.map(l => l.name).join(", ")}
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
