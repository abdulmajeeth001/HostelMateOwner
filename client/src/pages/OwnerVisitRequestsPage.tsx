import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { usePG } from "@/hooks/use-pg";

interface VisitRequest {
  id: number;
  tenantUserId: number;
  tenantName?: string;
  tenantEmail?: string;
  pgId: number;
  pgName?: string;
  roomId?: number;
  roomNumber?: string;
  requestedDate: string;
  requestedTime: string;
  confirmedDate?: string;
  confirmedTime?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  rescheduledBy?: string;
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
    icon: AlertCircle,
  },
};

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
];

export default function OwnerVisitRequestsPage() {
  const queryClient = useQueryClient();
  const { pg, isLoading: pgLoading } = usePG();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "date">("recent");
  const [rescheduleModal, setRescheduleModal] = useState<{
    open: boolean;
    request?: VisitRequest;
    newDate: string;
    newTime: string;
    ownerNotes: string;
  }>({
    open: false,
    newDate: "",
    newTime: "",
    ownerNotes: "",
  });

  // Fetch visit requests
  const { data: visitRequests = [], isLoading, error } = useQuery<VisitRequest[]>({
    queryKey: ["/api/visit-requests"],
    queryFn: async () => {
      const res = await fetch("/api/visit-requests", {
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch visit requests");
      }
      return res.json();
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/visit-requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve visit request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests"] });
      toast.success("Visit request approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate, newTime }: { id: number; newDate: string; newTime: string }) => {
      const res = await fetch(`/api/visit-requests/${id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newDate, newTime }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reschedule visit request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-requests"] });
      setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" });
      toast.success("Visit rescheduled successfully. Tenant will be notified.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReschedule = () => {
    if (!rescheduleModal.request || !rescheduleModal.newDate || !rescheduleModal.newTime) {
      toast.error("Please select both date and time");
      return;
    }

    rescheduleMutation.mutate({
      id: rescheduleModal.request.id,
      newDate: rescheduleModal.newDate,
      newTime: rescheduleModal.newTime,
    });
  };

  const openRescheduleModal = (request: VisitRequest) => {
    setRescheduleModal({
      open: true,
      request,
      newDate: "",
      newTime: "",
      ownerNotes: "",
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

  if (pgLoading) {
    return (
      <DesktopLayout title="Visit Requests">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DesktopLayout>
    );
  }

  if (!pg) {
    return (
      <DesktopLayout title="Visit Requests">
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-pg">
              No PG Selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Please select a PG to view visit requests
            </p>
          </CardContent>
        </Card>
      </DesktopLayout>
    );
  }

  if (error) {
    return (
      <DesktopLayout title="Visit Requests">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
              {error.message === "Owner access required" 
                ? "Owner Access Required" 
                : "Failed to load visit requests"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {error.message === "Owner access required"
                ? "Only owners can access this page. Please log in as an owner."
                : error.message || "Please try again later"}
            </p>
          </CardContent>
        </Card>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="Visit Requests">
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Visit Requests</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{counts.all}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-orange-600 font-medium mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-900">{counts.pending}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-900">{counts.approved}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium mb-1">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{counts.completed}</p>
            </div>
          </div>
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              data-testid="filter-all"
            >
              All ({counts.all})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
              data-testid="filter-pending"
            >
              Pending ({counts.pending})
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("approved")}
              data-testid="filter-approved"
            >
              Approved ({counts.approved})
            </Button>
            <Button
              variant={statusFilter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("completed")}
              data-testid="filter-completed"
            >
              Completed ({counts.completed})
            </Button>
          </div>
          <Select value={sortBy} onValueChange={(value: "recent" | "date") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent" data-testid="sort-recent">Most Recent</SelectItem>
              <SelectItem value="date" data-testid="sort-date">By Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Visit Request Cards */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-requests">
                {statusFilter === "all"
                  ? "No visit requests yet"
                  : `No ${statusFilter} visit requests`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "all"
                  ? "Visit requests from tenants will appear here"
                  : `You don't have any ${statusFilter} visit requests at the moment`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;
              const visitDate = request.confirmedDate || request.requestedDate;
              const visitTime = request.confirmedTime || request.requestedTime;

              return (
                <Card key={request.id} data-testid={`card-visit-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold" data-testid={`text-tenant-name-${request.id}`}>
                            {request.tenantName || "Tenant"}
                          </h3>
                          {request.tenantEmail && (
                            <span className="text-sm text-muted-foreground">
                              ({request.tenantEmail})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span data-testid={`text-pg-name-${request.id}`}>{request.pgName || "PG"}</span>
                          </div>
                          {request.roomNumber && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span data-testid={`text-room-${request.id}`}>Room {request.roomNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("flex items-center gap-1", statusConfig.color)}
                        data-testid={`badge-status-${request.id}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Visit Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Requested Date & Time</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium" data-testid={`text-requested-date-${request.id}`}>
                            {format(new Date(request.requestedDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm" data-testid={`text-requested-time-${request.id}`}>
                            {request.requestedTime}
                          </span>
                        </div>
                      </div>

                      {(request.confirmedDate || request.rescheduledDate) && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {request.status === "rescheduled" ? "Rescheduled" : "Confirmed"} Date & Time
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700" data-testid={`text-confirmed-date-${request.id}`}>
                              {format(
                                new Date(request.confirmedDate || request.rescheduledDate!),
                                "MMM dd, yyyy"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700" data-testid={`text-confirmed-time-${request.id}`}>
                              {request.confirmedTime || request.rescheduledTime}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Tenant Notes</p>
                            <p className="text-sm" data-testid={`text-notes-${request.id}`}>
                              {request.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rescheduled Info */}
                    {request.status === "rescheduled" && request.rescheduledBy && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700" data-testid={`text-rescheduled-by-${request.id}`}>
                          Rescheduled by {request.rescheduledBy}. Waiting for tenant confirmation.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRescheduleModal(request)}
                            data-testid={`button-reschedule-${request.id}`}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Reschedule
                          </Button>
                        </>
                      )}

                      {request.status === "approved" && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Visit confirmed for {format(new Date(visitDate), "MMM dd")} at {visitTime}</span>
                        </div>
                      )}

                      {request.status === "completed" && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Visit completed</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reschedule Modal */}
        <Dialog open={rescheduleModal.open} onOpenChange={(open) => !open && setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" })}>
          <DialogContent data-testid="dialog-reschedule">
            <DialogHeader>
              <DialogTitle>Reschedule Visit Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newDate">New Date</Label>
                <Input
                  id="newDate"
                  type="date"
                  value={rescheduleModal.newDate}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  data-testid="input-reschedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newTime">New Time</Label>
                <Select
                  value={rescheduleModal.newTime}
                  onValueChange={(value) =>
                    setRescheduleModal({ ...rescheduleModal, newTime: value })
                  }
                >
                  <SelectTrigger id="newTime" data-testid="select-reschedule-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerNotes">Owner Notes (Optional)</Label>
                <Textarea
                  id="ownerNotes"
                  placeholder="Add any notes for the tenant..."
                  value={rescheduleModal.ownerNotes}
                  onChange={(e) =>
                    setRescheduleModal({ ...rescheduleModal, ownerNotes: e.target.value })
                  }
                  rows={3}
                  data-testid="textarea-owner-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRescheduleModal({ open: false, newDate: "", newTime: "", ownerNotes: "" })}
                data-testid="button-cancel-reschedule"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={rescheduleMutation.isPending}
                data-testid="button-confirm-reschedule"
              >
                {rescheduleMutation.isPending ? "Sending..." : "Send Reschedule Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}
