
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle expired or invalid sessions.
  const handleSessionExpired = useCallback(() => {
    authService.logout();
    setUser(null);

    navigate("/login", {
      replace: true,
      state: {
        sessionExpired: true,
      },
    });
  }, [navigate]);

  // Check the user's authentication status.
  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch (error) {
        console.error("Authentication check failed");
        handleSessionExpired();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [handleSessionExpired]);

  // Listen for expired or invalid sessions.
  useEffect(() => {
    const handleExpiredSession = () => {
      handleSessionExpired();
    };

    window.addEventListener(
      "session-expired",
      handleExpiredSession
    );

    return () => {
      window.removeEventListener(
        "session-expired",
        handleExpiredSession
      );
    };
  }, [handleSessionExpired]);

  // Login user.
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  };

  // Register user.
  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  // Logout user.
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    handleSessionExpired,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
