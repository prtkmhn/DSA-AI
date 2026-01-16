import { BottomNav } from "./BottomNav";

export function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-background pb-24">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative">
        {children}
        <BottomNav />
      </main>
    </div>
  );
}
