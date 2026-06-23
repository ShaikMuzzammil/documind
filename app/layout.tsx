import type { Metadata } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/shared/Navigation';
import AppSidebar from '@/components/shared/AppSidebar';
import ToastProvider from '@/components/app/Toast';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const mono  = IBM_Plex_Mono({ variable: '--font-mono', subsets: ['latin'], weight: ['400','500','600'] });

export const metadata: Metadata = {
  title: 'DocuMind — AI Document Intelligence',
  description: 'Upload documents, ask questions, and get precise cited answers — powered by Gemini AI and retrieval-augmented generation.',
  keywords: ['RAG','AI','document chat','Gemini','embeddings','vector search','PDF AI'],
  authors: [{ name: 'DocuMind' }],
  openGraph: {
    title: 'DocuMind — AI Document Intelligence',
    description: 'Turn your PDFs and notes into an AI knowledge base. Get cited, grounded answers.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'DocuMind — AI Document Intelligence', description: 'Turn your PDFs and notes into an AI knowledge base.' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased">
        <Navigation />
        <div className="flex flex-1 pt-16">
          <AppSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
        <ToastProvider />
      </body>
    </html>
  );
}
