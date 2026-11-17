export function Pesan({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="card text-sm" style={{ borderColor: "#c0563b" }}>{pesan}</p>;
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="muted text-xs">{label}</div>
      <div className="stat">{value}</div>
      {sub && <div className="muted text-xs">{sub}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

export function Pertumbuhan({ data }: { data: { tanggal: string; berat: number }[] }) {
  if (data.length < 2) return <p className="muted text-sm">Grafik muncul setelah 2 kali timbang.</p>;
  const w = 320, h = 120, p = 24;
  const t = data.map((d) => new Date(d.tanggal).getTime());
  const b = data.map((d) => Number(d.berat));
  const t0 = Math.min(...t), t1 = Math.max(...t), b0 = Math.min(...b) * 0.95, b1 = Math.max(...b) * 1.05;
  const x = (v: number) => p + ((v - t0) / (t1 - t0 || 1)) * (w - 2 * p);
  const y = (v: number) => h - p + -((v - b0) / (b1 - b0 || 1)) * (h - 2 * p);
  const pts = data.map((_, i) => `${x(t[i])},${y(b[i])}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md" role="img" aria-label="Grafik berat badan">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(t[i])} cy={y(b[i])} r="3" fill="var(--accent)" />
          <text x={x(t[i])} y={y(b[i]) - 7} fontSize="9" textAnchor="middle" fill="currentColor">{b[i]}</text>
        </g>
      ))}
      <text x={p} y={h - 6} fontSize="9" fill="currentColor" opacity=".6">{data[0].tanggal}</text>
      <text x={w - p} y={h - 6} fontSize="9" textAnchor="end" fill="currentColor" opacity=".6">{data[data.length - 1].tanggal}</text>
    </svg>
  );
}
