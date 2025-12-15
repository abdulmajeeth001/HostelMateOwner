import DesktopLayout from "@/components/layout/DesktopLayout";
import { Search, UserPlus, Edit2, Trash2, Eye, Users, Phone, MapPin, IndianRupee, MoreVertical, Upload, UserCheck, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { TenantBulkUploadModal } from "@/components/TenantBulkUploadModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deletingTenantId, setDeletingTenantId] = useState<number | null>(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
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

  const statCards = [
    { 
      label: "Total Tenants", 
      value: stats.total, 
      icon: Users, 
      gradient: "from-purple-500 to-pink-600",
      description: "All tenants"
    },
    { 
      label: "Active", 
      value: stats.active, 
      icon: UserCheck, 
      gradient: "from-emerald-500 to-green-600",
      description: "Currently active"
    },
    { 
      label: "Inactive", 
      value: stats.inactive, 
      icon: UserX, 
      gradient: "from-orange-500 to-red-600",
      description: "Not active"
    },
  ];

  return (
    <DesktopLayout title="Tenants" showNav>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Tenant Management</h2>
              <p className="text-white/80 text-sm">Manage your PG residents and their information</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setBulkUploadOpen(true)}
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                data-testid="button-bulk-upload-tenant"
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Upload
              </Button>
              <Button 
                onClick={() => navigate("/tenants/add")}
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                data-testid="button-add-tenant"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300" data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                  `bg-gradient-to-br ${stat.gradient}`
                )}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-semibold mb-1">{stat.label}</p>
                <h3 className={cn(
                  "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  `${stat.gradient}`
                )}>{stat.value}</h3>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">

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
        <div className="flex gap-2 mb-6">
          {filterTabs.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              variant={filter === tab.value ? "default" : "outline"}
              size="sm"
              className="rounded-full px-4"
              data-testid={`filter-${tab.value}`}
            >
              {tab.label} <span className="ml-2 text-xs opacity-70">({tab.count})</span>
            </Button>
          ))}
        </div>

        {/* Tenants Grid */}
        <Card className="border-2 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Tenant Directory</h3>
              </div>
              <span className="text-sm text-muted-foreground font-medium">{filteredTenants.length} tenants</span>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-muted-foreground">Loading tenants...</p>
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {tenants.length === 0 ? "No tenants yet" : "No tenants found"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-no-tenants">
                  {tenants.length === 0 ? "Add your first tenant to get started" : "Try adjusting your search filters"}
                </p>
                {tenants.length === 0 && (
                  <Button onClick={() => navigate("/tenants/add")} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <UserPlus className="h-4 w-4" />
                    Add Tenant
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTenants.map((tenant: { id: number; name: string; room: string; rent: number; phone: string; status: string; avatar: string }) => (
                  <div 
                    key={tenant.id} 
                    className="group relative overflow-hidden border-2 border-transparent hover:border-purple-200 rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 shadow-sm hover:shadow-xl transition-all duration-300"
                    data-testid={`card-tenant-${tenant.id}`}
                  >
                    {/* Top Row: Avatar, Name, Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img 
                          src={tenant.avatar} 
                          alt={tenant.name} 
                          className="w-12 h-12 rounded-xl object-cover border-2 border-purple-100 flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate mb-1" data-testid={`text-tenant-name-${tenant.id}`}>
                            {tenant.name}
                          </h3>
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                            tenant.status === "active"
                              ? "bg-gradient-to-r from-emerald-100 to-green-100 text-green-700"
                              : "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700"
                          )}>
                            {tenant.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7 flex-shrink-0 hover:bg-purple-100"
                            data-testid={`button-more-options-${tenant.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => navigate(`/tenants/view/${tenant.id}`)}
                            data-testid={`button-view-tenant-${tenant.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => navigate(`/tenants/edit/${tenant.id}`)}
                            data-testid={`button-edit-tenant-${tenant.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Tenant
                          </DropdownMenuItem>
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

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Room Number</p>
                          <p className="font-bold text-sm text-foreground" data-testid={`text-room-number-${tenant.id}`}>
                            {tenant.room}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center flex-shrink-0">
                          <IndianRupee className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Monthly Rent</p>
                          <p className="font-bold text-sm bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" data-testid={`text-rent-${tenant.id}`}>
                            ₹{tenant.rent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-bold text-sm text-foreground truncate" data-testid={`text-phone-${tenant.id}`}>
                            {tenant.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

      <TenantBulkUploadModal 
        open={bulkUploadOpen} 
        onOpenChange={setBulkUploadOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
        }}
      />
    </DesktopLayout>
  );
}
