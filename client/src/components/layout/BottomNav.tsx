import { Link, useLocation } from "wouter";
import { BookOpen, Layers, User, Calendar, Play } from "lucide-react";
import { clsx } from "clsx";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: BookOpen, label: "Learn", path: "/" },
    { icon: Play, label: "Visualize", path: "/visualizer" },
    { icon: Calendar, label: "Track", path: "/track" },
    { icon: Layers, label: "Review", path: "/review" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 h-20 z-50 flex justify-between items-start safe-area-bottom">
      {navItems.map((item) => {
        const isActive = location === item.path;
        return (
          <Link key={item.path} href={item.path}>
            <div className="flex flex-col items-center gap-1 w-16 cursor-pointer group">
              <div 
                className={clsx(
                  "p-1.5 rounded-xl transition-all duration-300",
                  isActive ? "bg-brand-primary/10 text-brand-primary -translate-y-1" : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={clsx(
                "text-xs font-medium transition-colors",
                isActive ? "text-brand-primary" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
