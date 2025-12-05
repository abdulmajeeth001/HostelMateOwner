import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LocationPicker from "@/components/LocationPicker";
import { Bell, User, Building, Edit2, Wallet } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [pg, setPg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPg, setEditingPg] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [pgSaveLoading, setPgSaveLoading] = useState(false);
  const [paymentSaveLoading, setPaymentSaveLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", email: "", mobile: "" });
  const [pgForm, setPgForm] = useState({ pgName: "", pgAddress: "", pgLocation: "", totalRooms: 0, rentPaymentDate: null });
  const [paymentForm, setPaymentForm] = useState({ upiId: "" });
  const [originalProfileForm, setOriginalProfileForm] = useState({ name: "", email: "", mobile: "" });
  const [originalPgForm, setOriginalPgForm] = useState({ pgName: "", pgAddress: "", pgLocation: "", totalRooms: 0, rentPaymentDate: null });
  const [originalPaymentForm, setOriginalPaymentForm] = useState({ upiId: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/users/profile", { credentials: 'include' });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData && userData.id) {
            setUser(userData);
            const profileData = { 
              name: userData.name || "", 
              email: userData.email || "", 
              mobile: userData.mobile || "" 
            };
            setProfileForm(profileData);
            setOriginalProfileForm(profileData);
            
            const paymentData = { upiId: userData.upiId || "" };
            setPaymentForm(paymentData);
            setOriginalPaymentForm(paymentData);
          }
        }
        
        const pgRes = await fetch("/api/pg", { credentials: 'include' });
        if (pgRes.ok) {
          const pgData = await pgRes.json();
          if (pgData && pgData.id) {
            setPg(pgData);
            const pgData2 = { 
              pgName: pgData.pgName || "", 
              pgAddress: pgData.pgAddress || "", 
              pgLocation: pgData.pgLocation || "", 
              totalRooms: pgData.totalRooms || 0,
              rentPaymentDate: pgData.rentPaymentDate || null
            };
            setPgForm(pgData2);
            setOriginalPgForm(pgData2);
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

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleCancelProfile = () => {
    setEditingProfile(false);
    setProfileForm(originalProfileForm);
  };

  const handleSaveProfile = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setOriginalProfileForm(profileForm);
        setEditingProfile(false);
        alert("Profile updated successfully");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditPg = () => {
    setEditingPg(true);
  };

  const handleCancelPg = () => {
    setEditingPg(false);
    setPgForm(originalPgForm);
  };

  const handleSavePg = async () => {
    setPgSaveLoading(true);
    try {
      const res = await fetch("/api/pg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(pgForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPg(data);
        setOriginalPgForm(pgForm);
        setEditingPg(false);
        alert("PG details updated successfully");
      } else {
        alert("Failed to update PG details");
      }
    } catch (error) {
      alert("Failed to update PG details");
    } finally {
      setPgSaveLoading(false);
    }
  };

  const handleEditPayment = () => {
    setEditingPayment(true);
  };

  const handleCancelPayment = () => {
    setEditingPayment(false);
    setPaymentForm(originalPaymentForm);
  };

  const handleSavePayment = async () => {
    setPaymentSaveLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(paymentForm),
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setOriginalPaymentForm(paymentForm);
        setEditingPayment(false);
        alert("Payment details updated successfully");
      } else {
        alert("Failed to update payment details");
      }
    } catch (error) {
      alert("Failed to update payment details");
    } finally {
      setPaymentSaveLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <DesktopLayout title="Settings" showNav={true}>
      <div className="max-w-3xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Manage your personal information</CardDescription>
                </div>
              </div>
              {!editingProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditProfile}
                  data-testid="button-edit-profile"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  disabled={!editingProfile}
                  data-testid="input-settings-name" 
                  className={!editingProfile ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  disabled={!editingProfile}
                  data-testid="input-settings-email"
                  className={!editingProfile ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number</Label>
                <Input 
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  disabled={!editingProfile}
                  data-testid="input-settings-mobile"
                  className={!editingProfile ? "bg-muted" : ""}
                />
              </div>
            </div>
            {editingProfile && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saveLoading} 
                  data-testid="button-save-profile"
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelProfile}
                  data-testid="button-cancel-profile"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PG Settings - Only for Owners */}
        {user?.userType === "owner" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>PG Details</CardTitle>
                  <CardDescription>Update your property information</CardDescription>
                </div>
              </div>
              {!editingPg && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditPg}
                  data-testid="button-edit-pg"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>PG Name</Label>
              <Input 
                value={pgForm.pgName}
                onChange={(e) => setPgForm({ ...pgForm, pgName: e.target.value })}
                disabled={!editingPg}
                data-testid="input-settings-pgname"
                className={!editingPg ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={pgForm.pgAddress}
                onChange={(e) => setPgForm({ ...pgForm, pgAddress: e.target.value })}
                disabled={!editingPg}
                data-testid="input-settings-pgaddress"
                className={!editingPg ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Pick Location</Label>
              {editingPg ? (
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
              ) : (
                <Input 
                  value={pgForm.pgLocation}
                  disabled={true}
                  data-testid="input-settings-pglocation"
                  className="bg-muted"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Total Rooms</Label>
              <Input 
                type="number" 
                value={pgForm.totalRooms || 0}
                onChange={(e) => setPgForm({ ...pgForm, totalRooms: parseInt(e.target.value) || 0 })}
                disabled={!editingPg}
                data-testid="input-settings-rooms"
                className={!editingPg ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Rent Payment Date (Day of Month)</Label>
              <Input 
                type="number" 
                min="1"
                max="31"
                value={pgForm.rentPaymentDate || ""}
                onChange={(e) => setPgForm({ ...pgForm, rentPaymentDate: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!editingPg}
                placeholder="e.g., 1 for 1st of month"
                data-testid="input-settings-rent-date"
                className={!editingPg ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Tenants assigned to this PG will get automatic payment requests on this date each month
              </p>
            </div>
            {editingPg && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePg} 
                  disabled={pgSaveLoading} 
                  data-testid="button-save-pg"
                >
                  {pgSaveLoading ? "Updating..." : "Update PG Info"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelPg}
                  data-testid="button-cancel-pg"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Payment Settings - Only for Owners */}
        {user?.userType === "owner" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Payment Settings</CardTitle>
                  <CardDescription>Manage your UPI payment details for receiving rent</CardDescription>
                </div>
              </div>
              {!editingPayment && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditPayment}
                  data-testid="button-edit-payment"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UPI ID</Label>
              <Input 
                value={paymentForm.upiId}
                onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                disabled={!editingPayment}
                placeholder="yourname@upi"
                data-testid="input-settings-upiid"
                className={!editingPayment ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Tenants will use this UPI ID to pay rent. Example: yourname@paytm, yourname@phonepe
              </p>
            </div>
            {editingPayment && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSavePayment} 
                  disabled={paymentSaveLoading} 
                  data-testid="button-save-payment"
                >
                  {paymentSaveLoading ? "Saving..." : "Save UPI Details"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelPayment}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </div>
            </div>
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

      </div>
    </DesktopLayout>
  );
}
