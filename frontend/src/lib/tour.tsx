import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/lib/auth";

const STORAGE_KEY = "suri_tour_completed";

interface TourContextValue {
  tourActive: boolean;
  startTour: () => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  tourActive: false,
  startTour: () => {},
  stopTour: () => {},
});

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed && user.isFirstLogin) {
      const timer = setTimeout(() => setTourActive(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user]);

  const startTour = useCallback(() => setTourActive(true), []);

  const stopTour = useCallback(() => {
    setTourActive(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  return (
    <TourContext.Provider value={{ tourActive, startTour, stopTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}
