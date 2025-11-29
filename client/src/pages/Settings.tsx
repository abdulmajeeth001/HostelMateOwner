import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Lock, User, Building, CreditCard } from "lucide-react";

export default function Settings() {
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
                <Input defaultValue="Owner Name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="owner@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input defaultValue="+91 98765 43210" />
              </div>
            </div>
            <Button>Save Changes</Button>
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
              <Input defaultValue="My PG Home" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input defaultValue="123 Main Street, City" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location/Area</Label>
                <Input defaultValue="Downtown" />
              </div>
              <div className="space-y-2">
                <Label>Total Rooms</Label>
                <Input type="number" defaultValue="42" />
              </div>
            </div>
            <Button>Update PG Info</Button>
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
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Complaint Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about new complaints</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Maintenance Updates</p>
                <p className="text-sm text-muted-foreground">Get updates on scheduled maintenance</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" />
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
              <Button variant="outline">Upgrade Plan</Button>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Next Billing Date: December 15, 2024</p>
              <Button variant="outline" className="w-full">View Billing History</Button>
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
            <Button variant="outline" className="w-full">Change Password</Button>
            <Button variant="outline" className="w-full">Enable Two-Factor Authentication</Button>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive">Logout from all devices</Button>
          </CardContent>
        </Card>
      </div>
    </DesktopLayout>
  );
}
