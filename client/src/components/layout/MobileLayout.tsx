import { Link, useLocation } from "wouter";
import { Home, Users, CreditCard, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Tenants", path: "/tenants" },
    { icon: CreditCard, label: "Payments", path: "/payments" },
    { icon: Bell, label: "Alerts", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="h-screen bg-background max-w-md mx-auto border-x border-border shadow-2xl relative flex flex-col overflow-hidden">
      {/* Header */}
      {title && (
        <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50 px-4 h-16 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
          {action}
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ paddingBottom: showNav ? '100px' : '24px' }}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="bg-card border-t border-border fixed bottom-0 w-full max-w-md z-50 pb-safe-area-inset-bottom shrink-0">
          <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isActive = location === path || (path !== "/dashboard" && location.startsWith(path));
              
              return (
                <Link 
                  key={path} 
                  href={path}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors duration-200 cursor-pointer no-underline",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative pointer-events-none"
                  >
                    <Icon className={cn("w-6 h-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                    {path === "/notifications" && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
                    )}
                  </motion.div>
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
