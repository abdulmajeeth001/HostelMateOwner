import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  User,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  IndianRupee,
  FileText,
  Eye,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface OnboardingRequest {
  id: number;
  tenantUserId: number;
  visitRequestId?: number;
  pgId: number;
  pgName?: string;
  roomId: number;
  roomNumber?: string;
  name: string;
  email: string;
  phone: string;
  monthlyRent: string;
  tenantImage?: string;
  aadharCard?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
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
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export default function OwnerOnboardingRequestsPage() {
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent">("recent");
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    request?: OnboardingRequest;
  }>({ open: false });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    request?: OnboardingRequest;
    reason: string;
  }>({ open: false, reason: "" });
  const [imagePreview, setImagePreview] = useState<{
    open: boolean;
    src?: string;
    title?: string;
  }>({ open: false });

  // Fetch onboarding requests
  const { data: onboardingRequests = [], isLoading, error } = useQuery<OnboardingRequest[]>({
    queryKey: ["/api/onboarding-requests"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding-requests", {
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch onboarding requests");
      }
      return res.json();
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/onboarding-requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve onboarding request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-requests"] });
      toast.success("Onboarding request approved successfully. Tenant has been added.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`/api/onboarding-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject onboarding request");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-requests"] });
      setRejectDialog({ open: false, reason: "" });
      toast.success("Onboarding request rejected. Tenant has been notified.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReject = () => {
    if (!rejectDialog.request || !rejectDialog.reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    rejectMutation.mutate({
      id: rejectDialog.request.id,
      reason: rejectDialog.reason,
    });
  };

  const openRejectDialog = (request: OnboardingRequest) => {
    setRejectDialog({
      open: true,
      request,
      reason: "",
    });
  };

  const openDetailsDialog = (request: OnboardingRequest) => {
    setDetailsDialog({
      open: true,
      request,
    });
  };

  const openImagePreview = (src: string, title: string) => {
    setImagePreview({ open: true, src, title });
  };

  // Filter and sort requests
  const filteredRequests = onboardingRequests
    .filter((req) => {
      if (statusFilter === "all") return true;
      return req.status === statusFilter;
    })
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getStatusCounts = () => {
    return {
      all: onboardingRequests.length,
      pending: onboardingRequests.filter((r) => r.status === "pending").length,
      approved: onboardingRequests.filter((r) => r.status === "approved").length,
      rejected: onboardingRequests.filter((r) => r.status === "rejected").length,
    };
  };

  const counts = getStatusCounts();

  if (error) {
    return (
      <DesktopLayout title="Onboarding Requests">
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-error">
              {error.message === "Owner access required" 
                ? "Owner Access Required" 
                : "Failed to load onboarding requests"}
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
    <DesktopLayout title="Onboarding Requests">
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Onboarding Requests</h1>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-purple-600 font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-purple-900">{counts.all}</p>
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
              <p className="text-xs text-red-600 font-medium mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-900">{counts.rejected}</p>
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
              variant={statusFilter === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("rejected")}
              data-testid="filter-rejected"
            >
              Rejected ({counts.rejected})
            </Button>
          </div>
          <Select value={sortBy} onValueChange={(value: "recent") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent" data-testid="sort-recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Onboarding Request Cards */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <UserCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-requests">
                {statusFilter === "all"
                  ? "No onboarding requests yet"
                  : `No ${statusFilter} onboarding requests`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter === "all"
                  ? "Onboarding requests from tenants will appear here"
                  : `You don't have any ${statusFilter} onboarding requests at the moment`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={request.id} data-testid={`card-onboarding-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {request.tenantImage ? (
                          <img
                            src={request.tenantImage}
                            alt={request.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-border cursor-pointer"
                            onClick={() => openImagePreview(request.tenantImage!, "Tenant Photo")}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                            {request.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg" data-testid={`text-tenant-name-${request.id}`}>
                            {request.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span data-testid={`text-email-${request.id}`}>{request.email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span data-testid={`text-phone-${request.id}`}>{request.phone}</span>
                            </div>
                          </div>
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
                    {/* PG and Room Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">PG Name</p>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium" data-testid={`text-pg-name-${request.id}`}>
                            {request.pgName || "PG"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Room Number</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium" data-testid={`text-room-${request.id}`}>
                            {request.roomNumber || `Room ${request.roomId}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Rent */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-700" data-testid={`text-rent-${request.id}`}>
                          ₹{parseFloat(request.monthlyRent).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    {request.emergencyContactName && (
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Emergency Contact</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span data-testid={`text-emergency-name-${request.id}`}>
                              {request.emergencyContactName}
                            </span>
                            {request.emergencyContactRelationship && (
                              <span className="text-muted-foreground">
                                ({request.emergencyContactRelationship})
                              </span>
                            )}
                          </div>
                          {request.emergencyContactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span data-testid={`text-emergency-phone-${request.id}`}>
                                {request.emergencyContactPhone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    <div className="flex gap-2">
                      {request.aadharCard && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openImagePreview(request.aadharCard!, "Aadhar Card")}
                          data-testid={`button-view-aadhar-${request.id}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Aadhar Card
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsDialog(request)}
                        data-testid={`button-view-details-${request.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details
                      </Button>
                    </div>

                    {/* Rejection Reason */}
                    {request.status === "rejected" && request.rejectionReason && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-red-600 font-medium mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-700" data-testid={`text-rejection-reason-${request.id}`}>
                          {request.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Approve Onboarding
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(request)}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {request.status === "approved" && request.approvedAt && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Approved on {format(new Date(request.approvedAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog
          open={detailsDialog.open}
          onOpenChange={(open) => !open && setDetailsDialog({ open: false })}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-details">
            <DialogHeader>
              <DialogTitle>Onboarding Request Details</DialogTitle>
            </DialogHeader>
            {detailsDialog.request && (
              <div className="space-y-4 py-4">
                {/* Tenant Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Tenant Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="text-sm font-medium">{detailsDialog.request.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="text-sm">{detailsDialog.request.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm">{detailsDialog.request.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <p className="text-sm font-semibold text-green-700">
                        ₹{parseFloat(detailsDialog.request.monthlyRent).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Room Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Room Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">PG Name</p>
                      <p className="text-sm font-medium">{detailsDialog.request.pgName || "PG"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Room Number</p>
                      <p className="text-sm font-medium">
                        {detailsDialog.request.roomNumber || `Room ${detailsDialog.request.roomId}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {detailsDialog.request.emergencyContactName && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Emergency Contact</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Relationship</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactRelationship || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                        <p className="text-sm">{detailsDialog.request.emergencyContactPhone || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {detailsDialog.request.tenantImage && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Tenant Photo</p>
                        <img
                          src={detailsDialog.request.tenantImage}
                          alt="Tenant"
                          className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                          onClick={() =>
                            openImagePreview(detailsDialog.request!.tenantImage!, "Tenant Photo")
                          }
                        />
                      </div>
                    )}
                    {detailsDialog.request.aadharCard && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Aadhar Card</p>
                        <img
                          src={detailsDialog.request.aadharCard}
                          alt="Aadhar Card"
                          className="w-full h-40 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition"
                          onClick={() =>
                            openImagePreview(detailsDialog.request!.aadharCard!, "Aadhar Card")
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDetailsDialog({ open: false })}
                data-testid="button-close-details"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialog.open}
          onOpenChange={(open) => !open && setRejectDialog({ open: false, reason: "" })}
        >
          <DialogContent data-testid="dialog-reject">
            <DialogHeader>
              <DialogTitle>Reject Onboarding Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Please provide a reason for rejecting this onboarding request. The tenant will be
                notified with your reason.
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="e.g., Incomplete documents, Room already occupied, etc."
                  value={rejectDialog.reason}
                  onChange={(e) =>
                    setRejectDialog({ ...rejectDialog, reason: e.target.value })
                  }
                  rows={4}
                  data-testid="textarea-rejection-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, reason: "" })}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectDialog.reason.trim()}
                data-testid="button-confirm-reject"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog
          open={imagePreview.open}
          onOpenChange={(open) => !open && setImagePreview({ open: false })}
        >
          <DialogContent className="max-w-4xl" data-testid="dialog-image-preview">
            <DialogHeader>
              <DialogTitle>{imagePreview.title}</DialogTitle>
            </DialogHeader>
            {imagePreview.src && (
              <div className="py-4">
                <img
                  src={imagePreview.src}
                  alt={imagePreview.title}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setImagePreview({ open: false })}
                data-testid="button-close-image"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}
