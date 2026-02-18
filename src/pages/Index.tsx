import { useState } from "react";
import {
  Terminal, Lock, Hash, Code2, Shield,
  Regex, Network, Key, Menu, X
} from "lucide-react";
import { StegoTool } from "@/components/StegoTool";
import { HashTool } from "@/components/HashTool";
import { CipherTool } from "@/components/CipherTool";
import { EncoderTool } from "@/components/EncoderTool";
import { PasswordTool } from "@/components/PasswordTool";
import { JwtTool } from "@/components/JwtTool";
import { RegexTool } from "@/components/RegexTool";
import { NetworkTool } from "@/components/NetworkTool";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

type ToolId = "stego" | "hash" | "cipher" | "encoder" | "password" | "jwt" | "regex" | "network";

const TOOL_IDS: { id: ToolId; icon: React.ElementType; category: string }[] = [
  { id: "jwt",      icon: Key,      category: "AUTH" },
  { id: "hash",     icon: Hash,     category: "CRIPTO" },
  { id: "cipher",   icon: Lock,     category: "CRIPTO" },
  { id: "encoder",  icon: Code2,    category: "CODIFICACIÓN" },
  { id: "regex",    icon: Regex,    category: "ANÁLISIS" },
  { id: "network",  icon: Network,  category: "RED" },
  { id: "stego",    icon: Terminal, category: "STEGO" },
  { id: "password", icon: Shield,   category: "OPSEC" },
];

const CATEGORIES = ["AUTH", "CRIPTO", "CODIFICACIÓN", "ANÁLISIS", "RED", "STEGO", "OPSEC"];

function ToolComponent({ id }: { id: ToolId }) {
  switch (id) {
    case "stego":    return <StegoTool />;
    case "hash":     return <HashTool />;
    case "cipher":   return <CipherTool />;
    case "encoder":  return <EncoderTool />;
    case "password": return <PasswordTool />;
    case "jwt":      return <JwtTool />;
    case "regex":    return <RegexTool />;
    case "network":  return <NetworkTool />;
  }
}

function AppLayout() {
  const { t, lang, setLang } = useLanguage();
  const [activeTool, setActiveTool] = useState<ToolId>("jwt");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeMeta = TOOL_IDS.find(t => t.id === activeTool)!;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
        transition-transform duration-200
        md:relative md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5 mb-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="CyberLab logo" className="w-7 h-7" />
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">CyberLab</span>
          </div>
          <h1 className="text-base font-semibold text-foreground leading-tight">{t("app.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("app.subtitle")}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 cyber-scrollbar">
          {CATEGORIES.map(cat => {
            const catTools = TOOL_IDS.filter(tool => tool.category === cat);
            if (!catTools.length) return null;
            return (
              <div key={cat} className="mb-5">
                <div className="px-4 mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-widest uppercase">
                    {t(`cat.${cat}`)}
                  </span>
                </div>
                {catTools.map(tool => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => { setActiveTool(tool.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group rounded-none ${
                        isActive
                          ? "bg-primary/[0.08] border-r-2 border-primary text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground border-r-2 border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <div className={`text-sm leading-tight truncate ${isActive ? "font-medium text-foreground" : "font-normal"}`}>
                          {t(`tool.${tool.id}.name`)}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5 font-mono">
                          {t(`tool.${tool.id}.desc`)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">{t("app.privacy.badge")}</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{t("app.privacy")}</p>
        </div>
      </aside>

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="border-b border-border px-4 md:px-6 py-0 flex items-center gap-3 bg-card shrink-0 h-14">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <ActiveIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-semibold text-foreground text-sm truncate">{t(`tool.${activeTool}.name`)}</span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold uppercase tracking-wider shrink-0">
              {t(`cat.${activeMeta.category}`)}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center border border-border rounded overflow-hidden">
              <button
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 text-[11px] font-semibold tracking-wider transition-all ${
                  lang === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-[11px] font-semibold tracking-wider transition-all ${
                  lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline">
                {t("status.local")}
              </span>
            </div>
          </div>
        </header>

        {/* Tool panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 cyber-scrollbar bg-background">
          <div className="max-w-2xl mx-auto">
            <div className="mb-5 animate-fade-in" key={activeTool + "-header-" + lang}>
              <h2 className="text-lg font-semibold text-foreground">{t(`tool.${activeTool}.name`)}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t(`tool.${activeTool}.desc`)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 md:p-6 animate-fade-in shadow-sm" key={activeTool + lang}>
              <ToolComponent id={activeTool} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <LanguageProvider>
      <AppLayout />
    </LanguageProvider>
  );
}
