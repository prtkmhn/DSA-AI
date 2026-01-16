import { MobileLayout } from "@/components/layout/MobileLayout";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { ArrowLeft, Check, Key, Zap, ShieldAlert, Cpu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { clsx } from "clsx";
import { generateAIContent } from "@/lib/ai";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { aiSettings, updateAISettings } = useStore();
  const [isTesting, setIsTesting] = useState(false);
  const [, setLocation] = useLocation();

  const handleTest = async () => {
    setIsTesting(true);
    const result = await generateAIContent("Say 'Connection Successful!' in a pirate voice.");
    setIsTesting(false);

    if (result.error) {
      toast({
        title: "Connection Failed",
        description: result.error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: `Received from ${result.provider}: "${result.text}"`,
      });
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-4 sticky top-0 z-10">
          <Link href="/profile">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">AI Settings</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Privacy Note */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">Client-Side Only</p>
              <p>Your API keys are stored securely in your browser's local storage. They are never sent to our servers.</p>
            </div>
          </div>

          {/* Gemini Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                <Zap size={18} fill="currentColor" />
              </div>
              <h2 className="text-lg font-bold">Google Gemini</h2>
              {aiSettings.primaryProvider === 'gemini' && (
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">Primary</span>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <label className="text-sm font-medium text-gray-700 block">API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="password"
                  placeholder="Paste your Gemini API Key"
                  value={aiSettings.geminiKey}
                  onChange={(e) => updateAISettings({ geminiKey: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400">
                Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-brand-primary hover:underline">Google AI Studio</a>
              </p>
            </div>
          </div>

          {/* Groq Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                <Cpu size={18} />
              </div>
              <h2 className="text-lg font-bold">Groq (Fallback)</h2>
              {aiSettings.primaryProvider === 'groq' && (
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-bold">Primary</span>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <label className="text-sm font-medium text-gray-700 block">API Key</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="password"
                  placeholder="Paste your Groq API Key"
                  value={aiSettings.groqKey}
                  onChange={(e) => updateAISettings({ groqKey: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400">
                Get your key from <a href="https://console.groq.com/keys" target="_blank" className="text-brand-primary hover:underline">Groq Console</a>
              </p>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900">Preferences</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Primary Provider</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => updateAISettings({ primaryProvider: 'gemini' })}
                  className={clsx(
                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                    aiSettings.primaryProvider === 'gemini' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Gemini
                </button>
                <button 
                  onClick={() => updateAISettings({ primaryProvider: 'groq' })}
                  className={clsx(
                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                    aiSettings.primaryProvider === 'groq' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  Groq
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">Automatic Fallback</span>
                <span className="text-xs text-gray-400">Use backup provider if primary fails</span>
              </div>
              <button 
                onClick={() => updateAISettings({ enableFallback: !aiSettings.enableFallback })}
                className={clsx(
                  "w-12 h-6 rounded-full transition-colors relative",
                  aiSettings.enableFallback ? "bg-brand-primary" : "bg-gray-300"
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  aiSettings.enableFallback ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <button 
            onClick={handleTest}
            disabled={isTesting || (!aiSettings.geminiKey && !aiSettings.groqKey)}
            className={clsx(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
              isTesting ? "bg-gray-200 text-gray-500" : "bg-gray-900 text-white hover:bg-black btn-press"
            )}
          >
            {isTesting ? "Testing Connection..." : "Test Connection"}
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}
