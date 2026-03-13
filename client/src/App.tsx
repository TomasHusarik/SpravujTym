import { Routes, Route, Navigate } from "react-router";
import { AppShell } from "@mantine/core";
import { Suspense, lazy } from "react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { useAuth } from "./context/AuthContext";
import type { JSX } from "react";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";

/* LAZY PAGES */
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const UserPage = lazy(() => import("./pages/UserPage"));
const SquadsPage = lazy(() => import("./pages/SquadsPage"));
const SquadPage = lazy(() => import("./pages/SquadPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const AnnouncementsPage = lazy(() => import("./pages/AnnouncementsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));

const App = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  const requireAuth = (element: JSX.Element) =>
    isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <AppShell
      padding={isAuthenticated ? "xl" : 0}
      header={isAuthenticated ? { height: { base: 50, sm: 100 } } : undefined}
      footer={isAuthenticated ? { height: 80 } : undefined}
    >
      {isAuthenticated && (
        <AppShell.Header>
          <Header />
        </AppShell.Header>
      )}

      <AppShell.Main>

        {/* Suspense wrapper for lazy pages */}
        <Suspense fallback={null}>

          <Routes>
            {user?.new ? (
              <>
                <Route path="/user" element={requireAuth(<UserPage />)} />
                <Route path="*" element={<Navigate to="/user" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={isAuthenticated ? "/overview" : "/login"}
                      replace
                    />
                  }
                />

                <Route path="/home" element={<HomePage />} />

                <Route
                  path="/login"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/overview" replace />
                    ) : (
                      <LoginPage />
                    )
                  }
                />

                <Route path="/overview" element={requireAuth(<OverviewPage />)} />

                <Route path="/squads" element={requireAuth(<SquadsPage />)} />
                <Route path="/squad/:id" element={requireAuth(<SquadPage />)} />

                <Route path="/calendar" element={requireAuth(<CalendarPage />)} />

                <Route path="/user/:id" element={requireAuth(<UserPage />)} />

                <Route path="/payment" element={requireAuth(<PaymentPage />)} />

                <Route path="/event-detail" element={requireAuth(<EventDetailPage />)} />
                <Route path="/event-detail/:id" element={requireAuth(<EventDetailPage />)} />

                <Route path="/users" element={requireAuth(<UsersPage />)} />

                <Route
                  path="/announcements"
                  element={requireAuth(<AnnouncementsPage />)}
                />
              </>
            )}
          </Routes>

        </Suspense>

      </AppShell.Main>

      {isAuthenticated && (
        <AppShell.Footer visibleFrom="sm">
          <Footer />
        </AppShell.Footer>
      )}
    </AppShell>
  );
};

export default App;