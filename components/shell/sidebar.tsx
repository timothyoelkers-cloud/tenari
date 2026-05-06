'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../icons';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
  alertBadge?: string;
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Manage',
    items: [
      { href: '/', label: 'Overview', icon: 'home' },
      { href: '/tenants', label: 'Tenants', icon: 'layers', badge: '60' },
      { href: '/policies', label: 'Policies', icon: 'shield', badge: '12' },
      { href: '/savings', label: 'Cost & Savings', icon: 'piggy-bank', badge: '$284k' },
      { href: '/bicep', label: 'AI Bicep', icon: 'sparkles' },
    ],
  },
  {
    group: 'Operate',
    items: [
      { href: '/alerts', label: 'Alerts', icon: 'bell', alertBadge: '4' },
      { href: '/reports', label: 'Reports', icon: 'file-text' },
      { href: '/billing', label: 'Billing', icon: 'receipt' },
      { href: '/audit', label: 'Audit Log', icon: 'activity' },
    ],
  },
  {
    group: 'Admin',
    items: [
      { href: '/rbac', label: 'Users & RBAC', icon: 'users' },
      { href: '/portal', label: 'Customer Portal', icon: 'palette' },
      { href: '/mobile', label: 'Mobile View', icon: 'smartphone' },
      { href: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">Tenari</div>
          <div className="brand-tag">MSP Console</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="nav-section">{g.group}</div>
            {g.items.map(item => (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
                <Icon name={item.icon} size={16} className="icon" />
                <span>{item.label}</span>
                {item.badge && <span className="badge mono">{item.badge}</span>}
                {item.alertBadge && <span className="badge alert mono">{item.alertBadge}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">SC</div>
          <div className="user-info">
            <div className="user-name">Sarah Chen</div>
            <div className="user-role">Owner · Tenari MSP</div>
          </div>
          <Icon name="chevron" size={14} className="dim" />
        </div>
      </div>
    </div>
  );
}
