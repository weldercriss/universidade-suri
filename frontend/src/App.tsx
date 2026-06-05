import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { usePlatformSettings } from "./lib/settings";
import totvsLight from "@/assets/icons/totvs-dark.svg";
import totvsDark from "@/assets/icons/totvs.svg";
import { DashboardPage } from "./pages/Dashboard";
import { CoursesListPage } from "./pages/CoursesList";
import { CoursePlayerPage } from "./pages/CoursePlayer";
import { LeaderboardPage } from "./pages/Leaderboard";
import { ProfilePage } from "./pages/Profile";
import { SettingsPage } from "./pages/Settings";
import { AdminPanelPage } from "./pages/AdminPanel";
import { AdminCoursesPage } from "./pages/AdminCourses";
import { AdminTrailsPage } from "./pages/AdminTrails";
import { LoginPage } from "./pages/Login";
import { SignUpPage } from "./pages/SignUp";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { ResetPasswordPage } from "./pages/ResetPassword";
import { CertificatePage } from "./pages/Certificate";
import { LandingPage } from "./pages/Landing";
import { TrailsListPage } from "./pages/TrailsList";
import { RoadmapPage } from "./pages/Roadmap";
import { AdminGroupsPage } from "./pages/AdminGroups";
import { AdminReportsPage } from "./pages/AdminReports";
import { AdminLogosPage } from "./pages/AdminLogos";
import { AdminQuizzesPage } from "./pages/AdminQuizzes";
import { AdminRoadmapPage } from "./pages/AdminRoadmap";
import { AdminNewsletterPage } from "./pages/AdminNewsletter";
import { AdminApiTokensPage } from "./pages/AdminApiTokens";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const deniedToastShown = useRef(false);

  useEffect(() => {
    if (user && !user.isAdmin && user.group !== "admin" && !deniedToastShown.current) {
      toast.error("Acesso restrito a administradores.");
      deniedToastShown.current = true;
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.isAdmin && user.group !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function NotFound() {
  const { theme } = useTheme();
  const { settings } = usePlatformSettings();
  const isLight = theme === "snow-blue";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      <img 
        src={isLight 
          ? (settings?.logo_collapsed_light ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_light}` : totvsLight)
          : (settings?.logo_collapsed_dark ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${settings.logo_collapsed_dark}` : totvsDark)} 
        className="watermark-bg" 
        alt="" 
        aria-hidden="true" 
      />
      <div className="max-w-md text-center relative z-10">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O caminho que você tentou acessar não existe na Universidade Suri.
        </p>
        <div className="mt-6">
          <Button asChild className="bg-gradient-hero text-snow border border-border hover:shadow-glow">
            <Link to="/dashboard">Voltar ao início</Link>
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/esqueceu-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="/certificado/:codigo" element={<CertificatePage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
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
          path="/trilhas"
          element={
            <ProtectedRoute>
              <TrailsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <ProtectedRoute>
              <RoadmapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanelPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cursos"
          element={
            <AdminRoute>
              <AdminCoursesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/trilhas"
          element={
            <AdminRoute>
              <AdminTrailsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/grupos"
          element={
            <AdminRoute>
              <AdminGroupsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/relatorios"
          element={
            <AdminRoute>
              <AdminReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logotipos"
          element={
            <AdminRoute>
              <AdminLogosPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/provas"
          element={
            <AdminRoute>
              <AdminQuizzesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/roadmap"
          element={
            <AdminRoute>
              <AdminRoadmapPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/newsletter"
          element={
            <AdminRoute>
              <AdminNewsletterPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tokens"
          element={
            <AdminRoute>
              <AdminApiTokensPage />
            </AdminRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}
