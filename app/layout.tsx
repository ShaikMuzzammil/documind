import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/shared/Navigation';
import AppSidebar from '@/components/shared/AppSidebar';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocuMind - Chat with your documents',
  description:
    'An AI knowledge workspace: upload documents, ask questions, and get answers with citations. Retrieval-augmented generation, done right.',
  keywords: ['RAG', 'AI', 'documents', 'embeddings', 'vector search', 'LLM', 'chatbot'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased">
        <Navigation />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </body>
    </html>
  );
}
