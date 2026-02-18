import { useState, useCallback } from "react";
import { AlertCircle } from "lucide-react";

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
  { label: "Email", pattern: "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}" },
  { label: "IPv4", pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b" },
  { label: "URL", pattern: "https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+" },
  { label: "JWT", pattern: "eyJ[a-zA-Z0-9_\\-]+\\.eyJ[a-zA-Z0-9_\\-]+\\.[a-zA-Z0-9_\\-]+" },
  { label: "Hash MD5", pattern: "\\b[a-fA-F0-9]{32}\\b" },
  { label: "Hash SHA256", pattern: "\\b[a-fA-F0-9]{64}\\b" },
  { label: "Tarjeta crédito", pattern: "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\\b" },
  { label: "Teléfono ES", pattern: "(?:\\+34|0034)?[6789]\\d{8}" },
];

export function RegexTool() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("gi");
  const [testText, setTestText] = useState(
    "Contacta a admin@empresa.com o visita https://ejemplo.com\nIP del servidor: 192.168.1.1\nToken: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc123"
  );

  const { matches, error } = useCallback(() => runRegex(pattern, flags, testText), [pattern, flags, testText])();

  const allFlags = ["g", "i", "m", "s"];

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, "") : prev + f);
  };

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
        <span className="text-xs text-muted-foreground ml-2">
          {flags.includes("g") ? "global" : ""}{flags.includes("i") ? " insensible" : ""}{flags.includes("m") ? " multilinea" : ""}
        </span>
      </div>

      {/* Common patterns */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">PATRONES COMUNES</div>
        <div className="flex flex-wrap gap-1">
          {COMMON_PATTERNS.map(p => (
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
