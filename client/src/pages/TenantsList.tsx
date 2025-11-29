import MobileLayout from "@/components/layout/MobileLayout";
import { Search, UserPlus, Phone, Mail, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

const MOCK_TENANTS = [
  { id: 1, name: "Rahul Kumar", room: "101", rent: "₹5,000", status: "Paid", phone: "+91 98765 43210", avatar: "https://ui-avatars.com/api/?name=Rahul+Kumar&background=0D8ABC&color=fff" },
  { id: 2, name: "Amit Singh", room: "102", rent: "₹6,500", status: "Due", phone: "+91 98765 43211", avatar: "https://ui-avatars.com/api/?name=Amit+Singh&background=random" },
  { id: 3, name: "Priya Sharma", room: "201", rent: "₹7,000", status: "Paid", phone: "+91 98765 43212", avatar: "https://ui-avatars.com/api/?name=Priya+Sharma&background=random" },
  { id: 4, name: "Ankit Verma", room: "202", rent: "₹5,500", status: "Overdue", phone: "+91 98765 43213", avatar: "https://ui-avatars.com/api/?name=Ankit+Verma&background=random" },
  { id: 5, name: "Sneha Gupta", room: "301", rent: "₹8,000", status: "Paid", phone: "+91 98765 43214", avatar: "https://ui-avatars.com/api/?name=Sneha+Gupta&background=random" },
];

export default function TenantsList() {
  const [search, setSearch] = useState("");

  const filteredTenants = MOCK_TENANTS.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.room.includes(search)
  );

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
        {filteredTenants.map((tenant) => (
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
        ))}
      </div>
    </MobileLayout>
  );
}
