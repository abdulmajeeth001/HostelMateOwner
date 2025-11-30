import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Wifi,
  Droplets,
  Zap,
  Tv,
  Utensils,
  Trash2,
  Lightbulb,
  Sofa,
} from "lucide-react";

export default function TenantPgFacilities() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await fetch("/api/tenant/facilities", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setFacilities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch facilities:", err);
      // Set default facilities if API fails
      setFacilities([
        { name: "WiFi", icon: Wifi, available: true },
        { name: "Water Supply", icon: Droplets, available: true },
        { name: "Electricity", icon: Zap, available: true },
        { name: "Cable TV", icon: Tv, available: false },
        { name: "Kitchen", icon: Utensils, available: true },
        { name: "Waste Management", icon: Trash2, available: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLayout title="Facilities">Loading...</MobileLayout>;
  }

  const defaultFacilities = [
    { name: "WiFi", icon: Wifi, available: true },
    { name: "Water Supply", icon: Droplets, available: true },
    { name: "Electricity", icon: Zap, available: true },
    { name: "Cable TV", icon: Tv, available: false },
    { name: "Kitchen", icon: Utensils, available: true },
    { name: "Waste Management", icon: Trash2, available: true },
    { name: "Common Area", icon: Sofa, available: true },
    { name: "Laundry", icon: Lightbulb, available: false },
  ];

  const facilitiesToDisplay =
    facilities.length > 0 ? facilities : defaultFacilities;

  return (
    <MobileLayout title="Facilities">
      <p className="text-sm text-muted-foreground mb-4">
        Available facilities at your PG
      </p>

      <div className="grid grid-cols-2 gap-3">
        {facilitiesToDisplay.map((facility) => (
          <Card
            key={facility.name}
            className={facility.available ? "" : "opacity-50"}
            data-testid={`card-facility-${facility.name.toLowerCase().replace(" ", "-")}`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                {facility.icon ? (
                  <facility.icon
                    className={`w-8 h-8 ${
                      facility.available
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                ) : null}
                <p className="font-semibold text-sm">{facility.name}</p>
                <p
                  className={`text-xs font-medium ${
                    facility.available
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {facility.available ? "Available" : "Not Available"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
}
