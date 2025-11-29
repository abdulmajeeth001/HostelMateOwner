import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { ChevronLeft, Wind, Bath, Users, MapPin, Trash2, X } from "lucide-react";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

export default function EditRoom() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  
  const [formData, setFormData] = useState({
    roomNumber: "",
    monthlyRent: "",
    sharing: "1",
    floor: "1",
    hasAttachedBathroom: false,
    hasAC: false,
    tenantId: null as number | null,
    amenities: [] as string[],
  });

  const amenitiesOptions = ["WiFi", "Water", "Power"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomRes, tenantsRes] = await Promise.all([
          fetch(`/api/rooms/${id}`),
          fetch("/api/available-tenants")
        ]);

        if (roomRes.ok) {
          const data = await roomRes.json();
          setFormData({
            roomNumber: data.roomNumber,
            monthlyRent: data.monthlyRent,
            sharing: data.sharing?.toString() || "1",
            floor: data.floor?.toString() || "1",
            hasAttachedBathroom: data.hasAttachedBathroom || false,
            hasAC: data.hasAC || false,
            tenantId: data.tenantId || null,
            amenities: data.amenities || [],
          });

          // If room has a tenant, fetch their details
          if (data.tenantId) {
            const tenantRes = await fetch(`/api/tenants/${data.tenantId}`);
            if (tenantRes.ok) {
              const tenantData = await tenantRes.json();
              setCurrentTenant(tenantData);
            }
          }
        }

        if (tenantsRes.ok) {
          const data = await tenantsRes.json();
          setTenants(data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleTenantChange = (tenantId: number | null) => {
    handleInputChange("tenantId", tenantId);
    if (tenantId) {
      const tenant = tenants.find(t => t.id === tenantId);
      setCurrentTenant(tenant || null);
    } else {
      setCurrentTenant(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomNumber || !formData.monthlyRent) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          monthlyRent: formData.monthlyRent,
          sharing: parseInt(formData.sharing),
          floor: parseInt(formData.floor),
          hasAttachedBathroom: formData.hasAttachedBathroom,
          hasAC: formData.hasAC,
          tenantId: formData.tenantId,
          amenities: formData.amenities,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update room");
      }

      setLocation("/rooms");
    } catch (err) {
      setError((err as any).message);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete room");
      }

      setLocation("/rooms");
    } catch (err) {
      setError((err as any).message);
      setIsDeleting(false);
    }
  };

  if (isFetching) {
    return (
      <MobileLayout title="Edit Room" showNav={false}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading room details...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Edit Room" showNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/rooms")}
              className="h-10 w-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Edit Room</h1>
              <p className="text-sm text-slate-500">Update room details and settings</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200" data-testid="error-message">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-slate-700 font-medium">Room Number *</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                  required
                  data-testid="input-room-number"
                  className="h-11 border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor" className="text-slate-700 font-medium">Floor *</Label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.floor}
                  onChange={(e) => handleInputChange("floor", e.target.value)}
                  required
                  data-testid="input-floor"
                  className="h-11 border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-slate-700 font-medium">Monthly Rent (₹) *</Label>
              <Input
                id="monthlyRent"
                type="number"
                placeholder="e.g., 5000"
                value={formData.monthlyRent}
                onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
                required
                data-testid="input-monthly-rent"
                className="h-11 border-slate-300 rounded-lg text-lg font-semibold"
              />
            </div>
          </div>

          {/* Tenant Assignment Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-900">Tenant Assignment</h2>
            </div>

            {currentTenant && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Current Tenant</p>
                  <p className="font-semibold text-slate-900">{currentTenant.name}</p>
                  <p className="text-sm text-slate-600">{currentTenant.phone}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTenantChange(null)}
                  className="text-red-600 hover:bg-red-50"
                  data-testid="button-remove-tenant"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tenantId" className="text-slate-700 font-medium">
                {currentTenant ? "Change Tenant" : "Assign Tenant"}
              </Label>
              <select
                id="tenantId"
                value={formData.tenantId || ""}
                onChange={(e) => handleTenantChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 h-11"
                data-testid="select-tenant"
              >
                <option value="">No Tenant (Vacant)</option>
                {tenants.length === 0 ? (
                  <option disabled>No available tenants</option>
                ) : (
                  tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.phone})
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-slate-500">Only shows tenants not already assigned to other rooms</p>
            </div>
          </div>

          {/* Room Configuration Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">Room Configuration</h2>
            </div>

            {/* Sharing Type */}
            <div className="space-y-3">
              <Label htmlFor="sharing" className="text-slate-700 font-medium">Number of Sharing *</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "1", label: "Single", icon: "👤" },
                  { value: "2", label: "Double", icon: "👥" },
                  { value: "3", label: "Triple", icon: "👫" }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange("sharing", option.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.sharing === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                    data-testid={`button-sharing-${option.value}`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium text-slate-700">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-4">
              <Bath className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">Facilities</h2>
            </div>

            {/* Bathroom Type */}
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Bathroom Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "attached", label: "Attached Bathroom", icon: "🚿" },
                  { type: "common", label: "Common Bathroom", icon: "🛁" }
                ].map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => handleInputChange("hasAttachedBathroom", option.type === "attached")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      (option.type === "attached" ? formData.hasAttachedBathroom : !formData.hasAttachedBathroom)
                        ? "border-green-500 bg-green-50"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                    data-testid={`button-bathroom-${option.type}`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="text-sm font-medium text-slate-700">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* AC */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-all group hover:bg-blue-50"
                onClick={() => handleInputChange("hasAC", !formData.hasAC)}
              >
                <input
                  type="checkbox"
                  checked={formData.hasAC}
                  className="w-5 h-5 accent-blue-600"
                  data-testid="checkbox-ac"
                  readOnly
                />
                <div className="flex-1">
                  <Wind className="w-5 h-5 text-blue-600 inline mr-2" />
                  <span className="font-medium text-slate-700">Air Conditioning</span>
                </div>
              </label>
            </div>

            {/* Amenities Checklist */}
            <div className="space-y-3 pt-2">
              <Label className="text-slate-700 font-medium">Available Amenities</Label>
              <div className="space-y-2">
                {amenitiesOptions.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:bg-slate-50"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      className="w-4 h-4 accent-purple-600"
                      data-testid={`checkbox-amenity-${amenity.toLowerCase()}`}
                      readOnly
                    />
                    <span className="font-medium text-slate-700 flex-1">{amenity}</span>
                    {formData.amenities.includes(amenity) && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Selected</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <Button 
              type="button"
              variant="outline" 
              className="h-12 rounded-lg"
              onClick={() => setLocation("/rooms")}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading} 
              data-testid="button-edit-room-submit"
            >
              {isLoading ? "Updating Room..." : "Update Room"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="h-12 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
              data-testid="button-delete-room"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </MobileLayout>
  );
}
