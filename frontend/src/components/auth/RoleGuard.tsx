import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  requireDock?: string;
  requireShipId?: number;
  fallbackPath?: string;
}

export default function RoleGuard({
  children,
  allowedRoles,
  requireDock,
  requireShipId,
  fallbackPath = '/',
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireDock && user.dock !== requireDock) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireShipId && user.shipId !== requireShipId) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
