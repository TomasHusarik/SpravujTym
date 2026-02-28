import { Routes, Route, Navigate, useLocation } from "react-router";
import { AppShell } from '@mantine/core'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { useAuth } from './context/AuthContext';
import type { JSX } from "react";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import CalendarPage from "./pages/CalendarPage";
import EventDetailPage from "./pages/EventDetailPage";
import UserPage from "./pages/UserPage";
import SquadsPage from "./pages/SquadsPage";
import SquadPage from "./pages/SquadPage";
import UsersPage from "./pages/UsersPage";

const App = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isNewUser = Boolean(user?.new);

  if (isLoading) {
    return null;
  }

  const requireAuth = (element: JSX.Element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <>
      <AppShell
        padding={isAuthenticated ? "xl" : 0}
        header={isAuthenticated ? { height: { base: 50, sm: 100 } } : undefined}
        footer={isAuthenticated ? { height: 80 } : undefined}
      >
        {isAuthenticated  && (
          <AppShell.Header>
            <Header />
          </AppShell.Header>
        )}

        <AppShell.Main>
          <Routes>
            {
              user?.new ? (
                <>
                  <Route path="/user" element={requireAuth(<UserPage />)} />
                  <Route path="*" element={<Navigate to="/user" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Navigate to={isAuthenticated ? "/overview" : "/login"} replace />} />
                  <Route path="/login" element={isAuthenticated ? <Navigate to="/overview" replace /> : <LoginPage />} />
                  <Route path="/overview" element={requireAuth(<OverviewPage />)} />
                  <Route path="/squads" element={requireAuth(<SquadsPage />)} />
                  <Route path="/squad/:id" element={requireAuth(<SquadPage />)} />
                  <Route path="/calendar" element={requireAuth(<CalendarPage />)} />
                  <Route path="/user/:id" element={requireAuth(<UserPage />)} />
                  <Route path="/event-detail/:id" element={requireAuth(<EventDetailPage />)} />
                  <Route path="/users" element={requireAuth(<UsersPage />)} />
                </>
              )
            }
          </Routes>
        </AppShell.Main>

        {isAuthenticated && (
          <AppShell.Footer visibleFrom="sm">
            <Footer />
          </AppShell.Footer>
        )}
      </AppShell >
    </>
  )
}

export default App