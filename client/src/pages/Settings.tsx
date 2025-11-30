import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LocationPicker from "@/components/LocationPicker";
import { Bell, Lock, User, Building, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  const [user, setUser] = useState<any>(null);
  const [pg, setPg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pgSaveLoading, setPgSaveLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", email: "", mobile: "" });
  const [pgForm, setPgForm] = useState({ pgName: "", pgAddress: "", pgLocation: "", totalRooms: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/users/profile");
        
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData && userData.id) {
            setUser(userData);
            setProfileForm({ 
              name: userData.name || "", 
              email: userData.email || "", 
              mobile: userData.mobile || "" 
            });
          }
        }
        
        const pgRes = await fetch("/api/pg");
        if (pgRes.ok) {
          const pgData = await pgRes.json();
          if (pgData && pgData.id) {
            setPg(pgData);
            setPgForm({ 
              pgName: pgData.pgName || "", 
              pgAddress: pgData.pgAddress || "", 
              pgLocation: pgData.pgLocation || "", 
              totalRooms: pgData.totalRooms || 0 
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      
      if (res.ok) {
        try {
          const data = await res.json();
          setUser(data.user || data);
          alert("Profile updated successfully");
        } catch (e) {
          alert("Profile updated successfully");
        }
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSavePg = async () => {
    setPgSaveLoading(true);
    try {
      const res = await fetch("/api/pg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pgForm),
      });
      
      if (res.ok) {
        try {
          const data = await res.json();
          setPg(data.pg || data);
          alert("PG details updated successfully");
        } catch (e) {
          alert("PG details updated successfully");
        }
      } else {
        alert("Failed to update PG details");
      }
    } catch (error) {
      alert("Failed to update PG details");
    } finally {
      setPgSaveLoading(false);
    }
  };

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

  if (loading) return <div>Loading...</div>;

  return (
    <DesktopLayout title="Settings" showNav={true}>
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
                <Input 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  data-testid="input-settings-name" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  data-testid="input-settings-email" 
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input 
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  data-testid="input-settings-mobile" 
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saveLoading} data-testid="button-save-profile">
              {saveLoading ? "Saving..." : "Save Changes"}
            </Button>
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
              <Input 
                value={pgForm.pgName}
                onChange={(e) => setPgForm({ ...pgForm, pgName: e.target.value })}
                data-testid="input-settings-pgname" 
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={pgForm.pgAddress}
                onChange={(e) => setPgForm({ ...pgForm, pgAddress: e.target.value })}
                data-testid="input-settings-pgaddress" 
              />
            </div>
            <div className="space-y-2">
              <Label>Pick Location</Label>
              <LocationPicker 
                onLocationSelect={(location) => {
                  setPgForm(prev => ({
                    ...prev,
                    pgAddress: location.address,
                    pgLocation: location.city
                  }));
                }}
                selectedLocation={{
                  address: pgForm.pgAddress,
                  city: pgForm.pgLocation
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Rooms</Label>
              <Input 
                type="number" 
                value={pgForm.totalRooms || 0}
                onChange={(e) => setPgForm({ ...pgForm, totalRooms: parseInt(e.target.value) || 0 })}
                data-testid="input-settings-rooms" 
              />
            </div>
            <Button onClick={handleSavePg} disabled={pgSaveLoading} data-testid="button-save-pg">
              {pgSaveLoading ? "Updating..." : "Update PG Info"}
            </Button>
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
                <p className="text-sm text-muted-foreground">Get notified about maintenance requests</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" data-testid="checkbox-maintenance-alerts" />
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={() => setShowLogoutConfirm(true)}
              disabled={isLoggingOut}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 w-4 h-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You'll need to login again to access your account.
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600">
              Logout
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DesktopLayout>
  );
}
