import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Calendar, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TenantPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerUpi, setOwnerUpi] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchOwnerUpi();
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

  const fetchOwnerUpi = async () => {
    try {
      const res = await fetch("/api/tenant/owner-upi", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOwnerUpi(data);
      }
    } catch (err) {
      console.error("Failed to fetch owner UPI:", err);
    }
  };

  const handlePayNow = (payment: any) => {
    setSelectedPayment(payment);
    setTransactionId("");
    setIsPaymentDialogOpen(true);
  };

  const handleCopyUpi = () => {
    if (ownerUpi?.upiId) {
      navigator.clipboard.writeText(ownerUpi.upiId);
      setIsCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error("Please enter transaction ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/payments/${selectedPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "paid",
          paymentMethod: "upi",
          transactionId: transactionId.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Payment submitted successfully!");
        setIsPaymentDialogOpen(false);
        fetchPayments(); // Refresh payment list
      } else {
        toast.error("Failed to submit payment");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      toast.error("Failed to submit payment");
    } finally {
      setSubmitting(false);
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
                    {payment.status === "pending" && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => handlePayNow(payment)}
                        data-testid={`button-pay-${payment.id}`}
                      >
                        Pay Now
                      </Button>
                    )}
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

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Rent</DialogTitle>
            <DialogDescription>
              Make payment using UPI and enter the transaction ID
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ownerUpi?.upiId ? (
              <>
                <div className="space-y-2">
                  <Label>Owner's UPI ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={ownerUpi.upiId}
                      readOnly
                      className="bg-muted"
                      data-testid="input-owner-upi"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyUpi}
                      data-testid="button-copy-upi"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy this UPI ID and make payment using any UPI app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Amount to Pay</Label>
                  <Input
                    value={`₹${selectedPayment?.amount || 0}`}
                    readOnly
                    className="bg-muted font-bold"
                    data-testid="input-payment-amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Transaction ID / UTR Number</Label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID after payment"
                    data-testid="input-transaction-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    After making the payment, enter the transaction ID/UTR number from your payment app
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Owner has not set up UPI ID yet. Please contact your owner.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={!ownerUpi?.upiId || submitting || !transactionId.trim()}
              data-testid="button-submit-payment"
            >
              {submitting ? "Submitting..." : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
