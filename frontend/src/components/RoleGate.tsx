import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type RoleGateProps = {
  children: ReactNode;
  allowedRoles?: Array<'admin' | 'manager' | 'employee'>;
  redirectTo?: string;
};

const RoleGate = ({ children, allowedRoles, redirectTo = '/dashboard' }: RoleGateProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleGate;