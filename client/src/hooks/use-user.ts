import { useEffect, useState } from "react";

export interface TenantProfile {
  tenantId: number | null;
  pgId: number | null;
  onboardingStatus: "not_onboarded" | "pending" | "onboarded";
  status: "active" | "inactive" | null;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  userType: "owner" | "tenant" | "admin";
  tenantProfile?: TenantProfile;
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

  // Derived tenant flags for easier access
  const isTenantOnboarded = user?.userType === "tenant" && 
    user?.tenantProfile?.onboardingStatus === "onboarded" &&
    user?.tenantProfile?.status === "active";

  const isTenantNotOnboarded = user?.userType === "tenant" && 
    (!user?.tenantProfile || 
     user?.tenantProfile?.onboardingStatus !== "onboarded" ||
     user?.tenantProfile?.status !== "active");

  return { 
    user, 
    isLoading, 
    error,
    isTenantOnboarded,
    isTenantNotOnboarded
  };
}
