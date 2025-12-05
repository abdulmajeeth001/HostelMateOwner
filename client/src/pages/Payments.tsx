import DesktopLayout from "@/components/layout/DesktopLayout";
import { ArrowUpRight, ArrowDownLeft, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { usePG } from "@/hooks/use-pg";

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

export default function Payments() {
  const { pg } = usePG();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    fetchPayments();
  }, [pg]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payments", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
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

  return (
    <DesktopLayout title="Payments">
      {/* Balance Card */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg shadow-primary/30 mb-6">
        <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Balance</p>
        <h2 className="text-3xl font-bold mb-4">₹{totalBalance.toLocaleString()}</h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-emerald-300" />
              </div>
              <span className="text-xs opacity-80">Income</span>
            </div>
            <p className="font-semibold">₹{income.toLocaleString()}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-rose-400/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-rose-300" />
              </div>
              <span className="text-xs opacity-80">Pending</span>
            </div>
            <p className="font-semibold">₹{expense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
        <Button 
          variant={filter === "all" ? "default" : "outline"} 
          size="sm" 
          className={filter === "all" ? "rounded-full px-4" : "rounded-full px-4"}
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
          Income
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="rounded-full w-9 h-9 p-0 ml-auto"
          data-testid="button-filter-icon"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Recent Transactions</h3>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No transactions found</div>
        ) : (
          <div className="space-y-0 divide-y divide-border bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {transactions.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors"
                data-testid={`payment-row-${tx.id}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.type === 'received' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {tx.type === 'received' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground" data-testid={`text-name-${tx.id}`}>{tx.name}</h4>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    tx.type === 'received' ? 'text-emerald-600' : 'text-foreground'
                  }`} data-testid={`text-amount-${tx.id}`}>
                    {tx.type === 'received' ? '+' : '-'}{tx.amount}
                  </p>
                  <p className="text-[10px] text-muted-foreground" data-testid={`text-status-${tx.id}`}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}
