import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "./api";
import { toast } from "sonner";

export type Group = "embaixador" | "vip" | "admin";
export type Tier = string;

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  group: Group;
  tier: Tier;
  xp: number;
  nextLevelXp: number;
  level: number;
  badges: string[];
  projectsSent: number;
  isAdmin?: boolean;
}

interface AuthCtx {
  user: MockUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; group: Group; tier: Tier }) => Promise<void>;
  logout: () => void;
  switchGroup: (group: Group) => void;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const STORAGE_KEY = "nimbus_user";
const TOKEN_KEY = "suri_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;
      
      const realUser = await apiRequest("/auth/me");
      const mappedUser: MockUser = {
        id: realUser.id,
        name: realUser.name,
        email: realUser.email,
        avatar: realUser.avatar || realUser.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase(),
        group: realUser.group,
        tier: realUser.tier,
        xp: realUser.xp,
        nextLevelXp: (Math.floor(realUser.xp / 1000) + 1) * 1000,
        level: realUser.level,
        badges: realUser.badges || ["b1"],
        projectsSent: realUser.projectsSent || 0,
        isAdmin: realUser.isAdmin,
      };
      
      setUser(mappedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
    } catch (e) {
      console.warn("Failed to fetch fresh profile, keeping cached user:", e);
      // Do not auto-logout to prevent logging out on transient network errors or refreshes
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      localStorage.setItem(TOKEN_KEY, data.token);
      
      const mappedUser: MockUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar || data.user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase(),
        group: data.user.group,
        tier: data.user.tier,
        xp: data.user.xp,
        nextLevelXp: (Math.floor(data.user.xp / 1000) + 1) * 1000,
        level: data.user.level,
        badges: data.user.badges || ["b1"],
        projectsSent: data.user.projectsSent || 0,
        isAdmin: data.user.isAdmin,
      };

      setUser(mappedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
      toast.success(`Bem-vindo, ${data.user.name}!`);
    } catch (err: any) {
      toast.error(err.message || "E-mail ou senha incorretos");
      throw err;
    }
  };

  const signup = async ({ name, email, password, group, tier }: any) => {
    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password, group, tier }),
      });

      localStorage.setItem(TOKEN_KEY, data.token);

      const mappedUser: MockUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatar: data.user.avatar || data.user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase(),
        group: data.user.group,
        tier: data.user.tier,
        xp: data.user.xp,
        nextLevelXp: 1000,
        level: data.user.level,
        badges: [],
        projectsSent: 0,
        isAdmin: data.user.isAdmin,
      };

      setUser(mappedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
      toast.success("Cadastro ativado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar cadastro");
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    toast.info("Sessão encerrada");
  };

  const switchGroup = (group: Group) => {
    if (!user) return;
    const tier: Tier = group === "vip" ? "VIP PLUS" : "Embaixador Elite";
    const updated = { ...user, group, tier };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const value: AuthCtx = {
    user,
    login,
    signup,
    logout,
    switchGroup,
    refreshProfile: fetchProfile,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
