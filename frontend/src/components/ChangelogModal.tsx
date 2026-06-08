import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wrench, Zap } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface ChangeEntry {
  type: "new" | "improved" | "fixed";
  text: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  changes: ChangeEntry[];
}

const STORAGE_KEY = "suri_changelog_seen";

const changeIcon = {
  new: <Sparkles className="size-3 shrink-0 mt-0.5" />,
  improved: <Zap className="size-3 shrink-0 mt-0.5" />,
  fixed: <Wrench className="size-3 shrink-0 mt-0.5" />,
};

const changeBadgeClass = {
  new: "bg-secondary/15 text-secondary border-secondary/30",
  improved: "bg-primary/15 text-primary border-primary/30",
  fixed: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const changeLabel = {
  new: "Novo",
  improved: "Melhoria",
  fixed: "Correção",
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangelogModal({ open, onClose }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiRequest("/changelog")
      .then((data) => setReleases(data as Release[]))
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (open && releases.length > 0) {
      const firstRelease = releases[0];
      if (firstRelease) {
        localStorage.setItem(STORAGE_KEY, firstRelease.version);
      }
    }
  }, [open, releases]);

  const formatDate = (iso: string) => {
    const [year, month, day] = iso.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-gradient text-lg">Novidades da Plataforma</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : releases.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma versão disponível.</div>
        ) : (
          <div className="overflow-y-auto max-h-[60vh] pr-1">
            <div className="space-y-6 pb-2">
              {releases.map((release, idx) => (
                <div key={release.version} className="relative">
                  {idx < releases.length - 1 && (
                    <div className="absolute left-[7px] top-8 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="size-3.5 rounded-full bg-primary mt-1.5 shrink-0 ring-2 ring-primary/30" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">v{release.version}</span>
                        {idx === 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-secondary/15 text-secondary border border-secondary/30">
                            Atual
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(release.date)}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground/90 mb-2">{release.title}</p>
                      <ul className="space-y-1.5">
                        {release.changes.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] shrink-0 ${changeBadgeClass[c.type]}`}>
                              {changeIcon[c.type]}
                              {changeLabel[c.type]}
                            </span>
                            <span>{c.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

let cachedLatestVersion: string | null = null;
let cachedHasNew: boolean = false;
let isFetched = false;
let fetchPromise: Promise<void> | null = null;

export function useChangelogBadge() {
  const [latestVersion, setLatestVersion] = useState<string | null>(
    cachedLatestVersion || localStorage.getItem(STORAGE_KEY) || null
  );
  const [hasNew, setHasNew] = useState(cachedHasNew);

  useEffect(() => {
    if (isFetched) {
      setLatestVersion(cachedLatestVersion);
      setHasNew(cachedHasNew);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = apiRequest("/changelog")
        .then((data) => {
          const releases = data as Release[];
          const latestRelease = releases[0];
          if (!latestRelease) return;
          const latest = latestRelease.version;
          cachedLatestVersion = latest;
          setLatestVersion(latest);
          
          const seen = localStorage.getItem(STORAGE_KEY);
          const isNew = seen !== latest;
          cachedHasNew = isNew;
          setHasNew(isNew);
          isFetched = true;
        })
        .catch(() => {});
    } else {
      fetchPromise.then(() => {
        if (isFetched) {
          setLatestVersion(cachedLatestVersion);
          setHasNew(cachedHasNew);
        }
      });
    }
  }, []);

  const markSeen = () => {
    if (latestVersion) {
      localStorage.setItem(STORAGE_KEY, latestVersion);
      cachedHasNew = false;
      setHasNew(false);
    }
  };

  return { latestVersion, hasNew, markSeen };
}
