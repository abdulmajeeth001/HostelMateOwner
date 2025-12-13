import { useState } from "react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import { usePG, PG } from "@/hooks/use-pg";
import { Building2, Plus, Edit2, Trash2, MapPin, Home, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DesktopLayout title="My PGs">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout title="My PGs">
      <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Manage Your Properties
          </h1>
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="gap-2"
            data-testid="button-add-new-pg"
          >
            <Plus className="h-4 w-4" />
            Add New PG
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage all your PG properties. You can add, edit, or switch between properties.
        </p>
      </div>

      {allPgs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first PG property to start managing tenants and rooms.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="gap-2"
              data-testid="button-add-first-property"
            >
              <Plus className="h-4 w-4" />
              Add Your First PG
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {allPgs.map((pg) => (
            <Card 
              key={pg.id} 
              className={`transition-all ${
                pg.id === currentPg?.id 
                  ? "ring-2 ring-primary border-primary" 
                  : "hover:border-primary/50"
              }`}
              data-testid={`card-pg-${pg.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      pg.id === currentPg?.id 
                        ? "bg-gradient-to-br from-primary to-primary/80" 
                        : "bg-muted"
                    }`}>
                      <Building2 className={`h-6 w-6 ${
                        pg.id === currentPg?.id ? "text-primary-foreground" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {pg.pgName}
                        {pg.id === currentPg?.id && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {pg.pgLocation}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pg.id !== currentPg?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectPG(pg)}
                        className="gap-1"
                        data-testid={`button-select-pg-${pg.id}`}
                      >
                        <Check className="h-3 w-3" />
                        Select
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(pg)}
                      data-testid={`button-edit-pg-${pg.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDeleteDialog(pg)}
                      disabled={allPgs.length === 1}
                      data-testid={`button-delete-pg-${pg.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span>{pg.totalRooms || 0} rooms</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate max-w-[300px]">{pg.pgAddress}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
