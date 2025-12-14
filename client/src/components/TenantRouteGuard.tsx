import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

interface TenantRouteGuardProps {
  children: React.ReactNode;
  requiresOnboarding?: boolean;
}

export function TenantRouteGuard({ children, requiresOnboarding = false }: TenantRouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { user, isLoading, isTenantOnboarded, isApplicant } = useUser();

  useEffect(() => {
    // Wait for user to load
    if (isLoading || !user) return;

    // If route requires NOT being onboarded (applicant-only routes like search)
    if (requiresOnboarding === false) {
      // Only applicants should access these routes
      if (user.userType === "tenant") {
        // Any tenant (onboarded or not) trying to access applicant pages
        setLocation("/tenant-dashboard");
      }
    } 
    // If route requires being onboarded (tenant-only routes like dashboard)
    else if (requiresOnboarding === true) {
      // Only onboarded tenants should access these routes
      if (user.userType === "applicant") {
        // Applicant trying to access tenant-only pages
        setLocation("/tenant-search-pgs");
      } else if (user.userType === "tenant" && !isTenantOnboarded) {
        // Not onboarded tenant trying to access dashboard
        setLocation("/tenant-search-pgs");
      }
    }
  }, [isLoading, user, isTenantOnboarded, isApplicant, requiresOnboarding, location, setLocation]);

  return <>{children}</>;
}
