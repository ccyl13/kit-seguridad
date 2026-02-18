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

type ToolId = "stego" | "hash" | "cipher" | "encoder" | "password" | "jwt" | "regex" | "network";

interface Tool {
  id: ToolId;
  label: string;
  icon: React.ElementType;
  desc: string;
  category: string;
}

const TOOLS: Tool[] = [
  { id: "jwt", label: "JWT Inspector", icon: Key, desc: "Decodifica y analiza tokens JWT", category: "AUTH" },
  { id: "hash", label: "Hash Generator", icon: Hash, desc: "SHA-256, SHA-1, CRC-32 + entropía", category: "CRYPTO" },
  { id: "cipher", label: "Cifrado Clásico", icon: Lock, desc: "César, ROT13, Vigenère", category: "CRYPTO" },
  { id: "encoder", label: "Codificador", icon: Code2, desc: "Base64, URL, HEX, Binario", category: "ENCODE" },
  { id: "regex", label: "Regex Lab", icon: Regex, desc: "Testa expresiones regulares con resaltado", category: "ANÁLISIS" },
  { id: "network", label: "IP / Subnetting", icon: Network, desc: "Calculadora CIDR y análisis de red", category: "RED" },
  { id: "stego", label: "Esteganografía", icon: Terminal, desc: "Oculta datos en emojis con ZWJ", category: "STEGO" },
  { id: "password", label: "Contraseñas", icon: Shield, desc: "Analizador de fortaleza y generador", category: "OPSEC" },
];

const CATEGORIES = ["AUTH", "CRYPTO", "ENCODE", "ANÁLISIS", "RED", "STEGO", "OPSEC"];

function ToolComponent({ id }: { id: ToolId }) {
  switch (id) {
    case "stego": return <StegoTool />;
    case "hash": return <HashTool />;
    case "cipher": return <CipherTool />;
    case "encoder": return <EncoderTool />;
    case "password": return <PasswordTool />;
    case "jwt": return <JwtTool />;
    case "regex": return <RegexTool />;
    case "network": return <NetworkTool />;
  }
}

export default function Index() {
  const [activeTool, setActiveTool] = useState<ToolId>("jwt");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const active = TOOLS.find(t => t.id === activeTool)!;
  const ActiveIcon = active.icon;

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
            <img src="/logo.svg" alt="CyberLab logo" className="w-7 h-7" />
            <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">CyberLab</span>
          </div>
          <h1 className="text-base font-semibold text-foreground leading-tight">Security Toolkit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Herramientas de seguridad</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 cyber-scrollbar">
          {CATEGORIES.map(cat => {
            const catTools = TOOLS.filter(t => t.category === cat);
            if (!catTools.length) return null;
            return (
              <div key={cat} className="mb-5">
                <div className="px-4 mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground/60 tracking-widest uppercase">{cat}</span>
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
                        <div className={`text-sm leading-tight truncate ${isActive ? "font-medium text-foreground" : "font-normal"}`}>{tool.label}</div>
                        <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5 font-mono">{tool.desc}</div>
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
            <span className="text-[10px] font-semibold text-primary uppercase tracking-widest">100% Local</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Todo el procesamiento ocurre en tu navegador. Ningún dato se envía a servidores.
          </p>
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
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-sm truncate block">{active.label}</span>
            </div>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold uppercase tracking-wider shrink-0">
              {active.category}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary border border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline">Local</span>
            </div>
          </div>
        </header>

        {/* Tool panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 cyber-scrollbar bg-background">
          <div className="max-w-2xl mx-auto">
            <div className="mb-5 animate-fade-in" key={activeTool + "-header"}>
              <h2 className="text-lg font-semibold text-foreground">{active.label}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{active.desc}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-5 md:p-6 animate-fade-in shadow-sm" key={activeTool}>
              <ToolComponent id={activeTool} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
