import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useCachedRequest } from "@/hooks/useCachedRequest";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map as MapIcon, PlayCircle, FileText, ExternalLink, ArrowLeft, Flag, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";

interface RoadmapItem {
  id: string;
  type: "video" | "document" | "reference";
  title: string;
  url: string;
  description?: string | null;
  sortOrder: number;
}

interface Roadmap {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  items: RoadmapItem[];
}

const TYPE_CONFIG = {
  video: { label: "Vídeo", icon: PlayCircle, color: "text-primary", bg: "bg-primary/10 border-primary/30", line: "bg-primary/30" },
  document: { label: "Documento", icon: FileText, color: "text-secondary", bg: "bg-secondary/10 border-secondary/30", line: "bg-secondary/30" },
  reference: { label: "Referência", icon: ExternalLink, color: "text-muted-foreground", bg: "bg-muted/10 border-border", line: "bg-border" },
} as const;

const TYPE_NODE_COLOR: Record<string, string> = {
  video: "bg-primary border-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.35)]",
  document: "bg-secondary border-secondary/60 shadow-[0_0_12px_hsl(var(--secondary)/0.35)]",
  reference: "bg-muted-foreground/70 border-muted-foreground/40",
};

function RoadmapPathView({ roadmap, onBack }: { roadmap: Roadmap; onBack: () => void }) {
  const sorted = [...roadmap.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <AppShell>
      <div className="fade-in-up max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth"
        >
          <ArrowLeft className="size-4" />
          Roadmaps
        </button>

        <div className="flex items-start gap-3 mb-8">
          <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shrink-0 mt-0.5">
            <MapIcon className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient leading-tight">{roadmap.title}</h1>
            {roadmap.description && (
              <p className="text-sm text-muted-foreground mt-1">{roadmap.description}</p>
            )}
            <p className="text-xs text-muted-foreground/70 mt-1">{sorted.length} etapa{sorted.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <Card className="bg-gradient-card border-border p-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhum conteúdo cadastrado ainda.</p>
          </Card>
        ) : (
          <div className="relative">
            {/* Vertical route line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gradient-to-b from-primary/40 via-border to-border/20 rounded-full" />

            {/* Start node */}
            <div className="flex items-center gap-4 mb-3 relative z-10">
              <div className="size-10 rounded-full bg-gradient-hero border-2 border-primary/60 grid place-items-center shadow-glow shrink-0">
                <Flag className="size-4 text-snow" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Início</span>
            </div>

            {/* Path items */}
            <div className="space-y-0">
              {sorted.map((item, idx) => {
                const cfg = TYPE_CONFIG[item.type];
                const Icon = cfg.icon;
                const isLast = idx === sorted.length - 1;

                return (
                  <div key={item.id} className="relative">
                    {/* Connector line segment */}
                    <div className="absolute left-5 top-0 h-6 w-0.5 bg-border/50" />

                    <div className="pt-6 pb-0">
                      <div className="flex items-start gap-4 relative z-10">
                        {/* Node dot */}
                        <div className={`size-10 rounded-full border-2 grid place-items-center shrink-0 ${TYPE_NODE_COLOR[item.type]}`}>
                          <Icon className="size-4 text-white" />
                        </div>

                        {/* Card */}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex-1 rounded-xl border p-4 hover-lift transition-smooth group ${cfg.bg} mb-2`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 shrink-0 border-0 ${cfg.bg} ${cfg.color} font-medium`}
                                >
                                  {cfg.label}
                                </Badge>
                                <span className={`text-[10px] text-muted-foreground/60`}>Etapa {idx + 1}</span>
                              </div>
                              <p className={`text-sm font-semibold leading-snug group-hover:underline underline-offset-2 ${cfg.color}`}>
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                              )}
                            </div>
                            <ExternalLink className={`size-3.5 shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity ${cfg.color}`} />
                          </div>
                        </a>
                      </div>

                      {/* Connector to next item */}
                      {!isLast && (
                        <div className="absolute left-5 bottom-0 h-6 w-0.5 bg-border/50" style={{ bottom: "-24px" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* End node */}
            <div className="flex items-center gap-4 mt-6 relative z-10">
              <div className="absolute left-5 -top-6 h-6 w-0.5 bg-border/50" />
              <div className="size-10 rounded-full bg-secondary/20 border-2 border-secondary/50 grid place-items-center shrink-0">
                <CheckCircle2 className="size-5 text-secondary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary">Concluído</span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export function RoadmapPage() {
  const [selected, setSelected] = useState<Roadmap | null>(null);

  const { data, loading, refetch } = useCachedRequest<Roadmap[]>("/roadmaps", 30);
  const roadmaps = data ?? [];

  useEffect(() => {
    const id = setInterval(refetch, 30_000);
    return () => clearInterval(id);
  }, [refetch]);

  if (selected) {
    return <RoadmapPathView roadmap={selected} onBack={() => setSelected(null)} />;
  }

  if (loading) {
    return (
      <AppShell>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-card border-border h-44 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="fade-in-up mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-2">
          <MapIcon className="size-7 text-primary" />
          Roadmaps
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Siga as rotas de aprendizado curadas para cada área
        </p>
      </div>

      {roadmaps.length === 0 ? (
        <Card className="bg-gradient-card border-border p-12 text-center shadow-elegant">
          <MapIcon className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum roadmap disponível no momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmaps.map((r, mapIdx) => {
            const sorted = [...r.items].sort((a, b) => a.sortOrder - b.sortOrder);
            const typeCount = {
              video: sorted.filter((i) => i.type === "video").length,
              document: sorted.filter((i) => i.type === "document").length,
              reference: sorted.filter((i) => i.type === "reference").length,
            };

            return (
              <Card
                key={r.id}
                className="bg-gradient-card border-border hover-lift transition-smooth cursor-pointer group overflow-hidden"
                onClick={() => setSelected(r)}
                style={{ animationDelay: `${mapIdx * 60}ms` }}
              >
                {/* Map header */}
                <div className="p-6 pb-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                      <MapIcon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Mini route preview */}
                  {sorted.length > 0 && (
                    <div className="relative pl-4">
                      {/* Mini vertical line */}
                      <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border/60" />

                      <div className="space-y-2">
                        {sorted.slice(0, 4).map((item, i) => {
                          const cfg = TYPE_CONFIG[item.type];
                          const Icon = cfg.icon;
                          return (
                            <div key={item.id} className="flex items-center gap-2.5 relative">
                              <div className={`size-5 rounded-full border grid place-items-center shrink-0 -ml-4 ${TYPE_NODE_COLOR[item.type]}`}>
                                <Icon className="size-2.5 text-white" />
                              </div>
                              <span className="text-xs text-muted-foreground truncate">{item.title}</span>
                            </div>
                          );
                        })}
                        {sorted.length > 4 && (
                          <div className="flex items-center gap-2.5 relative">
                            <div className="size-5 rounded-full border border-border bg-muted/30 grid place-items-center shrink-0 -ml-4">
                              <Circle className="size-2 text-muted-foreground/60" />
                            </div>
                            <span className="text-xs text-muted-foreground/60">+{sorted.length - 4} etapa{sorted.length - 4 > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer stats */}
                <div className="border-t border-border/40 px-5 py-3 flex items-center gap-3 flex-wrap">
                  {typeCount.video > 0 && (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <PlayCircle className="size-3" /> {typeCount.video} vídeo{typeCount.video > 1 ? "s" : ""}
                    </span>
                  )}
                  {typeCount.document > 0 && (
                    <span className="text-[10px] text-secondary flex items-center gap-1">
                      <FileText className="size-3" /> {typeCount.document} doc{typeCount.document > 1 ? "s" : ""}
                    </span>
                  )}
                  {typeCount.reference > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="size-3" /> {typeCount.reference} ref
                    </span>
                  )}
                  {sorted.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/60">Sem itens ainda</span>
                  )}
                  <span className="ml-auto text-[10px] text-primary/70 font-medium group-hover:text-primary transition-colors">
                    Ver rota →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
