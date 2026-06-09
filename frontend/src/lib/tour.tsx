import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Step } from "react-joyride";
import { useAuth } from "@/lib/auth";
import { pageTours } from "@/lib/tour-steps";

const STORAGE_KEY = "suri_tour_completed";

interface TourContextValue {
  tourActive: boolean;
  activeSteps: Step[];
  startTour: (pageId: string) => void;
  stopTour: () => void;
  hasTour: (pageId: string | null) => boolean;
}

const TourContext = createContext<TourContextValue>({
  tourActive: false,
  activeSteps: [],
  startTour: () => {},
  stopTour: () => {},
  hasTour: () => false,
});

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tourActive, setTourActive] = useState(false);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);

  const startTour = useCallback((pageId: string) => {
    const steps = pageTours[pageId];
    if (!steps || steps.length === 0) return;
    setActiveSteps(steps);
    setTourActive(true);
  }, []);

  // Auto-start no 1º login do aluno — apenas no tour do dashboard.
  useEffect(() => {
    if (!user || user.isAdmin) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed && user.isFirstLogin) {
      const timer = setTimeout(() => startTour("dashboard"), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user, startTour]);

  const stopTour = useCallback(() => {
    setTourActive(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const hasTour = useCallback(
    (pageId: string | null) => !!pageId && (pageTours[pageId]?.length ?? 0) > 0,
    [],
  );

  return (
    <TourContext.Provider value={{ tourActive, activeSteps, startTour, stopTour, hasTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
