import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

export const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner label="Checking your session" />;
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return children;
};

export const RequireAdmin = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Checking your session" />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};
