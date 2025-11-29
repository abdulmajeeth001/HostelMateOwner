import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Lock, User, Building, CreditCard, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      if (res.ok) {
        setLocation("/");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DesktopLayout title="Settings" showNav={false}>
      <div className="max-w-3xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input defaultValue="Owner Name" data-testid="input-settings-name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="owner@example.com" data-testid="input-settings-email" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input defaultValue="+91 98765 43210" data-testid="input-settings-mobile" />
              </div>
            </div>
            <Button data-testid="button-save-profile">Save Changes</Button>
          </CardContent>
        </Card>

        {/* PG Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <CardTitle>PG Details</CardTitle>
            </div>
            <CardDescription>Update your property information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>PG Name</Label>
              <Input defaultValue="My PG Home" data-testid="input-settings-pgname" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input defaultValue="123 Main Street, City" data-testid="input-settings-pgaddress" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location/Area</Label>
                <Input defaultValue="Downtown" data-testid="input-settings-pglocation" />
              </div>
              <div className="space-y-2">
                <Label>Total Rooms</Label>
                <Input type="number" defaultValue="42" data-testid="input-settings-rooms" />
              </div>
            </div>
            <Button data-testid="button-save-pg">Update PG Info</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Payment Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified when rent is due</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" data-testid="checkbox-payment-reminder" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Complaint Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about new complaints</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" data-testid="checkbox-complaint-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Maintenance Updates</p>
                <p className="text-sm text-muted-foreground">Get updates on scheduled maintenance</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" data-testid="checkbox-maintenance-updates" />
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>Manage your plan and billing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div>
                <p className="font-medium text-foreground">Current Plan</p>
                <p className="text-sm text-muted-foreground">Pro Plan - ₹999/month</p>
              </div>
              <Button variant="outline" data-testid="button-upgrade-plan">Upgrade Plan</Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Next Billing Date: December 15, 2024</p>
              <Button variant="outline" className="w-full" data-testid="button-billing-history">View Billing History</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" data-testid="button-change-password">Change Password</Button>
            <Button variant="outline" className="w-full" data-testid="button-2fa">Enable Two-Factor Authentication</Button>
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setShowLogoutConfirm(true)}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You'll need to login again to access your account.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel data-testid="button-cancel-logout">Cancel</AlertDialogCancel>
            <Button 
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              data-testid="button-confirm-logout"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DesktopLayout>
  );
}
