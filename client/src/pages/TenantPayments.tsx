import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";

export default function TenantPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/tenant/payments", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLayout title="Payments">Loading...</MobileLayout>;
  }

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const totalDue = payments
    .filter((p) => p.status !== "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <MobileLayout title="Payments">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Total Paid</span>
            </div>
            <p className="text-xl font-bold text-emerald-600" data-testid="text-payments-paid">
              ₹{totalPaid}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-muted-foreground">Total Due</span>
            </div>
            <p className="text-xl font-bold text-orange-600" data-testid="text-payments-due">
              ₹{totalDue}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <h3 className="font-semibold text-lg mb-3">Payment History</h3>
      <div className="space-y-2">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <Card
              key={payment.id}
              data-testid={`card-payment-${payment.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.status === "paid"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      {payment.status === "paid" ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{payment.type}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{payment.amount}</p>
                    <p
                      className={`text-xs font-medium ${
                        payment.status === "paid"
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }`}
                    >
                      {payment.status}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No payments yet.
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
