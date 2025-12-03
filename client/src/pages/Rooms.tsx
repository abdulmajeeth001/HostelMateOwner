import DesktopLayout from "@/components/layout/DesktopLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoorOpen, Plus, Wifi, Droplet, Zap, Wind, Bath, Search, MoreVertical, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkUploadModal } from "@/components/BulkUploadModal";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface RoomData {
  room: {
    id: number;
    roomNumber: string;
    monthlyRent: string;
    sharing: number;
    floor: number;
    hasAttachedBathroom: boolean;
    hasAC: boolean;
    tenantIds: number[];
    status: string;
    amenities: string[];
  };
  tenants: Tenant[];
}

export default function Rooms() {
  const [, setLocation] = useLocation();
  const [roomsData, setRoomsData] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "fully_occupied" | "partially_occupied" | "vacant">("all");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const getRoomOccupancyStatus = (room: any) => {
    const tenantCount = room.tenantIds?.length || 0;
    if (tenantCount === 0) return "vacant";
    if (tenantCount === room.sharing) return "fully_occupied";
    return "partially_occupied";
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms");
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      setRoomsData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rooms/seed", { method: "POST" });
      if (!response.ok) throw new Error("Failed to seed rooms");
      await fetchRooms();
    } catch (err) {
      console.error("Error seeding rooms:", err);
      setError("Failed to seed rooms");
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    return roomsData.filter((item) => {
      const matchSearch = item.room.roomNumber.toLowerCase().includes(search.toLowerCase());
      const occupancyStatus = getRoomOccupancyStatus(item.room);
      const matchFilter = filter === "all" || occupancyStatus === filter;
      return matchSearch && matchFilter;
    });
  }, [roomsData, search, filter]);

  const stats = {
    total: roomsData.length,
    fully_occupied: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "fully_occupied").length,
    partially_occupied: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "partially_occupied").length,
    vacant: roomsData.filter((item) => getRoomOccupancyStatus(item.room) === "vacant").length,
  };

  const filterTabs = [
    { label: "All", value: "all", count: stats.total },
    { label: "Fully Occupied", value: "fully_occupied", count: stats.fully_occupied },
    { label: "Partially Occupied", value: "partially_occupied", count: stats.partially_occupied },
    { label: "Vacant", value: "vacant", count: stats.vacant },
  ] as const;

  if (loading) {
    return (
      <DesktopLayout title="Room Management" showNav={false}>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        </div>
      </DesktopLayout>
    );
  }

  if (error) {
    return (
      <DesktopLayout title="Room Management" showNav={false}>
        <div className="text-center text-destructive">{error}</div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout 
      title="Rooms" 
      action={
        <div className="flex gap-1 sm:gap-2">
          {roomsData.length === 0 && (
            <Button onClick={handleSeedRooms} className="gap-1 text-xs sm:text-sm px-2 sm:px-3" size="sm" data-testid="button-seed-rooms">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Seed Demo</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setBulkUploadOpen(true)} 
            className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
            size="sm"
            data-testid="button-bulk-upload"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Bulk</span>
          </Button>
          <Button onClick={() => setLocation("/rooms/add")} className="gap-1 text-xs sm:text-sm px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" size="sm" data-testid="button-add-room">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden xs:inline">Add</span>
          </Button>
        </div>
      }
      showNav={false}
    >
      <div className="space-y-6">
        {roomsData.length === 0 ? (
          <div className="text-center py-16 bg-secondary/30 rounded-2xl">
            <DoorOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium mb-2">No rooms found</p>
            <p className="text-sm text-muted-foreground mb-6">Click "Seed Demo Rooms" to create initial rooms.</p>
            <Button onClick={handleSeedRooms} className="gap-2">
              <Plus className="w-4 h-4" /> Seed Demo Rooms
            </Button>
          </div>
        ) : (
          <>
            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-2xl font-bold">Rooms Overview</h2>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-purple-600 font-medium mb-0.5 sm:mb-1">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-green-600 font-medium mb-0.5 sm:mb-1">Full</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">{stats.fully_occupied}</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-yellow-600 font-medium mb-0.5 sm:mb-1">Partial</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.partially_occupied}</p>
                </div>
                <div className="bg-white rounded-lg p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-orange-600 font-medium mb-0.5 sm:mb-1">Vacant</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-900">{stats.vacant}</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search room..." 
                  className="pl-9 sm:pl-10 h-9 sm:h-10 bg-secondary border border-border rounded-lg text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-room"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                      filter === tab.value
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                    data-testid={`filter-room-${tab.value}`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRooms.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No rooms found matching your criteria
                </div>
              ) : (
                filteredRooms.map(({ room, tenants }) => (
                  <Card 
                    key={room.id} 
                    className="hover:shadow-xl transition-all border-l-4 border-l-purple-500" 
                    data-testid={`card-room-${room.id}`}
                  >
                    <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                            <DoorOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold text-purple-900">
                              Room {room.roomNumber}
                            </CardTitle>
                            <p className="text-sm text-purple-700 font-medium">
                              ₹{room.monthlyRent}/month • Floor {room.floor}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              data-testid={`button-more-room-${room.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/rooms/edit/${room.id}`)}
                              data-testid={`button-edit-room-${room.id}`}
                            >
                              Edit Room
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          room.status === 'occupied' 
                            ? 'bg-green-100 text-green-700' 
                            : room.status === 'partially_occupied' 
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange-100 text-orange-700'
                        }`} data-testid={`status-room-${room.id}`}>
                          {room.status === 'occupied' ? '🟢 Occupied' : 
                           room.status === 'partially_occupied' ? '🟡 Partial' :
                           '🔴 Vacant'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      {/* Room Features */}
                      <div className="grid grid-cols-3 gap-3 py-3 border-b border-border">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Sharing</p>
                          <p className="font-bold text-lg text-foreground">{room.sharing}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">AC</p>
                          <p className="font-bold text-lg">{room.hasAC ? '✅' : '❌'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Bathroom</p>
                          <p className="font-bold text-lg">{room.hasAttachedBathroom ? '🚿' : '👥'}</p>
                        </div>
                      </div>

                      {/* Tenants Section */}
                      {tenants.length > 0 && (
                        <div className="pb-3 border-b border-border">
                          <p className="text-sm font-semibold text-foreground mb-2">
                            👥 Assigned Tenants ({tenants.length}/{room.sharing})
                          </p>
                          <div className="space-y-2">
                            {tenants.map((tenant) => (
                              <div key={tenant.id} className="p-2.5 bg-green-50 rounded-lg border border-green-200">
                                <p className="font-semibold text-green-900 text-sm" data-testid={`text-tenant-${room.id}`}>
                                  {tenant.name}
                                </p>
                                <p className="text-xs text-green-700">{tenant.phone}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {tenants.length === 0 && (
                        <div className="py-3 px-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-700 font-medium">No tenants assigned yet</p>
                        </div>
                      )}
                      
                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Amenities</p>
                          <div className="flex gap-2 flex-wrap">
                            {room.amenities.map((amenity) => (
                              <div key={amenity} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700">
                                {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                                {amenity === 'Water' && <Droplet className="w-3 h-3" />}
                                {amenity === 'Power' && <Zap className="w-3 h-3" />}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={() => setLocation(`/rooms/edit/${room.id}`)}
                        className="w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                        data-testid={`button-edit-room-${room.id}`}
                      >
                        Edit Room Details
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <BulkUploadModal 
        open={bulkUploadOpen} 
        onOpenChange={setBulkUploadOpen}
        onSuccess={fetchRooms}
      />
    </DesktopLayout>
  );
}
