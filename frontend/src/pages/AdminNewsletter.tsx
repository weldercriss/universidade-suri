import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Search, Download, Users, Building2, Phone } from "lucide-react";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  name: string;
  email: string;
  business: string;
  phone?: string | null;
  group: string;
  tier: string;
  isActive: boolean;
}

export function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiRequest<any[]>("/auth/users")
      .then((users) => {
        const subs = users
          .filter((u) => u.newsletter === true)
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            business: u.business || "",
            phone: u.phone || null,
            group: u.group,
            tier: u.tier,
            isActive: u.isActive,
          }));
        setSubscribers(subs);
      })
      .catch(() => toast.error("Erro ao carregar assinantes"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscribers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.business.toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = () => {
    const header = ["Nome", "E-mail", "Empresa", "Telefone", "Grupo", "Tier", "Status"];
    const rows = filtered.map((s) => [
      s.name,
      s.email,
      s.business,
      s.phone || "",
      s.group,
      s.tier,
      s.isActive ? "Ativo" : "Inativo",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-assinantes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} assinante${filtered.length !== 1 ? "s" : ""} exportado${filtered.length !== 1 ? "s" : ""}!`);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="fade-in-up mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-2">
            <Mail className="size-7 text-primary" />
            Newsletter
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Usuários que aceitaram receber comunicações
          </p>
        </div>
        <Button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="bg-primary text-primary-foreground gap-2"
        >
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card className="bg-gradient-card border-border p-4 shadow-elegant">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-gradient">{subscribers.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-card border-border p-4 shadow-elegant">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-secondary/10 border border-secondary/20 grid place-items-center shrink-0">
              <Mail className="size-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ativos</p>
              <p className="text-xl font-bold text-secondary">{subscribers.filter((s) => s.isActive).length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-card border-border p-4 shadow-elegant col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-muted/20 border border-border grid place-items-center shrink-0">
              <Building2 className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Empresas</p>
              <p className="text-xl font-bold text-foreground">
                {new Set(subscribers.map((s) => s.business).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/20 border-border"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-gradient-card border-border p-12 text-center border-dashed shadow-elegant">
          <Mail className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? "Nenhum resultado encontrado." : "Nenhum assinante ainda."}
          </p>
        </Card>
      ) : (
        <Card className="bg-gradient-card border-border shadow-elegant overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 bg-muted/20 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Empresa</span>
            <span>Telefone</span>
            <span>Grupo</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-border">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_2fr_2fr_1fr_1fr_1fr] gap-1 md:gap-3 px-4 py-3 hover:bg-muted/10 transition-smooth"
              >
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 border border-primary/20 grid place-items-center shrink-0 text-xs font-bold text-primary">
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate">{s.name}</span>
                </div>
                <span className="text-sm text-muted-foreground truncate md:flex md:items-center">
                  {s.email}
                </span>
                <span className="text-sm text-muted-foreground truncate md:flex md:items-center">
                  {s.business || <span className="text-muted-foreground/40 italic">—</span>}
                </span>
                <span className="text-sm text-muted-foreground truncate md:flex md:items-center">
                  {s.phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3 shrink-0" />
                      {s.phone}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 italic">—</span>
                  )}
                </span>
                <div className="md:flex md:items-center">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 capitalize border-border text-muted-foreground"
                  >
                    {s.group}
                  </Badge>
                </div>
                <div className="md:flex md:items-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      s.isActive
                        ? "border-secondary/40 text-secondary bg-secondary/5"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {s.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-border bg-muted/10 text-xs text-muted-foreground">
            {filtered.length} assinante{filtered.length !== 1 ? "s" : ""}
            {search && ` (de ${subscribers.length} no total)`}
          </div>
        </Card>
      )}
    </AppShell>
  );
}
