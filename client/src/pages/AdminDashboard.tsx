import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Clock, CreditCard, DollarSign, AlertTriangle, Users } from "lucide-react";
import { useLocation } from "wouter";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminStats {
  totalPgs: number;
  pendingApprovals: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalTenants: number;
  totalComplaints: number;
}

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      title: "Total PGs",
      value: stats?.totalPgs || 0,
      icon: Building2,
      description: "Registered properties",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      description: "Awaiting review",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: () => navigate("/admin-pgs?filter=pending"),
    },
    {
      title: "Active Subscriptions",
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      description: "Current subscriptions",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: `₹${stats?.totalRevenue || 0}`,
      icon: DollarSign,
      description: "Lifetime earnings",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Tenants",
      value: stats?.totalTenants || 0,
      icon: Users,
      description: "Platform-wide",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      title: "Total Complaints",
      value: stats?.totalComplaints || 0,
      icon: AlertTriangle,
      description: "All PGs",
      color: "text-red-600",
      bgColor: "bg-red-50",
      action: () => navigate("/admin-complaints"),
    },
  ];

  const content = (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-admin-dashboard-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Platform overview and management
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                className={stat.action ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}
                onClick={stat.action}
                data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground" data-testid={`text-stat-value-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/admin-pgs?filter=pending")}
                  data-testid="button-view-pending-pgs"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  View Pending Approvals ({stats?.pendingApprovals || 0})
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/admin-pgs")}
                  data-testid="button-view-all-pgs"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage All PGs
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/admin-subscriptions")}
                  data-testid="button-manage-subscriptions"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Subscriptions
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/admin-complaints")}
                  data-testid="button-view-complaints"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View Complaints
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Platform health metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <span className="text-sm font-medium text-green-600">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Status</span>
                  <span className="text-sm font-medium text-green-600">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm font-medium text-green-600">Normal</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );

  return isMobile ? (
    <MobileLayout title="Admin Dashboard">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}
