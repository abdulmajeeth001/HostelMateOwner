import DesktopLayout from "@/components/layout/DesktopLayout";
import { ArrowUpRight, ArrowDownLeft, Calendar, Filter, Plus, Wallet, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { usePG } from "@/hooks/use-pg";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Payment {
  id: number;
  tenantId: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: string;
  transactionId?: string;
  tenant?: {
    name: string;
    email: string;
  };
}

interface Tenant {
  id: number;
  name: string;
  email: string;
}

export default function Payments() {
  const { pg } = usePG();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ tenantId: "", amount: "", dueDate: "" });

  useEffect(() => {
    fetchData();
  }, [pg]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, tenantsRes] = await Promise.all([
        fetch("/api/payments", { credentials: "include" }),
        fetch("/api/tenants", { credentials: "include" }),
      ]);
      
      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
      }
      
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenants(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!formData.tenantId || !formData.amount || !formData.dueDate) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId: parseInt(formData.tenantId),
          amount: parseFloat(formData.amount),
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });

      if (res.ok) {
        toast.success("Payment request created");
        setDialogOpen(false);
        setFormData({ tenantId: "", amount: "", dueDate: "" });
        fetchData();
      } else {
        toast.error("Failed to create payment request");
      }
    } catch (error) {
      toast.error("Failed to create payment request");
    } finally {
      setCreating(false);
    }
  };

  const handleAutoGeneratePayments = async () => {
    if (!pg?.rentPaymentDate) {
      toast.error("Please set rent payment date in Settings first");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/payments/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchData();
      } else {
        toast.error("Failed to generate payments");
      }
    } catch (error) {
      toast.error("Failed to generate payments");
    } finally {
      setCreating(false);
    }
  };

  // Calculate totals
  const totalBalance = payments.reduce((sum, p) => sum + p.amount, 0);
  const income = payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const expense = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  // Filter transactions
  const getFilteredTransactions = () => {
    return payments.map(payment => ({
      id: payment.id,
      name: payment.tenant?.name || `Tenant #${payment.tenantId}`,
      type: payment.status === "paid" ? "received" : "pending",
      amount: `₹${payment.amount.toLocaleString()}`,
      date: format(new Date(payment.dueDate), "MMM dd"),
      status: payment.status === "paid" ? "Success" : "Pending",
    })).filter(tx => {
      if (filter === "all") return true;
      if (filter === "income") return tx.type === "received";
      if (filter === "expense") return tx.type === "pending";
      return true;
    });
  };

  const transactions = getFilteredTransactions();

  const cashflowStats = [
    { 
      label: "Total Revenue", 
      value: `₹${totalBalance.toLocaleString()}`, 
      icon: DollarSign, 
      gradient: "from-purple-500 to-pink-600",
      description: "All time"
    },
    { 
      label: "Received", 
      value: `₹${income.toLocaleString()}`, 
      icon: ArrowDownLeft, 
      gradient: "from-emerald-500 to-green-600",
      description: "Paid"
    },
    { 
      label: "Pending", 
      value: `₹${expense.toLocaleString()}`, 
      icon: ArrowUpRight, 
      gradient: "from-orange-500 to-red-600",
      description: "Outstanding"
    },
    { 
      label: "Transactions", 
      value: payments.length.toString(), 
      icon: TrendingUp, 
      gradient: "from-blue-500 to-cyan-600",
      description: "Total"
    },
  ];

  return (
    <DesktopLayout title="Payments" showNav={false}>
      {/* Hero Section with Gradient */}
      <div className="relative -mx-6 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        <div className="relative px-8 py-10 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-2">Payment Management</h2>
              <p className="text-white/80 text-sm">Track rent payments and manage tenant dues</p>
            </div>
            <div className="flex gap-3">
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white"
                onClick={handleAutoGeneratePayments}
                disabled={creating || !pg?.rentPaymentDate}
                data-testid="button-auto-generate"
              >
                Auto Generate
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 text-white transition-all duration-300"
                    data-testid="button-create-payment"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Request
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Payment Request</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenant">Tenant</Label>
                      <Select value={formData.tenantId} onValueChange={(val) => setFormData({...formData, tenantId: val})}>
                        <SelectTrigger id="tenant" data-testid="select-tenant">
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants.map(t => (
                            <SelectItem key={t.id} value={t.id.toString()}>
                              {t.name}
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
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        data-testid="input-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input 
                        id="dueDate" 
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        data-testid="input-due-date"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePayment} disabled={creating} data-testid="button-submit">
                        {creating ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cashflowStats.map((stat, i) => (
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

      {/* Filters */}
      <div className="flex gap-2 mb-6 items-center">
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          size="sm" 
          className="rounded-full px-4"
          onClick={() => setFilter("all")}
          data-testid="button-filter-all"
        >
          All
        </Button>
        <Button 
          variant={filter === "income" ? "default" : "outline"} 
          size="sm" 
          className="rounded-full px-4"
          onClick={() => setFilter("income")}
          data-testid="button-filter-income"
        >
          Received
        </Button>
        <Button 
          variant={filter === "expense" ? "default" : "outline"} 
          size="sm" 
          className="rounded-full px-4"
          onClick={() => setFilter("expense")}
          data-testid="button-filter-pending"
        >
          Pending
        </Button>
      </div>

      {/* Transactions */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Payment Timeline</h3>
            </div>
            <span className="text-sm text-muted-foreground font-medium">{transactions.length} payments</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-muted-foreground">Loading payments...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-no-payments">
                {filter !== "all" 
                  ? "Try adjusting your filters to see more results" 
                  : "Create your first payment request to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="group flex items-center gap-4 p-4 bg-gradient-to-r from-white to-gray-50 hover:from-purple-50 hover:to-blue-50 rounded-xl border-2 border-transparent hover:border-purple-200 transition-all duration-300"
                  data-testid={`payment-row-${tx.id}`}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform duration-300 group-hover:scale-110",
                    tx.type === 'received' 
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                      : 'bg-gradient-to-br from-orange-500 to-red-600'
                  )}>
                    {tx.type === 'received' ? (
                      <ArrowDownLeft className="w-6 h-6 text-white" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground mb-0.5" data-testid={`text-name-${tx.id}`}>{tx.name}</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-bold",
                        tx.status === "Success" 
                          ? "bg-gradient-to-r from-emerald-100 to-green-100 text-green-700"
                          : "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700"
                      )} data-testid={`text-status-${tx.id}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold text-lg",
                      tx.type === 'received' 
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent' 
                        : 'text-foreground'
                    )} data-testid={`text-amount-${tx.id}`}>
                      {tx.type === 'received' ? '+' : ''}{tx.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DesktopLayout>
  );
}
