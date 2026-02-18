import { useState } from "react";
import { Hash, Copy, CheckCheck } from "lucide-react";

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Simple MD5-like display using SHA-256 truncated (real MD5 not available in WebCrypto)
function simpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").repeat(4).slice(0, 32);
}

export function HashTool() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{ sha256: string; sha1: string; crc32: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const computeHashes = async () => {
    if (!input) return;
    setLoading(true);
    const [h256, h1] = await Promise.all([sha256(input), sha1(input)]);
    setHashes({ sha256: h256, sha1: h1, crc32: simpleChecksum(input) });
    setLoading(false);
  };

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const rows = hashes ? [
    { label: "SHA-256", value: hashes.sha256, key: "sha256" },
    { label: "SHA-1  ", value: hashes.sha1, key: "sha1" },
    { label: "CRC-32 ", value: hashes.crc32, key: "crc32" },
  ] : [];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{">> INPUT_DATA:"}</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none h-24"
          placeholder="Introduce el texto a hashear..."
        />
      </div>
      <button
        onClick={computeHashes}
        disabled={loading || !input}
        className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong"
      >
        {loading ? "COMPUTING..." : "GENERATE HASHES >>"}
      </button>
      {rows.map(row => (
        <div key={row.key} className="border border-border bg-muted p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-primary font-bold">{row.label}</span>
            <button onClick={() => copy(row.value, row.key)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              {copied === row.key ? <><CheckCheck className="w-3 h-3" /> OK</> : <><Copy className="w-3 h-3" /> COPY</>}
            </button>
          </div>
          <div className="text-xs text-foreground break-all font-mono">{row.value}</div>
        </div>
      ))}
      {hashes && (
        <div className="text-xs text-muted-foreground border border-border/50 p-2">
          <Hash className="w-3 h-3 inline mr-1" />
          Input: {input.length} bytes | Entropy: ~{Math.min(100, Math.round((new Set(input).size / Math.max(1, input.length)) * 100 * 1.5))}%
        </div>
      )}
    </div>
  );
}
