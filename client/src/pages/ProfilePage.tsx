import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStore } from "@/lib/store";
import { User, Settings, Award, Calendar, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function ProfilePage() {
  const { progress } = useStore();

  return (
    <MobileLayout>
      <div className="p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Link href="/settings">
            <button className="text-gray-400 hover:text-gray-600 p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
              <Settings size={24} />
            </button>
          </Link>
        </header>

        <div className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-brand-secondary/20 rounded-full flex items-center justify-center text-brand-secondary font-bold text-xl">
            ME
          </div>
          <div>
            <h2 className="font-bold text-lg">Guest User</h2>
            <p className="text-sm text-gray-500">Joined Jan 2026</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
              <Award size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{progress.completedUnits.length}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Units Done</div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
              <Calendar size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">1</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Day Streak</div>
            </div>
          </div>
        </div>

        {/* AI Settings Promo */}
        <Link href="/settings">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
                <Settings size={20} />
              </div>
              <div className="text-white">
                <p className="font-bold text-sm">Configure AI Providers</p>
                <p className="text-xs text-gray-400">Connect Gemini & Groq</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-white transition-colors" size={20} />
          </div>
        </Link>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center space-y-2">
          <p className="font-bold text-gray-700">Detailed Stats Coming Soon</p>
          <p className="text-sm text-gray-500">We are building more tracking features!</p>
        </div>
      </div>
    </MobileLayout>
  );
}
