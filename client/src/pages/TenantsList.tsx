import MobileLayout from "@/components/layout/MobileLayout";
import { Search, UserPlus, Phone, Mail, MoreVertical, Edit2, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TenantsList() {
  const [search, setSearch] = useState("");
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    roomNumber: "",
    monthlyRent: "",
  });
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenants");
      if (!res.ok) throw new Error("Failed to fetch tenants");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => {
      const response = await fetch(`/api/tenants/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update tenant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setEditingTenant(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/tenants/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete tenant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setDeletingTenantId(null);
    },
  });

  const handleEditClick = (tenant: any) => {
    setEditingTenant(tenant);
    setEditFormData({
      name: tenant.name,
      phone: tenant.phone,
      roomNumber: tenant.roomNumber,
      monthlyRent: tenant.monthlyRent,
    });
  };

  const handleSaveEdit = () => {
    if (editingTenant) {
      updateMutation.mutate({
        id: editingTenant.id,
        updates: editFormData,
      });
    }
  };

  const filteredTenants = tenants.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.roomNumber.includes(search)
  ).map((t: any) => ({
    id: t.id,
    name: t.name,
    room: t.roomNumber,
    rent: `₹${t.monthlyRent}`,
    phone: t.phone,
    status: "Active",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`
  }));

  return (
    <MobileLayout title="Tenants">
      {/* Search & Add */}
      <div className="flex gap-2 sticky top-0 bg-background z-10 pb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or room..." 
            className="pl-9 bg-secondary border-none" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/tenants/add">
          <Button size="icon" className="bg-primary text-primary-foreground shadow-md">
            <UserPlus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tenants found</div>
        ) : (
          filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
              <img src={tenant.avatar} alt={tenant.name} className="w-12 h-12 rounded-full object-cover" />
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-foreground truncate">{tenant.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tenant.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    tenant.status === 'Due' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tenant.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Room {tenant.room} • {tenant.rent}</p>
              </div>

              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600"
                  onClick={() => handleEditClick(tenant)}
                  data-testid={`button-edit-tenant-${tenant.id}`}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600"
                  onClick={() => setDeletingTenantId(tenant.id)}
                  data-testid={`button-delete-tenant-${tenant.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
        <DialogContent className="w-[90vw] max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input 
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input 
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-room">Room Number</Label>
              <Input 
                id="edit-room"
                value={editFormData.roomNumber}
                onChange={(e) => setEditFormData({...editFormData, roomNumber: e.target.value})}
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rent">Monthly Rent</Label>
              <Input 
                id="edit-rent"
                value={editFormData.monthlyRent}
                onChange={(e) => setEditFormData({...editFormData, monthlyRent: e.target.value})}
                className="bg-card"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setEditingTenant(null)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTenantId} onOpenChange={(open) => !open && setDeletingTenantId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this tenant? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={() => {
                if (deletingTenantId) {
                  deleteMutation.mutate(deletingTenantId);
                }
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
}
