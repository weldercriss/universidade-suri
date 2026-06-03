import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Award, GraduationCap, TrendingUp, Loader2, Search, Filter, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface ReportData {
  totalUsers: number;
  totalEnrollments: number;
  totalCertificates: number;
  passRate: number;
  byGroup: { groupType: string; tier: string; count: number }[];
  byCourse: { courseId: string; courseTitle: string; certificates: number }[];
  users: {
    id: string; name: string; email: string; groupType: string; tier: string;
    xp: number; level: number; isActive: boolean; business: string; createdAt: string;
  }[];
}

interface CourseOption { id: string; title: string }
interface TrailOption { id: string; name: string }

export function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [trails, setTrails] = useState<TrailOption[]>([]);

  const [filters, setFilters] = useState({
    courseId: "", trailId: "", groupType: "", tier: "", level: "", company: "", dateFrom: "", dateTo: "",
  });
  const [userSearch, setUserSearch] = useState("");

  const VIP_TIERS = ["VIP PLUS", "VIP GOLD", "VIP PLATINUM"];
  const EMB_TIERS = ["Embaixador Voice", "Embaixador Elite", "Embaixador Icon"];
  const tierOptions = filters.groupType === "vip" ? VIP_TIERS : filters.groupType === "embaixador" ? EMB_TIERS : [];

  useEffect(() => {
    apiRequest<any[]>("/courses").then((c) => setCourses(c.map((x: any) => ({ id: x.id, title: x.title })))).catch(() => {});
    apiRequest<any[]>("/trails").then((t) => setTrails(t.map((x: any) => ({ id: x.id, name: x.name })))).catch(() => {});
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const result = await apiRequest<ReportData>(`/admin/reports?${params.toString()}`);
      setData(result);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = (data?.users ?? []).filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.business || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const maxCertificates = Math.max(...(data?.byCourse.map((c) => c.certificates) ?? [1]), 1);

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
        <h1 className="text-3xl font-bold flex items-center gap-2 text-gradient">
          <BarChart3 className="size-8 text-primary" /> Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">Visualize métricas e filtre usuários da plataforma.</p>
      </header>

      {/* Filtros */}
      <Card className="bg-gradient-card border-border p-5 shadow-elegant mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Filtros</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Curso</Label>
            <select
              className="w-full h-9 rounded-md border border-border bg-muted/50 px-3 text-sm"
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
            >
              <option value="">Todos</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Trilha</Label>
            <select
              className="w-full h-9 rounded-md border border-border bg-muted/50 px-3 text-sm"
              value={filters.trailId}
              onChange={(e) => setFilters({ ...filters, trailId: e.target.value })}
            >
              <option value="">Todas</option>
              {trails.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Grupo</Label>
            <select
              className="w-full h-9 rounded-md border border-border bg-muted/50 px-3 text-sm"
              value={filters.groupType}
              onChange={(e) => setFilters({ ...filters, groupType: e.target.value, tier: "" })}
            >
              <option value="">Todos</option>
              <option value="vip">VIP</option>
              <option value="embaixador">Embaixador</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subgrupo</Label>
            <select
              className="w-full h-9 rounded-md border border-border bg-muted/50 px-3 text-sm"
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              disabled={!filters.groupType}
            >
              <option value="">Todos</option>
              {tierOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nível</Label>
            <Input
              type="number" min={1} placeholder="Ex: 3"
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="h-9 bg-muted/50 border-border text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Empresa</Label>
            <Input
              placeholder="Nome da empresa"
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="h-9 bg-muted/50 border-border text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data início</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="h-9 bg-muted/50 border-border text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Data fim</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="h-9 bg-muted/50 border-border text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={fetchReport} className="bg-primary text-primary-foreground hover:opacity-90" disabled={loading}>
            {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Search className="size-4 mr-2" />}
            Aplicar Filtros
          </Button>
          <Button
            variant="outline"
            className="border-border"
            onClick={() => {
              setFilters({ courseId: "", trailId: "", groupType: "", tier: "", level: "", company: "", dateFrom: "", dateTo: "" });
            }}
          >
            Limpar
          </Button>
        </div>
      </Card>

      {/* Cards de totais */}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
            {[
              { label: "Usuários", value: data.totalUsers, icon: Users, color: "text-primary bg-primary/10" },
              { label: "Matrículas", value: data.totalEnrollments, icon: GraduationCap, color: "text-secondary bg-secondary/10" },
              { label: "Certificados", value: data.totalCertificates, icon: Award, color: "text-success bg-success/10" },
              { label: "Taxa de Aprovação", value: `${data.passRate}%`, icon: TrendingUp, color: "text-primary bg-primary/10" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="bg-gradient-card border-border p-5 shadow-elegant hover-lift">
                  <div className={`size-10 rounded-lg grid place-items-center ${s.color} mb-3`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="text-2xl font-bold text-gradient">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Certificados por curso */}
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Award className="size-4 text-primary" /> Certificados por Curso
              </h2>
              {data.byCourse.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Nenhum dado disponível.</div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byCourse.sort((a, b) => b.certificates - a.certificates)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="courseTitle" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: "hsl(var(--muted)/0.5)" }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="certificates" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Certificados" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Distribuição por grupo */}
            <Card className="bg-gradient-card border-border p-5 shadow-elegant">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Users className="size-4 text-primary" /> Distribuição por Grupo
              </h2>
              {data.byGroup.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Nenhum dado disponível.</div>
              ) : (
                <div className="h-[280px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.byGroup}
                        dataKey="count"
                        nameKey="tier"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {data.byGroup.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                      <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Tabela de usuários */}
          <Card className="bg-gradient-card border-border p-5 shadow-elegant">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="size-4 text-primary" /> Usuários ({filteredUsers.length})
              </h2>
              <div className="relative max-w-xs flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 h-9 bg-muted/30 border-border text-sm"
                />
              </div>
            </div>
            <div className="divide-y divide-border/40 max-h-[400px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">Nenhum usuário.</div>
              ) : filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 py-3">
                  <div className="size-9 rounded-full bg-gradient-hero grid place-items-center text-xs font-semibold text-snow shrink-0">
                    {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u.email}{u.business ? ` · ${u.business}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold">{u.tier}</div>
                    <div className="text-[10px] text-muted-foreground">{u.xp.toLocaleString()} XP · Nv {u.level}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                    <Badge variant="outline" className={`text-[9px] border-border ${u.isActive ? "text-success" : "text-destructive"}`}>
                      {u.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {loading && !data && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      )}
    </AppShell>
  );
}
