import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, Plus, Wifi, Droplet, Zap, Wind, Bath } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface RoomData {
  room: {
    id: number;
    roomNumber: string;
    monthlyRent: string;
    sharing: number;
    floor: number;
    hasAttachedBathroom: boolean;
    hasAC: boolean;
    tenantIds: number[];
    status: string;
    amenities: string[];
  };
  tenants: Tenant[];
}

export default function Rooms() {
  const [, setLocation] = useLocation();
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
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
      setRoomsData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms/seed", { method: "POST" });
      if (!response.ok) throw new Error("Failed to seed rooms");
      await fetchRooms();
    } catch (err) {
      console.error("Error seeding rooms:", err);
      setError("Failed to seed rooms");
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
        <div className="flex gap-2">
          {roomsData.length === 0 && (
            <Button onClick={handleSeedRooms} className="gap-2" data-testid="button-seed-rooms">
              <Plus className="w-4 h-4" /> Seed Demo Rooms
            </Button>
          )}
          {roomsData.length > 0 && (
            <Button onClick={() => setLocation("/rooms/add")} className="gap-2" data-testid="button-add-room">
              <Plus className="w-4 h-4" /> Add Room
            </Button>
          )}
        </div>
      }
      showNav={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomsData.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">No rooms found. Click "Seed Demo Rooms" to create initial rooms.</p>
          </div>
        ) : (
          roomsData.map(({ room, tenants }) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow" data-testid={`card-room-${room.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <DoorOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                      <p className="text-xs text-muted-foreground">{`₹${room.monthlyRent}`}/month • Floor {room.floor}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.status === 'occupied' ? 'bg-green-100 text-green-700' : 
                    room.status === 'partially_occupied' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`} data-testid={`status-room-${room.id}`}>
                    {room.status === 'occupied' ? 'Occupied' : 
                     room.status === 'partially_occupied' ? 'Partial' :
                     'Vacant'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Room Details */}
                <div className="grid grid-cols-2 gap-2 py-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{room.sharing}-Sharing</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {room.hasAC && <div title="AC"><Wind className="w-4 h-4 text-blue-500" /></div>}
                    {room.hasAttachedBathroom ? (
                      <div title="Attached Bathroom"><Bath className="w-4 h-4 text-green-500" /></div>
                    ) : (
                      <div title="Common Bathroom"><Bath className="w-4 h-4 text-gray-400" /></div>
                    )}
                  </div>
                </div>

                {tenants.length > 0 && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-2">Assigned Tenants ({tenants.length}/{room.sharing})</p>
                    <div className="space-y-2">
                      {tenants.map((tenant) => (
                        <div key={tenant.id} className="p-2 bg-green-50 rounded">
                          <p className="font-semibold text-foreground text-sm" data-testid={`text-tenant-${room.id}`}>{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {tenants.length === 0 && (
                  <div className="pb-4 border-b border-border">
                    <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">Vacant - No tenants assigned</p>
                  </div>
                )}
                
                {room.amenities && room.amenities.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
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

                <Button 
                  variant="outline" 
                  className="w-full text-sm" 
                  size="sm" 
                  onClick={() => setLocation(`/rooms/edit/${room.id}`)}
                  data-testid={`button-edit-room-${room.id}`}
                >
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
