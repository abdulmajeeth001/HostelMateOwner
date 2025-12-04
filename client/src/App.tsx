import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import SubscriptionPlan from "@/pages/SubscriptionPlan";
import TenantsList from "@/pages/TenantsList";
import AddTenant from "@/pages/AddTenant";
import EditTenant from "@/pages/EditTenant";
import ViewTenant from "@/pages/ViewTenant";
import Payments from "@/pages/Payments";
import Notifications from "@/pages/Notifications";
import Rooms from "@/pages/Rooms";
import AddRoom from "@/pages/AddRoom";
import EditRoom from "@/pages/EditRoom";
import Complaints from "@/pages/Complaints";
import Maintenance from "@/pages/Maintenance";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import TenantResetPassword from "@/pages/TenantResetPassword";
import TenantDashboard from "@/pages/TenantDashboard";
import TenantProfile from "@/pages/TenantProfile";
import TenantRoomDetails from "@/pages/TenantRoomDetails";
import TenantPayments from "@/pages/TenantPayments";
import TenantComplaints from "@/pages/TenantComplaints";
import TenantPgDetails from "@/pages/TenantPgDetails";
import TenantPgFacilities from "@/pages/TenantPgFacilities";
import ForgotPassword from "@/pages/ForgotPassword";
import PGManagement from "@/pages/PGManagement";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/subscription" component={SubscriptionPlan} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/tenants" component={TenantsList} />
      <Route path="/tenants/add" component={AddTenant} />
      <Route path="/tenants/view/:id" component={ViewTenant} />
      <Route path="/tenants/edit/:id" component={EditTenant} />
      <Route path="/payments" component={Payments} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/rooms" component={Rooms} />
      <Route path="/rooms/add" component={AddRoom} />
      <Route path="/rooms/edit/:id" component={EditRoom} />
      <Route path="/complaints" component={Complaints} />
      <Route path="/maintenance" component={Maintenance} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/pg-management" component={PGManagement} />
      <Route path="/tenant-reset-password" component={TenantResetPassword} />
      <Route path="/tenant-dashboard" component={TenantDashboard} />
      <Route path="/tenant-profile" component={TenantProfile} />
      <Route path="/tenant-room" component={TenantRoomDetails} />
      <Route path="/tenant-payments" component={TenantPayments} />
      <Route path="/tenant-complaints" component={TenantComplaints} />
      <Route path="/tenant-pg" component={TenantPgDetails} />
      <Route path="/tenant-facilities" component={TenantPgFacilities} />
      <Route path="/forgot-password" component={ForgotPassword} />
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
