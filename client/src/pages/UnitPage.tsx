import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import { UNITS } from "@/lib/data";
import { useStore } from "@/lib/store";
import { LessonView } from "@/components/features/LessonView";
import { Unit } from "@/lib/types";
import NotFound from "./not-found";
import { Loader2 } from "lucide-react";

export default function UnitPage() {
  const [match, params] = useRoute("/unit/:id");
  const unitId = match ? params.id : null;
  const { units: storeUnits } = useStore();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadUnit() {
      if (!unitId) {
        setLoading(false);
        setError(true);
        return;
      }

      // 1. First check hardcoded UNITS (fast path)
      const hardcodedUnit = UNITS.find((u) => u.id === unitId);
      if (hardcodedUnit) {
        setUnit(hardcodedUnit);
        setLoading(false);
        return;
      }

      // 2. Check Zustand store (persisted units)
      const storeUnit = storeUnits.find((u) => u.id === unitId);
      if (storeUnit) {
        setUnit(storeUnit);
        setLoading(false);
        return;
      }

      // 3. Fetch from API (database)
      try {
        const response = await fetch(`/api/units/${unitId}`);
        if (response.ok) {
          const data = await response.json();
          setUnit(data);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Failed to fetch unit from API:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadUnit();
  }, [unitId, storeUnits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <p className="text-gray-500 font-medium">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !unit) return <NotFound />;

  return <LessonView unit={unit} />;
}
