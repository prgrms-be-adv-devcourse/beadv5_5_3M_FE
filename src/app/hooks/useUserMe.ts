import { useState, useEffect, useCallback } from "react";
import { userService, UserInfo } from "../services/userService";

export function useUserMe() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const data = await userService.getMe();
      setUserInfo(data);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { userInfo, loading, refetch: fetch };
}
