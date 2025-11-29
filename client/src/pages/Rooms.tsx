import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, Plus, Wifi, Droplet, Zap } from "lucide-react";
import { Link } from "wouter";

const ROOMS = [
  { id: 101, tenant: "Rahul Kumar", rent: "₹5,000", status: "occupied", amenities: ["WiFi", "Water", "Power"] },
  { id: 102, tenant: "Amit Singh", rent: "₹6,500", status: "occupied", amenities: ["WiFi", "Water", "Power"] },
  { id: 201, tenant: "Priya Sharma", rent: "₹7,000", status: "occupied", amenities: ["WiFi", "Water", "Power"] },
  { id: 202, tenant: null, rent: "₹5,500", status: "vacant", amenities: ["WiFi", "Water", "Power"] },
  { id: 301, tenant: "Sneha Gupta", rent: "₹8,000", status: "occupied", amenities: ["WiFi", "Water", "Power"] },
  { id: 302, tenant: null, rent: "₹8,000", status: "vacant", amenities: ["WiFi", "Water", "Power"] },
];

export default function Rooms() {
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
        {ROOMS.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <DoorOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Room {room.id}</CardTitle>
                    <p className="text-xs text-muted-foreground">{room.rent}/month</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  room.status === 'occupied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {room.status === 'occupied' ? 'Occupied' : 'Vacant'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.tenant && (
                <div className="pb-4 border-b border-border">
                  <p className="text-xs text-muted-foreground mb-1">Current Tenant</p>
                  <p className="font-semibold text-foreground">{room.tenant}</p>
                </div>
              )}
              
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

              <Button variant="outline" className="w-full text-sm" size="sm">
                Edit Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DesktopLayout>
  );
}
