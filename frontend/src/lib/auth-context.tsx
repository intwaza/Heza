import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  auth as authApi,
  clearToken,
  getToken,
  setToken as persistToken,
  setUnauthorizedHandler,
  type CurrentWorker,
} from "./api";
import { t } from "./i18n";

type AuthContextValue = {
  worker: CurrentWorker | null;
  isLoading: boolean;
  logoutMessage: string | null;
  clearLogoutMessage: () => void;
  login: (username: string, password: string) => Promise<void>;
  logout: (message?: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// log out after 15 minutes of no activity
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [worker, setWorker] = useState<CurrentWorker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(
    (message?: string) => {
      clearToken();
      setWorker(null);
      if (message) setLogoutMessage(message);
      navigate({ to: "/login" });
    },
    [navigate],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => logout(t("session_expired")));
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setWorker)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!worker) return;

    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => logout(t("session_expired")), IDLE_TIMEOUT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [worker, logout]);

  const login = useCallback(async (username: string, password: string) => {
    const token = await authApi.login(username, password);
    persistToken(token.access_token);
    const me = await authApi.me();
    setWorker(me);
    setLogoutMessage(null);
  }, []);

  const clearLogoutMessage = useCallback(() => setLogoutMessage(null), []);

  return (
    <AuthContext.Provider
      value={{ worker, isLoading, logoutMessage, clearLogoutMessage, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
