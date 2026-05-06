'use client';

interface Segment {
  name?: string;
  value: number;
  color: string;
}

interface DonutProps {
  size?: number;
  thickness?: number;
  segments: Segment[];
}

export function Donut({ size = 120, thickness = 14, segments }: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="var(--bg-hover)" strokeWidth={thickness} fill="none"
      />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dasharray = `${len} ${c - len}`;
        const el = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            stroke={s.color} strokeWidth={thickness} fill="none"
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}
