import { useState } from "react";
import { RotateCcw, ArrowRightLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function caesarCipher(text: string, shift: number, decrypt: boolean): string {
  const s = decrypt ? (26 - (shift % 26)) % 26 : shift % 26;
  return text.split("").map(char => {
    if (char.match(/[a-z]/)) return String.fromCharCode(((char.charCodeAt(0) - 97 + s) % 26) + 97);
    if (char.match(/[A-Z]/)) return String.fromCharCode(((char.charCodeAt(0) - 65 + s) % 26) + 65);
    return char;
  }).join("");
}
function rot13(text: string): string { return caesarCipher(text, 13, false); }
function vigenere(text: string, key: string, decrypt: boolean): string {
  if (!key) return text;
  const k = key.toLowerCase().replace(/[^a-z]/g, "");
  if (!k) return text;
  let ki = 0;
  return text.split("").map(char => {
    if (char.match(/[a-zA-Z]/)) {
      const isUpper = char === char.toUpperCase();
      const base = isUpper ? 65 : 97;
      const shift = k.charCodeAt(ki % k.length) - 97;
      const s = decrypt ? (26 - shift) % 26 : shift;
      ki++;
      return String.fromCharCode(((char.charCodeAt(0) - base + s) % 26) + base);
    }
    return char;
  }).join("");
}

type CipherMode = "caesar" | "rot13" | "vigenere";

export function CipherTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<CipherMode>("caesar");
  const [input, setInput] = useState("");
  const [shift, setShift] = useState(13);
  const [key, setKey] = useState("");
  const [direction, setDirection] = useState<"encrypt" | "decrypt">("encrypt");
  const [output, setOutput] = useState("");

  const process = () => {
    if (!input) return;
    let result = "";
    if (mode === "caesar")   result = caesarCipher(input, shift, direction === "decrypt");
    else if (mode === "rot13") result = rot13(input);
    else result = vigenere(input, key, direction === "decrypt");
    setOutput(result);
  };

  const swap = () => {
    setInput(output);
    setOutput("");
    setDirection(d => d === "encrypt" ? "decrypt" : "encrypt");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["caesar", "rot13", "vigenere"] as CipherMode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-xs font-mono tracking-wider border transition-all ${
              mode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {mode !== "rot13" && (
        <div className="flex gap-1">
          {(["encrypt", "decrypt"] as const).map(d => (
            <button key={d} onClick={() => setDirection(d)}
              className={`flex-1 py-1.5 text-xs font-mono tracking-wider border transition-all ${
                direction === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}>
              {d === "encrypt" ? t("cipher.encrypt") : t("cipher.decrypt")}
            </button>
          ))}
        </div>
      )}

      {mode === "caesar" && (
        <div className="flex items-center gap-3 border border-border bg-muted px-3 py-2">
          <label className="text-xs text-muted-foreground">{t("cipher.shift")}</label>
          <input type="range" min={1} max={25} value={shift} onChange={e => setShift(Number(e.target.value))} className="flex-1 accent-primary" />
          <span className="text-primary text-sm font-bold w-6 text-center">{shift}</span>
        </div>
      )}
      {mode === "vigenere" && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">{t("cipher.key_label")}</label>
          <input value={key} onChange={e => setKey(e.target.value)}
            className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
            placeholder="SECRETKEY" />
        </div>
      )}
      {mode === "rot13" && (
        <div className="text-xs text-muted-foreground border border-border/50 p-2">
          <RotateCcw className="w-3 h-3 inline mr-1" />{t("cipher.rot13_info")}
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground block mb-1">{t("cipher.input_label")}</label>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary resize-none h-20"
          placeholder="Texto a cifrar..." />
      </div>

      <button onClick={process} disabled={!input}
        className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong">
        {t("cipher.process")}
      </button>

      {output && (
        <div className="border border-primary/40 bg-muted p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-primary">// OUTPUT:</span>
            <button onClick={swap} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" /> {t("action.swap")}
            </button>
          </div>
          <div className="text-sm text-foreground break-all">{output}</div>
        </div>
      )}
    </div>
  );
}
