import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

export default function AddRoom() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    roomNumber: "",
    monthlyRent: "",
    sharing: "1",
    floor: "1",
    hasAttachedBathroom: false,
    hasAC: false,
    amenities: [] as string[],
  });

  const amenitiesOptions = ["WiFi", "Water", "Power"];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roomNumber || !formData.monthlyRent) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          monthlyRent: formData.monthlyRent,
          sharing: parseInt(formData.sharing),
          floor: parseInt(formData.floor),
          hasAttachedBathroom: formData.hasAttachedBathroom,
          hasAC: formData.hasAC,
          amenities: formData.amenities,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add room");
      }

      setLocation("/rooms");
    } catch (err) {
      setError((err as any).message);
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout title="Add Room" showNav={false}>
      <div className="max-w-md mx-auto p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/rooms")}
          className="mb-4"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm mb-4" data-testid="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Number */}
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number *</Label>
            <Input
              id="roomNumber"
              placeholder="e.g., 101"
              value={formData.roomNumber}
              onChange={(e) => handleInputChange("roomNumber", e.target.value)}
              required
              data-testid="input-room-number"
            />
          </div>

          {/* Monthly Rent */}
          <div className="space-y-2">
            <Label htmlFor="monthlyRent">Monthly Rent (₹) *</Label>
            <Input
              id="monthlyRent"
              type="number"
              placeholder="e.g., 5000"
              value={formData.monthlyRent}
              onChange={(e) => handleInputChange("monthlyRent", e.target.value)}
              required
              data-testid="input-monthly-rent"
            />
          </div>

          {/* Sharing */}
          <div className="space-y-2">
            <Label htmlFor="sharing">Number of Sharing *</Label>
            <select
              id="sharing"
              value={formData.sharing}
              onChange={(e) => handleInputChange("sharing", e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              data-testid="select-sharing"
            >
              <option value="1">1-Sharing (Single)</option>
              <option value="2">2-Sharing</option>
              <option value="3">3-Sharing</option>
            </select>
          </div>

          {/* Floor */}
          <div className="space-y-2">
            <Label htmlFor="floor">Floor Number *</Label>
            <Input
              id="floor"
              type="number"
              placeholder="e.g., 1"
              value={formData.floor}
              onChange={(e) => handleInputChange("floor", e.target.value)}
              required
              data-testid="input-floor"
            />
          </div>

          {/* Bathroom Type */}
          <div className="space-y-3">
            <Label>Bathroom Type</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasAttachedBathroom}
                  onChange={(e) => handleInputChange("hasAttachedBathroom", e.target.checked)}
                  className="w-4 h-4"
                  data-testid="checkbox-attached-bathroom"
                />
                <span>Attached Bathroom</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!formData.hasAttachedBathroom}
                  onChange={(e) => handleInputChange("hasAttachedBathroom", !e.target.checked)}
                  className="w-4 h-4"
                  data-testid="checkbox-common-bathroom"
                />
                <span>Common Bathroom</span>
              </label>
            </div>
          </div>

          {/* AC */}
          <div className="space-y-3">
            <Label>AC</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasAC}
                onChange={(e) => handleInputChange("hasAC", e.target.checked)}
                className="w-4 h-4"
                data-testid="checkbox-ac"
              />
              <span>Room has AC</span>
            </label>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <Label>Amenities</Label>
            <div className="space-y-2">
              {amenitiesOptions.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="w-4 h-4"
                    data-testid={`checkbox-amenity-${amenity.toLowerCase()}`}
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-add-room-submit">
            {isLoading ? "Adding..." : "Add Room"}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
