import { useState } from "react";
import { Copy, CheckCheck, AlertTriangle, CheckCircle, Clock, ShieldAlert, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  try { return decodeURIComponent(escape(atob(s))); }
  catch { return atob(s); }
}

interface JwtPayload {
  exp?: number; iat?: number; nbf?: number;
  sub?: string; iss?: string; aud?: string | string[];
  [key: string]: unknown;
}
interface JwtHeader { alg?: string; typ?: string; [key: string]: unknown; }

const INSECURE_ALGS = ["none", "None", "NONE"];
const WEAK_ALGS = ["HS256", "RS256"];
const STRONG_ALGS = ["HS384","HS512","RS384","RS512","ES256","ES384","ES512","EdDSA"];

function getAlgLevel(alg: string | undefined): "critical" | "warn" | "ok" | "unknown" {
  if (!alg) return "unknown";
  if (INSECURE_ALGS.includes(alg)) return "critical";
  if (STRONG_ALGS.includes(alg)) return "ok";
  if (WEAK_ALGS.includes(alg)) return "warn";
  return "warn";
}

function parseJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("invalid");
  const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader;
  const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  return { header, payload, signature: parts[2] };
}

function formatTimestamp(ts: number) {
  return new Date(ts * 1000).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "medium" });
}

function fmtDiff(secs: number) {
  const abs = Math.abs(secs);
  if (abs < 60) return `${Math.round(abs)}s`;
  if (abs < 3600) return `${Math.floor(abs/60)}m ${Math.round(abs%60)}s`;
  if (abs < 86400) return `${Math.floor(abs/3600)}h ${Math.floor((abs%3600)/60)}m`;
  return `${Math.floor(abs/86400)}d ${Math.floor((abs%86400)/3600)}h`;
}

function JsonView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="flex gap-2 text-xs font-mono">
          <span className="text-primary shrink-0">"{k}":</span>
          <span className="text-foreground break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
        </div>
      ))}
    </div>
  );
}

export function JwtTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseJwt> | null>(null);
  const [error, setError] = useState("");

  const parse = () => {
    try {
      setError("");
      setParsed(parseJwt(input.trim()));
    } catch {
      setError(t("jwt.invalid"));
      setParsed(null);
    }
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t("action.copied").toLowerCase()}`);
  };

  const alg = parsed?.header.alg as string | undefined;
  const algLevel = alg ? getAlgLevel(alg) : null;
  const algLabel = algLevel === "unknown" ? t("jwt.alg.unknown")
    : algLevel === "critical" ? t("jwt.alg.insecure", { alg: alg! })
    : algLevel === "ok" ? t("jwt.alg.strong", { alg: alg! })
    : t("jwt.alg.weak", { alg: alg! });

  const expStatus = (() => {
    if (!parsed?.payload.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    const diff = parsed.payload.exp - now;
    if (diff < 0) return { expired: true, warn: false, label: t("jwt.exp.expired", { time: fmtDiff(diff) }) };
    if (diff < 300) return { expired: false, warn: true, label: t("jwt.exp.soon", { time: fmtDiff(diff) }) };
    return { expired: false, warn: false, label: t("jwt.exp.valid", { time: fmtDiff(diff) }) };
  })();

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{t("jwt.token_label")}</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary resize-none h-20 cyber-scrollbar"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          spellCheck={false}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={parse}
          disabled={!input.trim()}
          className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong"
        >
          {t("jwt.decode")}
        </button>
        {parsed && (
          <button
            onClick={() => { setParsed(null); setInput(""); setError(""); }}
            className="px-3 py-2 border border-border text-muted-foreground text-xs hover:border-primary/50 hover:text-primary transition-all"
          >
            {t("jwt.clear")}
          </button>
        )}
      </div>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}

      {parsed && (
        <div className="space-y-2 animate-fade-in">
          {algLevel && (
            <div className={`flex items-center gap-2 border p-2 text-xs font-mono ${
              algLevel === "critical" ? "border-destructive/70 bg-destructive/15 text-destructive"
              : algLevel === "warn" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
              : "border-primary/30 bg-primary/5 text-primary"
            }`}>
              {algLevel === "critical" ? <ShieldX className="w-4 h-4 shrink-0" /> :
               algLevel === "warn" ? <ShieldAlert className="w-4 h-4 shrink-0" /> :
               <CheckCircle className="w-4 h-4 shrink-0" />}
              {algLabel}
            </div>
          )}

          {expStatus && (
            <div className={`flex items-center gap-2 border p-2 text-xs ${
              expStatus.expired ? "border-destructive/50 bg-destructive/10 text-destructive"
              : expStatus.warn ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
              : "border-primary/50 bg-primary/10 text-primary"
            }`}>
              {expStatus.expired ? <AlertTriangle className="w-4 h-4" />
               : expStatus.warn ? <Clock className="w-4 h-4" />
               : <CheckCircle className="w-4 h-4" />}
              {expStatus.label}
            </div>
          )}

          <div className="terminal-card border border-border p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-primary font-bold">{t("jwt.header")}</span>
              <button onClick={() => copy(JSON.stringify(parsed.header, null, 2), t("jwt.header"))} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Copy className="w-3 h-3" /> {t("action.copy")}
              </button>
            </div>
            <JsonView data={parsed.header} />
          </div>

          <div className="terminal-card border border-border p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-primary font-bold">{t("jwt.payload")}</span>
              <button onClick={() => copy(JSON.stringify(parsed.payload, null, 2), t("jwt.payload"))} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Copy className="w-3 h-3" /> {t("action.copy")}
              </button>
            </div>
            <JsonView data={parsed.payload} />
            {(parsed.payload.iat || parsed.payload.exp || parsed.payload.nbf) && (
              <div className="mt-3 pt-2 border-t border-border space-y-1">
                {parsed.payload.iat && <div className="text-xs text-muted-foreground">iat → {formatTimestamp(parsed.payload.iat)}</div>}
                {parsed.payload.nbf && <div className="text-xs text-muted-foreground">nbf → {formatTimestamp(parsed.payload.nbf)}</div>}
                {parsed.payload.exp && <div className="text-xs text-muted-foreground">exp → {formatTimestamp(parsed.payload.exp)}</div>}
              </div>
            )}
          </div>

          <div className="border border-border/50 bg-muted/50 p-2 text-xs text-muted-foreground">
            {t("jwt.sig_warning")}
          </div>
        </div>
      )}
    </div>
  );
}
