import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Upload, X as XIcon, Loader2 } from "lucide-react";

interface OnboardingRequestModalProps {
  open: boolean;
  onClose: () => void;
  visitRequestId?: number;
  pgId?: number;
  roomId?: number;
}

const RELATIONSHIP_OPTIONS = [
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Sibling", label: "Sibling" },
  { value: "Spouse", label: "Spouse" },
  { value: "Friend", label: "Friend" },
  { value: "Other", label: "Other" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function OnboardingRequestModal({
  open,
  onClose,
  visitRequestId,
  pgId,
  roomId,
}: OnboardingRequestModalProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [monthlyRent, setMonthlyRent] = useState<number | null>(null);
  const [tenantImage, setTenantImage] = useState<string | null>(null);
  const [aadharCard, setAadharCard] = useState<string | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState("");

  // Preview states
  const [tenantImagePreview, setTenantImagePreview] = useState<string | null>(null);
  const [aadharCardPreview, setAadharCardPreview] = useState<string | null>(null);

  // Fetch room details to get monthly rent
  const { data: roomData } = useQuery({
    queryKey: ["/api/tenant/rooms", roomId],
    queryFn: async () => {
      if (!roomId) return null;
      const res = await fetch(`/api/tenant/rooms/${roomId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch room details");
      return res.json();
    },
    enabled: !!roomId && open,
  });

  // Pre-fill user data when modal opens
  useEffect(() => {
    if (open && user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.mobile || "");
    }
  }, [open, user]);

  // Set monthly rent from room data
  useEffect(() => {
    if (roomData && roomData.monthlyRent) {
      setMonthlyRent(parseFloat(roomData.monthlyRent));
    }
  }, [roomData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setMonthlyRent(null);
      setTenantImage(null);
      setAadharCard(null);
      setEmergencyContactName("");
      setEmergencyContactPhone("");
      setEmergencyContactRelationship("");
      setTenantImagePreview(null);
      setAadharCardPreview(null);
    }
  }, [open]);

  // Create onboarding request mutation
  const createOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/tenant/onboarding-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit onboarding request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "Your onboarding request has been submitted successfully! The owner will review it shortly.",
      });
      onClose();
      // Redirect to tenant dashboard after a short delay
      setTimeout(() => {
        navigate("/tenant-dashboard");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (
    file: File,
    setBase64: (value: string) => void,
    setPreview: (value: string) => void
  ) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setBase64(base64String);
      setPreview(base64String);
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!name || !email || !phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Email, Phone)",
        variant: "destructive",
      });
      return;
    }

    if (!pgId || !roomId || !monthlyRent) {
      toast({
        title: "Missing Information",
        description: "Room information is required",
        variant: "destructive",
      });
      return;
    }

    if (!emergencyContactName || !emergencyContactPhone || !emergencyContactRelationship) {
      toast({
        title: "Missing Information",
        description: "Please provide emergency contact details",
        variant: "destructive",
      });
      return;
    }

    // Submit the form
    createOnboardingMutation.mutate({
      visitRequestId: visitRequestId || undefined,
      pgId,
      roomId,
      name,
      email,
      phone,
      monthlyRent,
      tenantImage: tenantImage || undefined,
      aadharCard: aadharCard || undefined,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-onboarding">
        <DialogHeader>
          <DialogTitle>Request Onboarding</DialogTitle>
          <DialogDescription>
            Fill in your details to request onboarding to this PG. The owner will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Personal Information</h3>
            
            <div>
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                data-testid="input-name"
              />
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                data-testid="input-phone"
              />
            </div>

            <div>
              <Label htmlFor="monthly-rent">Monthly Rent</Label>
              <Input
                id="monthly-rent"
                type="number"
                value={monthlyRent || ""}
                disabled
                readOnly
                placeholder="Loading..."
                data-testid="input-rent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This value is set by the room configuration
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Documents</h3>
            
            {/* Tenant Photo */}
            <div>
              <Label htmlFor="tenant-photo">Your Photo</Label>
              <div className="mt-2">
                {tenantImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={tenantImagePreview}
                      alt="Tenant"
                      className="w-32 h-32 object-cover rounded border"
                      data-testid="img-tenant-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => {
                        setTenantImage(null);
                        setTenantImagePreview(null);
                      }}
                      data-testid="button-remove-tenant-photo"
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="tenant-photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, setTenantImage, setTenantImagePreview);
                        }
                      }}
                      className="hidden"
                      data-testid="input-tenant-photo"
                    />
                    <Label
                      htmlFor="tenant-photo"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-secondary transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload Photo (Max 5MB)</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* Aadhar/ID Card */}
            <div>
              <Label htmlFor="aadhar-card">Aadhar/ID Card</Label>
              <div className="mt-2">
                {aadharCardPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={aadharCardPreview}
                      alt="Aadhar Card"
                      className="w-48 h-32 object-cover rounded border"
                      data-testid="img-aadhar-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => {
                        setAadharCard(null);
                        setAadharCardPreview(null);
                      }}
                      data-testid="button-remove-aadhar"
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      id="aadhar-card"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, setAadharCard, setAadharCardPreview);
                        }
                      }}
                      className="hidden"
                      data-testid="input-aadhar-card"
                    />
                    <Label
                      htmlFor="aadhar-card"
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded cursor-pointer hover:bg-secondary transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      <span>Upload ID (Max 5MB)</span>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Emergency Contact</h3>
            
            <div>
              <Label htmlFor="emergency-name">
                Contact Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergency-name"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Emergency contact name"
                data-testid="input-emergency-name"
              />
            </div>

            <div>
              <Label htmlFor="emergency-phone">
                Contact Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergency-phone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Emergency contact phone"
                data-testid="input-emergency-phone"
              />
            </div>

            <div>
              <Label htmlFor="emergency-relationship">
                Relationship <span className="text-destructive">*</span>
              </Label>
              <Select
                value={emergencyContactRelationship}
                onValueChange={setEmergencyContactRelationship}
              >
                <SelectTrigger id="emergency-relationship" data-testid="select-relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      data-testid={`relationship-${option.value.toLowerCase()}`}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={createOnboardingMutation.isPending}
              className="flex-1"
              data-testid="button-submit"
            >
              {createOnboardingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={createOnboardingMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
