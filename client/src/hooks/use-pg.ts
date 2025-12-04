import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface PG {
  id: number;
  pgName: string;
  pgAddress?: string;
  pgLocation?: string;
  totalRooms?: number;
  ownerId: number;
  createdAt?: string;
}

export function usePG() {
  const [pg, setPG] = useState<PG | null>(null);
  const [allPgs, setAllPgs] = useState<PG[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchPG = useCallback(async () => {
    try {
      const res = await fetch("/api/pg", { 
        credentials: "include",
        cache: "no-store"
      });
      if (!res.ok) {
        if (res.status === 401) {
          setPG(null);
        } else {
          throw new Error("Failed to fetch PG");
        }
      } else {
        const data = await res.json();
        console.log("PG data fetched:", data);
        setPG(data);
      }
    } catch (err) {
      console.error("Error fetching PG:", err);
      setError((err as any).message);
      setPG(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllPgs = useCallback(async () => {
    try {
      const res = await fetch("/api/pgs", { 
        credentials: "include",
        cache: "no-store"
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAllPgs([]);
        } else {
          throw new Error("Failed to fetch PGs");
        }
      } else {
        const data = await res.json();
        console.log("All PGs fetched:", data);
        setAllPgs(data || []);
      }
    } catch (err) {
      console.error("Error fetching all PGs:", err);
      setAllPgs([]);
    }
  }, []);

  useEffect(() => {
    fetchPG();
    fetchAllPgs();
  }, [fetchPG, fetchAllPgs]);

  const selectPG = useCallback(async (pgId: number) => {
    try {
      const res = await fetch(`/api/pg/select/${pgId}`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to select PG");
      }
      
      const data = await res.json();
      setPG(data.pg);
      
      // Invalidate queries to refresh data for new PG context
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/active-rooms"] });
      
      return data.pg;
    } catch (err) {
      console.error("Error selecting PG:", err);
      throw err;
    }
  }, [queryClient]);

  const createPG = useCallback(async (pgData: { pgName: string; pgAddress: string; pgLocation: string; totalRooms?: number }) => {
    try {
      const res = await fetch("/api/pg", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pgData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to create PG");
      }
      
      const data = await res.json();
      setPG(data);
      await fetchAllPgs();
      
      return data;
    } catch (err) {
      console.error("Error creating PG:", err);
      throw err;
    }
  }, [fetchAllPgs]);

  const updatePG = useCallback(async (pgId: number, pgData: Partial<PG>) => {
    try {
      const res = await fetch(`/api/pg/${pgId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pgData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update PG");
      }
      
      const data = await res.json();
      if (pg?.id === pgId) {
        setPG(data);
      }
      await fetchAllPgs();
      
      return data;
    } catch (err) {
      console.error("Error updating PG:", err);
      throw err;
    }
  }, [pg, fetchAllPgs]);

  const deletePG = useCallback(async (pgId: number) => {
    try {
      const res = await fetch(`/api/pg/${pgId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete PG");
      }
      
      const data = await res.json();
      
      // If a new active PG was returned, update the current PG state
      if (data.newActivePg) {
        setPG(data.newActivePg);
      }
      
      await fetchAllPgs();
      
      // If deleted the current PG and no newActivePg was returned, refresh
      if (pg?.id === pgId && !data.newActivePg) {
        await fetchPG();
      }
      
      return true;
    } catch (err) {
      console.error("Error deleting PG:", err);
      throw err;
    }
  }, [pg, fetchAllPgs, fetchPG]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPG(), fetchAllPgs()]);
    setIsLoading(false);
  }, [fetchPG, fetchAllPgs]);

  return { 
    pg, 
    allPgs,
    isLoading, 
    error, 
    selectPG,
    createPG,
    updatePG,
    deletePG,
    refetch
  };
}
