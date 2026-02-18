import { useState } from "react";
import { Eye, EyeOff, Copy, CheckCheck } from "lucide-react";

// Zero Width Joiner steganography using ZWJ characters to encode binary
const ZWJ = "\u200D";   // 1
const ZWNJ = "\u200C";  // 0
const ZWS = "\u200B";   // delimiter between chars

function textToBinary(text: string): string {
  return text.split("").map(char =>
    char.charCodeAt(0).toString(2).padStart(8, "0")
  ).join("");
}

function binaryToText(binary: string): string {
  const chars = binary.match(/.{1,8}/g) || [];
  return chars.map(b => String.fromCharCode(parseInt(b, 2))).join("");
}

function encode(coverText: string, secretText: string): string {
  const binary = textToBinary(secretText);
  const hidden = binary.split("").map(b => b === "1" ? ZWJ : ZWNJ).join("") + ZWS;
  // Inject after first character
  if (!coverText) return hidden;
  return coverText[0] + hidden + coverText.slice(1);
}

function decode(stegoText: string): string {
  const hiddenChars = stegoText.split("").filter(c => c === ZWJ || c === ZWNJ || c === ZWS);
  if (hiddenChars.length === 0) return "";
  // Remove delimiter
  const binaryArr = hiddenChars.filter(c => c !== ZWS);
  const binary = binaryArr.map(c => c === ZWJ ? "1" : "0").join("");
  try { return binaryToText(binary); } catch { return "[Error decodificando]"; }
}

export function StegoTool() {
  const [mode, setMode] = useState<"hide" | "reveal">("hide");
  const [coverText, setCoverText] = useState("👍👀🔥");
  const [secretText, setSecretText] = useState("");
  const [result, setResult] = useState("");
  const [stegoInput, setStegoInput] = useState("");       // valor real con ZWJ/ZWNJ para decodificar
  const [displayInput, setDisplayInput] = useState("");   // versión limpia para mostrar en la UI
  const [revealResult, setRevealResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);

  const handleHide = () => {
    if (!secretText) return;
    setResult(encode(coverText, secretText));
  };

  const handleReveal = () => {
    const decoded = decode(stegoInput);
    setRevealResult(decoded || "[No se encontró mensaje oculto]");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text/plain");
    setStegoInput(raw);
    const invisible = [...raw].filter(c => c === ZWJ || c === ZWNJ || c === ZWS).length;
    setHiddenCount(invisible);
    // Mostrar versión limpia (sin caracteres invisibles)
    setDisplayInput(raw.replace(/[\u200B\u200C\u200D]/g, ""));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-0 border border-border rounded overflow-hidden">
        <button
          onClick={() => setMode("hide")}
          className={`flex-1 py-2 px-4 text-sm font-mono transition-all flex items-center justify-center gap-2 ${
            mode === "hide"
              ? "bg-primary text-primary-foreground glow-border"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <EyeOff className="w-4 h-4" /> HIDE_PAYLOAD
        </button>
        <button
          onClick={() => setMode("reveal")}
          className={`flex-1 py-2 px-4 text-sm font-mono transition-all flex items-center justify-center gap-2 ${
            mode === "reveal"
              ? "bg-primary text-primary-foreground glow-border"
              : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Eye className="w-4 h-4" /> EXTRACT_PAYLOAD
        </button>
      </div>

      {mode === "hide" ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{">> COVER_TEXT (emojis/texto visible):"}</label>
            <input
              value={coverText}
              onChange={e => setCoverText(e.target.value)}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="👍👀🔥"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{">> SECRET_MESSAGE:"}</label>
            <textarea
              value={secretText}
              onChange={e => setSecretText(e.target.value)}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none h-20"
              placeholder="Escribe tu mensaje secreto aquí..."
            />
          </div>
          <button
            onClick={handleHide}
            className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity glow-border-strong"
          >
            INJECT {">>"}
          </button>
          {result && (
            <div className="border border-primary/40 bg-muted p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-primary">{"// OUTPUT (listo para copiar y pegar):"}</span>
                <button onClick={() => copyToClipboard(result)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  {copied ? <><CheckCheck className="w-3 h-3" /> COPIADO</> : <><Copy className="w-3 h-3" /> COPIAR</>}
                </button>
              </div>
              {/* Solo mostrar el cover text — los ZWJ/ZWNJ son invisibles pero están en el clipboard */}
              <div className="flex items-center gap-3">
                <div className="text-3xl">{coverText}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="block">← Apariencia visible para otros</span>
                  <span className="block text-primary">{secretText.length * 8} bits ocultos incrustados</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                ✓ Pulsa COPIAR — el texto copiado lleva el payload invisible dentro
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{">> PASTE SUSPICIOUS TEXT/EMOJIS:"}</label>
            {/*
              Solución limpia: value=displayInput (sin chars invisibles) para evitar ◆◆,
              pero stegoInput tiene el raw original con ZWJ/ZWNJ para decodificar.
              onPaste intercepta, guarda el raw, muestra el limpio.
            */}
            <textarea
              value={displayInput}
              onChange={e => setDisplayInput(e.target.value)}
              onPaste={handlePaste}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none h-24 cyber-scrollbar"
              placeholder="Pega aquí el texto sospechoso..."
            />
            {hiddenCount > 0 && (
              <div className="text-xs text-primary mt-1">
                ✓ {hiddenCount} caracteres invisibles detectados — payload potencial encontrado
              </div>
            )}
            {displayInput && hiddenCount === 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Sin caracteres invisibles detectados en este texto
              </div>
            )}
          </div>
          <button
            onClick={handleReveal}
            disabled={!stegoInput}
            className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong"
          >
            ANALYZE & EXTRACT {">>"}
          </button>
          {revealResult && (
            <div className="border border-primary/40 bg-muted p-3">
              <div className="text-xs text-primary mb-1">DECRYPTED</div>
              <div className="text-foreground text-sm">{revealResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
