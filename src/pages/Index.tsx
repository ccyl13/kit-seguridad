import { useState } from "react";
import {
  Terminal, Lock, Hash, Code2, Shield,
  Regex, Network, Key, ChevronRight, Menu, X
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
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-primary rounded-full glow-border" />
            <span className="text-xs text-muted-foreground font-mono tracking-widest">CYBERLAB</span>
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Cyber Toolkit</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Herramientas de seguridad</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 cyber-scrollbar">
          {CATEGORIES.map(cat => {
            const catTools = TOOLS.filter(t => t.category === cat);
            if (!catTools.length) return null;
            return (
              <div key={cat} className="mb-4">
                <div className="px-4 mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground tracking-widest">{cat}</span>
                </div>
                {catTools.map(tool => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => { setActiveTool(tool.id); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all group ${
                        isActive
                          ? "bg-primary/10 border-r-2 border-primary text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground border-r-2 border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight truncate">{tool.label}</div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">{tool.desc}</div>
                      </div>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
            Todo el procesamiento es local.<br />Ningún dato sale de tu navegador.
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
        <header className="border-b border-border px-4 md:px-6 py-3 flex items-center gap-3 bg-card shrink-0">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <ActiveIcon className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground truncate">{active.label}</span>
            <span className="hidden sm:inline text-xs px-1.5 py-0.5 border border-border text-muted-foreground font-mono shrink-0">
              {active.category}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary glow-border animate-pulse" />
              <span className="text-xs text-muted-foreground font-mono hidden sm:inline">ONLINE</span>
            </div>
          </div>
        </header>

        {/* Tool panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 cyber-scrollbar">
          <div className="max-w-2xl mx-auto">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">{active.label}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{active.desc}</p>
            </div>
            <div className="terminal-card p-4 md:p-5">
              <ToolComponent id={activeTool} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
