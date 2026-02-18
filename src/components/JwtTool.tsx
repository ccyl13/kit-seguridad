import { useState } from "react";
import { Copy, CheckCheck, AlertTriangle, CheckCircle, Clock } from "lucide-react";

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  try {
    return decodeURIComponent(escape(atob(s)));
  } catch {
    return atob(s);
  }
}

interface JwtPayload {
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  iss?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

function parseJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Formato JWT inválido (debe tener 3 partes separadas por '.')");
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  const signature = parts[2];
  return { header, payload, signature };
}

function formatTimestamp(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "medium" });
}

function getExpStatus(payload: JwtPayload) {
  if (!payload.exp) return null;
  const now = Math.floor(Date.now() / 1000);
  const diff = payload.exp - now;
  if (diff < 0) return { expired: true, label: `Expirado hace ${Math.abs(Math.round(diff / 60))} min` };
  if (diff < 300) return { expired: false, warn: true, label: `Expira en ${Math.round(diff / 60)} min ⚠` };
  return { expired: false, warn: false, label: `Válido — expira en ${Math.round(diff / 3600)}h` };
}

function JsonView({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-1">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="flex gap-2 text-xs font-mono">
          <span className="text-primary shrink-0">"{k}":</span>
          <span className="text-foreground break-all">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function JwtTool() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseJwt> | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const parse = () => {
    try {
      setError("");
      setParsed(parseJwt(input.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Token inválido");
      setParsed(null);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const expStatus = parsed ? getExpStatus(parsed.payload) : null;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">TOKEN JWT</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary resize-none h-20 cyber-scrollbar"
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          spellCheck={false}
        />
      </div>

      <button
        onClick={parse}
        disabled={!input.trim()}
        className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 glow-border-strong"
      >
        DECODIFICAR
      </button>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 p-3 flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}

      {parsed && (
        <div className="space-y-2">
          {/* Status bar */}
          {expStatus && (
            <div className={`flex items-center gap-2 border p-2 text-xs ${
              expStatus.expired
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : expStatus.warn
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-primary/50 bg-primary/10 text-primary"
            }`}>
              {expStatus.expired
                ? <AlertTriangle className="w-4 h-4" />
                : expStatus.warn
                  ? <Clock className="w-4 h-4" />
                  : <CheckCircle className="w-4 h-4" />
              }
              {expStatus.label}
            </div>
          )}

          {/* Header */}
          <div className="terminal-card border border-border p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-primary font-bold">HEADER</span>
              <button onClick={() => copy(JSON.stringify(parsed.header, null, 2), "header")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                {copied === "header" ? <><CheckCheck className="w-3 h-3" /> OK</> : <><Copy className="w-3 h-3" /> COPIAR</>}
              </button>
            </div>
            <JsonView data={parsed.header} />
          </div>

          {/* Payload */}
          <div className="terminal-card border border-border p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-primary font-bold">PAYLOAD</span>
              <button onClick={() => copy(JSON.stringify(parsed.payload, null, 2), "payload")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                {copied === "payload" ? <><CheckCheck className="w-3 h-3" /> OK</> : <><Copy className="w-3 h-3" /> COPIAR</>}
              </button>
            </div>
            <JsonView data={parsed.payload} />

            {/* Timestamps decoded */}
            {(parsed.payload.iat || parsed.payload.exp || parsed.payload.nbf) && (
              <div className="mt-3 pt-2 border-t border-border space-y-1">
                {parsed.payload.iat && (
                  <div className="text-xs text-muted-foreground">iat → {formatTimestamp(parsed.payload.iat)}</div>
                )}
                {parsed.payload.nbf && (
                  <div className="text-xs text-muted-foreground">nbf → {formatTimestamp(parsed.payload.nbf)}</div>
                )}
                {parsed.payload.exp && (
                  <div className="text-xs text-muted-foreground">exp → {formatTimestamp(parsed.payload.exp)}</div>
                )}
              </div>
            )}
          </div>

          {/* Signature warning */}
          <div className="border border-border/50 bg-muted/50 p-2 text-xs text-muted-foreground">
            ⚠ La firma no se verifica en el navegador sin la clave secreta. No confíes en tokens sin verificar la firma en el servidor.
          </div>
        </div>
      )}
    </div>
  );
}
