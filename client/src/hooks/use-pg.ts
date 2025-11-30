import { useEffect, useState } from "react";

export interface PG {
  id: number;
  pgName: string;
  pgAddress?: string;
  pgLocation?: string;
  ownerId: number;
}

export function usePG() {
  const [pg, setPG] = useState<PG | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPG = async () => {
      try {
        const res = await fetch("/api/pg", { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) {
            setPG(null);
          } else {
            throw new Error("Failed to fetch PG");
          }
        } else {
          const data = await res.json();
          setPG(data);
        }
      } catch (err) {
        setError((err as any).message);
        setPG(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPG();
  }, []);

  return { pg, isLoading, error };
}
