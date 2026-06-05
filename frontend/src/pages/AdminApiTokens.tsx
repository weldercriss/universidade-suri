import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  KeyRound, Plus, Trash2, Loader2, ArrowLeft, Copy, Check, Power, PowerOff, Terminal,
  Users, BookOpen, Award, BarChart2, GraduationCap, Trophy, Layers,
} from "lucide-react";
import { toast } from "sonner";

interface ApiToken {
  id: string;
  name: string;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

type ParamDoc = { name: string; desc: string };
type EndpointDoc = { path: string; description: string; params: ParamDoc[] };
type GroupDoc = { key: string; label: string; icon: React.ElementType; endpoints: EndpointDoc[] };

const API_GROUPS: GroupDoc[] = [
  {
    key: "stats",
    label: "Estatísticas & Leaderboard",
    icon: BarChart2,
    endpoints: [
      {
        path: "/external/stats",
        description: "Totais gerais: usuários, cursos, trilhas, matrículas, certificados e assinantes de newsletter",
        params: [],
      },
      {
        path: "/external/leaderboard",
        description: "Ranking de usuários ordenado por XP",
        params: [
          { name: "limit", desc: "Máx. de resultados (padrão 50, máx 100)" },
          { name: "groupType", desc: "embaixador | vip" },
        ],
      },
    ],
  },
  {
    key: "users",
    label: "Usuários",
    icon: Users,
    endpoints: [
      {
        path: "/external/users",
        description: "Lista usuários com filtros combinados",
        params: [
          { name: "company", desc: "Busca parcial por empresa" },
          { name: "newsletter", desc: "true | false" },
          { name: "groupType", desc: "embaixador | vip" },
          { name: "tier", desc: "Número do tier" },
          { name: "isActive", desc: "true | false — padrão: true" },
          { name: "search", desc: "Busca por nome ou e-mail" },
        ],
      },
      {
        path: "/external/users/:id",
        description: "Usuário por ID — inclui contagens de matrículas, certificados e trilhas",
        params: [],
      },
      {
        path: "/external/users/newsletter",
        description: "Atalho: retorna somente assinantes ativos da newsletter",
        params: [],
      },
    ],
  },
  {
    key: "courses",
    label: "Cursos",
    icon: BookOpen,
    endpoints: [
      {
        path: "/external/courses",
        description: "Lista cursos publicados com contagem de módulos, matrículas e certificados",
        params: [
          { name: "all", desc: "true → inclui cursos não publicados" },
        ],
      },
      {
        path: "/external/courses/:id",
        description: "Curso por ID — inclui lista de módulos ordenada e contagens",
        params: [],
      },
    ],
  },
  {
    key: "trails",
    label: "Trilhas",
    icon: Layers,
    endpoints: [
      {
        path: "/external/trails",
        description: "Lista todas as trilhas com contagem de cursos, matrículas e certificados",
        params: [],
      },
      {
        path: "/external/trails/:id",
        description: "Trilha por ID — inclui cursos ordenados com detalhes",
        params: [],
      },
    ],
  },
  {
    key: "enrollments",
    label: "Matrículas",
    icon: GraduationCap,
    endpoints: [
      {
        path: "/external/enrollments",
        description: "Lista matrículas com filtros (máx. 500 registros por requisição)",
        params: [
          { name: "userId", desc: "Filtrar por usuário" },
          { name: "courseId", desc: "Filtrar por curso" },
          { name: "completed", desc: "true = concluídos | false = em andamento" },
        ],
      },
      {
        path: "/external/enrollments/user/:userId",
        description: "Todas as matrículas de um usuário específico",
        params: [],
      },
      {
        path: "/external/enrollments/course/:courseId",
        description: "Todos os alunos matriculados em um curso específico",
        params: [],
      },
    ],
  },
  {
    key: "certificates",
    label: "Certificados",
    icon: Award,
    endpoints: [
      {
        path: "/external/certificates",
        description: "Lista certificados de cursos e trilhas (máx. 500 cada)",
        params: [
          { name: "userId", desc: "Filtrar por usuário" },
          { name: "courseId", desc: "Filtrar por curso" },
        ],
      },
      {
        path: "/external/certificates/user/:userId",
        description: "Todos os certificados (cursos + trilhas) de um usuário",
        params: [],
      },
      {
        path: "/external/certificates/validate/:code",
        description: "Valida e retorna dados de um certificado pelo código (UNISURI-XXXXXX ou SURI-TR-XXXXXX)",
        params: [],
      },
    ],
  },
];

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copiado!");
        setTimeout(() => setCopied(false), 2000);
      }}
      className={`text-muted-foreground hover:text-foreground transition-colors shrink-0 ${className}`}
      title="Copiar"
    >
      {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
    </button>
  );
}

export function AdminApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", expiresAt: "" });

  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    onConfirm: () => void;
  }>({ open: false, title: "", onConfirm: () => {} });

  async function fetchTokens() {
    setLoading(true);
    try {
      const data = await apiRequest<ApiToken[]>("/admin/api-tokens");
      setTokens(data);
    } catch {
      toast.error("Erro ao carregar tokens");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTokens(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe um nome para o token"); return; }
    setCreating(true);
    try {
      const result = await apiRequest<{ token: string }>("/admin/api-tokens", {
        method: "POST",
        body: JSON.stringify({ name: form.name.trim(), expiresAt: form.expiresAt || undefined }),
      });
      setOpenCreate(false);
      setForm({ name: "", expiresAt: "" });
      setGeneratedToken(result.token);
      fetchTokens();
    } catch {
      toast.error("Erro ao criar token");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(token: ApiToken) {
    try {
      await apiRequest(`/admin/api-tokens/${token.id}/toggle`, { method: "PATCH" });
      toast.success(token.isActive ? "Token desativado" : "Token ativado");
      fetchTokens();
    } catch {
      toast.error("Erro ao alterar status do token");
    }
  }

  function handleRevoke(token: ApiToken) {
    setConfirmState({
      open: true,
      title: `Revogar token "${token.name}"?`,
      description: "Esta ação é irreversível. O token será excluído permanentemente.",
      onConfirm: async () => {
        try {
          await apiRequest(`/admin/api-tokens/${token.id}`, { method: "DELETE" });
          toast.success("Token revogado com sucesso");
          fetchTokens();
        } catch {
          toast.error("Erro ao revogar token");
        }
      },
    });
  }

  async function copyToken() {
    if (!generatedToken) return;
    await navigator.clipboard.writeText(generatedToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="size-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
            <KeyRound className="size-5 text-snow" />
          </div>
          <div>
            <h1 className="text-xl font-bold">API Tokens & Documentação</h1>
            <p className="text-sm text-muted-foreground">Gerencie tokens e explore os endpoints externos disponíveis</p>
          </div>
        </div>

        {/* Auth info */}
        <Card className="bg-gradient-card border-border p-5 shadow-elegant mb-6">
          <div className="flex items-start gap-3 text-sm">
            <KeyRound className="size-4 mt-0.5 shrink-0 text-primary" />
            <div className="space-y-2 w-full">
              <p className="text-muted-foreground">
                Todos os endpoints abaixo exigem autenticação via{" "}
                <code className="bg-muted/50 px-1 rounded text-xs text-foreground">Bearer token</code> no header{" "}
                <code className="bg-muted/50 px-1 rounded text-xs text-foreground">Authorization</code>. Acesso{" "}
                <strong className="text-foreground">somente leitura</strong> — nenhum endpoint externo altera dados.
              </p>
              <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground shrink-0">Base URL</span>
                <code className="text-xs font-mono text-foreground flex-1">https://api.unisuri.com</code>
                <CopyButton text="https://api.unisuri.com" />
              </div>
              <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground shrink-0">Header</span>
                <code className="text-xs font-mono text-foreground flex-1">{"Authorization: Bearer <SEU_TOKEN>"}</code>
                <CopyButton text="Authorization: Bearer <SEU_TOKEN>" />
              </div>
            </div>
          </div>
        </Card>

        {/* API Reference */}
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="size-4 text-primary" />
          <h2 className="font-semibold">Referência da API</h2>
          <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 h-4 ml-auto">
            {API_GROUPS.reduce((acc, g) => acc + g.endpoints.length, 0)} endpoints
          </Badge>
        </div>

        <div className="space-y-3 mb-6">
          {API_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <Card key={group.key} className="bg-gradient-card border-border shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <span className="font-semibold text-sm">{group.label}</span>
                  <Badge className="bg-muted/60 text-muted-foreground border-0 text-[10px] px-1.5 h-4 ml-auto">
                    {group.endpoints.length} endpoint{group.endpoints.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="divide-y divide-border">
                  {group.endpoints.map((ep) => (
                    <div key={ep.path} className="px-5 py-3">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-success/15 text-success border-0 text-[10px] font-bold px-1.5 h-5 mt-0.5 shrink-0 tracking-wide">
                          GET
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-foreground break-all">{ep.path}</code>
                            <CopyButton text={ep.path} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ep.description}</p>
                          {ep.params.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {ep.params.map((p) => (
                                <span
                                  key={p.name}
                                  className="inline-flex items-center gap-1 text-[10px] bg-muted/50 border border-border rounded px-1.5 py-0.5 leading-normal"
                                >
                                  <span className="text-warning font-mono font-medium">?{p.name}</span>
                                  <span className="text-muted-foreground">— {p.desc}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Code examples */}
        <Card className="bg-gradient-card border-border shadow-elegant mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
            <Terminal className="size-4 text-primary" />
            <span className="font-semibold">Exemplos de Requisição</span>
          </div>
          <div className="p-5">
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="fetch">JS (Fetch)</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>

              <TabsContent value="curl" className="mt-0">
                <div className="relative">
                  <pre className="bg-[#1e1e1e] text-snow p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
                    <code>{`# Estatísticas gerais
curl "https://api.unisuri.com/external/stats" \\
  -H "Authorization: Bearer <SEU_TOKEN>"

# Usuários de uma empresa (com filtros)
curl "https://api.unisuri.com/external/users?company=TOTVS&newsletter=true" \\
  -H "Authorization: Bearer <SEU_TOKEN>"

# Matrículas de um usuário
curl "https://api.unisuri.com/external/enrollments/user/<USER_ID>" \\
  -H "Authorization: Bearer <SEU_TOKEN>"

# Validar certificado
curl "https://api.unisuri.com/external/certificates/validate/UNISURI-AB12CD" \\
  -H "Authorization: Bearer <SEU_TOKEN>"`}</code>
                  </pre>
                  <Button
                    size="icon" variant="ghost"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-snow hover:bg-white/10"
                    onClick={() => { navigator.clipboard.writeText(`curl "https://api.unisuri.com/external/stats" \\\n  -H "Authorization: Bearer <SEU_TOKEN>"`); toast.success("Código copiado!"); }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="fetch" className="mt-0">
                <div className="relative">
                  <pre className="bg-[#1e1e1e] text-snow p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
                    <code>{`const BASE_URL = "https://api.unisuri.com";
const headers = { "Authorization": "Bearer <SEU_TOKEN>" };

// Estatísticas gerais
const stats = await fetch(\`\${BASE_URL}/external/stats\`, { headers })
  .then(r => r.json());

// Usuários filtrados por empresa
const users = await fetch(
  \`\${BASE_URL}/external/users?company=TOTVS&newsletter=true\`,
  { headers }
).then(r => r.json());

// Leaderboard (top 10)
const ranking = await fetch(
  \`\${BASE_URL}/external/leaderboard?limit=10\`,
  { headers }
).then(r => r.json());

// Validar certificado
const cert = await fetch(
  \`\${BASE_URL}/external/certificates/validate/UNISURI-AB12CD\`,
  { headers }
).then(r => r.json());`}</code>
                  </pre>
                  <Button
                    size="icon" variant="ghost"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-snow hover:bg-white/10"
                    onClick={() => { navigator.clipboard.writeText(`const BASE_URL = "https://api.unisuri.com";\nconst headers = { "Authorization": "Bearer <SEU_TOKEN>" };`); toast.success("Código copiado!"); }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="python" className="mt-0">
                <div className="relative">
                  <pre className="bg-[#1e1e1e] text-snow p-4 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed">
                    <code>{`import requests

BASE_URL = "https://api.unisuri.com"
headers = {"Authorization": "Bearer <SEU_TOKEN>"}

# Estatísticas gerais
stats = requests.get(f"{BASE_URL}/external/stats", headers=headers).json()

# Usuários filtrados por empresa e newsletter
users = requests.get(
    f"{BASE_URL}/external/users",
    params={"company": "TOTVS", "newsletter": "true"},
    headers=headers,
).json()

# Leaderboard (top 10)
ranking = requests.get(
    f"{BASE_URL}/external/leaderboard",
    params={"limit": 10},
    headers=headers,
).json()

# Certificados de um usuário
certs = requests.get(
    f"{BASE_URL}/external/certificates/user/<USER_ID>",
    headers=headers,
).json()`}</code>
                  </pre>
                  <Button
                    size="icon" variant="ghost"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-snow hover:bg-white/10"
                    onClick={() => { navigator.clipboard.writeText(`import requests\n\nBASE_URL = "https://api.unisuri.com"\nheaders = {"Authorization": "Bearer <SEU_TOKEN>"}`); toast.success("Código copiado!"); }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Tokens table */}
        <Card className="bg-gradient-card border-border shadow-elegant">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="font-semibold">Tokens criados</span>
            <Button
              className="bg-gradient-hero border border-border text-snow hover:shadow-glow"
              onClick={() => setOpenCreate(true)}
            >
              <Plus className="size-4 mr-2" /> Novo Token
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <KeyRound className="size-8 opacity-30" />
              <p className="text-sm">Nenhum token criado ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tokens.map((token) => {
                const expired = token.expiresAt ? new Date(token.expiresAt) < new Date() : false;
                return (
                  <div key={token.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="size-9 rounded-lg bg-muted/30 border border-border flex items-center justify-center shrink-0">
                      <KeyRound className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{token.name}</span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                            !token.isActive || expired
                              ? "bg-destructive/15 text-destructive"
                              : "bg-success/15 text-success"
                          }`}
                        >
                          {expired ? "Expirado" : token.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Criado: {formatDate(token.createdAt)}</span>
                        {token.expiresAt && <span>Expira: {formatDate(token.expiresAt)}</span>}
                        {token.lastUsedAt && <span>Último uso: {formatDate(token.lastUsedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon"
                        title={token.isActive ? "Desativar token" : "Ativar token"}
                        className={token.isActive ? "text-warning hover:text-warning hover:bg-warning/10" : "text-success hover:text-success hover:bg-success/10"}
                        onClick={() => handleToggle(token)}
                      >
                        {token.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        title="Revogar token"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevoke(token)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Dialog: Criar token */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Criar API Token</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nome do token</Label>
              <Input
                placeholder="Ex: Integração PowerBI"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted/50 border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de expiração <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="bg-muted/50 border-border"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpenCreate(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-gradient-hero text-snow" disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Criar Token
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Exibir token gerado */}
      <Dialog open={!!generatedToken} onOpenChange={(open) => { if (!open) setGeneratedToken(null); }}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Token Criado com Sucesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              Este token <strong>não será exibido novamente</strong>. Copie e guarde em local seguro antes de fechar.
            </div>
            <div className="bg-muted/40 border border-border rounded-lg p-3 font-mono text-xs break-all select-all">
              {generatedToken}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-hero text-snow" onClick={copyToken}>
                {copiedToken ? <Check className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                {copiedToken ? "Copiado!" : "Copiar Token"}
              </Button>
              <Button variant="outline" onClick={() => setGeneratedToken(null)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState({ ...confirmState, open })}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        variant="destructive"
      />
    </AppShell>
  );
}
