import { Routes, Route, Navigate, useLocation } from "react-router";
import { AppShell } from '@mantine/core'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Overview from './pages/Overview';
import Calendar from './pages/Calendar';
import Payments from './pages/Payments';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import type { JSX } from "react";
import UserDetail from "./pages/UserDetail";

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
            <Route path="/login" element={isAuthenticated ? <Navigate to="/overview" replace /> : <Login />} />
            <Route path="/overview" element={requireAuth(<Overview />)} />
            <Route path="/calendar" element={requireAuth(<Calendar />)} />
            <Route path="/payments" element={requireAuth(<Payments />)} />
            <Route path="/userdetail" element={requireAuth(<UserDetail />)} />
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