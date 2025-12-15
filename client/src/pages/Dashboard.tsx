import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, Wallet, AlertCircle, TrendingUp, UserPlus, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  return (
    <>
      <div className="hidden lg:block">
        <DashboardDesktop />
      </div>
      <div className="lg:hidden">
        <DashboardMobile />
      </div>
    </>
  );
}

function DashboardDesktop() {
  const [, navigate] = useLocation();
  
  const stats = [
    { 
      label: "Total Tenants", 
      value: "42", 
      icon: Users, 
      gradient: "from-blue-500 to-cyan-600", 
      trend: "+12%",
      trendUp: true,
      description: "Active tenants"
    },
    { 
      label: "Revenue (Nov)", 
      value: "₹84,500", 
      icon: Wallet, 
      gradient: "from-emerald-500 to-green-600", 
      trend: "+8%",
      trendUp: true,
      description: "This month"
    },
    { 
      label: "Pending Dues", 
      value: "₹12,000", 
      icon: AlertCircle, 
      gradient: "from-orange-500 to-red-600", 
      trend: "-3%",
      trendUp: false,
      description: "Overdue payments"
    },
    { 
      label: "Occupancy", 
      value: "85%", 
      icon: TrendingUp, 
      gradient: "from-purple-500 to-pink-600", 
      trend: "+5%",
      trendUp: true,
      description: "Room utilization"
    },
  ];

  const quickActions = [
    { label: "Add Tenant", icon: UserPlus, action: () => navigate("/tenants/add"), gradient: "from-blue-500 to-cyan-600" },
    { label: "Add Room", icon: Building2, action: () => navigate("/rooms/add"), gradient: "from-purple-500 to-pink-600" },
    { label: "View Reports", icon: TrendingUp, action: () => navigate("/reports"), gradient: "from-emerald-500 to-green-600" },
    { label: "Manage PG", icon: Building2, action: () => navigate("/pg-management"), gradient: "from-orange-500 to-red-600" },
  ];

  return (
    <DesktopLayout title="Dashboard" showNav={false}>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm mb-2">Welcome back,</p>
              <h2 className="text-4xl font-bold tracking-tight">Owner Dashboard</h2>
            </div>
            <div className="flex gap-3">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  onClick={action.action}
                  className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                  size="sm"
                  data-testid={`button-quick-${action.label.toLowerCase().replace(" ", "-")}`}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  stat.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold mb-1 bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity with Enhanced Design */}
      <Card className="border-2 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Activity</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[
              { title: "Payment Received", desc: "Rahul Kumar paid ₹5,000", icon: Wallet, gradient: "from-emerald-500 to-green-600", time: "2 hours ago" },
              { title: "New Tenant", desc: "Amit Singh joined Room 102", icon: UserPlus, gradient: "from-blue-500 to-cyan-600", time: "5 hours ago" },
              { title: "Complaint Logged", desc: "Room 204: Fan not working", icon: AlertCircle, gradient: "from-orange-500 to-red-600", time: "1 day ago" },
            ].map((activity, i) => (
              <div key={i} className="group flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 rounded-xl border-2 border-transparent hover:border-purple-200 transition-all duration-300 cursor-pointer" data-testid={`activity-${i}`}>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${activity.gradient}`
                )}>
                  <activity.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-800 mb-0.5">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground">{activity.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DesktopLayout>
  );
}

function DashboardMobile() {
  const [, navigate] = useLocation();
  
  const stats = [
    { 
      label: "Total Tenants", 
      value: "42", 
      icon: Users, 
      gradient: "from-blue-500 to-cyan-600", 
      trend: "+12%",
      trendUp: true 
    },
    { 
      label: "Revenue", 
      value: "₹84,500", 
      icon: Wallet, 
      gradient: "from-emerald-500 to-green-600", 
      trend: "+8%",
      trendUp: true 
    },
    { 
      label: "Pending Dues", 
      value: "₹12,000", 
      icon: AlertCircle, 
      gradient: "from-orange-500 to-red-600", 
      trend: "-3%",
      trendUp: false 
    },
    { 
      label: "Occupancy", 
      value: "85%", 
      icon: TrendingUp, 
      gradient: "from-purple-500 to-pink-600", 
      trend: "+5%",
      trendUp: true 
    },
  ];

  const recentActivities = [
    { id: 1, title: "Payment Received", desc: "Rahul Kumar paid ₹5,000", time: "2h ago", icon: Wallet, gradient: "from-emerald-500 to-green-600" },
    { id: 2, title: "New Tenant", desc: "Amit Singh joined Room 102", time: "5h ago", icon: UserPlus, gradient: "from-blue-500 to-cyan-600" },
    { id: 3, title: "Complaint Logged", desc: "Room 204: Fan not working", time: "1d ago", icon: AlertCircle, gradient: "from-orange-500 to-red-600" },
  ];

  return (
    <MobileLayout title="Dashboard">
      {/* Hero Section with Gradient */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-6 py-8 text-white">
          <div className="mb-6">
            <p className="text-white/80 text-sm mb-2">Welcome back,</p>
            <h2 className="text-3xl font-bold tracking-tight mb-4">Owner Dashboard</h2>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => navigate("/tenants/add")} 
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white h-11"
              data-testid="button-add-tenant"
            >
              <UserPlus className="mr-2 w-4 h-4" /> Add Tenant
            </Button>
            <Button 
              onClick={() => navigate("/rooms/add")}
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white h-11"
              data-testid="button-add-room"
            >
              <Building2 className="mr-2 w-4 h-4" /> Add Room
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Design */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold",
                  stat.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity with Enhanced Design */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-700">View All</Button>
        </div>
        
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="group flex items-start gap-3 p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 rounded-xl border-2 border-transparent hover:border-purple-200 shadow-sm hover:shadow-lg transition-all duration-300" data-testid={`activity-${activity.id}`}>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                `bg-gradient-to-br ${activity.gradient}`
              )}>
                <activity.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate text-gray-800">{activity.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{activity.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
