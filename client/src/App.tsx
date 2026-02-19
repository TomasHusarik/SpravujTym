import { Routes, Route, Navigate, useLocation } from "react-router";
import { AppShell } from '@mantine/core'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { useAuth } from './context/AuthContext';
import type { JSX } from "react";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import CalendarPage from "./pages/CalendarPage";
import PaymentsPage from "./pages/PaymentsPage";
import UserDetailPage from "./pages/UserDetailPage";

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const requireAuth = (element: JSX.Element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <>
      <AppShell
        padding={isAuthenticated ? "xl" : 0}
        header={isAuthenticated ? { height: { base: 50, sm: 100 } } : undefined }
        footer={isAuthenticated ? { height: 80 } : undefined }
      >
        {isAuthenticated && (
          <AppShell.Header style={{ zIndex: 1000 }}>
            <Header />
          </AppShell.Header>
        )}

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/overview" : "/login"} replace />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/overview" replace /> : <LoginPage />} />
            <Route path="/overview" element={requireAuth(<OverviewPage />)} />
            <Route path="/calendar" element={requireAuth(<CalendarPage />)} />
            <Route path="/payments" element={requireAuth(<PaymentsPage />)} />
            <Route path="/userdetail" element={requireAuth(<UserDetailPage />)} />
          </Routes>
        </AppShell.Main>

        {isAuthenticated && (
          <AppShell.Footer style={{ zIndex: 1000 }} visibleFrom="sm">
            <Footer />
          </AppShell.Footer>
        )}
      </AppShell >
    </>
  )
}

export default App