import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

export default function TenantComplaints() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch tenant complaints
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["tenant-complaints"],
    queryFn: async () => {
      const response = await fetch("/api/tenant/complaints", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch complaints");
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
      queryClient.invalidateQueries({ queryKey: ["tenant-complaints"] });
      setIsCreateDialogOpen(false);
      toast({ title: "Complaint submitted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateComplaint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createComplaintMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      priority: formData.get("priority"),
      status: "open",
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

  const getStatusText = (status: string) => {
    if (status === "resolved") return "Resolved";
    if (status === "in-progress") return "In Progress";
    return "Open";
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

  if (isLoading) {
    return (
      <MobileLayout title="My Complaints">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading complaints...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="My Complaints">
      <div className="space-y-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" data-testid="button-create-complaint">
              <Plus className="w-4 h-4 mr-2" />
              Submit New Complaint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Complaint</DialogTitle>
              <DialogDescription>Report an issue or request maintenance</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateComplaint}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Issue Title</Label>
                  <Input id="title" name="title" required data-testid="input-complaint-title" placeholder="e.g., Fan not working" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    required 
                    data-testid="input-complaint-description" 
                    placeholder="Describe the issue in detail..."
                  />
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
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit" disabled={createComplaintMutation.isPending} data-testid="button-submit-complaint">
                  {createComplaintMutation.isPending ? "Submitting..." : "Submit Complaint"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {complaints.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground" data-testid="text-no-complaints">No complaints yet</p>
              <p className="text-sm text-muted-foreground mt-2">Click the button above to submit your first complaint</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="overflow-hidden" data-testid={`card-complaint-${complaint.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm" data-testid={`text-complaint-title-${complaint.id}`}>{complaint.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getPriorityColor(complaint.priority)}`} data-testid={`text-complaint-priority-${complaint.id}`}>
                          {getPriorityIcon(complaint.priority)} {complaint.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-complaint-description-${complaint.id}`}>
                        {complaint.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground" data-testid={`text-complaint-date-${complaint.id}`}>
                          {format(new Date(complaint.createdAt), "MMM d, yyyy")}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${getStatusColor(complaint.status)}`} data-testid={`text-complaint-status-${complaint.id}`}>
                          {getStatusText(complaint.status)}
                        </span>
                      </div>
                      {complaint.status === "resolved" && complaint.resolutionNotes && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                          <p className="text-xs font-medium text-green-800 mb-1">Resolution:</p>
                          <p className="text-xs text-green-700">{complaint.resolutionNotes}</p>
                          {complaint.resolvedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Resolved on {format(new Date(complaint.resolvedAt), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
