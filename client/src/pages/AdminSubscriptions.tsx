import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard } from "lucide-react";
import DesktopLayout from "@/components/layout/DesktopLayout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxRooms: number;
  maxTenants: number;
  features: string[];
  isActive: boolean;
}

interface PGSubscription {
  id: number;
  pgName: string;
  ownerName: string;
  planName: string;
  billingCycle: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  paidAt: string | null;
}

export default function AdminSubscriptions() {
  const isMobile = useIsMobile();

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const { data: subscriptions } = useQuery<PGSubscription[]>({
    queryKey: ["/api/admin/pg-subscriptions"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const content = (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-subscriptions-title">
          Subscription Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage subscription plans and PG subscriptions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Available pricing tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans?.map((plan) => (
              <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""} data-testid={`card-plan-${plan.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {!plan.isActive && <Badge variant="outline">Inactive</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">₹{plan.monthlyPrice}</div>
                    <div className="text-sm text-muted-foreground">per month</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ₹{plan.yearlyPrice}/year
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-sm">
                      <span className="font-medium">Max Rooms:</span> {plan.maxRooms}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Max Tenants:</span> {plan.maxTenants}
                    </div>
                  </div>
                  {plan.features.length > 0 && (
                    <div className="space-y-1 pt-4 border-t">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-3 w-3" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {plans?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subscription plans configured
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PG Subscriptions</CardTitle>
          <CardDescription>
            {subscriptions?.length || 0} active subscription{subscriptions?.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subscriptions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PG Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions?.map((sub) => (
                    <TableRow key={sub.id} data-testid={`row-subscription-${sub.id}`}>
                      <TableCell className="font-medium">{sub.pgName}</TableCell>
                      <TableCell>{sub.ownerName}</TableCell>
                      <TableCell>{sub.planName}</TableCell>
                      <TableCell className="capitalize">{sub.billingCycle}</TableCell>
                      <TableCell>₹{sub.amount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return isMobile ? (
    <MobileLayout title="Subscriptions">{content}</MobileLayout>
  ) : (
    <DesktopLayout>{content}</DesktopLayout>
  );
}
