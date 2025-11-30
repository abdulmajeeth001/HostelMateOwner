import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Upload, FileText } from "lucide-react";
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

export default function EditTenant() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/tenants/edit/:id");
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
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [aadharPreview, setAadharPreview] = useState<string>("");

  const tenantId = params?.id ? parseInt(params.id) : null;

  // Fetch tenant data
  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch tenant");
      return res.json();
    },
    enabled: !!tenantId,
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

  // Populate form when tenant data loads
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        roomNumber: String(tenant.roomNumber || ""),
        monthlyRent: String(tenant.monthlyRent || ""),
        tenantImage: tenant.tenantImage || "",
        aadharCard: tenant.aadharCard || "",
        emergencyContactName: tenant.emergencyContactName || "",
        emergencyContactPhone: tenant.emergencyContactPhone || "",
        relationship: tenant.relationship || "",
      });
      if (tenant.tenantImage) {
        setPhotoPreview(tenant.tenantImage);
      }
      if (tenant.aadharCard) {
        setAadharPreview("Document uploaded");
      }
    }
  }, [tenant]);

  // Update monthlyRent when room is changed
  useEffect(() => {
    if (formData.roomNumber) {
      const selectedRoom = rooms.find(r => r.roomNumber === formData.roomNumber);
      if (selectedRoom) {
        setFormData(prev => ({ ...prev, monthlyRent: selectedRoom.monthlyRent }));
      }
    }
  }, [formData.roomNumber, rooms]);

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
      const dataPart = base64.split(",")[1];
      if (!dataPart) return base64;
      
      const binaryString = atob(dataPart);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const compressed = pako.deflate(bytes);
      const compressedBinary = String.fromCharCode.apply(null, Array.from(compressed));
      const compressedBase64 = btoa(compressedBinary);
      
      return `data:application/gzip;base64,${compressedBase64}`;
    } catch (error) {
      console.error("Compression failed:", error);
      return base64;
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const updateTenantMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to update tenant");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] });
      setLocation("/tenants");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <MobileLayout title="Edit Tenant">
        <div className="text-center py-8">Loading...</div>
      </MobileLayout>
    );
  }

  if (!tenant) {
    return (
      <MobileLayout title="Edit Tenant">
        <div className="text-center py-8">Tenant not found</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Edit Tenant"
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div className="flex justify-center">
          {photoPreview ? (
            <label className="cursor-pointer">
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover" data-testid="img-edit-tenant-preview" />
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" data-testid="input-edit-photo" />
            </label>
          ) : (
            <label className="cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-secondary/80 transition-colors">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Upload Photo</span>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" data-testid="input-edit-photo" />
            </label>
          )}
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
              data-testid="input-edit-name"
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
              data-testid="input-edit-email"
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
                data-testid="input-edit-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Room No.</Label>
              <Select value={formData.roomNumber || ""} onValueChange={(val) => setFormData({...formData, roomNumber: val})}>
                <SelectTrigger className="bg-card" data-testid="select-edit-room">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={String(room.roomNumber)}>
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
                data-testid="input-edit-rent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ID Proof (Aadhar/PAN)</Label>
            <label className="cursor-pointer">
              <Card className="bg-card border-dashed hover:bg-secondary/30 transition-colors">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        {aadharPreview ? aadharPreview : "Click to upload document"}
                      </p>
                      {aadharPreview && <p className="text-xs text-muted-foreground/70">Click to replace</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleAadharUpload} className="hidden" data-testid="input-edit-aadhar" />
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
                data-testid="input-edit-emergency-name"
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
                data-testid="input-edit-emergency-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={formData.relationship} onValueChange={(val) => setFormData({...formData, relationship: val})}>
                <SelectTrigger className="bg-white" data-testid="select-edit-relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
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
          <Button type="submit" className="w-full h-12 text-base" disabled={updateTenantMutation.isPending} data-testid="button-save-tenant">
            {updateTenantMutation.isPending ? "Updating..." : "Update Tenant"}
          </Button>
        </div>
      </form>
    </MobileLayout>
  );
}
