import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { PlaceholderPanel } from '../../components/common/PlaceholderPanel.jsx';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, sessionStatus } = useAuth();

  if (sessionStatus === 'checking') {
    return (
      <div className="page-stack">
        <PlaceholderPanel
          badge="Loading"
          title="Checking your session"
          description="The app is restoring your local session before deciding whether this route should stay protected."
        />
      </div>
    );
  }

  const redirectTarget = `${location.pathname}${location.search}`;

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate replace to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} />
  );
};

export const AdminRoute = () => {
  const { isAdmin, sessionStatus } = useAuth();

  if (sessionStatus === 'checking') {
    return (
      <div className="page-stack">
        <PlaceholderPanel
          badge="Loading"
          title="Checking your session"
          description="The app is restoring your local session before deciding whether this route should stay protected."
        />
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate replace to="/" />;
};
