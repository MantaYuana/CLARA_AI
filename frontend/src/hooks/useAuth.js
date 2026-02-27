import { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "../lib/axios";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUser = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.get("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Auth response:", res);

      setUser(res.data.data);
    } catch (error) {
      console.error("Auth error:", error);
      setUser(null);
      localStorage.removeItem("token"); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getUser();
  }, [getUser]);

  return { user, loading, setUser, refetchUser: getUser };
};