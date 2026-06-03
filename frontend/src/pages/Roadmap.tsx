import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { apiRequest } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, PlayCircle, FileText, ExternalLink, ArrowLeft, ChevronRight } from "lucide-react";
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
  video: { label: "Vídeo", icon: PlayCircle, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  document: { label: "Documento", icon: FileText, color: "text-secondary", bg: "bg-secondary/10 border-secondary/20" },
  reference: { label: "Referência", icon: ExternalLink, color: "text-muted-foreground", bg: "bg-muted/10 border-border" },
} as const;

export function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selected, setSelected] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Roadmap[]>("/roadmaps")
      .then(setRoadmaps)
      .catch(() => toast.error("Erro ao carregar roadmaps"))
      .finally(() => setLoading(false));
  }, []);

  const countByType = (items: RoadmapItem[], type: RoadmapItem["type"]) =>
    items.filter((i) => i.type === type).length;

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

  /* ── Detail view ── */
  if (selected) {
    const groups: Array<{ type: RoadmapItem["type"]; label: string }> = [
      { type: "video", label: "Vídeos" },
      { type: "document", label: "Documentos" },
      { type: "reference", label: "Referências" },
    ];

    return (
      <AppShell>
        <div className="fade-in-up">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-smooth"
          >
            <ArrowLeft className="size-4" />
            Roadmaps
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-2 mb-1">
            <MapIcon className="size-7 text-primary shrink-0" />
            {selected.title}
          </h1>
          {selected.description && (
            <p className="text-sm text-muted-foreground mt-1 mb-6">{selected.description}</p>
          )}

          {selected.items.length === 0 ? (
            <Card className="bg-gradient-card border-border p-10 text-center mt-4">
              <p className="text-muted-foreground text-sm">Nenhum conteúdo cadastrado ainda.</p>
            </Card>
          ) : (
            <div className="space-y-8 mt-4">
              {groups.map(({ type, label }) => {
                const items = selected.items.filter((i) => i.type === type);
                if (items.length === 0) return null;
                const cfg = TYPE_CONFIG[type];
                const Icon = cfg.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`size-4 ${cfg.color}`} />
                      <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        {label}
                      </h2>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {items.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-start gap-3 rounded-lg border p-3.5 ${cfg.bg} hover-lift transition-smooth group`}
                        >
                          <Icon className={`size-4 mt-0.5 shrink-0 ${cfg.color}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium group-hover:underline underline-offset-2 line-clamp-1">
                              {item.title}
                            </span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="size-3.5 text-muted-foreground shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  /* ── List view ── */
  return (
    <AppShell>
      <div className="fade-in-up mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-2">
          <MapIcon className="size-7 text-primary" />
          Roadmaps
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Conteúdos curados para te capacitar em cada área
        </p>
      </div>

      {roadmaps.length === 0 ? (
        <Card className="bg-gradient-card border-border p-12 text-center shadow-elegant">
          <MapIcon className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum roadmap disponível no momento.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roadmaps.map((r) => {
            const videos = countByType(r.items, "video");
            const docs = countByType(r.items, "document");
            const refs = countByType(r.items, "reference");
            const tags = [
              videos > 0 && `${videos} vídeo${videos > 1 ? "s" : ""}`,
              docs > 0 && `${docs} doc${docs > 1 ? "s" : ""}`,
              refs > 0 && `${refs} referência${refs > 1 ? "s" : ""}`,
            ].filter(Boolean);

            return (
              <Card
                key={r.id}
                className="bg-gradient-card border-border p-5 hover-lift transition-smooth cursor-pointer group"
                onClick={() => setSelected(r)}
              >
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                    <MapIcon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                    )}
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tags.map((tag) => (
                      <Badge
                        key={String(tag)}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-border"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 px-2 text-primary hover:bg-primary/10 gap-1"
                  >
                    Ver conteúdo <ChevronRight className="size-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
