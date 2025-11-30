import { useEffect, useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mail, Phone, Calendar, User } from "lucide-react";

export default function TenantProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/tenant/profile", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MobileLayout title="Profile">Loading...</MobileLayout>;
  }

  const profileFields = [
    { label: "Name", value: profile?.name, icon: User },
    { label: "Email", value: profile?.email, icon: Mail },
    { label: "Phone", value: profile?.phone, icon: Phone },
    { label: "Member Since", value: profile?.joinDate || "N/A", icon: Calendar },
  ];

  return (
    <MobileLayout title="Profile">
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
          <User className="w-12 h-12 text-primary" />
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-3">
        {profileFields.map((field) => (
          <Card key={field.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-secondary rounded-lg p-2">
                  <field.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p
                    className="font-semibold text-sm"
                    data-testid={`text-profile-${field.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {field.value || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
}
