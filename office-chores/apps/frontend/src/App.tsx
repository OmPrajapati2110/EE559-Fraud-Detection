import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import LoginPage from '@/pages/LoginPage';
import AppShell from '@/components/AppShell';
import CalendarPage from '@/pages/CalendarPage';
import ChoresPage from '@/pages/ChoresPage';
import TeamPage from '@/pages/TeamPage';
import HistoryPage from '@/pages/HistoryPage';
import SettingsPage from '@/pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuthStore();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<CalendarPage />} />
          <Route path="chores" element={<AdminRoute><ChoresPage /></AdminRoute>} />
          <Route path="team" element={<AdminRoute><TeamPage /></AdminRoute>} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
