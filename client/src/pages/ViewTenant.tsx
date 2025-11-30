import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function ViewTenant() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/tenants/view/:id");
  const tenantId = params?.id ? parseInt(params.id) : null;

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch tenant");
      return res.json();
    },
    enabled: !!tenantId,
  });

  const decompressDocument = (compressedBase64: string): string => {
    try {
      if (!compressedBase64) return "";
      
      const dataPart = compressedBase64.split(",")[1] || compressedBase64;
      const binaryString = atob(dataPart);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Try to decompress if gzipped
      try {
        const pako = require("pako");
        const decompressed = pako.inflate(bytes);
        const decompressedBinary = String.fromCharCode.apply(null, Array.from(decompressed));
        return btoa(decompressedBinary);
      } catch {
        return dataPart;
      }
    } catch (error) {
      console.error("Decompression failed:", error);
      return "";
    }
  };

  const downloadDocument = () => {
    if (!tenant?.aadharCard) return;
    
    const link = document.createElement("a");
    link.href = tenant.aadharCard;
    link.download = `${tenant.name}-aadhar.pdf`;
    link.click();
  };

  if (isLoading) {
    return (
      <MobileLayout
        title="View Tenant"
        action={
          <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
        }
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading tenant details...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error || !tenant) {
    return (
      <MobileLayout
        title="View Tenant"
        action={
          <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
        }
      >
        <div className="text-center text-destructive">Failed to load tenant details</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="Tenant Profile"
      action={
        <Button variant="ghost" size="icon" onClick={() => setLocation("/tenants")}>
          <ChevronLeft className="w-6 h-6" />
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Photo */}
        {tenant.tenantImage && (
          <div className="flex justify-center">
            <img
              src={tenant.tenantImage}
              alt={tenant.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary"
            />
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{tenant.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium" data-testid="text-tenant-email">{tenant.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="font-medium" data-testid="text-tenant-phone">{tenant.phone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Room</p>
              <p className="font-medium" data-testid="text-tenant-room">Room {tenant.roomNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Rent</p>
              <p className="font-medium" data-testid="text-tenant-rent">₹{tenant.monthlyRent}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium" data-testid="text-tenant-status">{tenant.status || "Active"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Aadhar Card */}
        {tenant.aadharCard && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aadhar/ID Proof</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={downloadDocument}
                className="w-full gap-2"
                data-testid="button-download-aadhar"
              >
                <Download className="w-4 h-4" />
                Download Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
