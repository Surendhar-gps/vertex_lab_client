import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/index';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cad_lab_token';
const USER_KEY = 'cad_lab_user';
const ROLE_KEY = 'cad_lab_role';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // On mount, verify token is still valid
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setInitializing(false);
        return;
      }
      try {
        const res = await authService.getMe();
        const freshUser = res.data.data.user;
        setUser(freshUser);
        localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        localStorage.setItem(ROLE_KEY, freshUser.role);
      } catch {
        // Token invalid or expired — clear everything
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };
    verifyToken();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  };

  const login = useCallback(async (email, password, role) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password, role);
      const { token: newToken, user: newUser } = res.data.data;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(ROLE_KEY, newUser.role);

      return { success: true, user: newUser };
    } catch (error) {
      const data = error.response?.data;
      const message = data?.message || 'Login failed. Please try again.';
      return { success: false, message, needsRegistration: data?.needsRegistration || false };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    const role = user?.role || 'student';
    clearAuth();
    window.location.href = `/${role}/login`;
  }, [user]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const setAuth = useCallback((newUser, newToken) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ROLE_KEY, newUser.role);
  }, []);

  const value = {
    user,
    token,
    loading,
    initializing,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    setAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
