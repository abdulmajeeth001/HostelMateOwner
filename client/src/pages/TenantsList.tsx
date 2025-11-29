import MobileLayout from "@/components/layout/MobileLayout";
import { Search, UserPlus, Phone, Mail, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function TenantsList() {
  const [search, setSearch] = useState("");

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await fetch("/api/tenants");
      if (!res.ok) throw new Error("Failed to fetch tenants");
      return res.json();
    },
  });

  const filteredTenants = tenants.filter((t: any) => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.roomNumber.includes(search)
  ).map((t: any) => ({
    id: t.id,
    name: t.name,
    room: t.roomNumber,
    rent: `₹${t.monthlyRent}`,
    phone: t.phone,
    status: "Active",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`
  }));

  return (
    <MobileLayout title="Tenants">
      {/* Search & Add */}
      <div className="flex gap-2 sticky top-0 bg-background z-10 pb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or room..." 
            className="pl-9 bg-secondary border-none" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/tenants/add">
          <Button size="icon" className="bg-primary text-primary-foreground shadow-md">
            <UserPlus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tenants found</div>
        ) : (
          filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4 active:scale-[0.98] transition-transform">
              <img src={tenant.avatar} alt={tenant.name} className="w-12 h-12 rounded-full object-cover" />
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-foreground truncate">{tenant.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    tenant.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    tenant.status === 'Due' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tenant.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Room {tenant.room} • {tenant.rent}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
