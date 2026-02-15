import { Unit } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Lock, CheckCircle, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { clsx } from "clsx";

interface UnitCardProps {
  unit: Unit;
  index: number;
}

export function UnitCard({ unit, index }: UnitCardProps) {
  const { progress } = useStore();
  const isUnlocked = progress.unlockedUnits.includes(unit.id);
  const isCompleted = progress.completedUnits.includes(unit.id);

  return (
    <Link href={isUnlocked ? `/unit/${unit.id}` : "#"}>
      <div 
        className={clsx(
          "relative group rounded-2xl p-4 border-2 transition-all duration-300 cursor-pointer overflow-hidden",
          isCompleted ? "bg-brand-primary/5 border-brand-primary/20" : 
          isUnlocked ? "bg-white border-gray-100 hover:border-brand-primary/50 shadow-sm hover:shadow-md card-shadow" : 
          "bg-gray-50 border-gray-100 opacity-60 pointer-events-none"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm",
            isCompleted ? "bg-brand-primary" : 
            isUnlocked ? "bg-brand-secondary" : 
            "bg-gray-300"
          )}>
            {index + 1}
          </div>
          {isCompleted && <CheckCircle className="text-brand-primary" size={20} />}
          {!isUnlocked && <Lock className="text-gray-400" size={20} />}
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">{unit.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{unit.description}</p>
        
        {isUnlocked && (
          <div className="mt-4 flex items-center text-brand-secondary font-bold text-sm group-hover:translate-x-1 transition-transform">
            {isCompleted ? "Review" : "Start"} <ArrowRight size={16} className="ml-1" />
          </div>
        )}
      </div>
    </Link>
  );
}
