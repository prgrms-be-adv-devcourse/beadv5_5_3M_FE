import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { userService, UserInfo } from "../services/userService";
import { tokenStorage } from "../services/authService";

interface UserContextType {
  user: UserInfo | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateCookies: (newBalance: number) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await userService.getMe();
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
  }, []);

  const updateCookies = (newBalance: number) => {
    if (user) {
      setUser({ ...user, cookieBalance: newBalance });
    }
  };

  useEffect(() => {
    // 토큰이 있을 때만 fetch (OAuth 콜백에서는 clearTokens() 이후라 토큰 없음)
    if (tokenStorage.getAccessToken()) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, updateCookies, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
