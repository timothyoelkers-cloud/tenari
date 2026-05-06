'use client';

interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  area?: boolean;
}

export function Sparkline({ data, w = 80, h = 24, color = 'currentColor', area = false }: SparklineProps) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / span) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      {area && (
        <polyline
          points={`0,${h} ${pts} ${w},${h}`}
          fill={color}
          fillOpacity="0.15"
          stroke="none"
        />
      )}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
