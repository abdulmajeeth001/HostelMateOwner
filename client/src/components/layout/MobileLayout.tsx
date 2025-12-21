import { useLocation } from "wouter";
import { Home, Users, CreditCard, Bell, Settings, DoorOpen, Wrench, AlertCircle, BarChart3, Menu, X, Building2, LogOut, Shield, Search, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { PGSwitcher } from "@/components/PGSwitcher";
import { useQueryClient } from "@tanstack/react-query";
import appIcon from "/winkstay-logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotificationBell } from "@/components/NotificationBell";

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  title?: string;
  action?: React.ReactNode;
}

export default function MobileLayout({ 
  children, 
  showNav = true, 
  title,
  action
}: MobileLayoutProps) {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, isTenantOnboarded, isApplicant } = useUser();
  
  const isOwner = user?.userType === "owner";
  const isAdmin = user?.userType === "admin";
  const isTenant = user?.userType === "tenant";

  // Close sidebar when location changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
      
      if (res.ok) {
        // Clear all cached queries to prevent stale data across sessions
        queryClient.clear();
        navigate("/");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  // Owner navigation items
  const ownerSideNavItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: DoorOpen, label: "Rooms", path: "/rooms" },
    { icon: Users, label: "Tenants", path: "/tenants" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: CalendarCheck, label: "Visit Requests", path: "/owner-visit-requests" },
    { icon: Users, label: "Onboarding", path: "/owner-onboarding-requests" },
    { icon: AlertCircle, label: "Complaints", path: "/complaints" },
    { icon: Wrench, label: "Maintenance", path: "/maintenance" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Building2, label: "My PGs", path: "/pg-management" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Applicant navigation items (searching for PG)
  const applicantSideNavItems = [
    { icon: Search, label: "Search PGs", path: "/tenant-search-pgs" },
    { icon: CalendarCheck, label: "Visit Requests", path: "/tenant-visit-requests" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Tenant navigation items (already living in PG)
  const tenantSideNavItems = [
    { icon: Home, label: "Dashboard", path: "/tenant-dashboard" },
    { icon: DoorOpen, label: "Room", path: "/tenant-room" },
    { icon: CreditCard, label: "Payments", path: "/tenant-payments" },
    { icon: AlertCircle, label: "Complaints", path: "/tenant-complaints" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const ownerBottomNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: CalendarCheck, label: "Visits", path: "/owner-visit-requests" },
    { icon: Users, label: "Tenants", path: "/tenants" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Applicant bottom navigation
  const applicantBottomNavItems = [
    { icon: Search, label: "Search", path: "/tenant-search-pgs" },
    { icon: CalendarCheck, label: "Visits", path: "/tenant-visit-requests" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Tenant bottom navigation
  const tenantBottomNavItems = [
    { icon: Home, label: "Home", path: "/tenant-dashboard" },
    { icon: DoorOpen, label: "Room", path: "/tenant-room" },
    { icon: CreditCard, label: "Payments", path: "/tenant-payments" },
    { icon: AlertCircle, label: "Issues", path: "/tenant-complaints" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Admin navigation items
  const adminSideNavItems = [
    { icon: Home, label: "Dashboard", path: "/admin-dashboard" },
    { icon: Building2, label: "PG Management", path: "/admin-pgs" },
    { icon: CreditCard, label: "Subscriptions", path: "/admin-subscriptions" },
    { icon: AlertCircle, label: "Complaints", path: "/admin-complaints" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const adminBottomNavItems = [
    { icon: Home, label: "Home", path: "/admin-dashboard" },
    { icon: Building2, label: "PGs", path: "/admin-pgs" },
    { icon: CreditCard, label: "Subs", path: "/admin-subscriptions" },
    { icon: AlertCircle, label: "Alerts", path: "/admin-complaints" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Select navigation based on user type
  // Note: userType now reflects actual state - "applicant" = searching for housing, "tenant" = has housing
  // When a tenant is removed, their userType reverts to "applicant"
  const sideNavItems = user?.userType === "admin" ? adminSideNavItems 
    : user?.userType === "applicant" ? applicantSideNavItems
    : user?.userType === "tenant" ? tenantSideNavItems 
    : ownerSideNavItems;
  const bottomNavItems = user?.userType === "admin" ? adminBottomNavItems 
    : user?.userType === "applicant" ? applicantBottomNavItems
    : user?.userType === "tenant" ? tenantBottomNavItems 
    : ownerBottomNavItems;

  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto border-x border-border shadow-2xl relative flex overflow-hidden">
      {/* Side Navigation - Collapsible */}
      <aside className={cn(
        "bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto transition-all duration-300 absolute lg:relative h-full",
        sidebarOpen ? "w-64 z-40" : "w-0"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div 
            onClick={() => navigate(isAdmin ? "/admin-dashboard" : "/dashboard")}
            className="flex items-center gap-3 cursor-pointer mb-4"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 p-2">
              <img src={appIcon} alt="StayBuki" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">StayBuki</h1>
              {isAdmin && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin Panel
                </p>
              )}
            </div>
          </div>
          {isOwner && (
            <PGSwitcher variant="sidebar" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sideNavItems.map(({ icon: Icon, label, path }) => {
            const isActive = location === path || (path !== "/dashboard" && location.startsWith(path));
            
            return (
              <div
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-primary-foreground rounded-full" />}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-3 bg-secondary rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Plan</p>
            <p className="font-bold text-sm text-foreground">Pro Plan</p>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            data-testid="button-mobile-logout"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </aside>

      {/* Backdrop for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 lg:hidden z-30 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        {/* Header */}
        {title && (
          <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 h-16 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
                data-testid="button-toggle-sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && <NotificationBell />}
              {action}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-scroll w-full">
          <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile only */}
        {showNav && (
          <nav className="bg-card border-t border-border shrink-0 lg:hidden">
            <div className="flex items-center justify-between h-16 px-2 overflow-x-auto">
              {bottomNavItems.map(({ icon: Icon, label, path }) => {
                const isActive = location === path || (path !== "/dashboard" && location.startsWith(path));
                
                return (
                  <div
                    key={path}
                    onClick={() => navigate(path)}
                    className={cn(
                      "flex flex-col items-center justify-center flex-1 h-16 space-y-1 transition-colors duration-200 cursor-pointer",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="relative pointer-events-none"
                    >
                      <Icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
                    <span className="text-[10px] font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You'll need to login again to access your account.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
