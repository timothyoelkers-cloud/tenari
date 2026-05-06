'use client';

import { fmtMoneyK } from '@/lib/data/mock';

interface SpendChartProps {
  data: number[];
}

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

export function SpendChart({ data }: SpendChartProps) {
  const W = 720, H = 220;
  const pad = { l: 50, r: 10, t: 10, b: 24 };
  const max = Math.max(...data) * 1.1;
  const min = 0;
  const xs = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const ys = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const path = data.map((v, i) => `${i ? 'L' : 'M'} ${xs(i)} ${ys(v)}`).join(' ');
  const areaPath = `${path} L ${xs(data.length - 1)} ${H - pad.b} L ${xs(0)} ${H - pad.b} Z`;
  const yTicks = 4;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxHeight: 260 }}>
      <defs>
        <linearGradient id="spendgrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const y = pad.t + (i / yTicks) * (H - pad.t - pad.b);
        const v = max - (i / yTicks) * (max - min);
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="var(--border)" strokeDasharray="2 4" />
            <text x={pad.l - 8} y={y + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="var(--font-mono)">
              {fmtMoneyK(v)}
            </text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#spendgrad)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={xs(i)} cy={ys(v)} r="3" fill="var(--bg-elev)" stroke="var(--accent)" strokeWidth="1.5" />
      ))}
      {MONTHS.map((m, i) => (
        <text key={i} x={xs(i)} y={H - 6} fill="var(--text-muted)" fontSize="10" textAnchor="middle">{m}</text>
      ))}
    </svg>
  );
}
