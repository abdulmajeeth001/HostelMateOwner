import { useState } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { usePG, PG } from "@/hooks/use-pg";
import { Building2, Plus, Edit2, Trash2, MapPin, Home, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import LocationMapPicker from "@/components/LocationMapPicker";
import ImageUploader from "@/components/ImageUploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function PGManagement() {
  const { pg: currentPg, allPgs, selectPG, createPG, updatePG, deletePG, isLoading } = usePG();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPg, setSelectedPg] = useState<PG | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    pgName: "",
    pgAddress: "",
    pgLocation: "",
    latitude: "",
    longitude: "",
    imageUrl: "",
    totalRooms: "",
  });

  const resetForm = () => {
    setFormData({
      pgName: "",
      pgAddress: "",
      pgLocation: "",
      latitude: "",
      longitude: "",
      imageUrl: "",
      totalRooms: "",
    });
  };

  const handleAddPG = async () => {
    if (!formData.pgName || !formData.pgAddress || !formData.pgLocation) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPG({
        pgName: formData.pgName,
        pgAddress: formData.pgAddress,
        pgLocation: formData.pgLocation,
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl,
        totalRooms: formData.totalRooms ? parseInt(formData.totalRooms) : 0,
      });
      toast.success("PG created successfully!");
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create PG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPG = async () => {
    if (!selectedPg) return;
    if (!formData.pgName || !formData.pgAddress || !formData.pgLocation) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePG(selectedPg.id, {
        pgName: formData.pgName,
        pgAddress: formData.pgAddress,
        pgLocation: formData.pgLocation,
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrl: formData.imageUrl,
        totalRooms: formData.totalRooms ? parseInt(formData.totalRooms) : 0,
      });
      toast.success("PG updated successfully!");
      setIsEditDialogOpen(false);
      setSelectedPg(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update PG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePG = async () => {
    if (!selectedPg) return;

    setIsSubmitting(true);
    try {
      await deletePG(selectedPg.id);
      toast.success("PG deleted successfully!");
      setIsDeleteDialogOpen(false);
      setSelectedPg(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete PG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (pg: PG) => {
    setSelectedPg(pg);
    setFormData({
      pgName: pg.pgName,
      pgAddress: pg.pgAddress || "",
      pgLocation: pg.pgLocation || "",
      latitude: pg.latitude || "",
      longitude: pg.longitude || "",
      imageUrl: pg.imageUrl || "",
      totalRooms: pg.totalRooms?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (pg: PG) => {
    setSelectedPg(pg);
    setIsDeleteDialogOpen(true);
  };

  const handleSelectPG = async (pg: PG) => {
    if (pg.id === currentPg?.id) return;
    
    try {
      await selectPG(pg.id);
      toast.success(`Switched to ${pg.pgName}`);
    } catch (error) {
      toast.error("Failed to switch PG");
    }
  };

  if (isLoading) {
    return (
      <DesktopLayout title="My PGs" showNav>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="My PGs" showNav>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">My PG Properties</h2>
              <p className="text-white/80 text-sm">Manage all your properties in one place</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
              data-testid="button-add-new-pg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New PG
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">

      {allPgs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first PG property to start managing tenants and rooms
          </p>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            data-testid="button-add-first-property"
          >
            <Plus className="h-4 w-4" />
            Add Your First PG
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {allPgs.map((pg) => (
            <div 
              key={pg.id} 
              className={cn(
                "group relative overflow-hidden rounded-xl p-6 transition-all duration-300",
                "bg-gradient-to-r from-white to-gray-50",
                pg.id === currentPg?.id 
                  ? "border-2 border-purple-300 shadow-xl hover:shadow-2xl bg-gradient-to-r from-purple-50 to-blue-50" 
                  : "border-2 border-transparent hover:border-purple-200 shadow-sm hover:shadow-xl hover:from-purple-50 hover:to-blue-50"
              )}
              data-testid={`card-pg-${pg.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    "h-14 w-14 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110",
                    pg.id === currentPg?.id 
                      ? "bg-gradient-to-br from-purple-500 to-blue-600" 
                      : "bg-gradient-to-br from-gray-400 to-gray-500"
                  )}>
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-foreground">{pg.pgName}</h3>
                      {pg.id === currentPg?.id && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {pg.pgLocation}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pg.id !== currentPg?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectPG(pg)}
                      className="gap-1 hover:bg-purple-50 hover:border-purple-300"
                      data-testid={`button-select-pg-${pg.id}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Select
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(pg)}
                    className="hover:bg-purple-100"
                    data-testid={`button-edit-pg-${pg.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-red-50"
                    onClick={() => openDeleteDialog(pg)}
                    disabled={allPgs.length === 1}
                    data-testid={`button-delete-pg-${pg.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <Home className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Rooms</p>
                    <p className="font-bold text-foreground">{pg.totalRooms || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium text-sm text-foreground truncate">{pg.pgAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add PG Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New PG</DialogTitle>
            <DialogDescription>
              Enter the details of your new PG property.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="pgName">PG Name *</Label>
              <Input
                id="pgName"
                placeholder="Enter PG name"
                value={formData.pgName}
                onChange={(e) => setFormData({ ...formData, pgName: e.target.value })}
                data-testid="input-pg-name"
              />
            </div>
            <LocationMapPicker 
              onLocationSelect={(location) => {
                setFormData(prev => ({
                  ...prev,
                  pgAddress: location.address,
                  pgLocation: location.city,
                  latitude: location.lat,
                  longitude: location.lon
                }));
              }}
              selectedLocation={{
                address: formData.pgAddress,
                city: formData.pgLocation,
                lat: formData.latitude,
                lon: formData.longitude
              }}
            />
            <ImageUploader 
              onImageSelect={(base64Image) => {
                setFormData(prev => ({
                  ...prev,
                  imageUrl: base64Image
                }));
              }}
              currentImage={formData.imageUrl}
              label="PG Image (Optional)"
            />
            <div className="grid gap-2">
              <Label htmlFor="totalRooms">Total Rooms</Label>
              <Input
                id="totalRooms"
                type="number"
                placeholder="Enter total rooms"
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                data-testid="input-pg-rooms"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPG} disabled={isSubmitting} data-testid="button-submit-add-pg">
              {isSubmitting ? "Creating..." : "Add PG"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PG Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit PG</DialogTitle>
            <DialogDescription>
              Update the details of your PG property.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="edit-pgName">PG Name *</Label>
              <Input
                id="edit-pgName"
                placeholder="Enter PG name"
                value={formData.pgName}
                onChange={(e) => setFormData({ ...formData, pgName: e.target.value })}
                data-testid="input-edit-pg-name"
              />
            </div>
            <LocationMapPicker 
              onLocationSelect={(location) => {
                setFormData(prev => ({
                  ...prev,
                  pgAddress: location.address,
                  pgLocation: location.city,
                  latitude: location.lat,
                  longitude: location.lon
                }));
              }}
              selectedLocation={{
                address: formData.pgAddress,
                city: formData.pgLocation,
                lat: formData.latitude,
                lon: formData.longitude
              }}
            />
            <ImageUploader 
              onImageSelect={(base64Image) => {
                setFormData(prev => ({
                  ...prev,
                  imageUrl: base64Image
                }));
              }}
              currentImage={formData.imageUrl}
              label="PG Image (Optional)"
            />
            <div className="grid gap-2">
              <Label htmlFor="edit-totalRooms">Total Rooms</Label>
              <Input
                id="edit-totalRooms"
                type="number"
                placeholder="Enter total rooms"
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                data-testid="input-edit-pg-rooms"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPG} disabled={isSubmitting} data-testid="button-submit-edit-pg">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PG Property?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPg?.pgName}"? This action cannot be undone and will remove all associated data including tenants, rooms, and payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePG}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
              data-testid="button-confirm-delete-pg"
            >
              {isSubmitting ? "Deleting..." : "Delete PG"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DesktopLayout>
  );
}
