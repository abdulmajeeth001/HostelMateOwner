import { useEffect, useState } from "react";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  userType: "owner" | "tenant" | "admin";
}

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) {
            setUser(null);
          } else {
            throw new Error("Failed to fetch user");
          }
        } else {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        setError((err as any).message);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isLoading, error };
}
