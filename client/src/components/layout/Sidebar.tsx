import { useLocation } from "wouter";
import { Home, Users, CreditCard, Bell, Settings, DoorOpen, Wrench, AlertCircle, BarChart3, LogOut, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { PGSwitcher } from "@/components/PGSwitcher";
import appIcon from "@assets/generated_images/app_icon_for_pg_management.png";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ownerNavItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: DoorOpen, label: "Rooms", path: "/rooms" },
  { icon: Users, label: "Tenants", path: "/tenants" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: AlertCircle, label: "Complaints", path: "/complaints" },
  { icon: Wrench, label: "Maintenance", path: "/maintenance" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Building2, label: "My PGs", path: "/pg-management" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const tenantNavItems = [
  { icon: Home, label: "Dashboard", path: "/tenant-dashboard" },
  { icon: DoorOpen, label: "Room", path: "/tenant-room" },
  { icon: CreditCard, label: "Payments", path: "/tenant-payments" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = user?.userType === "tenant" ? tenantNavItems : ownerNavItems;
  const isOwner = user?.userType === "owner";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
      
      if (res.ok) {
        navigate("/");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div 
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-3 cursor-pointer rounded-lg hover:bg-secondary/50 transition-colors p-2 -m-2 mb-4"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <img src={appIcon} alt="WinkStay" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">WinkStay</h1>
          </div>
        </div>
        {isOwner && (
          <PGSwitcher variant="sidebar" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ icon: Icon, label, path }) => {
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
          data-testid="button-sidebar-logout"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
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
    </aside>
  );
}
