'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { ThemeProvider, ToastProvider } from '@/components/providers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [tenantId, setTenantId] = useState('ALL');

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="app">
          <Sidebar />
          <Topbar tenantId={tenantId} onTenantChange={setTenantId} />
          <main className="main">{children}</main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
