import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "./api";

interface Settings {
  logo_expanded_light?: string | null;
  logo_expanded_dark?: string | null;
  logo_collapsed_light?: string | null;
  logo_collapsed_dark?: string | null;
  [key: string]: any;
}

interface SettingsContextType {
  settings: Settings;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await apiRequest("/settings/public");
      setSettings(data);
    } catch (err) {
      console.error("Failed to load platform settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
    const id = setInterval(refreshSettings, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("usePlatformSettings must be used within a SettingsProvider");
  }
  return context;
}
