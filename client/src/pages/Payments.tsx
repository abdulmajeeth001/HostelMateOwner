import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, IndianRupee, Calendar, User, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { usePG } from "@/hooks/use-pg";
import { useToast } from "@/hooks/use-toast";

interface Tenant {
  id: number;
  name: string;
  email: string;
  roomId: number;
}

interface Payment {
  id: number;
  tenantId: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  tenant?: {
    name: string;
    email: string;
  };
}

export default function Payments() {
  const { pg } = usePG();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  
  const [newPayment, setNewPayment] = useState({
    tenantId: "",
    amount: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchData();
  }, [pg]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [paymentsRes, tenantsRes] = await Promise.all([
        fetch("/api/payments", { credentials: "include" }),
        fetch("/api/tenants", { credentials: "include" })
      ]);

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.tenantId || !newPayment.amount || !newPayment.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId: parseInt(newPayment.tenantId),
          amount: parseFloat(newPayment.amount),
          dueDate: new Date(newPayment.dueDate).toISOString(),
        }),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Payment request created successfully",
        });
        setDialogOpen(false);
        setNewPayment({ tenantId: "", amount: "", dueDate: "" });
        fetchData();
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create payment request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment request",
        variant: "destructive",
      });
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    if (filter === "pending") return payment.status === "pending";
    if (filter === "paid") return payment.status === "paid";
    return true;
  });

  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0),
    received: payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Paid</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <DesktopLayout title="Payments">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">₹{stats.total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-2xl font-bold">₹{stats.pending.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold">₹{stats.received.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              data-testid="button-filter-all"
            >
              All
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
              data-testid="button-filter-pending"
            >
              Pending
            </Button>
            <Button
              variant={filter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("paid")}
              data-testid="button-filter-paid"
            >
              Paid
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-payment">
                <Plus className="w-4 h-4 mr-2" />
                Create Payment Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant">Tenant</Label>
                  <Select
                    value={newPayment.tenantId}
                    onValueChange={(value) => setNewPayment({ ...newPayment, tenantId: value })}
                  >
                    <SelectTrigger id="tenant" data-testid="select-tenant">
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name} - {tenant.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    data-testid="input-amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                    data-testid="input-due-date"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePayment} data-testid="button-submit-payment">
                    Create Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {filter !== "all" ? filter : ""} payments found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`payment-item-${payment.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getStatusIcon(payment.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`text-tenant-${payment.id}`}>
                            {payment.tenant?.name || `Tenant #${payment.tenantId}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {format(new Date(payment.dueDate), "MMM dd, yyyy")}</span>
                          </div>
                          {payment.paidAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Paid: {format(new Date(payment.paidAt), "MMM dd, yyyy")}</span>
                            </div>
                          )}
                        </div>
                        {payment.transactionId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Transaction ID: <span className="font-mono">{payment.transactionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg" data-testid={`text-amount-${payment.id}`}>
                          ₹{payment.amount.toLocaleString()}
                        </div>
                        <div>{getStatusBadge(payment.status)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DesktopLayout>
  );
}
