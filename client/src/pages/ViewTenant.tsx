import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useRoute } from "wouter";
import { ChevronLeft, Download, FileText, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import pako from "pako";

export default function ViewTenant() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/tenants/view/:id");
  const [showAadharPreview, setShowAadharPreview] = useState(false);
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

  // Decompress and decode document
  const decompressedDocument = useMemo(() => {
    if (!tenant?.aadharCard) return null;
    
    try {
      const aadharCard = tenant.aadharCard;
      
      // If not gzip, return as-is
      if (!aadharCard.includes("application/gzip")) {
        return aadharCard;
      }
      
      // Extract base64 part
      const dataPart = aadharCard.split(",")[1];
      if (!dataPart) return null;
      
      // Decode base64
      const binaryString = atob(dataPart);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decompress
      const decompressed = pako.inflate(bytes);
      const decompressedString = new TextDecoder().decode(decompressed);
      
      // Return as data URI
      return decompressedString.startsWith("data:")
        ? decompressedString
        : `data:application/octet-stream;base64,${btoa(decompressedString)}`;
    } catch (err) {
      console.error("Decompression failed:", err);
      return null;
    }
  }, [tenant?.aadharCard]);

  // Detect if document is PDF or image
  const isImage = useMemo(() => {
    if (!decompressedDocument) return false;
    return decompressedDocument.startsWith("data:image");
  }, [decompressedDocument]);

  const isPdf = useMemo(() => {
    if (!decompressedDocument) return false;
    return decompressedDocument.includes("pdf") || 
           decompressedDocument.includes("octet-stream");
  }, [decompressedDocument]);

  const downloadDocument = () => {
    if (!tenant?.aadharCard) return;
    
    try {
      const link = document.createElement("a");
      link.href = tenant.aadharCard;
      link.download = `${tenant.name}-aadhar-card`;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    }
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
        <div className="text-center text-destructive py-8">Failed to load tenant details</div>
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
      <div className="space-y-4 pb-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white flex flex-col items-center gap-4">
          {tenant.tenantImage ? (
            <img
              src={tenant.tenantImage}
              alt={tenant.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              data-testid="img-tenant-profile"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white">
              <User className="w-12 h-12" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold" data-testid="text-tenant-name">{tenant.name}</h1>
            <p className="text-sm text-blue-100">Room {tenant.roomNumber}</p>
          </div>
        </div>

        {/* Contact Information */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium w-20">Email:</span>
              <p className="font-medium break-all" data-testid="text-tenant-email">{tenant.email || "N/A"}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium w-20">Phone:</span>
              <p className="font-medium" data-testid="text-tenant-phone">{tenant.phone}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-muted-foreground text-sm font-medium w-20">Status:</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium" data-testid="text-tenant-status">
                {tenant.status?.toUpperCase() || "ACTIVE"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Room & Rent Information */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Room & Rent Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm font-medium">Room Number:</span>
              <p className="font-bold text-lg" data-testid="text-tenant-room-number">{tenant.roomNumber}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm font-medium">Monthly Rent:</span>
              <p className="font-bold text-lg text-green-600" data-testid="text-tenant-rent">
                ₹{tenant.monthlyRent}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aadhar/ID Card Section */}
        {tenant.aadharCard && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Aadhar / ID Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-purple-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-purple-700 font-medium">
                  {isPdf ? "PDF Document" : "Image Document"} uploaded
                </span>
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <Button
                onClick={downloadDocument}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                data-testid="button-download-aadhar"
              >
                <Download className="w-4 h-4" />
                Download Document
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAadharPreview(!showAadharPreview)}
                className="w-full"
                data-testid="button-preview-aadhar"
              >
                {showAadharPreview ? "Hide Preview" : "View Preview"}
              </Button>
              
              {showAadharPreview && decompressedDocument && (
                <div className="mt-4 border rounded-lg p-3 bg-gray-50">
                  <p className="text-xs text-muted-foreground mb-2">Document Preview:</p>
                  <div className="bg-white rounded border p-2 max-h-96 overflow-auto">
                    {isImage ? (
                      <img src={decompressedDocument} alt="Aadhar Card" className="w-full" data-testid="img-aadhar-preview" />
                    ) : isPdf ? (
                      <iframe
                        src={decompressedDocument}
                        className="w-full h-80 border-0 rounded"
                        data-testid="iframe-pdf-preview"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Document type not supported for preview</p>
                        <p className="text-xs mt-2">Click download to view the full document</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile Photo */}
        {tenant.tenantImage && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={tenant.tenantImage}
                alt={tenant.name}
                className="w-full h-auto rounded-lg object-cover max-h-80"
                data-testid="img-tenant-full"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
