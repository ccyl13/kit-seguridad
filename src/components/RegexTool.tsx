import { useState, useCallback } from "react";
import { AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

interface Match {
  start: number;
  end: number;
  groups: Record<string, string | undefined>;
  index: number;
}

function runRegex(pattern: string, flags: string, text: string): { matches: Match[]; error: string | null } {
  if (!pattern) return { matches: [], error: null };
  try {
    const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const matches: Match[] = [];
    let m: RegExpExecArray | null;
    let safetyCount = 0;
    while ((m = regex.exec(text)) !== null && safetyCount++ < 500) {
      matches.push({ start: m.index, end: m.index + m[0].length, groups: m.groups ?? {}, index: matches.length });
      if (!flags.includes("g")) break;
    }
    return { matches, error: null };
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : "Regex inválido" };
  }
}

function HighlightedText({ text, matches }: { text: string; matches: Match[] }) {
  if (matches.length === 0) return <span className="text-foreground whitespace-pre-wrap break-all">{text}</span>;

  const parts: { text: string; highlighted: boolean; matchIdx: number }[] = [];
  let pos = 0;
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  for (const m of sorted) {
    if (m.start > pos) parts.push({ text: text.slice(pos, m.start), highlighted: false, matchIdx: -1 });
    parts.push({ text: text.slice(m.start, m.end), highlighted: true, matchIdx: m.index });
    pos = m.end;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), highlighted: false, matchIdx: -1 });

  return (
    <span className="whitespace-pre-wrap break-all">
      {parts.map((p, i) =>
        p.highlighted ? (
          <mark key={i} className="bg-primary/30 text-primary border-b border-primary">{p.text}</mark>
        ) : (
          <span key={i} className="text-foreground">{p.text}</span>
        )
      )}
    </span>
  );
}

const COMMON_PATTERNS = [
  // Red
  { label: "Email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}", category: "RED" },
  { label: "IPv4", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b", category: "RED" },
  { label: "IPv6", pattern: "([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}", category: "RED" },
  { label: "URL", pattern: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+", category: "RED" },
  { label: "CIDR", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\/(?:[0-9]|[12]\\d|3[0-2])\\b", category: "RED" },
  // Auth/Tokens
  { label: "JWT", pattern: "eyJ[a-zA-Z0-9_\\-]+\\.eyJ[a-zA-Z0-9_\\-]+\\.[a-zA-Z0-9_\\-]+", category: "AUTH" },
  { label: "Bearer", pattern: "Bearer\\s+[A-Za-z0-9\\-_\\.]+", category: "AUTH" },
  { label: "API Key", pattern: "(?:api[_-]?key|apikey|access[_-]?token)[\"']?\\s*[:=]\\s*[\"']?([\\w\\-]{16,})", category: "AUTH" },
  // Hashes
  { label: "MD5", pattern: "\\b[a-fA-F0-9]{32}\\b", category: "HASH" },
  { label: "SHA-256", pattern: "\\b[a-fA-F0-9]{64}\\b", category: "HASH" },
  { label: "SHA-1", pattern: "\\b[a-fA-F0-9]{40}\\b", category: "HASH" },
  // Ataques
  { label: "SQL Inject", pattern: "(?:'\\s*(?:OR|AND)\\s*'\\d|UNION\\s+SELECT|DROP\\s+TABLE|--\\s*$|;\\s*--|xp_cmdshell)", category: "ATTACK" },
  { label: "XSS", pattern: "<\\s*script[^>]*>|javascript\\s*:|on(?:load|click|error|mouseover)\\s*=", category: "ATTACK" },
  { label: "Path Traversal", pattern: "\\.{2}[\\\\/]|\\.{2}%2[Ff]|%2e%2e[\\\\/]", category: "ATTACK" },
  { label: "LFI/RFI", pattern: "(?:file|php|data|expect|zip|phar)://", category: "ATTACK" },
  // PII
  { label: "Tarjeta crédito", pattern: "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\\b", category: "PII" },
  { label: "Teléfono ES", pattern: "(?:\\+34|0034)?[6789]\\d{8}", category: "PII" },
  { label: "DNI/NIE", pattern: "\\b[0-9]{8}[A-HJ-NP-TV-Z]\\b|\\b[XYZ][0-9]{7}[A-HJ-NP-TV-Z]\\b", category: "PII" },
];

const CATEGORIES = ["RED", "AUTH", "HASH", "ATTACK", "PII"];

const CATEGORY_COLORS: Record<string, string> = {
  RED: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  AUTH: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
  HASH: "border-purple-500/50 text-purple-400 bg-purple-500/10",
  ATTACK: "border-destructive/50 text-destructive bg-destructive/10",
  PII: "border-orange-500/50 text-orange-400 bg-orange-500/10",
};

export function RegexTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gi");
  const [testText, setTestText] = useState(
    "Contacta a admin@empresa.com o visita https://ejemplo.com\nIP del servidor: 192.168.1.1\nToken: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc123\n' OR '1'='1' -- inyección SQL\n<script>alert('xss')</script>"
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { matches, error } = useCallback(() => runRegex(pattern, flags, testText), [pattern, flags, testText])();

  const allFlags = ["g", "i", "m", "s"];

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, "") : prev + f);
  };

  const copyMatches = () => {
    const texts = matches.map(m => testText.slice(m.start, m.end));
    navigator.clipboard.writeText(texts.join("\n"));
    toast.success(`${texts.length} coincidencias copiadas`);
  };

  const filteredPatterns = activeCategory
    ? COMMON_PATTERNS.filter(p => p.category === activeCategory)
    : COMMON_PATTERNS;

  return (
    <div className="space-y-3">
      {/* Pattern input */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">PATRÓN</span>
          {matches.length > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 font-mono">
              {matches.length} coincidencia{matches.length !== 1 ? "s" : ""}
            </span>
          )}
          {matches.length > 0 && (
            <button onClick={copyMatches} className="ml-auto text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
              <Copy className="w-3 h-3" /> copiar resultados
            </button>
          )}
        </div>
        <div className="flex border border-border bg-muted focus-within:border-primary transition-colors">
          <span className="px-2 py-2 text-muted-foreground text-sm">/</span>
          <input
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            className="flex-1 bg-transparent px-1 py-2 text-foreground text-sm focus:outline-none font-mono"
            placeholder="[a-z]+"
            spellCheck={false}
          />
          <span className="px-2 py-2 text-muted-foreground text-sm">/{flags}</span>
        </div>
        {error && (
          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="flex gap-1 items-center">
        <span className="text-xs text-muted-foreground mr-1">FLAGS:</span>
        {allFlags.map(f => (
          <button
            key={f}
            onClick={() => toggleFlag(f)}
            className={`w-7 h-7 text-xs font-mono border transition-all ${
              flags.includes(f) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">CATEGORÍA DE PATRONES</div>
        <div className="flex flex-wrap gap-1 mb-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-2 py-1 border transition-all font-mono ${
              activeCategory === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            TODOS
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`text-xs px-2 py-1 border transition-all font-mono ${
                activeCategory === cat
                  ? CATEGORY_COLORS[cat]
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Common patterns */}
        <div className="flex flex-wrap gap-1">
          {filteredPatterns.map(p => (
            <button
              key={p.label}
              onClick={() => setPattern(p.pattern)}
              className={`text-xs px-2 py-1 border transition-all font-mono ${
                pattern === p.pattern
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test text */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">TEXTO DE PRUEBA</label>
        <textarea
          value={testText}
          onChange={e => setTestText(e.target.value)}
          className="w-full bg-muted border border-border px-3 py-2 text-foreground text-xs focus:outline-none focus:border-primary resize-none h-24 cyber-scrollbar"
          spellCheck={false}
        />
      </div>

      {/* Highlighted result */}
      {pattern && !error && (
        <div className="border border-border bg-muted p-3 text-xs max-h-40 overflow-y-auto cyber-scrollbar">
          <div className="text-xs text-muted-foreground mb-2">RESULTADO</div>
          <HighlightedText text={testText} matches={matches} />
        </div>
      )}

      {/* Match details */}
      {matches.length > 0 && (
        <div className="border border-border bg-muted p-3 space-y-1 max-h-36 overflow-y-auto cyber-scrollbar">
          <div className="text-xs text-primary mb-2">COINCIDENCIAS ({matches.length})</div>
          {matches.slice(0, 20).map((m, i) => (
            <div key={i} className="flex gap-3 text-xs font-mono">
              <span className="text-muted-foreground w-6">[{i}]</span>
              <span className="text-primary">{testText.slice(m.start, m.end)}</span>
              <span className="text-muted-foreground">pos:{m.start}–{m.end}</span>
            </div>
          ))}
          {matches.length > 20 && (
            <div className="text-xs text-muted-foreground">... y {matches.length - 20} más</div>
          )}
        </div>
      )}
    </div>
  );
}
