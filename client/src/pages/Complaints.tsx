import { useState } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Plus, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Complaint = {
  id: number;
  pgId: number;
  ownerId: number;
  tenantId: number | null;
  roomId: number | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type Room = {
  id: number;
  roomNumber: string;
};

type Tenant = {
  id: number;
  name: string;
};

export default function Complaints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // Fetch complaints
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      const response = await fetch("/api/complaints", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch complaints");
      return response.json();
    },
  });

  // Fetch rooms for dropdown
  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await fetch("/api/rooms", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch rooms");
      return response.json();
    },
  });

  // Fetch tenants for dropdown
  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await fetch("/api/tenants", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch tenants");
      return response.json();
    },
  });

  // Create complaint mutation
  const createComplaintMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create complaint");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Complaint created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Update complaint mutation
  const updateComplaintMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/complaints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update complaint");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      setIsUpdateDialogOpen(false);
      setSelectedComplaint(null);
      toast({ title: "Complaint updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Filter complaints
  const filteredComplaints = complaints.filter((complaint) => {
    if (statusFilter !== "all" && complaint.status !== statusFilter) return false;
    if (priorityFilter !== "all" && complaint.priority !== priorityFilter) return false;
    return true;
  });

  const handleCreateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createComplaintMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      status: "open",
      tenantId: formData.get("tenantId") ? parseInt(formData.get("tenantId") as string) : null,
      roomId: formData.get("roomId") ? parseInt(formData.get("roomId") as string) : null,
    });
  };

  const handleUpdateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    
    const formData = new FormData(e.currentTarget);
    updateComplaintMutation.mutate({
      id: selectedComplaint.id,
      data: {
        status: formData.get("status"),
        resolutionNotes: formData.get("resolutionNotes") || null,
      },
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === "resolved") return <CheckCircle className="w-5 h-5" />;
    if (status === "in-progress") return <Clock className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "resolved") return "bg-green-100 text-green-600";
    if (status === "in-progress") return "bg-blue-100 text-blue-600";
    return "bg-red-100 text-red-600";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-100 text-red-700";
    if (priority === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "high") return "🔴";
    if (priority === "medium") return "🟡";
    return "🔵";
  };

  const getRoomNumber = (roomId: number | null) => {
    if (!roomId) return "N/A";
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.roomNumber : "Unknown";
  };

  const getTenantName = (tenantId: number | null) => {
    if (!tenantId) return "N/A";
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : "Unknown";
  };

  if (isLoading) {
    return (
      <DesktopLayout title="Complaints & Issues" showNav={false}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading complaints...</p>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="Complaints & Issues" showNav={false}>
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filter-status">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                  <DropdownMenuRadioItem value="all" data-testid="filter-status-all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="open" data-testid="filter-status-open">Open</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="in-progress" data-testid="filter-status-in-progress">In Progress</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="resolved" data-testid="filter-status-resolved">Resolved</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="filter-priority">
                  <Filter className="w-4 h-4 mr-2" />
                  Priority: {priorityFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={priorityFilter} onValueChange={setPriorityFilter}>
                  <DropdownMenuRadioItem value="all" data-testid="filter-priority-all">All</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="low" data-testid="filter-priority-low">Low</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="medium" data-testid="filter-priority-medium">Medium</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="high" data-testid="filter-priority-high">High</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-complaint">
                <Plus className="w-4 h-4 mr-2" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Complaint</DialogTitle>
                <DialogDescription>Add a new complaint or issue to track</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateComplaint}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Issue Title</Label>
                    <Input id="title" name="title" required data-testid="input-complaint-title" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" required data-testid="input-complaint-description" />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium" required>
                      <SelectTrigger data-testid="select-complaint-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low" data-testid="select-priority-low">Low</SelectItem>
                        <SelectItem value="medium" data-testid="select-priority-medium">Medium</SelectItem>
                        <SelectItem value="high" data-testid="select-priority-high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="roomId">Room (Optional)</Label>
                    <Select name="roomId">
                      <SelectTrigger data-testid="select-complaint-room">
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.roomNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tenantId">Tenant (Optional)</Label>
                    <Select name="tenantId">
                      <SelectTrigger data-testid="select-complaint-tenant">
                        <SelectValue placeholder="Select tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id.toString()}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={createComplaintMutation.isPending} data-testid="button-submit-complaint">
                    {createComplaintMutation.isPending ? "Creating..." : "Create Complaint"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {filteredComplaints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-complaints">No complaints found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => (
              <Card key={complaint.id} className="hover:shadow-md transition-shadow" data-testid={`card-complaint-${complaint.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground" data-testid={`text-complaint-title-${complaint.id}`}>{complaint.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(complaint.priority)}`} data-testid={`text-complaint-priority-${complaint.id}`}>
                            {getPriorityIcon(complaint.priority)} {complaint.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-complaint-description-${complaint.id}`}>
                          {complaint.description}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-complaint-details-${complaint.id}`}>
                          Room {getRoomNumber(complaint.roomId)} • {getTenantName(complaint.tenantId)} • {format(new Date(complaint.createdAt), "MMM d, yyyy")}
                        </p>
                        {complaint.status === "resolved" && complaint.resolvedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Resolved on {format(new Date(complaint.resolvedAt), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {complaint.status !== "resolved" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setIsUpdateDialogOpen(true);
                          }}
                          data-testid={`button-update-complaint-${complaint.id}`}
                        >
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Complaint Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Complaint</DialogTitle>
              <DialogDescription>Update the status and add resolution notes</DialogDescription>
            </DialogHeader>
            {selectedComplaint && (
              <form onSubmit={handleUpdateComplaint}>
                <div className="space-y-4">
                  <div>
                    <Label>Issue</Label>
                    <p className="text-sm text-muted-foreground">{selectedComplaint.title}</p>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={selectedComplaint.status} required>
                      <SelectTrigger data-testid="select-update-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open" data-testid="select-status-open">Open</SelectItem>
                        <SelectItem value="in-progress" data-testid="select-status-in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved" data-testid="select-status-resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                    <Textarea
                      id="resolutionNotes"
                      name="resolutionNotes"
                      defaultValue={selectedComplaint.resolutionNotes || ""}
                      placeholder="Add notes about the resolution..."
                      data-testid="input-resolution-notes"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="submit" disabled={updateComplaintMutation.isPending} data-testid="button-submit-update">
                    {updateComplaintMutation.isPending ? "Updating..." : "Update Complaint"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}
