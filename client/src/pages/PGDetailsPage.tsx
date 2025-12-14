import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Star,
  Utensils,
  Car,
  Wind,
  Camera,
  Wifi,
  Shirt,
  Dumbbell,
  Check,
  X as XIcon,
  ArrowLeft,
  Building2,
  Home as HomeIcon,
  Calendar,
  Clock,
  DoorOpen,
  Users,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Room {
  id: number;
  roomNumber: string;
  monthlyRent: string;
  sharing: number;
  floor: number;
  hasAttachedBathroom: boolean;
  hasAC: boolean;
  status: string;
  tenantIds: number[];
}

interface PGDetails {
  id: number;
  pgName: string;
  pgAddress: string;
  pgLocation: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl: string | null;
  pgType: string;
  hasFood: boolean;
  hasParking: boolean;
  hasAC: boolean;
  hasCCTV: boolean;
  hasWifi: boolean;
  hasLaundry: boolean;
  hasGym: boolean;
  averageRating: string;
  totalRatings: number;
  ownerId: number;
  availableRooms: Room[];
}

const AMENITY_ICONS = {
  hasFood: { icon: Utensils, label: "Food" },
  hasParking: { icon: Car, label: "Parking" },
  hasAC: { icon: Wind, label: "AC" },
  hasCCTV: { icon: Camera, label: "CCTV" },
  hasWifi: { icon: Wifi, label: "WiFi" },
  hasLaundry: { icon: Shirt, label: "Laundry" },
  hasGym: { icon: Dumbbell, label: "Gym" },
};

const TIME_SLOTS = [
  { value: "morning", label: "Morning (9:00 AM - 12:00 PM)" },
  { value: "afternoon", label: "Afternoon (12:00 PM - 4:00 PM)" },
  { value: "evening", label: "Evening (4:00 PM - 7:00 PM)" },
];

export default function PGDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  const pgId = parseInt(id || "0");

  // Fetch PG details
  const { data: pg, isLoading, error } = useQuery<PGDetails>({
    queryKey: ["/api/tenant/pgs", pgId],
    queryFn: async () => {
      const res = await fetch(`/api/tenant/pgs/${pgId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error("PG not found");
        throw new Error("Failed to fetch PG details");
      }
      return res.json();
    },
    enabled: !!pgId,
  });

  // Fetch existing visit requests to check for pending ones
  const { data: visitRequests } = useQuery<any[]>({
    queryKey: ["/api/tenant/visit-requests"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/visit-requests", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch visit requests");
      return res.json();
    },
  });

  // Check if there's a pending request for this PG
  const hasPendingRequest = visitRequests?.some(
    (req) =>
      req.pgId === pgId &&
      (req.status === "pending" || req.status === "approved" || req.status === "rescheduled")
  );

  // Create visit request mutation
  const createVisitRequest = useMutation({
    mutationFn: async (data: {
      pgId: number;
      roomId?: number;
      requestedDate: string;
      requestedTime: string;
      notes?: string;
    }) => {
      const res = await fetch("/api/tenant/visit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create visit request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Visit Request Submitted",
        description: "Your visit request has been sent to the PG owner. You'll be notified once it's reviewed.",
      });
      setShowVisitModal(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestVisit = (room?: Room) => {
    if (hasPendingRequest) {
      toast({
        title: "Pending Request Exists",
        description: "You already have a pending visit request for this PG. Please wait for the owner's response.",
        variant: "destructive",
      });
      return;
    }
    setSelectedRoom(room || null);
    setShowVisitModal(true);
  };

  const handleSubmitVisit = () => {
    if (!visitDate || !visitTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your visit.",
        variant: "destructive",
      });
      return;
    }

    createVisitRequest.mutate({
      pgId,
      roomId: selectedRoom?.id,
      requestedDate: visitDate,
      requestedTime: visitTime,
      notes: visitNotes,
    });
  };

  const resetForm = () => {
    setVisitDate("");
    setVisitTime("");
    setVisitNotes("");
    setSelectedRoom(null);
  };

  if (isLoading) {
    return (
      <MobileLayout title="PG Details" showNav={true}>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  if (error || !pg) {
    return (
      <MobileLayout title="PG Details" showNav={true}>
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
              {error?.message || "PG not found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The PG you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate("/tenant-search-pgs")} data-testid="button-back-to-search">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  const rating = parseFloat(pg.averageRating);

  return (
    <MobileLayout
      title="PG Details"
      showNav={true}
      action={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/tenant-search-pgs")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      }
    >
      {/* PG Header Section */}
      <Card data-testid="card-pg-header">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2" data-testid="text-pg-name">
                {pg.pgName}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" />
                <span data-testid="text-pg-address">{pg.pgAddress}</span>
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <HomeIcon className="w-4 h-4" />
                <span data-testid="text-pg-location">{pg.pgLocation}</span>
              </p>
            </div>
            {pg.imageUrl && (
              <img
                src={pg.imageUrl}
                alt={pg.pgName}
                className="w-24 h-24 rounded-lg object-cover border border-border"
                data-testid="img-pg"
              />
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                pg.pgType === "male" && "bg-blue-50 text-blue-700 border-blue-200",
                pg.pgType === "female" && "bg-pink-50 text-pink-700 border-pink-200",
                pg.pgType === "common" && "bg-purple-50 text-purple-700 border-purple-200"
              )}
              data-testid="badge-pg-type"
            >
              {pg.pgType}
            </Badge>

            {rating > 0 && (
              <Badge variant="secondary" className="gap-1" data-testid="badge-rating">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {rating.toFixed(1)} ★ ({pg.totalRatings} {pg.totalRatings === 1 ? "review" : "reviews"})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities Section */}
      <Card data-testid="card-amenities">
        <CardHeader>
          <CardTitle className="text-lg">Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(AMENITY_ICONS).map(([key, { icon: Icon, label }]) => {
              const isAvailable = pg[key as keyof PGDetails];
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-colors",
                    isAvailable
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  )}
                  data-testid={`amenity-${key}`}
                >
                  {isAvailable ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <XIcon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Available Rooms Section */}
      <Card data-testid="card-rooms">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Available Rooms</CardTitle>
          <Badge variant="secondary" data-testid="badge-room-count">
            {pg.availableRooms.length} {pg.availableRooms.length === 1 ? "room" : "rooms"}
          </Badge>
        </CardHeader>
        <CardContent>
          {pg.availableRooms.length === 0 ? (
            <div className="text-center py-8">
              <DoorOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-rooms">
                No rooms available at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pg.availableRooms.map((room) => {
                const availableBeds = room.sharing - (room.tenantIds?.length || 0);
                const isFullyOccupied = availableBeds === 0;

                return (
                  <Card key={room.id} className="border" data-testid={`card-room-${room.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg mb-1" data-testid={`text-room-number-${room.id}`}>
                            Room {room.roomNumber}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs" data-testid={`badge-sharing-${room.id}`}>
                              <Users className="w-3 h-3 mr-1" />
                              {room.sharing} Sharing
                            </Badge>
                            <Badge variant="outline" className="text-xs" data-testid={`badge-floor-${room.id}`}>
                              Floor {room.floor}
                            </Badge>
                            {isFullyOccupied ? (
                              <Badge variant="destructive" className="text-xs">
                                Fully Occupied
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-availability-${room.id}`}>
                                {availableBeds}/{room.sharing} beds available
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold" data-testid={`text-rent-${room.id}`}>
                            <IndianRupee className="w-4 h-4" />
                            {parseFloat(room.monthlyRent).toLocaleString("en-IN")}
                          </div>
                          <p className="text-xs text-muted-foreground">per month</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        {room.hasAC && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            <Wind className="w-3 h-3" />
                            AC
                          </div>
                        )}
                        {room.hasAttachedBathroom && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            <DoorOpen className="w-3 h-3" />
                            Attached Bathroom
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleRequestVisit(room)}
                        className="w-full"
                        disabled={hasPendingRequest || isFullyOccupied}
                        data-testid={`button-request-visit-${room.id}`}
                      >
                        {hasPendingRequest
                          ? "Visit Request Pending"
                          : isFullyOccupied
                          ? "Room Full"
                          : "Request Visit"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* General Request Visit Button */}
          {pg.availableRooms.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => handleRequestVisit()}
                variant="outline"
                className="w-full"
                disabled={hasPendingRequest}
                data-testid="button-request-visit-general"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {hasPendingRequest ? "Visit Request Pending" : "Request General Visit"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Request Modal */}
      <Dialog open={showVisitModal} onOpenChange={setShowVisitModal}>
        <DialogContent data-testid="dialog-visit-request">
          <DialogHeader>
            <DialogTitle>Request Visit</DialogTitle>
            <DialogDescription>
              {selectedRoom
                ? `Schedule a visit for Room ${selectedRoom.roomNumber}`
                : "Schedule a visit to this PG"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="visit-date">Preferred Date</Label>
              <Input
                id="visit-date"
                type="date"
                min={format(new Date(), "yyyy-MM-dd")}
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                data-testid="input-visit-date"
              />
            </div>

            <div>
              <Label htmlFor="visit-time">Preferred Time</Label>
              <Select value={visitTime} onValueChange={setVisitTime}>
                <SelectTrigger id="visit-time" data-testid="select-visit-time">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem
                      key={slot.value}
                      value={slot.label}
                      data-testid={`time-slot-${slot.value}`}
                    >
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visit-notes">Notes (Optional)</Label>
              <Textarea
                id="visit-notes"
                placeholder="Any specific requirements or questions..."
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
                data-testid="textarea-visit-notes"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitVisit}
                disabled={createVisitRequest.isPending}
                className="flex-1"
                data-testid="button-submit-visit"
              >
                {createVisitRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                onClick={() => {
                  setShowVisitModal(false);
                  resetForm();
                }}
                variant="outline"
                disabled={createVisitRequest.isPending}
                data-testid="button-cancel-visit"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
