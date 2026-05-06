'use client';

import { Icon } from './icons';
import { Sparkline } from './charts/sparkline';

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDir?: 'up' | 'down';
  sub?: string;
  spark?: number[];
  sparkColor?: string;
}

export function KpiCard({ label, value, delta, deltaDir, sub, spark, sparkColor = 'var(--accent)' }: KpiCardProps) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value tabular">{value}</div>
      <div className="kpi-delta">
        {deltaDir && (
          <Icon
            name={deltaDir === 'up' ? 'trending-up' : 'trending-down'}
            size={12}
            className={deltaDir === 'up' ? 'ok-text' : 'bad-text'}
          />
        )}
        <span style={{ color: deltaDir === 'up' ? 'var(--ok)' : deltaDir === 'down' ? 'var(--danger)' : 'inherit' }}>
          {delta}
        </span>
        {sub && <span className="muted">{sub}</span>}
      </div>
      {spark && (
        <div className="kpi-spark">
          <Sparkline data={spark} w={84} h={28} color={sparkColor} area />
        </div>
      )}
    </div>
  );
}
