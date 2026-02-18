import { useState, useEffect } from "react";
import { Terminal, Lock, Hash, Code2, Shield, ChevronRight } from "lucide-react";
import { StegoTool } from "@/components/StegoTool";
import { HashTool } from "@/components/HashTool";
import { CipherTool } from "@/components/CipherTool";
import { EncoderTool } from "@/components/EncoderTool";
import { PasswordTool } from "@/components/PasswordTool";

type ToolId = "stego" | "hash" | "cipher" | "encoder" | "password";

const TOOLS: { id: ToolId; label: string; icon: React.ElementType; desc: string; tag: string }[] = [
  { id: "stego", label: "ESTEGANOGRAFÍA", icon: Terminal, desc: "Oculta mensajes en emojis con caracteres invisibles", tag: "ZWJ/ZWNJ" },
  { id: "hash", label: "HASH GENERATOR", icon: Hash, desc: "SHA-256, SHA-1, CRC-32 y análisis de entropía", tag: "CRYPTO" },
  { id: "cipher", label: "CIFRADO", icon: Lock, desc: "César, ROT13, Vigenère — encripta y desencripta texto", tag: "CIPHER" },
  { id: "encoder", label: "CODIFICADOR", icon: Code2, desc: "Base64, URL encoding, HEX, binario", tag: "ENCODE" },
  { id: "password", label: "CONTRASEÑAS", icon: Shield, desc: "Analiza fortaleza y genera contraseñas seguras", tag: "OPSEC" },
];

function useTypewriter(text: string, speed = 60) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return displayed;
}

export default function Index() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [bootDone, setBootDone] = useState(false);

  const title = useTypewriter("CYBER_TOOLKIT v1.0", 80);

  useEffect(() => {
    const timer = setTimeout(() => setBootDone(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const active = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 font-mono">
          <span className="text-primary">●</span>
          <span>root@cyberlab:~$</span>
          <span className="animate-pulse">_</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black glow-text text-primary tracking-wider mb-2">
          {title}
          <span className="animate-pulse">|</span>
        </h1>
        {bootDone && (
          <p className="text-muted-foreground text-sm font-mono">
            {">> Herramientas de ciberseguridad y criptografía para uso educativo"}
          </p>
        )}
        <div className="mt-4 h-px bg-gradient-to-r from-primary via-primary/30 to-transparent" />
      </header>

      {/* Tool grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(isActive ? null : tool.id)}
              className={`terminal-card p-4 text-left transition-all duration-200 group border ${
                isActive
                  ? "border-primary glow-border-strong bg-primary/5"
                  : "border-border hover:border-primary/50 hover:glow-border"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-5 h-5 ${isActive ? "text-primary glow-text" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${isActive ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                  {tool.tag}
                </span>
              </div>
              <div className={`text-sm font-bold tracking-wider mb-1 font-mono ${isActive ? "text-primary" : "text-foreground"}`}>
                {tool.label}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</div>
              <div className={`flex items-center gap-1 mt-2 text-xs transition-all ${isActive ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`}>
                <ChevronRight className="w-3 h-3" />
                {isActive ? "ACTIVO" : "EJECUTAR"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active tool panel */}
      {activeTool && active && (
        <div className="terminal-card border border-primary/60 glow-border-strong">
          {/* Panel header */}
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(45 90% 55%)" }} />
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <span className="text-xs text-primary font-mono">
                {"> "}{active.label}.exe
              </span>
            </div>
            <button
              onClick={() => setActiveTool(null)}
              className="text-muted-foreground hover:text-primary text-xs font-mono"
            >
              [X] CERRAR
            </button>
          </div>

          <div className="p-4">
            {activeTool === "stego" && <StegoTool />}
            {activeTool === "hash" && <HashTool />}
            {activeTool === "cipher" && <CipherTool />}
            {activeTool === "encoder" && <EncoderTool />}
            {activeTool === "password" && <PasswordTool />}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 border-t border-border pt-4">
        <div className="text-xs text-muted-foreground font-mono space-y-1">
          <div>{"// Todo el procesamiento es LOCAL — ningún dato se envía a servidores"}</div>
          <div>{"// Uso exclusivamente educativo e investigación en seguridad"}</div>
        </div>
      </footer>
    </div>
  );
}
