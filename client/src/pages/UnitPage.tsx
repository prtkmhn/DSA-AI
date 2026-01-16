import { useRoute } from "wouter";
import { UNITS } from "@/lib/data";
import { LessonView } from "@/components/features/LessonView";
import NotFound from "./not-found";

export default function UnitPage() {
  const [match, params] = useRoute("/unit/:id");
  const unitId = match ? params.id : null;
  const unit = UNITS.find((u) => u.id === unitId);

  if (!unit) return <NotFound />;

  return <LessonView unit={unit} />;
}
