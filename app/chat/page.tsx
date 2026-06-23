'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import {
  Send, Sparkles, Loader2, Copy, CheckCheck,
  Trash2, Download, RefreshCw, RotateCcw,
} from 'lucide-react';
import { ChatMessage, Citation } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useCollections } from '@/lib/use-collections';
import AuthGate from '@/components/app/AuthGate';
import CollectionPicker from '@/components/app/CollectionPicker';
import Citations from '@/components/app/Citations';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <button onClick={copy} title="Copy message"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const QUICK_PROMPTS = [
  'Summarize the key points across all documents.',
  'What risks, deadlines, or action items should I know about?',
  'Create a structured action list with citations.',
  'Compare and contrast the main themes in these documents.',
];

export default function ChatPage() {
  const { collections } = useCollections();
  const [collectionId, setCollectionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('collectionId');
    if (id) setCollectionId(id);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  const send = useCallback(async (question?: string) => {
    const q = (question ?? input).trim();
    if (!q || busy) return;

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: q, createdAt: new Date().toISOString() };
    const asstId = generateId();
    const asstMsg: ChatMessage = { id: asstId, role: 'assistant', content: '', citations: [], createdAt: new Date().toISOString() };

    setMessages((m) => [...m, userMsg, asstMsg]);
    setInput('');
    setBusy(true);
    scrollToBottom();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, collectionId: collectionId || undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `${res.status}`);
      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = ''; let headerParsed = false; let citations: Citation[] = []; let answer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        if (!headerParsed) {
          const nl = buf.indexOf('\n');
          if (nl !== -1) {
            try { citations = JSON.parse(buf.slice(0, nl)).citations || []; } catch { citations = []; }
            buf = buf.slice(nl + 1);
            headerParsed = true;
            setMessages((m) => m.map((msg) => msg.id === asstId ? { ...msg, citations } : msg));
          }
        }
        if (headerParsed) {
          answer += buf; buf = '';
          setMessages((m) => m.map((msg) => msg.id === asstId ? { ...msg, content: answer } : msg));
          scrollToBottom();
        }
      }
    } catch (err) {
      setMessages((m) => m.map((msg) =>
        msg.id === asstId ? { ...msg, content: `⚠️ ${err instanceof Error ? err.message : 'Request failed'}` } : msg,
      ));
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }, [input, collectionId, busy, scrollToBottom]);

  const clearChat = () => setMessages([]);

  const exportChat = async () => {
    if (!messages.length) return;
    setExporting(true);
    try {
      const colName = collections.find((c) => c.id === collectionId)?.name || 'All collections';
      const res = await fetch('/api/export/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, collectionName: colName }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `chat-export-${Date.now()}.md`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    finally { setExporting(false); }
  };

  const wordCount = useMemo(() =>
    messages.filter((m) => m.role === 'assistant').reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0),
  [messages]);

  return (
    <AuthGate>
      <div className="flex flex-col h-[calc(100vh-4rem)]">

        {/* Header */}
        <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <h1 className="font-semibold flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-accent" />Chat
          </h1>
          <div className="flex-1" />
          <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} includeAll />
          {messages.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted hidden sm:block font-mono">
                {messages.length} msgs · {wordCount} words
              </span>
              <button
                onClick={exportChat}
                disabled={exporting}
                title="Export chat as Markdown"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-bg-card text-xs text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="h-8 w-8 rounded-lg border border-border bg-bg-card text-xs text-text-secondary hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-5">

            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Ask anything about your documents</h2>
                <p className="text-sm text-text-muted max-w-sm mx-auto mb-6">
                  Upload files in{' '}
                  <Link href="/documents" className="text-accent hover:underline">Documents</Link> first,
                  then ask questions here. Answers come with inline citations.
                </p>
                <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} onClick={() => send(prompt)}
                      className="rounded-xl border border-border bg-bg-card px-4 py-3 text-left text-xs text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex group ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-accent text-white' : 'glass'}`}>
                  {msg.role === 'assistant' && !msg.content && busy ? (
                    <span className="flex items-center gap-2 text-text-muted text-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                    </span>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose-sm text-sm leading-relaxed [&_p]:mb-2 [&_code]:text-accent-2 [&_strong]:text-text-primary">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && msg.citations && (
                    <Citations citations={msg.citations} />
                  )}
                </div>
                <CopyButton text={msg.content} />
                {msg.role === 'user' && (
                  <button onClick={() => send(msg.content)} title="Retry this prompt"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {messages.length === 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {QUICK_PROMPTS.slice(0,3).map((p) => (
                  <button key={p} onClick={() => send(p)}
                    className="whitespace-nowrap shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-border bg-bg-card text-text-muted hover:text-text-secondary hover:border-accent/30 transition-colors">
                    {p.slice(0, 36)}…
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
                placeholder="Ask a question about your documents… (Enter to send, Shift+Enter for newline)"
                className="flex-1 resize-none bg-bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40 max-h-40"
              />
              {busy && (
                <button onClick={() => setBusy(false)} title="Stop generation"
                  className="shrink-0 w-11 h-11 rounded-xl border border-border bg-bg-card text-text-muted hover:text-danger flex items-center justify-center transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => send()} disabled={busy || !input.trim()}
                className="shrink-0 w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-muted text-center">
              Answers are grounded in your documents · citations expand below each response
            </p>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
