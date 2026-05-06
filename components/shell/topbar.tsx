'use client';

import { useTheme } from '../providers';
import { TenantSwitcher } from './tenant-switcher';
import { Icon } from '../icons';

interface TopbarProps {
  tenantId: string;
  onTenantChange: (id: string) => void;
  allOption?: boolean;
}

export function Topbar({ tenantId, onTenantChange, allOption = true }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="topbar">
      <TenantSwitcher tenantId={tenantId} onChange={onTenantChange} allOption={allOption} />

      <div className="search">
        <Icon name="search" size={14} className="dim" />
        <input placeholder="Search resources, policies, alerts…" />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" title="Refresh">
          <Icon name="refresh" size={16} />
        </button>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>
        <button className="icon-btn" title="Notifications">
          <Icon name="bell" size={16} />
          <span className="dot" />
        </button>
      </div>
    </div>
  );
}
