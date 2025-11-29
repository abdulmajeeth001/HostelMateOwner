import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import SubscriptionPlan from "@/pages/SubscriptionPlan";
import TenantsList from "@/pages/TenantsList";
import AddTenant from "@/pages/AddTenant";
import Payments from "@/pages/Payments";
import Notifications from "@/pages/Notifications";
import Rooms from "@/pages/Rooms";
import Complaints from "@/pages/Complaints";
import Maintenance from "@/pages/Maintenance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/subscription" component={SubscriptionPlan} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tenants" component={TenantsList} />
      <Route path="/tenants/add" component={AddTenant} />
      <Route path="/payments" component={Payments} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/complaints" component={Complaints} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
