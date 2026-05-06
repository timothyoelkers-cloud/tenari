'use client';

interface BarsProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
}

export function Bars({ data, w = 100, h = 28, color = 'var(--accent)' }: BarsProps) {
  if (!data?.length) return null;
  const max = Math.max(...data) || 1;
  const bw = (w - (data.length - 1) * 2) / data.length;
  return (
    <svg width={w} height={h}>
      {data.map((v, i) => (
        <rect
          key={i}
          x={i * (bw + 2)}
          y={h - (v / max) * h}
          width={bw}
          height={(v / max) * h}
          fill={color}
          rx="1"
        />
      ))}
    </svg>
  );
}
