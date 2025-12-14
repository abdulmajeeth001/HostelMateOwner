import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Home as HomeIcon,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import OnboardingRequestModal from "@/components/OnboardingRequestModal";

interface VisitRequest {
  id: number;
  pgId: number;
  pgName?: string;
  pgAddress?: string;
  roomId?: number;
  roomNumber?: string;
  requestedDate: string;
  requestedTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  status: "pending" | "approved" | "rescheduled" | "completed" | "cancelled";
  notes?: string;
  ownerNotes?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: AlertCircle,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  rescheduled: {
    label: "Rescheduled",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function TenantVisitRequestsPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "date">("recent");
  const [onboardingModal, setOnboardingModal] = useState<{
    open: boolean;
    visitRequestId?: number;
    pgId?: number;
    roomId?: number;
  }>({ open: false });

  // Fetch visit requests
  const { data: visitRequests = [], isLoading, error } = useQuery<VisitRequest[]>({
    queryKey: ["/api/tenant/visit-requests"],
    queryFn: async () => {
      const res = await fetch("/api/tenant/visit-requests", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch visit requests");
      return res.json();
    },
  });

  // Accept reschedule mutation
  const acceptRescheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tenant/visit-requests/${id}/accept-reschedule`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to accept reschedule");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "New visit time accepted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete visit mutation
  const completeVisitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tenant/visit-requests/${id}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to mark as completed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "Visit marked as completed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel visit mutation
  const cancelVisitMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tenant/visit-requests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel visit request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/visit-requests"] });
      toast({
        title: "Success",
        description: "Visit request cancelled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenOnboarding = (visitRequest: VisitRequest) => {
    setOnboardingModal({
      open: true,
      visitRequestId: visitRequest.id,
      pgId: visitRequest.pgId,
      roomId: visitRequest.roomId,
    });
  };

  // Filter and sort requests
  const filteredRequests = visitRequests
    .filter((req) => {
      if (statusFilter === "all") return true;
      return req.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const dateA = new Date(a.requestedDate).getTime();
        const dateB = new Date(b.requestedDate).getTime();
        return dateB - dateA;
      }
    });

  const getStatusCounts = () => {
    return {
      all: visitRequests.length,
      pending: visitRequests.filter((r) => r.status === "pending").length,
      approved: visitRequests.filter((r) => r.status === "approved").length,
      completed: visitRequests.filter((r) => r.status === "completed").length,
    };
  };

  const counts = getStatusCounts();

  if (isLoading) {
    return (
      <MobileLayout title="My Visit Requests" showNav={true}>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout title="My Visit Requests" showNav={true}>
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
              Failed to load visit requests
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error.message || "Please try again later"}
            </p>
            <Button onClick={() => navigate("/tenant-search-pgs")} data-testid="button-search-pgs">
              Search PGs
            </Button>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="My Visit Requests"
      showNav={true}
      action={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/tenant-dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Sort Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Select value={sortBy} onValueChange={(value: "recent" | "date") => setSortBy(value)}>
              <SelectTrigger data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent" data-testid="sort-recent">Most Recent</SelectItem>
                <SelectItem value="date" data-testid="sort-date">By Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => navigate("/tenant-search-pgs")}
            variant="outline"
            data-testid="button-new-visit"
          >
            + New Visit
          </Button>
        </div>

        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({counts.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Visit Request Cards */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-requests">
                {statusFilter === "all"
                  ? "No visit requests yet"
                  : `No ${statusFilter} visit requests`}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === "all"
                  ? "Start by searching for PGs and requesting a visit"
                  : `You don't have any ${statusFilter} visit requests at the moment`}
              </p>
              {statusFilter === "all" && (
                <Button onClick={() => navigate("/tenant-search-pgs")} data-testid="button-search-pgs-empty">
                  Search PGs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;
              const visitDate = request.confirmedDate || request.requestedDate;
              const visitTime = request.confirmedTime || request.requestedTime;
              const isPastVisit = visitDate ? isPast(new Date(visitDate)) : false;
              const showOnboardingButton =
                (request.status === "approved" || request.status === "completed") && request.roomId;

              return (
                <Card key={request.id} data-testid={`card-visit-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2" data-testid={`text-pg-name-${request.id}`}>
                          {request.pgName || "PG"}
                        </CardTitle>
                        {request.pgAddress && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                            <MapPin className="w-3 h-3" />
                            <span data-testid={`text-address-${request.id}`}>{request.pgAddress}</span>
                          </p>
                        )}
                        {request.roomNumber && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <HomeIcon className="w-3 h-3" />
                            Room {request.roomNumber}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("gap-1", statusConfig.color)}
                        data-testid={`badge-status-${request.id}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Visit Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Requested:</span>
                        <span data-testid={`text-requested-date-${request.id}`}>
                          {format(new Date(request.requestedDate), "MMM dd, yyyy")}
                        </span>
                        <span className="text-muted-foreground">at</span>
                        <span data-testid={`text-requested-time-${request.id}`}>{request.requestedTime}</span>
                      </div>

                      {request.confirmedDate && request.confirmedTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Confirmed:</span>
                          <span data-testid={`text-confirmed-date-${request.id}`}>
                            {format(new Date(request.confirmedDate), "MMM dd, yyyy")}
                          </span>
                          <span className="text-muted-foreground">at</span>
                          <span data-testid={`text-confirmed-time-${request.id}`}>{request.confirmedTime}</span>
                        </div>
                      )}

                      {request.status === "rescheduled" &&
                        request.rescheduledDate &&
                        request.rescheduledTime && (
                          <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">New Time:</span>
                            <span data-testid={`text-rescheduled-date-${request.id}`}>
                              {format(new Date(request.rescheduledDate), "MMM dd, yyyy")}
                            </span>
                            <span>at</span>
                            <span data-testid={`text-rescheduled-time-${request.id}`}>
                              {request.rescheduledTime}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Your Notes:</p>
                        <p className="text-muted-foreground" data-testid={`text-notes-${request.id}`}>
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {request.ownerNotes && (
                      <div className="text-sm bg-secondary p-3 rounded">
                        <p className="font-medium mb-1">Owner's Notes:</p>
                        <p className="text-muted-foreground" data-testid={`text-owner-notes-${request.id}`}>
                          {request.ownerNotes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {request.status === "pending" && (
                        <Button
                          onClick={() => cancelVisitMutation.mutate(request.id)}
                          variant="destructive"
                          size="sm"
                          disabled={cancelVisitMutation.isPending}
                          data-testid={`button-cancel-${request.id}`}
                        >
                          {cancelVisitMutation.isPending ? "Cancelling..." : "Cancel Request"}
                        </Button>
                      )}

                      {request.status === "rescheduled" && (
                        <Button
                          onClick={() => acceptRescheduleMutation.mutate(request.id)}
                          variant="default"
                          size="sm"
                          disabled={acceptRescheduleMutation.isPending}
                          data-testid={`button-accept-reschedule-${request.id}`}
                        >
                          {acceptRescheduleMutation.isPending ? "Accepting..." : "Accept New Time"}
                        </Button>
                      )}

                      {request.status === "approved" && isPastVisit && (
                        <Button
                          onClick={() => completeVisitMutation.mutate(request.id)}
                          variant="outline"
                          size="sm"
                          disabled={completeVisitMutation.isPending}
                          data-testid={`button-complete-${request.id}`}
                        >
                          {completeVisitMutation.isPending ? "Marking..." : "Mark as Completed"}
                        </Button>
                      )}

                      {showOnboardingButton && (
                        <Button
                          onClick={() => handleOpenOnboarding(request)}
                          variant="default"
                          size="sm"
                          data-testid={`button-onboarding-${request.id}`}
                        >
                          Request Onboarding
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingRequestModal
        open={onboardingModal.open}
        onClose={() => setOnboardingModal({ open: false })}
        visitRequestId={onboardingModal.visitRequestId}
        pgId={onboardingModal.pgId}
        roomId={onboardingModal.roomId}
      />
    </MobileLayout>
  );
}
