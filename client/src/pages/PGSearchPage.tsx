import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Navigation,
  Star,
  Utensils,
  Car,
  Wind,
  Camera,
  Wifi,
  Shirt,
  Dumbbell,
  SlidersHorizontal,
  X,
  ChevronRight,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PGSearchFilters {
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
  pgType?: string;
  hasFood?: boolean;
  hasParking?: boolean;
  hasAC?: boolean;
  hasCCTV?: boolean;
  hasWifi?: boolean;
  hasLaundry?: boolean;
  hasGym?: boolean;
  limit?: number;
  offset?: number;
}

interface PGResult {
  id: number;
  pgName: string;
  pgAddress: string;
  pgLocation: string;
  latitude: string | null;
  longitude: string | null;
  imageUrl: string | null;
  pgType: string;
  hasFood: boolean;
  hasParking: boolean;
  hasAC: boolean;
  hasCCTV: boolean;
  hasWifi: boolean;
  hasLaundry: boolean;
  hasGym: boolean;
  averageRating: string;
  totalRatings: number;
  distance?: number;
}

const DISTANCE_PRESETS = [
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "20 km", value: 20 },
  { label: "50 km", value: 50 },
];

const AMENITY_ICONS = {
  hasFood: { icon: Utensils, label: "Food" },
  hasParking: { icon: Car, label: "Parking" },
  hasAC: { icon: Wind, label: "AC" },
  hasCCTV: { icon: Camera, label: "CCTV" },
  hasWifi: { icon: Wifi, label: "WiFi" },
  hasLaundry: { icon: Shirt, label: "Laundry" },
  hasGym: { icon: Dumbbell, label: "Gym" },
};

export default function PGSearchPage() {
  const [, navigate] = useLocation();
  const [filters, setFilters] = useState<PGSearchFilters>({
    maxDistance: 10,
    limit: 20,
    offset: 0,
  });
  const [tempFilters, setTempFilters] = useState<PGSearchFilters>({ ...filters });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "both">("both");

  const { data: pgs, isLoading, refetch } = useQuery<PGResult[]>({
    queryKey: ["/api/tenant/pgs/search", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
      const res = await fetch(`/api/tenant/pgs/search?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to search PGs");
      return res.json();
    },
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setTempFilters({
          ...tempFilters,
          latitude: lat,
          longitude: lng,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location access denied. Please enable location permissions to search nearby PGs.");
        } else {
          alert("Failed to get your location. Please try manual input.");
        }
      }
    );
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const resetFilters = {
      maxDistance: 10,
      limit: 20,
      offset: 0,
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
  };

  const loadMore = () => {
    setFilters({
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || 20),
    });
  };

  const sortedPgs = [...(pgs || [])].sort((a, b) => {
    if (sortBy === "distance" && a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    if (sortBy === "rating") {
      return parseFloat(b.averageRating) - parseFloat(a.averageRating);
    }
    // both: prioritize rating, then distance
    const ratingDiff = parseFloat(b.averageRating) - parseFloat(a.averageRating);
    if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  const getAmenityIcons = (pg: PGResult) => {
    return Object.entries(AMENITY_ICONS)
      .filter(([key]) => pg[key as keyof PGResult])
      .slice(0, 4);
  };

  return (
    <MobileLayout title="Search PGs" showNav={true}>
      {/* Location Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full"
            variant="outline"
            data-testid="button-get-location"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {isGettingLocation ? "Getting your location..." : "Use Current Location"}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude" className="text-xs">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="19.0760"
                value={tempFilters.latitude || ""}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    latitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                data-testid="input-latitude"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-xs">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="72.8777"
                value={tempFilters.longitude || ""}
                onChange={(e) =>
                  setTempFilters({
                    ...tempFilters,
                    longitude: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                data-testid="input-longitude"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Max Distance</Label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {DISTANCE_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={tempFilters.maxDistance === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setTempFilters({ ...tempFilters, maxDistance: preset.value })
                  }
                  data-testid={`button-distance-${preset.value}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom distance (km)"
              value={tempFilters.maxDistance || ""}
              onChange={(e) =>
                setTempFilters({
                  ...tempFilters,
                  maxDistance: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              data-testid="input-custom-distance"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Toggle Button - Mobile */}
      <div className="lg:hidden">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="w-full"
          data-testid="button-toggle-filters"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Section */}
      <div className={cn("space-y-4", !showFilters && "hidden lg:block")}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters(false)}
              data-testid="button-close-filters"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* PG Type */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">PG Type</Label>
              <RadioGroup
                value={tempFilters.pgType || "all"}
                onValueChange={(value) =>
                  setTempFilters({
                    ...tempFilters,
                    pgType: value === "all" ? undefined : value,
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="type-all" data-testid="radio-type-all" />
                  <Label htmlFor="type-all" className="font-normal cursor-pointer">
                    All
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="type-male" data-testid="radio-type-male" />
                  <Label htmlFor="type-male" className="font-normal cursor-pointer">
                    Male
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="type-female" data-testid="radio-type-female" />
                  <Label htmlFor="type-female" className="font-normal cursor-pointer">
                    Female
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="common" id="type-common" data-testid="radio-type-common" />
                  <Label htmlFor="type-common" className="font-normal cursor-pointer">
                    Common
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amenities */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Amenities</Label>
              <div className="space-y-3">
                {Object.entries(AMENITY_ICONS).map(([key, { icon: Icon, label }]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={!!tempFilters[key as keyof PGSearchFilters]}
                      onCheckedChange={(checked) =>
                        setTempFilters({
                          ...tempFilters,
                          [key]: checked || undefined,
                        })
                      }
                      data-testid={`checkbox-${key}`}
                    />
                    <Label
                      htmlFor={key}
                      className="font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={applyFilters} className="flex-1" data-testid="button-apply-filters">
                Apply Filters
              </Button>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="flex-1"
                data-testid="button-clear-filters"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sort & Results Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both" data-testid="sort-both">Best Match</SelectItem>
              <SelectItem value="rating" data-testid="sort-rating">Rating</SelectItem>
              {filters.latitude && filters.longitude && (
                <SelectItem value="distance" data-testid="sort-distance">Distance</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        {!isLoading && sortedPgs && (
          <p className="text-sm text-muted-foreground" data-testid="text-results-count">
            {sortedPgs.length} PG{sortedPgs.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedPgs && sortedPgs.length > 0 ? (
        <>
          <div className="space-y-4">
            {sortedPgs.map((pg) => {
              const amenities = getAmenityIcons(pg);
              const rating = parseFloat(pg.averageRating);

              return (
                <Card
                  key={pg.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  data-testid={`card-pg-${pg.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`text-pg-name-${pg.id}`}>
                          {pg.pgName}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {pg.pgAddress}
                        </p>
                      </div>
                      {pg.imageUrl && (
                        <img
                          src={pg.imageUrl}
                          alt={pg.pgName}
                          className="w-16 h-16 rounded-lg object-cover ml-3"
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      {pg.distance != null && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-distance-${pg.id}`}>
                          <MapPin className="w-3 h-3 mr-1" />
                          {pg.distance.toFixed(1)} km away
                        </Badge>
                      )}
                      {rating > 0 && (
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-rating-${pg.id}`}>
                          <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {rating.toFixed(1)} ({pg.totalRatings})
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs capitalize",
                          pg.pgType === "male" && "bg-blue-50 text-blue-700 border-blue-200",
                          pg.pgType === "female" && "bg-pink-50 text-pink-700 border-pink-200",
                          pg.pgType === "common" && "bg-purple-50 text-purple-700 border-purple-200"
                        )}
                        data-testid={`badge-type-${pg.id}`}
                      >
                        {pg.pgType}
                      </Badge>
                    </div>

                    {amenities.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        {amenities.map(([key, { icon: Icon, label }]) => (
                          <div
                            key={key}
                            className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded"
                            data-testid={`amenity-${key}-${pg.id}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{label}</span>
                          </div>
                        ))}
                        {Object.entries(AMENITY_ICONS).filter(([key]) => pg[key as keyof PGResult])
                          .length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{Object.entries(AMENITY_ICONS).filter(([key]) => pg[key as keyof PGResult])
                              .length - 4}{" "}
                            more
                          </span>
                        )}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/pg/${pg.id}`)}
                      data-testid={`button-view-details-${pg.id}`}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load More */}
          {sortedPgs.length >= (filters.limit || 20) && (
            <Button
              onClick={loadMore}
              variant="outline"
              className="w-full"
              data-testid="button-load-more"
            >
              Load More
            </Button>
          )}
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-state">
              No PGs found matching your criteria
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search in a different location
            </p>
            <Button onClick={clearFilters} variant="outline" data-testid="button-clear-from-empty">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </MobileLayout>
  );
}
