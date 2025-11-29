import MobileLayout from "@/components/layout/MobileLayout";
import { ArrowUpRight, ArrowDownLeft, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRANSACTIONS = [
  { id: 1, name: "Rahul Kumar", type: "received", amount: "₹5,000", date: "Today, 10:30 AM", status: "Success" },
  { id: 2, name: "Electricity Bill", type: "paid", amount: "₹2,400", date: "Yesterday", status: "Success" },
  { id: 3, name: "Amit Singh", type: "received", amount: "₹6,500", date: "28 Nov", status: "Success" },
  { id: 4, name: "Maintenance", type: "paid", amount: "₹500", date: "27 Nov", status: "Pending" },
  { id: 5, name: "Priya Sharma", type: "received", amount: "₹7,000", date: "26 Nov", status: "Success" },
];

export default function Payments() {
  return (
    <MobileLayout title="Payments">
      {/* Balance Card */}
      <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg shadow-primary/30">
        <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Balance</p>
        <h2 className="text-3xl font-bold mb-4">₹42,500</h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-emerald-300" />
              </div>
              <span className="text-xs opacity-80">Income</span>
            </div>
            <p className="font-semibold">₹54,200</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-rose-400/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-rose-300" />
              </div>
              <span className="text-xs opacity-80">Expense</span>
            </div>
            <p className="font-semibold">₹11,700</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button variant="secondary" size="sm" className="rounded-full px-4 bg-primary/10 text-primary hover:bg-primary/20 border-transparent">All</Button>
        <Button variant="outline" size="sm" className="rounded-full px-4">Income</Button>
        <Button variant="outline" size="sm" className="rounded-full px-4">Expense</Button>
        <Button variant="ghost" size="sm" className="rounded-full w-9 h-9 p-0 ml-auto"><Filter className="w-4 h-4" /></Button>
      </div>

      {/* Transactions */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Recent Transactions</h3>
        <div className="space-y-0 divide-y divide-border bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                tx.type === 'received' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
              }`}>
                {tx.type === 'received' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-foreground">{tx.name}</h4>
                <p className="text-xs text-muted-foreground">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${
                  tx.type === 'received' ? 'text-emerald-600' : 'text-foreground'
                }`}>
                  {tx.type === 'received' ? '+' : '-'}{tx.amount}
                </p>
                <p className="text-[10px] text-muted-foreground">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
