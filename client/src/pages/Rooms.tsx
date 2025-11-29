import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, Plus, Wifi, Droplet, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  tenantId: number | null;
  status: string;
  amenities: string[];
}

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms");
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      setRooms(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DesktopLayout title="Room Management" showNav={false}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </DesktopLayout>
    );
  }

  if (error) {
    return (
      <DesktopLayout title="Room Management" showNav={false}>
        <div className="text-center text-destructive">{error}</div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout 
      title="Room Management" 
      action={
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      }
      showNav={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No rooms found. Create your first room.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow" data-testid={`card-room-${room.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <DoorOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{room.roomNumber}</CardTitle>
                      <p className="text-xs text-muted-foreground">{`₹${room.monthlyRent}`}/month</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`} data-testid={`status-room-${room.id}`}>
                    {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {room.tenantId && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Current Tenant</p>
                    <p className="font-semibold text-foreground" data-testid={`text-tenant-${room.id}`}>Tenant ID: {room.tenantId}</p>
                  </div>
                )}
                
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex gap-2">
                    {room.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-1 px-2 py-1 bg-secondary rounded text-xs">
                        {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                        {amenity === 'Water' && <Droplet className="w-3 h-3" />}
                        {amenity === 'Power' && <Zap className="w-3 h-3" />}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" className="w-full text-sm" size="sm" data-testid={`button-edit-room-${room.id}`}>
                  Edit Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DesktopLayout>
  );
}
