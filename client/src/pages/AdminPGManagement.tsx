import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Ban, PlayCircle, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface PG {
  id: number;
  pgName: string;
  pgAddress: string;
  totalRooms: number;
  status: string;
  isActive: boolean;
  approvedAt: string | null;
  rejectionReason: string | null;
  owner: {
    id: number;
    name: string;
    email: string;
    mobile: string;
  };
}

export default function AdminPGManagement() {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPg, setSelectedPg] = useState<PG | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const filterParam = params.get("filter");
    if (filterParam) {
      setFilter(filterParam);
    }
  }, [location]);

  const { data: pgs, isLoading } = useQuery<PG[]>({
    queryKey: [filter === "pending" ? "/api/admin/pgs/pending" : "/api/admin/pgs"],
  });

  const approveMutation = useMutation({
    mutationFn: async (pgId: number) => {
      const res = await fetch(`/api/admin/pgs/${pgId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "PG Approved", description: "The PG has been approved successfully." });
      setShowApproveDialog(false);
      setSelectedPg(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve PG", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ pgId, reason }: { pgId: number; reason: string }) => {
      const res = await fetch(`/api/admin/pgs/${pgId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "PG Rejected", description: "The PG has been rejected." });
      setShowRejectDialog(false);
      setSelectedPg(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject PG", variant: "destructive" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (pgId: number) => {
      const res = await fetch(`/api/admin/pgs/${pgId}/deactivate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "PG Deactivated", description: "The PG has been deactivated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to deactivate PG", variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (pgId: number) => {
      const res = await fetch(`/api/admin/pgs/${pgId}/activate`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pgs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "PG Activated", description: "The PG has been activated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate PG", variant: "destructive" });
    },
  });

  const filteredPgs = pgs?.filter((pg) => {
    const matchesSearch = pg.pgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pg.owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pg.owner.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "pending") return pg.status === "pending" && matchesSearch;
    if (filter === "approved") return pg.status === "approved" && matchesSearch;
    if (filter === "rejected") return pg.status === "rejected" && matchesSearch;
    if (filter === "active") return pg.isActive && matchesSearch;
    if (filter === "inactive") return !pg.isActive && matchesSearch;
    return matchesSearch;
  });

  const getStatusBadge = (pg: PG) => {
    if (!pg.isActive) {
      return <Badge variant="destructive" data-testid={`badge-status-${pg.id}`}>Inactive</Badge>;
    }
    switch (pg.status) {
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-status-${pg.id}`}>Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600" data-testid={`badge-status-${pg.id}`}>Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`badge-status-${pg.id}`}>Rejected</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${pg.id}`}>{pg.status}</Badge>;
    }
  };

  const content = (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-pg-management-title">
          PG Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage all registered PG properties
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PG name, owner name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-pgs"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PGs</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PG List</CardTitle>
          <CardDescription>
            {filteredPgs?.length || 0} PG{filteredPgs?.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredPgs?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No PGs found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PG Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rooms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPgs?.map((pg) => (
                    <TableRow key={pg.id} data-testid={`row-pg-${pg.id}`}>
                      <TableCell className="font-medium">{pg.pgName}</TableCell>
                      <TableCell>{pg.owner.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pg.owner.email}
                      </TableCell>
                      <TableCell>{pg.totalRooms}</TableCell>
                      <TableCell>{getStatusBadge(pg)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {pg.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setSelectedPg(pg);
                                  setShowApproveDialog(true);
                                }}
                                data-testid={`button-approve-${pg.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedPg(pg);
                                  setShowRejectDialog(true);
                                }}
                                data-testid={`button-reject-${pg.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {pg.status === "approved" && (
                            <>
                              {pg.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => deactivateMutation.mutate(pg.id)}
                                  data-testid={`button-deactivate-${pg.id}`}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => activateMutation.mutate(pg.id)}
                                  data-testid={`button-activate-${pg.id}`}
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent data-testid="dialog-approve-pg">
          <DialogHeader>
            <DialogTitle>Approve PG</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve "{selectedPg?.pgName}"? The owner will be able to access all features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} data-testid="button-cancel-approve">
              Cancel
            </Button>
            <Button
              onClick={() => selectedPg && approveMutation.mutate(selectedPg.id)}
              disabled={approveMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent data-testid="dialog-reject-pg">
          <DialogHeader>
            <DialogTitle>Reject PG</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{selectedPg?.pgName}". This will be shown to the owner.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-rejection-reason"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} data-testid="button-cancel-reject">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedPg && rejectMutation.mutate({ pgId: selectedPg.id, reason: rejectionReason })}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return isMobile ? (
    <MobileLayout title="PG Management">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}
