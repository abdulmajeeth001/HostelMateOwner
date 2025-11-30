import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Home,
  Users,
  AirVent,
  Droplets,
  Wind,
  DoorOpen,
} from "lucide-react";

export default function TenantRoomDetails() {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoomDetails();
  }, []);

  const fetchRoomDetails = async () => {
    try {
      const res = await fetch("/api/tenant/room", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
      }
    } catch (err) {
      console.error("Failed to fetch room details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLayout title="Room Details">Loading...</MobileLayout>;
  }

  if (!room) {
    return (
      <MobileLayout title="Room Details">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No room assigned yet.
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  const features = [
    {
      label: "Sharing",
      value: `${room.sharing} people`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: "Floor",
      value: `Floor ${room.floor}`,
      icon: DoorOpen,
      color: "text-green-600",
    },
    {
      label: "AC",
      value: room.hasAC ? "Yes" : "No",
      icon: AirVent,
      color: "text-cyan-600",
    },
    {
      label: "Bathroom",
      value: room.hasAttachedBathroom ? "Attached" : "Common",
      icon: Droplets,
      color: "text-purple-600",
    },
  ];

  return (
    <MobileLayout title="Room Details">
      {/* Room Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Home className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">Room {room.roomNumber}</h2>
              <p className="text-sm text-muted-foreground">
                Monthly Rent: ₹{room.monthlyRent}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => (
          <Card key={feature.label}>
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
                <p className="text-xs text-muted-foreground">{feature.label}</p>
                <p
                  className="font-semibold text-sm"
                  data-testid={`text-room-${feature.label.toLowerCase()}`}
                >
                  {feature.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Amenities */}
      {room.amenities && room.amenities.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Amenities</h3>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {room.amenities.map((amenity: string) => (
                <span
                  key={amenity}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  data-testid={`tag-amenity-${amenity.toLowerCase()}`}
                >
                  {amenity}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}
