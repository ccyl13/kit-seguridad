import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldX, RefreshCw, Copy, CheckCheck } from "lucide-react";

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  crackTime: string;
  issues: string[];
  entropy: number;
}

function analyzePassword(password: string): PasswordStrength {
  const issues: string[] = [];
  let score = 0;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const len = password.length;

  if (!hasLower) issues.push("Sin minúsculas");
  if (!hasUpper) issues.push("Sin mayúsculas");
  if (!hasDigit) issues.push("Sin números");
  if (!hasSpecial) issues.push("Sin símbolos especiales");
  if (len < 8) issues.push("Muy corta (<8)");
  if (len < 12 && len >= 8) issues.push("Recomendado: 12+ caracteres");

  // Common patterns
  if (/(.)\1{2,}/.test(password)) issues.push("Caracteres repetidos");
  if (/^[a-z]+$/i.test(password)) issues.push("Solo letras");
  if (/^[0-9]+$/.test(password)) issues.push("Solo números");
  if (/password|123456|qwerty|abc|admin/i.test(password)) issues.push("¡Patrón común detectado!");

  // Charset size
  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigit) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;

  const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, len)) : 0;

  // Score
  if (len >= 8) score++;
  if (len >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasDigit && hasSpecial) score++;
  if (issues.some(i => i.includes("común"))) score = Math.min(score, 1);

  // Crack time (assuming 10B guesses/sec)
  const combinations = charsetSize > 0 ? Math.pow(charsetSize, len) : 0;
  const seconds = combinations / 10_000_000_000;
  let crackTime = "";
  if (seconds < 1) crackTime = "< 1 segundo ⚡";
  else if (seconds < 60) crackTime = `${Math.round(seconds)} segundos`;
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutos`;
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} horas`;
  else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} días`;
  else if (seconds < 31536000 * 1000) crackTime = `${Math.round(seconds / 31536000)} años`;
  else crackTime = `${(seconds / 31536000).toExponential(1)} años 🛡️`;

  const labels = ["MUY DÉBIL", "DÉBIL", "MODERADA", "FUERTE", "MUY FUERTE"];
  const colors = ["text-red-500", "text-orange-500", "text-yellow-400", "text-green-400", "text-green-300"];

  return { score, label: labels[score], color: colors[score], crackTime, issues, entropy: Math.round(entropy) };
}

function generatePassword(length: number, opts: { upper: boolean; digits: boolean; special: boolean }): string {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (opts.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opts.digits) chars += "0123456789";
  if (opts.special) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => chars[v % chars.length]).join("");
}

const BARS = 4;

export function PasswordTool() {
  const [password, setPassword] = useState("");
  const [genLength, setGenLength] = useState(20);
  const [genOpts, setGenOpts] = useState({ upper: true, digits: true, special: true });
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"analyze" | "generate">("analyze");

  const strength = password ? analyzePassword(password) : null;
  const ShieldIcon = strength ? [ShieldX, ShieldAlert, ShieldAlert, ShieldCheck, ShieldCheck][strength.score] : Shield;

  const gen = () => setGenerated(generatePassword(genLength, genOpts));
  const copy = (t: string) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="space-y-3">
      <div className="flex gap-0 border border-border rounded overflow-hidden">
        {(["analyze", "generate"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-mono tracking-wider transition-all ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t === "analyze" ? "🔍 ANALIZAR" : "⚡ GENERAR"}
          </button>
        ))}
      </div>

      {tab === "analyze" ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{">> PASSWORD:"}</label>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
              placeholder="Introduce una contraseña..."
            />
          </div>

          {strength && (
            <div className="space-y-3">
              {/* Strength bar */}
              <div className="flex gap-1">
                {Array.from({ length: BARS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 transition-all ${i <= strength.score - 1 ? "bg-primary glow-border" : "bg-muted"}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 border border-border bg-muted p-3">
                <ShieldIcon className={`w-8 h-8 ${strength.color}`} />
                <div>
                  <div className={`text-lg font-bold ${strength.color}`}>{strength.label}</div>
                  <div className="text-xs text-muted-foreground">Entropía: {strength.entropy} bits</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-muted-foreground">Tiempo de crackeo</div>
                  <div className="text-sm text-foreground">{strength.crackTime}</div>
                </div>
              </div>

              {strength.issues.length > 0 && (
                <div className="border border-border bg-muted p-3 space-y-1">
                  <div className="text-xs text-primary mb-2">// WARNINGS:</div>
                  {strength.issues.map((issue, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      <span className="text-destructive">▶</span> {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 border border-border bg-muted px-3 py-2">
            <label className="text-xs text-muted-foreground">LONGITUD:</label>
            <input
              type="range" min={8} max={64} value={genLength}
              onChange={e => setGenLength(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="text-primary text-sm font-bold w-8 text-center">{genLength}</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {([
              { key: "upper", label: "A-Z" },
              { key: "digits", label: "0-9" },
              { key: "special", label: "!@#" },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setGenOpts(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                className={`flex-1 py-1.5 text-xs font-mono border transition-all ${
                  genOpts[opt.key]
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={gen}
              className="flex-1 py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity glow-border-strong flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> GENERAR
            </button>
          </div>

          {generated && (
            <div className="border border-primary/40 bg-muted p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-primary">// GENERATED_PASSWORD:</span>
                <button onClick={() => copy(generated)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  {copied ? <><CheckCheck className="w-3 h-3" /> OK</> : <><Copy className="w-3 h-3" /> COPY</>}
                </button>
              </div>
              <div className="text-sm text-foreground break-all font-mono">{generated}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Entropía: {Math.round(Math.log2(Math.pow(
                  26 + (genOpts.upper ? 26 : 0) + (genOpts.digits ? 10 : 0) + (genOpts.special ? 32 : 0),
                  genLength
                )))} bits
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
