import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Calendar, Copy, Check, AlertCircle } from "lucide-react";
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
      {/* Hero Section */}
      <div className="relative -mx-4 -mt-6 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative px-6 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Payments
            </h1>
            <p className="text-purple-100 text-sm">
              Track your rent payments and history
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 opacity-50 group-hover:opacity-70 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <ArrowDownLeft className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Paid</span>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mt-1" data-testid="text-payments-paid">
              ₹{totalPaid}
            </p>
          </CardContent>
        </Card>
        <Card className="relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-50 group-hover:opacity-70 transition-opacity" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Due</span>
            <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-1" data-testid="text-payments-due">
              ₹{totalDue}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <h3 className="font-bold text-xl mb-4 text-gray-800">Payment History</h3>
      <div className="space-y-3">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <Card
              key={payment.id}
              data-testid={`card-payment-${payment.id}`}
              className="border-2 hover:border-purple-200 hover:shadow-lg transition-all duration-300"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                        payment.status === "paid"
                          ? "bg-gradient-to-br from-emerald-500 to-green-600"
                          : payment.status === "pending_approval"
                          ? "bg-gradient-to-br from-orange-500 to-yellow-500"
                          : "bg-gradient-to-br from-gray-400 to-gray-500"
                      }`}
                    >
                      {payment.status === "paid" ? (
                        <ArrowDownLeft className="w-6 h-6 text-white" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base text-gray-800 mb-1">{payment.type}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-gray-800 mb-1">₹{payment.amount}</p>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                        payment.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : payment.status === "pending_approval"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                      data-testid={`status-payment-${payment.id}`}
                    >
                      {payment.status === "pending_approval" ? "Pending Approval" : payment.status}
                    </p>
                    {payment.status === "pending" && (
                      <Button
                        size="sm"
                        className="mt-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
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
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-gray-600 font-medium">No payments yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Pay Rent
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Make payment using UPI and enter the transaction ID
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {ownerUpi?.upiId ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Owner's UPI ID</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={ownerUpi.upiId}
                      readOnly
                      className="bg-purple-50 border-2 font-mono"
                      data-testid="input-owner-upi"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyUpi}
                      className="border-2 hover:border-purple-300 hover:bg-purple-50"
                      data-testid="button-copy-upi"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Copy this UPI ID and make payment using any UPI app
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Amount to Pay</Label>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4">
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid="input-payment-amount">
                      ₹{selectedPayment?.amount || 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Transaction ID / UTR Number</Label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID after payment"
                    className="border-2 focus:border-purple-400"
                    data-testid="input-transaction-id"
                  />
                  <p className="text-xs text-gray-600">
                    After making the payment, enter the transaction ID/UTR number from your payment app
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-gray-700 font-medium">Owner has not set up UPI ID yet</p>
                <p className="text-sm text-gray-600 mt-1">Please contact your owner</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="border-2"
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={!ownerUpi?.upiId || submitting || !transactionId.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
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
