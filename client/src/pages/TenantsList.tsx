import MobileLayout from "@/components/layout/MobileLayout";
import { Search, UserPlus, Edit2, Trash2, Eye, Users, Phone, MapPin, IndianRupee, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TenantsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenants");
      if (!res.ok) throw new Error("Failed to fetch tenants");
      return res.json();
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

  const filteredTenants = useMemo(() => {
    return tenants.filter((t: any) => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                         t.roomNumber.includes(search) ||
                         t.phone.includes(search);
      const matchFilter = filter === "all" || 
                         (filter === "active" && t.status === "active") ||
                         (filter === "inactive" && t.status === "inactive");
      return matchSearch && matchFilter;
    }).map((t: any) => ({
      id: t.id,
      name: t.name,
      room: t.roomNumber,
      rent: parseFloat(t.monthlyRent),
      phone: t.phone,
      status: t.status || "active",
      avatar: t.tenantImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`
    }));
  }, [tenants, search, filter]);

  const stats = {
    total: tenants.length,
    active: tenants.filter((t: any) => t.status === "active").length,
    inactive: tenants.filter((t: any) => t.status === "inactive").length,
  };

  const filterTabs = [
    { label: "All", value: "all", count: stats.total },
    { label: "Active", value: "active", count: stats.active },
    { label: "Inactive", value: "inactive", count: stats.inactive },
  ] as const;

  return (
    <MobileLayout title="Tenants">
      <div className="space-y-4">
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Tenants</h1>
            <Link href="/tenants/add">
              <Button 
                size="icon" 
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                data-testid="button-add-tenant"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-1">Active</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-yellow-600 font-medium mb-1">Inactive</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.inactive}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, room, or phone..." 
            className="pl-10 h-12 bg-secondary border border-border rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-tenant"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                filter === tab.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
              data-testid={`filter-${tab.value}`}
            >
              {tab.label} <span className="ml-2 text-xs">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tenants List */}
        <div className="space-y-3 pb-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
              <p className="text-muted-foreground mt-3">Loading tenants...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 rounded-2xl">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground font-medium mb-2">
                {tenants.length === 0 ? "No tenants yet" : "No tenants found"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {tenants.length === 0 ? "Add your first tenant to get started" : "Try adjusting your search filters"}
              </p>
              {tenants.length === 0 && (
                <Link href="/tenants/add">
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Tenant
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <div 
                key={tenant.id} 
                className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                data-testid={`card-tenant-${tenant.id}`}
              >
                {/* Top Row: Avatar, Name, Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img 
                      src={tenant.avatar} 
                      alt={tenant.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-foreground truncate" data-testid={`text-tenant-name-${tenant.id}`}>
                        {tenant.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tenant.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {tenant.status === "active" ? "🟢 Active" : "🟡 Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        data-testid={`button-more-options-${tenant.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/tenants/view/${tenant.id}`}>
                        <DropdownMenuItem data-testid={`button-view-tenant-${tenant.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/tenants/edit/${tenant.id}`}>
                        <DropdownMenuItem data-testid={`button-edit-tenant-${tenant.id}`}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Tenant
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        className="text-destructive focus:bg-red-50 focus:text-red-600"
                        onClick={() => setDeletingTenantId(tenant.id)}
                        data-testid={`button-delete-tenant-${tenant.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Details Row: Room, Rent, Phone */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Room</p>
                      <p className="font-semibold text-foreground" data-testid={`text-room-number-${tenant.id}`}>
                        {tenant.room}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rent</p>
                      <p className="font-semibold text-green-600" data-testid={`text-rent-${tenant.id}`}>
                        ₹{tenant.rent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground" data-testid={`text-phone-${tenant.id}`}>
                        {tenant.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
