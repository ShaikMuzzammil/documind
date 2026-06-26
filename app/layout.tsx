import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';
import Navigation   from '@/components/shared/Navigation';
import AppSidebar   from '@/components/shared/AppSidebar';
import ToastProvider from '@/components/app/Toast';

export const metadata: Metadata = {
  title:       'DocuMind — Document Intelligence Platform',
  description: 'Upload documents and query them with precision AI. Cited answers, analytics, batch extraction.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#05080f',
  width:      'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Navigation />
        <div className="flex pt-16">
          <AppSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}
