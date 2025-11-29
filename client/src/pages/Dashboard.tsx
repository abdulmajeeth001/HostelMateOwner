import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Wallet, AlertCircle, TrendingUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
  const stats = [
    { label: "Total Tenants", value: "42", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Revenue (Nov)", value: "₹84,500", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Pending Dues", value: "₹12,000", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Occupancy", value: "85%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <DesktopLayout title="Dashboard" showNav={false}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col gap-3">
              <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "Payment Received", desc: "Rahul Kumar paid ₹5,000", icon: Wallet, color: "bg-emerald-100 text-emerald-600" },
              { title: "New Tenant", desc: "Amit Singh joined Room 102", icon: UserPlus, color: "bg-blue-100 text-blue-600" },
              { title: "Complaint Logged", desc: "Room 204: Fan not working", icon: AlertCircle, color: "bg-orange-100 text-orange-600" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.color}`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{activity.title}</h4>
                  <p className="text-xs text-muted-foreground">{activity.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DesktopLayout>
  );
}

function DashboardMobile() {
  const stats = [
    { label: "Total Tenants", value: "42", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Revenue (Nov)", value: "₹84,500", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Pending Dues", value: "₹12,000", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Occupancy", value: "85%", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const recentActivities = [
    { id: 1, title: "Payment Received", desc: "Rahul Kumar paid ₹5,000", time: "2h ago", icon: Wallet, color: "bg-emerald-100 text-emerald-600" },
    { id: 2, title: "New Tenant", desc: "Amit Singh joined Room 102", time: "5h ago", icon: UserPlus, color: "bg-blue-100 text-blue-600" },
    { id: 3, title: "Complaint Logged", desc: "Room 204: Fan not working", time: "1d ago", icon: AlertCircle, color: "bg-orange-100 text-orange-600" },
  ];

  return (
    <MobileLayout 
      title="Dashboard" 
      action={
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Owner&background=random" alt="Owner" className="w-full h-full" />
        </div>
      }
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/tenants/add">
          <Button className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <UserPlus className="mr-2 w-4 h-4" /> Add Tenant
          </Button>
        </Link>
        <Button variant="outline" className="w-full h-12 border-primary/20 text-primary hover:bg-primary/5">
          View Reports
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <h3 className="text-xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent Activity</h2>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View All</Button>
        </div>
        
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border/50 shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.color}`}>
                <activity.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{activity.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{activity.desc}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
