import { useState } from "react";
import { Hash, Copy } from "lucide-react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

async function sha256(message: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function sha1(message: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function simpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return Math.abs(hash).toString(16).padStart(8, "0").repeat(4).slice(0, 32);
}

export function HashTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{ sha256: string; sha1: string; crc32: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hashA, setHashA] = useState("");
  const [hashB, setHashB] = useState("");
  const [compareResult, setCompareResult] = useState<"match" | "nomatch" | null>(null);
  const [tab, setTab] = useState<"generate" | "compare">("generate");

  const computeHashes = async () => {
    if (!input) return;
    setLoading(true);
    const [h256, h1] = await Promise.all([sha256(input), sha1(input)]);
    setHashes({ sha256: h256, sha1: h1, crc32: simpleChecksum(input) });
    setLoading(false);
  };

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} ${t("action.copied").toLowerCase()}`);
  };

  const compare = () => {
    setCompareResult(hashA.trim().toLowerCase() === hashB.trim().toLowerCase() ? "match" : "nomatch");
  };

  const rows = hashes ? [
    { label: "SHA-256", value: hashes.sha256, key: "SHA-256" },
    { label: "SHA-1  ", value: hashes.sha1,   key: "SHA-1" },
    { label: "CRC-32 ", value: hashes.crc32,  key: "CRC-32" },
  ] : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-0 border border-border rounded overflow-hidden">
        {(["generate", "compare"] as const).map(tab_ => (
          <button key={tab_} onClick={() => setTab(tab_)}
            className={`flex-1 py-2 text-xs font-mono tracking-wider transition-all ${
              tab === tab_ ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}>
            {tab_ === "generate" ? t("hash.generate_tab") : t("hash.compare_tab")}
          </button>
        ))}
      </div>

      {tab === "generate" ? (
        <>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("hash.input_label")}</label>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary resize-none h-24"
              placeholder={t("hash.placeholder")} />
          </div>
          <div className="flex gap-2">
            <button onClick={computeHashes} disabled={loading || !input}
              className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong">
              {loading ? t("hash.computing") : t("hash.generate_btn")}
            </button>
            {hashes && (
              <button onClick={() => { setHashes(null); setInput(""); }}
                className="px-3 py-2 border border-border text-muted-foreground text-xs hover:border-primary/50 hover:text-primary transition-all">
                {t("action.clear")}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row.key} className="border border-border bg-muted p-3 animate-fade-in">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-primary font-bold">{row.label}</span>
                  <button onClick={() => copy(row.value, row.key)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <Copy className="w-3 h-3" /> {t("action.copy")}
                  </button>
                </div>
                <div className="text-xs text-foreground break-all font-mono">{row.value}</div>
              </div>
            ))}
          </div>
          {hashes && (
            <div className="text-xs text-muted-foreground border border-border/50 p-2">
              <Hash className="w-3 h-3 inline mr-1" />
              {t("hash.entropy_label", {
                bytes: input.length,
                pct: Math.min(100, Math.round((new Set(input).size / Math.max(1, input.length)) * 100 * 1.5))
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">{t("hash.compare_desc")}</div>
          {["A", "B"].map(lbl => (
            <div key={lbl}>
              <label className="text-xs text-muted-foreground block mb-1">HASH {lbl}</label>
              <input
                value={lbl === "A" ? hashA : hashB}
                onChange={e => { (lbl === "A" ? setHashA : setHashB)(e.target.value); setCompareResult(null); }}
                className="w-full bg-muted border border-border px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary font-mono"
                placeholder="sha256:abc123..." spellCheck={false} />
            </div>
          ))}
          <button onClick={compare} disabled={!hashA || !hashB}
            className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong">
            {t("action.compare")} {">>"}
          </button>
          {compareResult && (
            <div className={`flex items-center gap-3 border p-3 animate-fade-in ${
              compareResult === "match" ? "border-primary/50 bg-primary/10" : "border-destructive/50 bg-destructive/10"
            }`}>
              {compareResult === "match" ? <ShieldCheck className="w-6 h-6 text-primary" /> : <ShieldX className="w-6 h-6 text-destructive" />}
              <div>
                <div className={`text-sm font-bold ${compareResult === "match" ? "text-primary" : "text-destructive"}`}>
                  {compareResult === "match" ? t("hash.match") : t("hash.nomatch")}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {compareResult === "match" ? t("hash.match_detail") : t("hash.nomatch_detail")}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
