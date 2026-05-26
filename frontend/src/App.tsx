import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { DashboardPage } from "./pages/Dashboard";
import { CoursesListPage } from "./pages/CoursesList";
import { CoursePlayerPage } from "./pages/CoursePlayer";
import { CommunityPage } from "./pages/Community";
import { ProjectsPage } from "./pages/Projects";
import { LeaderboardPage } from "./pages/Leaderboard";
import { ProfilePage } from "./pages/Profile";
import { SettingsPage } from "./pages/Settings";
import { AdminPanelPage } from "./pages/AdminPanel";
import { LoginPage } from "./pages/Login";
import { SignUpPage } from "./pages/SignUp";
import { CertificatePage } from "./pages/Certificate";
import { Toaster } from "@/components/ui/sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      <img src="/totvs.svg" className="watermark-bg" alt="" aria-hidden="true" />
      <div className="max-w-md text-center relative z-10">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O caminho que você tentou acessar não existe na Universidade Suri.
        </p>
        <div className="mt-6">
          <Button asChild className="bg-gradient-hero text-snow border border-border hover:shadow-glow">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/certificado/:codigo" element={<CertificatePage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cursos"
          element={
            <ProtectedRoute>
              <CoursesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cursos/:courseId"
          element={
            <ProtectedRoute>
              <CoursePlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comunidade"
          element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projetos"
          element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ranking"
          element={
            <ProtectedRoute>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanelPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}
