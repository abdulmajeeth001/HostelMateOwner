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
import pako from "pako";

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  status: string;
}

const RELATIONSHIPS = [
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Brother", value: "Brother" },
  { label: "Sister", value: "Sister" },
  { label: "Spouse", value: "Spouse" },
  { label: "Son", value: "Son" },
  { label: "Daughter", value: "Daughter" },
  { label: "Grandfather", value: "Grandfather" },
  { label: "Grandmother", value: "Grandmother" },
  { label: "Uncle", value: "Uncle" },
  { label: "Aunt", value: "Aunt" },
  { label: "Cousin", value: "Cousin" },
  { label: "Friend", value: "Friend" },
  { label: "Other", value: "Other" },
];

export default function AddTenant() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roomNumber: "",
    monthlyRent: "",
    tenantImage: "",
    aadharCard: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    relationship: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aadharPreview, setAadharPreview] = useState<string | null>(null);

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

  const compressImage = (base64: string, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        }
      };
      img.src = base64;
    });
  };

  const compressDocument = (base64: string): string => {
    try {
      // Extract the actual data part (after "data:...;base64,")
      const dataPart = base64.split(",")[1];
      if (!dataPart) return base64;
      
      // Convert base64 to binary
      const binaryString = atob(dataPart);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Compress using pako
      const compressed = pako.deflate(bytes);
      
      // Convert compressed data to base64
      const compressedBinary = String.fromCharCode.apply(null, Array.from(compressed));
      const compressedBase64 = btoa(compressedBinary);
      
      // Return with metadata
      return `data:application/gzip;base64,${compressedBase64}`;
    } catch (error) {
      console.error("Compression failed:", error);
      return base64;
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const compressed = await compressImage(base64, 0.7);
        setFormData({...formData, tenantImage: compressed});
        setPhotoPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadharUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const compressed = compressDocument(base64);
        setFormData({...formData, aadharCard: compressed});
        setAadharPreview(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenantImage) {
      alert("Please upload tenant photo");
      return;
    }
    if (!formData.aadharCard) {
      alert("Please upload Aadhar card");
      return;
    }
    if (!formData.emergencyContactName || !formData.emergencyContactPhone || !formData.relationship) {
      alert("Please fill in emergency contact information");
      return;
    }
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
          <label className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
            ) : (
              <>
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Upload Photo</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden"
              data-testid="input-upload-photo"
            />
          </label>
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
              data-testid="input-add-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="tenant@example.com" 
              required 
              className="bg-card"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              data-testid="input-add-email"
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
                data-testid="input-add-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room No.</Label>
              <Select value={formData.roomNumber} onValueChange={(val) => setFormData({...formData, roomNumber: val})}>
                <SelectTrigger className="bg-card" data-testid="select-add-room">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.roomNumber}>
                      {room.roomNumber}
                    </SelectItem>
                  ))}
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
                data-testid="input-add-rent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aadhar">ID Proof (Aadhar/PAN)</Label>
            <label htmlFor="aadhar" className="block">
              <Card className="bg-card border-dashed cursor-pointer hover:bg-secondary/50 transition-colors">
                <CardContent className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                  {aadharPreview ? (
                    <span className="text-foreground font-medium">{aadharPreview}</span>
                  ) : (
                    "Click to upload document"
                  )}
                </CardContent>
              </Card>
              <input 
                id="aadhar"
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleAadharUpload} 
                className="hidden"
                data-testid="input-upload-aadhar"
              />
            </label>
          </div>

          {/* Emergency Contact Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-orange-900">Emergency Contact Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="emergency-name">Contact Person Name</Label>
              <Input 
                id="emergency-name" 
                placeholder="e.g. John Doe" 
                required 
                className="bg-white"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                data-testid="input-add-emergency-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-phone">Contact Phone</Label>
              <Input 
                id="emergency-phone" 
                type="tel" 
                placeholder="+91" 
                required 
                className="bg-white"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                data-testid="input-add-emergency-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={formData.relationship} onValueChange={(val) => setFormData({...formData, relationship: val})}>
                <SelectTrigger className="bg-white" data-testid="select-add-relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full h-12 text-base" disabled={createTenantMutation.isPending} data-testid="button-add-tenant">
            {createTenantMutation.isPending ? "Adding..." : "Add Tenant"}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}
