import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

interface TenantRouteGuardProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

export function TenantRouteGuard({ children, requiresOnboarding = false }: TenantRouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isTenantOnboarded, isTenantNotOnboarded } = useUser();

  useEffect(() => {
    // Wait for user to load
    if (isLoading || !user) return;

    // Only apply guard to tenants
    if (user.userType !== "tenant") return;

    // If route requires NOT being onboarded (e.g., search page)
    if (requiresOnboarding === false) {
      if (isTenantOnboarded) {
        // Already onboarded tenant trying to access search/onboarding pages
        // Redirect to tenant dashboard
        setLocation("/tenant-dashboard");
      }
    } 
    // If route requires being onboarded (e.g., dashboard, profile, etc.)
    else if (requiresOnboarding === true) {
      if (isTenantNotOnboarded) {
        // Not onboarded tenant trying to access dashboard pages
        // Redirect to search page
        setLocation("/tenant-search-pgs");
      }
    }
  }, [isLoading, user, isTenantOnboarded, isTenantNotOnboarded, requiresOnboarding, location, setLocation]);

  return <>{children}</>;
}
