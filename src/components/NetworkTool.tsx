import { useState } from "react";
import { Copy, CheckCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
function intToIp(n: number): string {
  return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".");
}
function ipToBinary(ip: string): string {
  return ip.split(".").map(n => Number(n).toString(2).padStart(8,"0")).join(".");
}
function parseSubnet(cidr: string) {
  const [ip, prefixStr] = cidr.split("/");
  const prefix = parseInt(prefixStr);
  if (!ip || isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error("CIDR inválido");
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) throw new Error("IP inválida");
  const mask = prefix === 0 ? 0 : (0xffffffff << (32-prefix)) >>> 0;
  const ipInt = ipToInt(ip);
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | (~mask >>> 0)) >>> 0;
  const firstHost = prefix <= 30 ? (networkInt + 1) >>> 0 : networkInt;
  const lastHost  = prefix <= 30 ? (broadcastInt - 1) >>> 0 : broadcastInt;
  const totalHosts = Math.pow(2, 32 - prefix);
  const usableHosts = prefix <= 30 ? totalHosts - 2 : totalHosts;
  return {
    ip, prefix, mask: intToIp(mask),
    network: intToIp(networkInt), broadcast: intToIp(broadcastInt),
    firstHost: intToIp(firstHost), lastHost: intToIp(lastHost),
    totalHosts: totalHosts.toLocaleString("es-ES"),
    usableHosts: usableHosts.toLocaleString("es-ES"),
    ipBinary: ipToBinary(ip), maskBinary: ipToBinary(intToIp(mask)), networkBinary: ipToBinary(intToIp(networkInt)),
    isPrivate: (
      (ipInt >= ipToInt("10.0.0.0") && ipInt <= ipToInt("10.255.255.255")) ||
      (ipInt >= ipToInt("172.16.0.0") && ipInt <= ipToInt("172.31.255.255")) ||
      (ipInt >= ipToInt("192.168.0.0") && ipInt <= ipToInt("192.168.255.255"))
    ),
    isLoopback: ipInt >= ipToInt("127.0.0.0") && ipInt <= ipToInt("127.255.255.255"),
    class: ipInt >= ipToInt("240.0.0.0") ? "E" : ipInt >= ipToInt("224.0.0.0") ? "D" : ipInt >= ipToInt("192.0.0.0") ? "C" : ipInt >= ipToInt("128.0.0.0") ? "B" : "A",
  };
}

export function NetworkTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState("192.168.1.0/24");
  const [result, setResult] = useState<ReturnType<typeof parseSubnet> | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const analyze = () => {
    try { setError(""); setResult(parseSubnet(input.trim())); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); setResult(null); }
  };
  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const rows = result ? [
    { labelKey: "network.rows.ip",      value: result.ip,                              key: "ip" },
    { labelKey: "network.rows.mask",    value: `${result.mask} (/${result.prefix})`,   key: "mask" },
    { labelKey: "network.rows.network", value: result.network,                         key: "net" },
    { labelKey: "network.rows.broadcast",value: result.broadcast,                      key: "bc" },
    { labelKey: "network.rows.first",   value: result.firstHost,                       key: "first" },
    { labelKey: "network.rows.last",    value: result.lastHost,                        key: "last" },
    { labelKey: "network.rows.usable",  value: result.usableHosts,                    key: "usable" },
    { labelKey: "network.rows.total",   value: result.totalHosts,                     key: "total" },
  ] : [];

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">{t("network.input_label")}</label>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()}
            className="flex-1 bg-muted border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary font-mono"
            placeholder="192.168.1.0/24" />
          <button onClick={analyze} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 glow-border-strong">
            {t("network.analyze_btn")}
          </button>
        </div>
        {error && <div className="text-xs text-destructive mt-1">{error}</div>}
      </div>

      <div className="flex gap-1 flex-wrap">
        {["192.168.1.0/24","10.0.0.0/8","172.16.0.0/12","192.168.0.1/30"].map(ex => (
          <button key={ex} onClick={() => setInput(ex)}
            className="text-xs px-2 py-1 border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-all font-mono">
            {ex}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <span className={`text-xs px-2 py-1 border font-mono ${result.isPrivate ? "border-primary/50 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
              {result.isPrivate ? t("network.private") : t("network.public")}
            </span>
            <span className="text-xs px-2 py-1 border border-border text-muted-foreground font-mono">
              {t("network.class", { cls: result.class })}
            </span>
            {result.isLoopback && (
              <span className="text-xs px-2 py-1 border border-border text-muted-foreground font-mono">{t("network.loopback")}</span>
            )}
          </div>

          <div className="border border-border">
            {rows.map((row, i) => (
              <div key={row.key} className={`flex justify-between items-center px-3 py-2 ${i%2===0?"bg-muted":"bg-muted/50"} border-b border-border/50 last:border-0`}>
                <span className="text-xs text-muted-foreground font-mono">{t(row.labelKey)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground font-mono">{row.value}</span>
                  <button onClick={() => copy(row.value, row.key)} className="text-muted-foreground hover:text-primary">
                    {copied === row.key ? <CheckCheck className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-border/50 bg-muted p-3">
            <div className="text-xs text-primary mb-2">{t("network.binary_title")}</div>
            <div className="space-y-1 font-mono text-xs">
              {[
                { label: "IP    ", value: result.ipBinary, cls: "text-foreground" },
                { label: "MÁSCARA", value: result.maskBinary, cls: "text-foreground" },
                { label: "RED   ", value: result.networkBinary, cls: "text-primary" },
              ].map(r => (
                <div key={r.label} className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">{r.label}</span>
                  <span className={r.cls}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
