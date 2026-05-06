import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tenari — Multi-Tenant Azure Management',
  description: 'MSP control plane for managing Azure tenants at scale',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
