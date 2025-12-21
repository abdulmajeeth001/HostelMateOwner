import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Zap, Calendar, FileText, Eye, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

interface ElectricityBillingCycle {
  id: number;
  pgId: number;
  ownerId: number;
  periodStart: string;
  periodEnd: string;
  billingMonth: string;
  invoiceNumber: string | null;
  totalAmount: string;
  status: string;
  confirmedAt: string | null;
  createdAt: string;
}

interface RoomBill {
  id: number;
  roomNumber: string;
  meterNumber: string | null;
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: string;
  roomAmount: string;
  notes: string | null;
  sharing: number;
  tenantIds: number[] | null;
}

interface TenantCharge {
  tenantName: string;
  roomNumber: string;
  amount: string;
  dueDate: string;
}

interface CycleSummary {
  cycle: ElectricityBillingCycle;
  roomBills: RoomBill[];
  tenantCharges: TenantCharge[];
  totalRoomAmount: number;
  totalTenantCharges: number;
}

export default function ElectricityHistory() {
  const isMobile = useIsMobile();

  return isMobile ? <ElectricityHistoryMobile /> : <ElectricityHistoryDesktop />;
}

function ElectricityHistoryDesktop() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCycle, setSelectedCycle] = useState<ElectricityBillingCycle | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: cycles = [], isLoading } = useQuery<ElectricityBillingCycle[]>({
    queryKey: ["/api/electricity/cycles"],
    queryFn: async () => {
      const response = await fetch("/api/electricity/cycles", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch cycles");
      return response.json();
    },
  });

  const { data: cycleSummary, isLoading: loadingSummary } = useQuery<CycleSummary>({
    queryKey: [`/api/electricity/cycles/${selectedCycle?.id}/summary`],
    enabled: !!selectedCycle && detailsDialogOpen,
    queryFn: async () => {
      const response = await fetch(`/api/electricity/cycles/${selectedCycle?.id}/summary`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
  });

  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch =
      cycle.billingMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cycle.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600 hover:bg-green-700">Confirmed</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (cycle: ElectricityBillingCycle) => {
    setSelectedCycle(cycle);
    setDetailsDialogOpen(true);
  };

  return (
    <DesktopLayout title="Electricity Bill History">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent" data-testid="text-eb-history-title">
            Electricity Bill History
          </h1>
          <p className="text-muted-foreground mt-2">
            View all electricity billing cycles and their details
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by month or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-cycles"
            />
          </div>
        </div>

        {/* Cycles Table */}
        <Card className="border-2 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Billing Cycles</CardTitle>
                <CardDescription>{filteredCycles.length} cycle{filteredCycles.length !== 1 ? 's' : ''} found</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center animate-pulse">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-muted-foreground">Loading billing cycles...</p>
              </div>
            ) : filteredCycles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No billing cycles found</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-no-cycles">
                  {searchQuery ? "Try adjusting your search" : "Create your first electricity bill to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Billing Month</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Confirmed At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCycles.map((cycle) => (
                      <TableRow key={cycle.id} data-testid={`row-cycle-${cycle.id}`}>
                        <TableCell className="font-medium">{format(new Date(cycle.billingMonth), "MMM yyyy")}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(cycle.periodStart), "dd MMM")} - {format(new Date(cycle.periodEnd), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">{cycle.invoiceNumber || "-"}</TableCell>
                        <TableCell className="font-semibold">₹{parseFloat(cycle.totalAmount).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cycle.confirmedAt ? format(new Date(cycle.confirmedAt), "dd MMM yyyy, hh:mm a") : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(cycle)}
                            data-testid={`button-view-details-${cycle.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Billing Cycle Details</DialogTitle>
          </DialogHeader>
          {loadingSummary ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center animate-pulse">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-muted-foreground">Loading details...</p>
            </div>
          ) : cycleSummary ? (
            <div className="space-y-6">
              {/* Cycle Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Billing Month</p>
                  <p className="font-semibold">{format(new Date(cycleSummary.cycle.billingMonth), "MMMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-semibold">
                    {format(new Date(cycleSummary.cycle.periodStart), "dd MMM")} - {format(new Date(cycleSummary.cycle.periodEnd), "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-semibold">{cycleSummary.cycle.invoiceNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-lg">₹{parseFloat(cycleSummary.cycle.totalAmount).toLocaleString()}</p>
                </div>
              </div>

              {/* Room Bills */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Room Bills ({cycleSummary.roomBills.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Room</TableHead>
                        <TableHead>Meter</TableHead>
                        <TableHead>Prev Reading</TableHead>
                        <TableHead>Current Reading</TableHead>
                        <TableHead>Units</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cycleSummary.roomBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.roomNumber}</TableCell>
                          <TableCell className="text-sm">{bill.meterNumber || "-"}</TableCell>
                          <TableCell>{bill.previousReading}</TableCell>
                          <TableCell>{bill.currentReading}</TableCell>
                          <TableCell className="font-semibold">{bill.unitsConsumed}</TableCell>
                          <TableCell>₹{parseFloat(bill.ratePerUnit).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">₹{parseFloat(bill.roomAmount).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tenant Charges */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Tenant Charges ({cycleSummary.tenantCharges.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant Name</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cycleSummary.tenantCharges.map((charge, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{charge.tenantName}</TableCell>
                          <TableCell>{charge.roomNumber}</TableCell>
                          <TableCell className="font-semibold">₹{parseFloat(charge.amount).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{format(new Date(charge.dueDate), "dd MMM yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DesktopLayout>
  );
}

function ElectricityHistoryMobile() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCycle, setSelectedCycle] = useState<ElectricityBillingCycle | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: cycles = [], isLoading } = useQuery<ElectricityBillingCycle[]>({
    queryKey: ["/api/electricity/cycles"],
    queryFn: async () => {
      const response = await fetch("/api/electricity/cycles", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch cycles");
      return response.json();
    },
  });

  const { data: cycleSummary, isLoading: loadingSummary } = useQuery<CycleSummary>({
    queryKey: [`/api/electricity/cycles/${selectedCycle?.id}/summary`],
    enabled: !!selectedCycle && detailsDialogOpen,
    queryFn: async () => {
      const response = await fetch(`/api/electricity/cycles/${selectedCycle?.id}/summary`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
  });

  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch =
      cycle.billingMonth.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cycle.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600 hover:bg-green-700 text-xs">Confirmed</Badge>;
      case "draft":
        return <Badge variant="secondary" className="text-xs">Draft</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const handleViewDetails = (cycle: ElectricityBillingCycle) => {
    setSelectedCycle(cycle);
    setDetailsDialogOpen(true);
  };

  return (
    <MobileLayout title="EB History">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent" data-testid="text-eb-history-title-mobile">
            EB History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All electricity billing cycles
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-cycles-mobile"
          />
        </div>

        {/* Cycles List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center animate-pulse">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          ) : filteredCycles.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <p className="text-sm text-muted-foreground" data-testid="text-no-cycles-mobile">
                  {searchQuery ? "No cycles match your search" : "No billing cycles yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCycles.map((cycle, index) => (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card
                  className="border-2 hover:border-yellow-200 transition-colors cursor-pointer"
                  onClick={() => handleViewDetails(cycle)}
                  data-testid={`card-cycle-mobile-${cycle.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shrink-0">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{format(new Date(cycle.billingMonth), "MMM yyyy")}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(cycle.periodStart), "dd MMM")} - {format(new Date(cycle.periodEnd), "dd MMM")}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(cycle.status)}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-bold text-lg">₹{parseFloat(cycle.totalAmount).toLocaleString()}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cycle Details</DialogTitle>
          </DialogHeader>
          {loadingSummary ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center animate-pulse">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : cycleSummary ? (
            <div className="space-y-4">
              {/* Cycle Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Month</p>
                  <p className="font-semibold">{format(new Date(cycleSummary.cycle.billingMonth), "MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold">₹{parseFloat(cycleSummary.cycle.totalAmount).toLocaleString()}</p>
                </div>
              </div>

              {/* Room Bills */}
              <div>
                <h3 className="font-semibold mb-2 text-sm">Room Bills ({cycleSummary.roomBills.length})</h3>
                <div className="space-y-2">
                  {cycleSummary.roomBills.map((bill) => (
                    <Card key={bill.id} className="border">
                      <CardContent className="p-3 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Room {bill.roomNumber}</span>
                          <span className="font-bold">₹{parseFloat(bill.roomAmount).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Units: {bill.unitsConsumed}</div>
                          <div>Rate: ₹{parseFloat(bill.ratePerUnit).toFixed(2)}/unit</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tenant Charges */}
              <div>
                <h3 className="font-semibold mb-2 text-sm">Tenant Charges ({cycleSummary.tenantCharges.length})</h3>
                <div className="space-y-2">
                  {cycleSummary.tenantCharges.map((charge, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold">{charge.tenantName}</span>
                          <span className="font-bold">₹{parseFloat(charge.amount).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Room {charge.roomNumber} • Due: {format(new Date(charge.dueDate), "dd MMM yyyy")}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
