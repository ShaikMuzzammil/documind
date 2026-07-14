import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/shared/Navigation';
import AppSidebar from '@/components/shared/AppSidebar';
import { ToastProvider } from '@/components/shared/Toast';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });
const mono  = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'DocuMind – Intelligent Document Workspace', template: '%s · DocuMind' },
  description:
    'Upload documents, ask questions in plain language, and get grounded, cited answers from your own files. A private RAG workspace powered by your own AI keys.',
  keywords: ['document AI', 'RAG', 'vector search', 'document intelligence', 'chat with PDF'],
  robots: { index: true, follow: true },
  icons: { icon: [{ url: '/favicon.png', type: 'image/png' }], apple: '/favicon.png' },
};

export const viewport: Viewport = {
  themeColor: '#080a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased">
        <ToastProvider>
          <Navigation />
          <div className="flex flex-1">
            <AppSidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
