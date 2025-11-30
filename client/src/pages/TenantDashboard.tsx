import { useEffect, useState } from "react";
import { Link } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  User,
  Wallet,
  Building2,
  Lightbulb,
  AlertCircle,
} from "lucide-react";

export default function TenantDashboard() {
  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const res = await fetch("/api/tenant/dashboard", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTenantData(data);
      }
    } catch (err) {
      console.error("Failed to fetch tenant data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLayout title="Dashboard">Loading...</MobileLayout>;
  }

  const menuItems = [
    {
      label: "Profile",
      icon: User,
      href: "/tenant-profile",
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Room Details",
      icon: Home,
      href: "/tenant-room",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Payments",
      icon: Wallet,
      href: "/tenant-payments",
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "PG Details",
      icon: Building2,
      href: "/tenant-pg",
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Facilities",
      icon: Lightbulb,
      href: "/tenant-facilities",
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <MobileLayout title="Dashboard">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-none shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-1">Welcome, {tenantData?.name}!</h2>
          <p className="opacity-90 text-sm">Room {tenantData?.roomNumber}</p>
        </CardContent>
      </Card>

      {/* Quick Menu */}
      <div className="grid grid-cols-2 gap-3">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className="block"
              data-testid={`link-dashboard-${item.label.toLowerCase().replace(" ", "-")}`}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-center">{item.label}</p>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      {/* Quick Info */}
      {tenantData?.monthlyRent && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Monthly Rent
            </h3>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              ₹{tenantData?.monthlyRent}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Due: Next month
            </p>
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}
