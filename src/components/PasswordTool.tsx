import { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldX, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  crackTimes: CrackTime[];
  issues: string[];
  entropy: number;
}

interface CrackTime {
  label: string;
  icon: string;
  time: string;
  speed: number; // guesses/sec
}

const CRACK_SCENARIOS: { label: string; icon: string; speed: number }[] = [
  { label: "CPU moderna", icon: "💻", speed: 1_000_000 },
  { label: "GPU RTX 4090", icon: "🎮", speed: 100_000_000_000 },
  { label: "Botnet 10K GPUs", icon: "🌐", speed: 1_000_000_000_000_000 },
];

function formatTime(seconds: number): string {
  if (seconds < 0.001) return "< 1ms ⚡";
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds < 31536000) return `${Math.floor(seconds / 86400)} días`;
  if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000)} años`;
  if (seconds < 31536000 * 1e9) return `${(seconds / 31536000).toExponential(1)} años`;
  return "∞ incrackeable 🛡️";
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

  if (/(.)\1{2,}/.test(password)) issues.push("Caracteres repetidos");
  if (/^[a-z]+$/i.test(password)) issues.push("Solo letras");
  if (/^[0-9]+$/.test(password)) issues.push("Solo números");
  if (/password|123456|qwerty|abc|admin/i.test(password)) issues.push("¡Patrón común detectado!");

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigit) charsetSize += 10;
  if (hasSpecial) charsetSize += 32;

  const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, len)) : 0;
  const combinations = charsetSize > 0 ? Math.pow(charsetSize, len) : 0;

  if (len >= 8) score++;
  if (len >= 12) score++;
  if (hasLower && hasUpper) score++;
  if (hasDigit && hasSpecial) score++;
  if (issues.some(i => i.includes("común"))) score = Math.min(score, 1);

  const crackTimes: CrackTime[] = CRACK_SCENARIOS.map(s => ({
    ...s,
    time: formatTime(combinations / s.speed),
  }));

  const labels = ["MUY DÉBIL", "DÉBIL", "MODERADA", "FUERTE", "MUY FUERTE"];
  const colors = ["text-red-500", "text-orange-500", "text-yellow-400", "text-green-400", "text-green-300"];

  return { score, label: labels[score], color: colors[score], crackTimes, issues, entropy: Math.round(entropy) };
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

// Diceware-style passphrase
const WORD_LIST = ["agua","bosque","cielo","datos","error","firma","golpe","hielo","imán","juego","karma","lunar","monte","noche","ópalo","poder","quark","radar","sol","token","ultra","vapor","watt","xenón","yate","zona","fuego","clave","bruma","delta","faro","gato","hada","isla","joya","kilo","lava","mapa","nexo","orbe","pico","quinta","roca","seda","tren","urna","vela","xilo","yoga","zarpa"];

function generatePassphrase(wordCount: number): string {
  const arr = new Uint32Array(wordCount);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => WORD_LIST[v % WORD_LIST.length]).join("-");
}

const BARS = 4;

export function PasswordTool() {
  const [password, setPassword] = useState("");
  const [genLength, setGenLength] = useState(20);
  const [genOpts, setGenOpts] = useState({ upper: true, digits: true, special: true });
  const [generated, setGenerated] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [tab, setTab] = useState<"analyze" | "generate">("analyze");
  const [genMode, setGenMode] = useState<"random" | "passphrase">("random");

  const strength = password ? analyzePassword(password) : null;
  const ShieldIcon = strength ? [ShieldX, ShieldAlert, ShieldAlert, ShieldCheck, ShieldCheck][strength.score] : Shield;

  const gen = () => setGenerated(generatePassword(genLength, genOpts));
  const genPhrase = () => setPassphrase(generatePassphrase(4));

  const copy = (t: string, label: string) => {
    navigator.clipboard.writeText(t);
    toast.success(`${label} copiada`);
  };

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
            <div className="space-y-3 animate-fade-in">
              {/* Strength bar */}
              <div className="flex gap-1">
                {Array.from({ length: BARS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 transition-all duration-300 ${i <= strength.score - 1 ? "bg-primary glow-border" : "bg-muted"}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 border border-border bg-muted p-3">
                <ShieldIcon className={`w-8 h-8 ${strength.color}`} />
                <div>
                  <div className={`text-lg font-bold ${strength.color}`}>{strength.label}</div>
                  <div className="text-xs text-muted-foreground">Entropía: {strength.entropy} bits</div>
                </div>
              </div>

              {/* Crack time by hardware */}
              <div className="border border-border bg-muted p-3">
                <div className="text-xs text-primary mb-2">// TIEMPO DE CRACKEO POR HARDWARE:</div>
                <div className="space-y-2">
                  {strength.crackTimes.map(ct => (
                    <div key={ct.label} className="flex justify-between items-center text-xs font-mono">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span>{ct.icon}</span> {ct.label}
                        <span className="text-muted-foreground/60">({ct.speed.toExponential(0)} h/s)</span>
                      </span>
                      <span className={`${ct.time.includes("∞") || ct.time.includes("años") ? "text-primary" : ct.time.includes("ms") || ct.time.includes("⚡") || ct.time.includes("s") ? "text-destructive" : "text-yellow-400"}`}>
                        {ct.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {strength.issues.length > 0 && (
                <div className="border border-border bg-muted p-3 space-y-1">
                  <div className="text-xs text-primary mb-2">// ADVERTENCIAS:</div>
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
          {/* Gen mode toggle */}
          <div className="flex gap-0 border border-border overflow-hidden">
            {(["random", "passphrase"] as const).map(m => (
              <button
                key={m}
                onClick={() => setGenMode(m)}
                className={`flex-1 py-1.5 text-xs font-mono transition-all ${
                  genMode === m ? "bg-primary/20 text-primary border-b border-primary" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {m === "random" ? "ALEATORIA" : "FRASE CLAVE"}
              </button>
            ))}
          </div>

          {genMode === "random" ? (
            <>
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

              <button
                onClick={gen}
                className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity glow-border-strong flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> GENERAR
              </button>

              {generated && (
                <div className="border border-primary/40 bg-muted p-3 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-primary">// CONTRASEÑA GENERADA:</span>
                    <button onClick={() => copy(generated, "Contraseña")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Copy className="w-3 h-3" /> COPIAR
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
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground border border-border/50 p-2">
                Genera una frase de 4 palabras aleatorias estilo Diceware — fácil de recordar, difícil de crackear.
              </div>
              <button
                onClick={genPhrase}
                className="w-full py-2 bg-primary text-primary-foreground text-sm font-bold tracking-widest hover:opacity-90 transition-opacity glow-border-strong flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> GENERAR FRASE CLAVE
              </button>
              {passphrase && (
                <div className="border border-primary/40 bg-muted p-3 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-primary">// FRASE DE CONTRASEÑA:</span>
                    <button onClick={() => copy(passphrase, "Passphrase")} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Copy className="w-3 h-3" /> COPIAR
                    </button>
                  </div>
                  <div className="text-lg text-foreground font-mono tracking-wide">{passphrase}</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    ~{Math.round(4 * Math.log2(WORD_LIST.length))} bits de entropía — {passphrase.length} caracteres
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
