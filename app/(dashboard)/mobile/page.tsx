'use client';

import { ALERTS, TENANTS } from '@/lib/data/mock';

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#0b1220', borderRadius: 36, padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,.4)', border: '1px solid #1e2a44', width: 300 }}>
      <div style={{ background: '#000', borderRadius: 30, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', color: '#e6edf7', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          <span>9:41</span><span>•••</span>
        </div>
        <div style={{ background: '#0b1220', padding: '14px 14px 8px', borderBottom: '1px solid #1e2a44' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#e6edf7' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#8a9bb8' }}>Tenari · all tenants</div>
        </div>
        <div style={{ height: 380, background: '#0b1220', overflow: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

function SparkBig() {
  const data = [40, 42, 45, 52, 48, 55, 60, 58, 65, 68, 72, 75];
  const max = Math.max(...data); const min = Math.min(...data);
  const w = 260, h = 60;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min)) * h * 0.9 - h * 0.05}`).join(' ');
  return (
    <svg width={w} height={h}>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill="rgba(59,130,246,.18)" stroke="none" />
      <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
    </svg>
  );
}

export default function MobilePage() {
  const critAlerts = ALERTS.filter(a => a.sev === 'crit').slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mobile Companion</h1>
          <p className="page-sub">On-call view for after-hours response</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,320px))', gap: 24, justifyContent: 'center', padding: '20px 0' }}>
        <PhoneFrame title="Alerts">
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#8a9bb8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Critical · {critAlerts.length} open</div>
            {critAlerts.map(a => (
              <div key={a.id} style={{ background: '#131c30', border: '1px solid #1e2a44', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                  <span className="sev crit" />
                  <span style={{ fontSize: 11, color: '#f87171' }}>Critical</span>
                  <span style={{ fontSize: 11, color: '#5a6b86', marginLeft: 'auto' }}>{a.when}</span>
                </div>
                <div style={{ fontSize: 13, color: '#e6edf7', fontWeight: 500, marginBottom: 2 }}>{a.rule}</div>
                <div style={{ fontSize: 11, color: '#8a9bb8' }}>{a.tenant}</div>
              </div>
            ))}
          </div>
        </PhoneFrame>

        <PhoneFrame title="Spend">
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#8a9bb8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Today</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: '#e6edf7', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>$92,140</div>
            <div style={{ fontSize: 11, color: '#34d399', marginBottom: 14 }}>↓ 4.2% vs yesterday</div>
            <SparkBig />
            <div style={{ fontSize: 11, color: '#8a9bb8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 6px' }}>Top tenants</div>
            {TENANTS.slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #1e2a44' }}>
                <div className="tenant-pip" style={{ background: t.color, width: 20, height: 20, fontSize: 9 }}>{t.initials}</div>
                <span style={{ fontSize: 12, color: '#e6edf7', flex: 1 }}>{t.name}</span>
                <span style={{ fontSize: 12, color: '#8a9bb8', fontFamily: 'var(--font-mono)' }}>${(t.monthly / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </PhoneFrame>

        <PhoneFrame title="Approve">
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: '#8a9bb8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Pending approval</div>
            <div style={{ background: '#131c30', border: '1px solid #1e2a44', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#a3e635', marginBottom: 6 }}>Saving $1,840 / mo</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf7', marginBottom: 2 }}>Reserved Instance · sqldb-warehouse</div>
              <div style={{ fontSize: 11, color: '#8a9bb8', marginBottom: 14 }}>Meridian Capital · Confidence 87%</div>
              <button style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, marginBottom: 6, cursor: 'pointer' }}>
                Approve
              </button>
              <button style={{ width: '100%', padding: '10px', background: 'transparent', color: '#8a9bb8', border: '1px solid #1e2a44', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
                Defer
              </button>
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
