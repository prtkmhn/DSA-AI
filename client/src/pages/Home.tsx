import { MobileLayout } from "@/components/layout/MobileLayout";
import { UnitCard } from "@/components/features/UnitCard";
import { UNITS } from "@/lib/data";
import { Flame, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Home() {
  const { progress } = useStore();
  const completedCount = progress.completedUnits.length;

  return (
    <MobileLayout>
      <div className="bg-brand-primary text-white p-6 pb-12 rounded-b-3xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10" />

        <div className="relative z-10">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold font-sans">PatternMaster</h1>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold">
              <Flame className="text-orange-300 fill-orange-300" size={16} />
              <span>{completedCount * 100} XP</span>
            </div>
          </header>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/30">
              <Trophy className="text-yellow-300" size={32} />
            </div>
            <div>
              <p className="text-brand-primary-light text-sm font-medium opacity-90">Current Goal</p>
              <h2 className="text-xl font-bold">Master Hash Maps</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 space-y-4 relative z-20 pb-20">
        <div className="flex items-center justify-between text-gray-500 text-sm font-medium px-1">
          <span>Learning Path</span>
          <span>{Math.round((completedCount / UNITS.length) * 100)}% Complete</span>
        </div>

        <div className="space-y-4">
          {UNITS.map((unit, index) => (
            <UnitCard key={unit.id} unit={unit} index={index} />
          ))}
        </div>
        
        <div className="text-center p-8 text-gray-400 text-sm">
          More units coming soon...
        </div>
      </div>
    </MobileLayout>
  );
}
