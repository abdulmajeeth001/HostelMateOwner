import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ChevronLeft, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  status: string;
}

export default function AddTenant() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    roomNumber: "",
    monthlyRent: "",
  });

  // Fetch active rooms
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["active-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/active-rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });

  // Set monthlyRent when room is selected
  useEffect(() => {
    if (formData.roomNumber) {
      const selectedRoom = rooms.find(r => r.roomNumber === formData.roomNumber);
      if (selectedRoom) {
        setFormData(prev => ({ ...prev, monthlyRent: selectedRoom.monthlyRent }));
      }
    }
  }, [formData.roomNumber, rooms]);

  const createTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to create tenant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setLocation("/tenants");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(formData);
  };

  return (
    <MobileLayout 
      title="Add Tenant"
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
            <Upload className="w-6 h-6 mb-1" />
            <span className="text-[10px]">Upload Photo</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Rahul Kumar" 
              required 
              className="bg-card"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+91" 
                required 
                className="bg-card"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room No.</Label>
              <Select value={formData.roomNumber} onValueChange={(val) => setFormData({...formData, roomNumber: val})}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.length > 0 ? (
                    rooms.map((room) => (
                      <SelectItem key={room.id} value={room.roomNumber}>
                        {room.roomNumber}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>No rooms available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rent">Monthly Rent</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
              <Input 
                id="rent" 
                type="number" 
                className="pl-7 bg-card" 
                placeholder="5000"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ID Proof (Aadhar/PAN)</Label>
            <Card className="bg-card border-dashed">
              <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm cursor-pointer hover:bg-secondary/50">
                Click to upload document
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-12 text-base" disabled={createTenantMutation.isPending}>
            {createTenantMutation.isPending ? "Adding..." : "Add Tenant"}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}
