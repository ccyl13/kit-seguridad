import { useState } from "react";
import { ArrowRightLeft, Copy, CheckCheck } from "lucide-react";

type EncoderMode = "base64" | "url" | "hex" | "binary";

function toBase64(s: string) { try { return btoa(unescape(encodeURIComponent(s))); } catch { return "ERROR"; } }
function fromBase64(s: string) { try { return decodeURIComponent(escape(atob(s))); } catch { return "INVALID BASE64"; } }
function toHex(s: string) { return Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, "0")).join(" "); }
function fromHex(s: string) { try { const bytes = s.trim().split(/\s+/).map(h => parseInt(h, 16)); return new TextDecoder().decode(new Uint8Array(bytes)); } catch { return "INVALID HEX"; } }
function toBinary(s: string) { return Array.from(new TextEncoder().encode(s)).map(b => b.toString(2).padStart(8, "0")).join(" "); }
function fromBinary(s: string) { try { const bytes = s.trim().split(/\s+/).map(b => parseInt(b, 2)); return new TextDecoder().decode(new Uint8Array(bytes)); } catch { return "INVALID BINARY"; } }
function toUrl(s: string) { return encodeURIComponent(s); }
function fromUrl(s: string) { try { return decodeURIComponent(s); } catch { return "INVALID URL ENCODING"; } }

const MODES: { id: EncoderMode; label: string }[] = [
  { id: "base64", label: "BASE64" },
  { id: "url", label: "URL" },
  { id: "hex", label: "HEX" },
  { id: "binary", label: "BINARIO" },
];

export function EncoderTool() {
  const [mode, setMode] = useState<EncoderMode>("base64");
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const process = () => {
    if (!input) return;
    let result = "";
    if (direction === "encode") {
      if (mode === "base64") result = toBase64(input);
      else if (mode === "url") result = toUrl(input);
      else if (mode === "hex") result = toHex(input);
      else result = toBinary(input);
    } else {
      if (mode === "base64") result = fromBase64(input);
      else if (mode === "url") result = fromUrl(input);
      else if (mode === "hex") result = fromHex(input);
      else result = fromBinary(input);
    }
    setOutput(result);
  };

  const swap = () => {
    setInput(output);
    setOutput("");
    setDirection(d => d === "encode" ? "decode" : "encode");
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 py-1.5 text-xs font-mono tracking-wider border min-w-[60px] transition-all ${
              mode === m.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {(["encode", "decode"] as const).map(d => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={`flex-1 py-1.5 text-xs font-mono tracking-wider border transition-all ${
              direction === d
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {d === "encode" ? "📥 CODIFICAR" : "📤 DECODIFICAR"}
          </button>
        ))}
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">{">> ENTRADA:"}</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary resize-none h-24 cyber-scrollbar"
          placeholder={direction === "encode" ? "Texto plano..." : `${mode.toUpperCase()} encoded string...`}
        />
      </div>

      <button
        onClick={process}
        disabled={!input}
        className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong"
      >
        {direction === "encode" ? "CODIFICAR" : "DECODIFICAR"} {">>"}
      </button>

      {output && (
        <div className="border border-primary/40 bg-muted p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-primary">// OUTPUT:</span>
            <div className="flex gap-2">
              <button onClick={swap} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" /> INTERCAMBIAR
              </button>
              <button onClick={copy} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                {copied ? <><CheckCheck className="w-3 h-3" /> OK</> : <><Copy className="w-3 h-3" /> COPIAR</>}
              </button>
            </div>
          </div>
          <div className="text-xs text-foreground break-all font-mono max-h-32 overflow-y-auto cyber-scrollbar">{output}</div>
        </div>
      )}
    </div>
  );
}
