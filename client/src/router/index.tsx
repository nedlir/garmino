import { Routes, Route, Navigate } from 'react-router-dom';
import { Register } from '../pages/Register';
import { Login } from '../pages/Login';
import { AdminDashboard } from '../pages/AdminDashboard';
import { UserDashboard } from '../pages/UserDashboard';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../config/routes';

export const AppRoutes = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  return (
    <Routes>
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.DASHBOARD} element={<UserDashboard />} />
        <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
      </Route>

      <Route
        path={ROUTES.HOME}
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD} replace />
          ) : (
            <Navigate to={ROUTES.LOGIN} replace />
          )
        }
      />
    </Routes>
  );
};
