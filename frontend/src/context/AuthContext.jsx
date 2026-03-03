import { useCallback, useEffect, useMemo, useState } from "react";
import { apiEvents } from "../services/api-events";
import { clearToken, getToken, setToken } from "../services/session.service";
import * as authService from "../services/auth.service";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    return apiEvents.onUnauthorized(() => {
      clearToken();
      setUser(null);
    });
  }, []);

  const login = useCallback(async (credentials) => {
    const payload = await authService.login(credentials);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }, []);

  const register = useCallback(async (registrationPayload) => {
    const payload = await authService.register(registrationPayload);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore backend logout errors; always clear local session.
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      reloadMe: loadCurrentUser,
    }),
    [user, loading, login, register, logout, loadCurrentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
