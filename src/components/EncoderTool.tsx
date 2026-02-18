import { useState } from "react";
import { ArrowRightLeft, Copy, CheckCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type EncoderMode = "base64" | "url" | "hex" | "binary" | "html" | "unicode" | "morse";

// --- Encoding functions ---
function toBase64(s: string) { try { return btoa(unescape(encodeURIComponent(s))); } catch { return "ERROR"; } }
function fromBase64(s: string) { try { return decodeURIComponent(escape(atob(s))); } catch { return "BASE64 INVÁLIDO"; } }
function toHex(s: string) { return Array.from(new TextEncoder().encode(s)).map(b => b.toString(16).padStart(2, "0")).join(" "); }
function fromHex(s: string) { try { const bytes = s.trim().split(/\s+/).map(h => parseInt(h, 16)); return new TextDecoder().decode(new Uint8Array(bytes)); } catch { return "HEX INVÁLIDO"; } }
function toBinary(s: string) { return Array.from(new TextEncoder().encode(s)).map(b => b.toString(2).padStart(8, "0")).join(" "); }
function fromBinary(s: string) { try { const bytes = s.trim().split(/\s+/).map(b => parseInt(b, 2)); return new TextDecoder().decode(new Uint8Array(bytes)); } catch { return "BINARIO INVÁLIDO"; } }
function toUrl(s: string) { return encodeURIComponent(s); }
function fromUrl(s: string) { try { return decodeURIComponent(s); } catch { return "CODIFICACIÓN URL INVÁLIDA"; } }

// HTML Entities
function toHtmlEntities(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function fromHtmlEntities(s: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

// Unicode escapes
function toUnicode(s: string): string {
  return [...s].map(c => {
    const cp = c.codePointAt(0)!;
    return cp > 0xFFFF
      ? `\\u{${cp.toString(16).toUpperCase()}}`
      : `\\u${cp.toString(16).toUpperCase().padStart(4, "0")}`;
  }).join("");
}
function fromUnicode(s: string): string {
  try {
    return s
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  } catch { return "UNICODE INVÁLIDO"; }
}

// Morse code
const MORSE_MAP: Record<string, string> = {
  A:".-", B:"-...", C:"-.-.", D:"-..", E:".", F:"..-.", G:"--.", H:"....",
  I:"..", J:".---", K:"-.-", L:".-..", M:"--", N:"-.", O:"---", P:".--.",
  Q:"--.-", R:".-.", S:"...", T:"-", U:"..-", V:"...-", W:".--", X:"-..-",
  Y:"-.--", Z:"--..",
  "0":"-----","1":".----","2":"..---","3":"...--","4":"....-",
  "5":".....","6":"-....","7":"--...","8":"---..","9":"----.",
  ".":".-.-.-", ",":"--..--", "?":"..--..", "!":"-.-.--",
  "-":"-....-", "/":"-..-.", "(":"-.--.", ")":"-.--.-",
  "&":".-...", ":":"---...", ";":"-.-.-.", "=":"-...-",
  "+":".-.-.", "_":"..--.-", "\"":".-..-.","$":"...-..-","@":".--.-.",
};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

function toMorse(s: string): string {
  return s.toUpperCase().split("").map(c => {
    if (c === " ") return "/";
    return MORSE_MAP[c] ?? "?";
  }).join(" ");
}
function fromMorse(s: string): string {
  return s.trim().split(" / ").map(word =>
    word.split(" ").map(code => MORSE_REVERSE[code] ?? "?").join("")
  ).join(" ");
}

const MODES: { id: EncoderMode; label: string }[] = [
  { id: "base64",  label: "BASE64" },
  { id: "url",     label: "URL" },
  { id: "hex",     label: "HEX" },
  { id: "binary",  label: "BINARIO" },
  { id: "html",    label: "HTML" },
  { id: "unicode", label: "UNICODE" },
  { id: "morse",   label: "MORSE" },
];

export function EncoderTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<EncoderMode>("base64");
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const process = () => {
    if (!input) return;
    let result = "";
    if (direction === "encode") {
      if (mode === "base64")  result = toBase64(input);
      else if (mode === "url")     result = toUrl(input);
      else if (mode === "hex")     result = toHex(input);
      else if (mode === "binary")  result = toBinary(input);
      else if (mode === "html")    result = toHtmlEntities(input);
      else if (mode === "unicode") result = toUnicode(input);
      else                         result = toMorse(input);
    } else {
      if (mode === "base64")  result = fromBase64(input);
      else if (mode === "url")     result = fromUrl(input);
      else if (mode === "hex")     result = fromHex(input);
      else if (mode === "binary")  result = fromBinary(input);
      else if (mode === "html")    result = fromHtmlEntities(input);
      else if (mode === "unicode") result = fromUnicode(input);
      else                         result = fromMorse(input);
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

  // Morse only supports encode direction
  const modeNosDecode = mode === "morse" && direction === "decode";

  return (
    <div className="space-y-3">
      {/* Mode pills */}
      <div className="flex gap-1 flex-wrap">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setOutput(""); }}
            className={`py-1.5 px-3 text-xs font-mono tracking-wider border transition-all ${
              mode === m.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Direction */}
      <div className="flex gap-1">
        {(["encode", "decode"] as const).map(d => (
          <button
            key={d}
            onClick={() => { setDirection(d); setOutput(""); }}
            disabled={mode === "morse" && d === "decode"}
            className={`flex-1 py-1.5 text-xs font-mono tracking-wider border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              direction === d
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {d === "encode" ? t("encoder.encode_btn") : t("encoder.decode_btn")}
          </button>
        ))}
      </div>

      {/* Mode hint */}
      {mode === "morse" && (
        <div className="text-xs text-muted-foreground border border-border/50 bg-muted/50 p-2">
          · ·· — Palabras separadas por <code className="text-primary">/</code> al decodificar. Solo admite ASCII.
        </div>
      )}
      {mode === "html" && (
        <div className="text-xs text-muted-foreground border border-border/50 bg-muted/50 p-2">
          Convierte caracteres especiales en entidades HTML: <code className="text-primary">&amp; &lt; &gt; &quot; &#39;</code>
        </div>
      )}
      {mode === "unicode" && (
        <div className="text-xs text-muted-foreground border border-border/50 bg-muted/50 p-2">
          Formato <code className="text-primary">\uXXXX</code> — compatible con JSON, JavaScript y Python.
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground block mb-1">{t("encoder.input_label")}</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary resize-none h-24 cyber-scrollbar"
          placeholder={direction === "encode" ? t("encoder.plain_placeholder") : `${MODES.find(m=>m.id===mode)?.label}...`}
        />
      </div>

      <button
        onClick={process}
        disabled={!input || modeNosDecode}
        className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong"
      >
        {direction === "encode" ? t("encoder.action_encode") : t("encoder.action_decode")}
      </button>

      {output && (
        <div className="border border-primary/40 bg-muted p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-primary">// OUTPUT:</span>
            <div className="flex gap-2">
              <button onClick={swap} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" /> {t("action.swap")}
              </button>
              <button onClick={copy} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                {copied ? <><CheckCheck className="w-3 h-3" /> {t("action.copied")}</> : <><Copy className="w-3 h-3" /> {t("action.copy")}</>}
              </button>
            </div>
          </div>
          <div className="text-xs text-foreground break-all font-mono max-h-32 overflow-y-auto cyber-scrollbar">{output}</div>
        </div>
      )}
    </div>
  );
}
