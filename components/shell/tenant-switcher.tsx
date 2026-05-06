'use client';

import { useEffect, useRef, useState } from 'react';
import { TENANTS } from '@/lib/data/mock';
import { Icon } from '../icons';

interface TenantSwitcherProps {
  tenantId: string;
  onChange: (id: string) => void;
  allOption?: boolean;
}

export function TenantSwitcher({ tenantId, onChange, allOption = true }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = TENANTS.filter(
    t => t.name.toLowerCase().includes(q.toLowerCase()) || t.id.toLowerCase().includes(q.toLowerCase())
  );
  const current = tenantId === 'ALL' ? null : TENANTS.find(t => t.id === tenantId);

  return (
    <div
      className="tenant-switcher"
      ref={ref}
      onClick={() => setOpen(o => !o)}
      style={{ userSelect: 'none' }}
    >
      <div
        className="tenant-pip"
        style={{
          background: current
            ? current.color
            : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        }}
      >
        {current ? current.initials : <Icon name="layers" size={11} />}
      </div>
      <div className="tenant-info">
        <div className="tenant-name">{current ? current.name : 'All Tenants'}</div>
        <div className="tenant-id mono">
          {current ? current.id : `${TENANTS.length} organizations`}
        </div>
      </div>
      <Icon name="chevron" className="chevron" size={14} />

      {open && (
        <div className="tenant-menu" onClick={e => e.stopPropagation()}>
          <div className="tenant-menu-search">
            <input
              autoFocus
              placeholder="Search tenants…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <div className="tenant-menu-list">
            {allOption && (
              <button
                className={`tenant-menu-item ${tenantId === 'ALL' ? 'active' : ''}`}
                onClick={() => { onChange('ALL'); setOpen(false); }}
              >
                <div className="tenant-pip" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
                  <Icon name="layers" size={11} />
                </div>
                <div className="tenant-info">
                  <div className="tenant-name">All Tenants</div>
                  <div className="tenant-id mono">{TENANTS.length} organizations</div>
                </div>
                {tenantId === 'ALL' && <Icon name="check" size={14} />}
              </button>
            )}
            {filtered.map(t => (
              <button
                key={t.id}
                className={`tenant-menu-item ${tenantId === t.id ? 'active' : ''}`}
                onClick={() => { onChange(t.id); setOpen(false); }}
              >
                <div className="tenant-pip" style={{ background: t.color }}>{t.initials}</div>
                <div className="tenant-info">
                  <div className="tenant-name">{t.name}</div>
                  <div className="tenant-id mono">{t.id} · {t.subs} subs</div>
                </div>
                <span
                  className={`pill ${t.status === 'crit' ? 'danger' : t.status === 'warn' ? 'warn' : 'ok'}`}
                  style={{ marginLeft: 'auto' }}
                >
                  <span className="dot" />
                  {t.status === 'crit' ? 'Critical' : t.status === 'warn' ? 'Warn' : 'OK'}
                </span>
              </button>
            ))}
          </div>
          <div className="tenant-menu-foot">
            <button className="btn btn-sm btn-ghost"><Icon name="plus" size={12} /> Add tenant</button>
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }}><Icon name="settings" size={12} /> Manage</button>
          </div>
        </div>
      )}
    </div>
  );
}
