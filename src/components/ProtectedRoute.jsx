import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirects unauthenticated users to the correct login page.
 * Optionally restricts to specific roles.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="loading-center" style={{ height: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to the user's correct dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;
