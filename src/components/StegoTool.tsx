import { useState } from "react";
import { Eye, EyeOff, Copy, CheckCheck, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ZWJ  = "\u200D";
const ZWNJ = "\u200C";
const ZWS  = "\u200B";

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "😀 Caras", emojis: ["😀","😂","😍","🥰","😎","🤔","😱","🤯","😴","🥳","😈","👻","💀","🤖","👽","🎭","🫡","🥸","🤠","🫶"] },
  { label: "👋 Gestos", emojis: ["👍","👎","👀","✌️","🤞","🤟","🤙","👊","✊","🫵","🖕","👏","🙌","🫶","🤝","🙏","💪","🦾","🫱","🫲"] },
  { label: "🔥 Símbolos", emojis: ["🔥","💥","⚡","❄️","🌊","🌀","💫","✨","🎯","🔮","💎","🏆","🎖️","🔑","🗝️","⚙️","🔧","🛡️","⚔️","🧿"] },
  { label: "🐱 Animales", emojis: ["🐱","🐶","🦊","🐺","🦁","🐯","🐻","🐼","🦄","🐉","🦅","🦋","🐍","🦂","🕷️","🐙","🦑","🦈","🐬","🦭"] },
  { label: "🍕 Comida", emojis: ["🍕","🍔","🌮","🍣","🍜","🍩","🎂","🍺","☕","🧃","🌶️","🍄","🫀","🧪","💊","🔬","🧬","🫧","🍯","🥑"] },
  { label: "🚀 Tech", emojis: ["🚀","💻","📱","🖥️","⌨️","🖱️","💾","📡","🛸","🤖","🧠","🔐","🔒","📊","📈","🧮","📟","🛰️","🌐","🕵️"] },
];

function textToBinary(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes).map(b => b.toString(2).padStart(8, "0")).join("");
}
function binaryToText(binary: string): string {
  const byteStrings = binary.match(/.{1,8}/g) || [];
  const bytes = new Uint8Array(byteStrings.map(b => parseInt(b, 2)));
  return new TextDecoder().decode(bytes);
}
function encode(coverText: string, secretText: string): string {
  const binary = textToBinary(secretText);
  const hidden = binary.split("").map(b => b === "1" ? ZWJ : ZWNJ).join("") + ZWS;
  if (!coverText) return hidden;
  const chars = [...coverText];
  return chars[0] + hidden + chars.slice(1).join("");
}
function decode(stegoText: string): string {
  const hiddenChars = [...stegoText].filter(c => c === ZWJ || c === ZWNJ || c === ZWS);
  if (hiddenChars.length === 0) return "";
  const binary = hiddenChars.filter(c => c !== ZWS).map(c => c === ZWJ ? "1" : "0").join("");
  try { return binaryToText(binary); } catch { return "[Error]"; }
}

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-mono bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors">
        <span>EMOJI</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-background border border-border shadow-xl">
          <div className="flex overflow-x-auto border-b border-border">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setActiveCategory(i)}
                className={`flex-shrink-0 px-2 py-1.5 text-xs font-mono whitespace-nowrap transition-colors ${
                  activeCategory === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}>
                {cat.label.split(" ")[0]}
              </button>
            ))}
          </div>
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-1.5 font-mono">{EMOJI_CATEGORIES[activeCategory].label}</div>
            <div className="grid grid-cols-10 gap-0.5">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
                <button key={i} onClick={() => { onSelect(emoji); setOpen(false); }}
                  className="w-7 h-7 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StegoTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"hide" | "reveal">("hide");
  const [coverText, setCoverText] = useState("👍👀🔥");
  const [secretText, setSecretText] = useState("");
  const [result, setResult] = useState("");
  const [stegoInput, setStegoInput] = useState("");
  const [displayInput, setDisplayInput] = useState("");
  const [revealResult, setRevealResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);

  const handleHide = () => {
    if (!secretText) return;
    setResult(encode(coverText, secretText));
  };

  const handleReveal = () => {
    const decoded = decode(stegoInput);
    setRevealResult(decoded || t("stego.not_found"));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text/plain");
    setStegoInput(raw);
    const invisible = [...raw].filter(c => c === ZWJ || c === ZWNJ || c === ZWS).length;
    setHiddenCount(invisible);
    setDisplayInput(raw.replace(/[\u200B\u200C\u200D]/g, ""));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-0 border border-border rounded overflow-hidden">
        <button onClick={() => setMode("hide")}
          className={`flex-1 py-2 px-4 text-sm font-mono transition-all flex items-center justify-center gap-2 ${
            mode === "hide" ? "bg-primary text-primary-foreground glow-border" : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}>
          <EyeOff className="w-4 h-4" /> {t("stego.hide_mode")}
        </button>
        <button onClick={() => setMode("reveal")}
          className={`flex-1 py-2 px-4 text-sm font-mono transition-all flex items-center justify-center gap-2 ${
            mode === "reveal" ? "bg-primary text-primary-foreground glow-border" : "bg-muted text-muted-foreground hover:bg-secondary"
          }`}>
          <Eye className="w-4 h-4" /> {t("stego.reveal_mode")}
        </button>
      </div>

      {mode === "hide" ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("stego.cover_label")}</label>
            <div className="flex gap-1">
              <input value={coverText} onChange={e => setCoverText(e.target.value)}
                className="flex-1 bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="👍👀🔥" />
              <EmojiPicker onSelect={emoji => setCoverText(prev => prev + emoji)} />
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1">{t("stego.cover_hint")}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("stego.secret_label")}</label>
            <textarea value={secretText} onChange={e => setSecretText(e.target.value)}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none h-20"
              placeholder={t("stego.secret_placeholder")} />
          </div>
          <button onClick={handleHide}
            className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity glow-border-strong">
            {t("stego.inject_btn")}
          </button>
          {result && (
            <div className="border border-primary/40 bg-muted p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-primary">{t("stego.output_label")}</span>
                <button onClick={() => copyToClipboard(result)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  {copied ? <><CheckCheck className="w-3 h-3" /> {t("action.copied")}</> : <><Copy className="w-3 h-3" /> {t("action.copy")}</>}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{coverText}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="block">{t("stego.visible_hint")}</span>
                  <span className="block text-primary">{t("stego.bits_hidden", { bits: secretText.length * 8 })}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                {t("stego.copy_hint")}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("stego.paste_label")}</label>
            <textarea value={displayInput} onChange={e => setDisplayInput(e.target.value)} onPaste={handlePaste}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none h-24 cyber-scrollbar"
              placeholder={t("stego.paste_placeholder")} />
            {hiddenCount > 0 && (
              <div className="text-xs text-primary mt-1">{t("stego.invisible_found", { count: hiddenCount })}</div>
            )}
            {displayInput && hiddenCount === 0 && (
              <div className="text-xs text-muted-foreground mt-1">{t("stego.none_detected")}</div>
            )}
          </div>
          <button onClick={handleReveal} disabled={!stegoInput}
            className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong">
            {t("stego.analyze_btn")}
          </button>
          {revealResult && (
            <div className="border border-primary/40 bg-muted p-3">
              <div className="text-xs text-primary mb-1">{t("stego.decrypted")}</div>
              <div className="text-foreground text-sm">{revealResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
