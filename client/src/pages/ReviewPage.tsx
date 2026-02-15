import { MobileLayout } from "@/components/layout/MobileLayout";
import { InfiniteReviewSession } from "@/components/features/InfiniteReviewSession";
import { useStore } from "@/lib/store";
import { Layers } from "lucide-react";

export default function ReviewPage() {
  const { units } = useStore();

  return (
    <MobileLayout>
       <div className="h-[calc(100vh-80px)] flex flex-col">
        <header className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="text-brand-secondary" />
            Review Session
          </h1>
          <p className="text-sm text-gray-500">
            Infinite AI cards with learning-first and spaced repetition
          </p>
        </header>

        <div className="flex-1">
          <InfiniteReviewSession units={units} />
        </div>
       </div>
    </MobileLayout>
  );
}
