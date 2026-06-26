'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import AuthGate from '@/components/app/AuthGate';
import Citations from '@/components/app/Citations';
import CollectionPicker from '@/components/app/CollectionPicker';
import { useCollections } from '@/lib/use-collections';
import { ChatMessage, Citation } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { toast } from '@/components/app/Toast';
import {
  Send, StopCircle, Trash2, Download, Copy, CheckCheck,
  RotateCcw, MessageSquare, Sparkles, AlertTriangle, Bot,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function UserAvatar({ name }: { name?: string }) {
  const initials = name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U';
  return (
    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
      <span className="text-[10px] font-bold text-blue-400">{initials}</span>
    </div>
  );
}

function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
      <Bot className="w-3.5 h-3.5 text-emerald-400" />
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /**/ }
  };
  return (
    <button onClick={copy} title="Copy"
      className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function ChatPage() {
  return <AuthGate><ChatInner /></AuthGate>;
}

function ChatInner() {
  const { collections } = useCollections();
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [input,         setInput]         = useState('');
  const [busy,          setBusy]          = useState(false);
  const [collectionId,  setCollectionId]  = useState<string | undefined>();
  const [sessionTitle,  setSessionTitle]  = useState('New Chat');
  const [wordCount,     setWordCount]     = useState(0);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const wc = messages
      .filter((m) => m.role === 'assistant')
      .reduce((s, m) => s + m.content.split(/\s+/).length, 0);
    setWordCount(wc);
  }, [messages]);

  const submit = useCallback(async (question: string) => {
    if (!question.trim() || busy) return;
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: question.trim(), createdAt: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setBusy(true);
    if (messages.length === 0) setSessionTitle(question.slice(0, 48));

    const assistantId = generateId();
    setMessages((p) => [...p, { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString() }]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  ctrl.signal,
        body:    JSON.stringify({ question: question.trim(), collectionId, topK: 6 }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let   first  = true;
      let   citations: Citation[] = [];
      let   buf    = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        if (first) {
          const nl = buf.indexOf('\n');
          if (nl >= 0) {
            try { const hdr = JSON.parse(buf.slice(0, nl)); citations = hdr.citations ?? []; } catch { /**/ }
            buf   = buf.slice(nl + 1);
            first = false;
          }
        }

        setMessages((p) =>
          p.map((m) => m.id === assistantId ? { ...m, content: m.content + buf, citations } : m)
        );
        buf = '';
      }

      setMessages((p) =>
        p.map((m) => m.id === assistantId ? { ...m, citations } : m)
      );
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setMessages((p) =>
        p.map((m) => m.id === assistantId ? { ...m, content: `⚠️ ${msg}` } : m)
      );
      toast.error(msg);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, collectionId, messages.length]);

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); submit(input); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input); }
  };
  const stop      = () => { abortRef.current?.abort(); setBusy(false); };
  const clearChat = () => { setMessages([]); setSessionTitle('New Chat'); setWordCount(0); };
  const retry     = (idx: number) => {
    const prev = messages[idx - 1];
    if (prev?.role === 'user') { setMessages((p) => p.slice(0, idx - 1)); submit(prev.content); }
  };

  const exportChat = async () => {
    const res = await fetch('/api/export/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages, title: sessionTitle }),
    });
    if (!res.ok) { toast.error('Export failed'); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = `${sessionTitle.replace(/\s+/g, '-')}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Chat exported');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{sessionTitle}</p>
            <p className="text-xs text-text-muted">
              {messages.length} msg{messages.length !== 1 ? 's' : ''} · {wordCount} words
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} placeholder="All docs" />
          {messages.length > 0 && (
            <>
              <button onClick={exportChat} title="Export as Markdown"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={clearChat} title="Clear chat"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1.5">Ask your documents anything</h2>
              <p className="text-sm text-text-muted max-w-sm">
                Questions are answered from your uploaded documents with precise source citations.
              </p>
            </div>
            {collections.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mt-2">
                {['Summarize the key points', 'What are the main risks?', 'List all dates mentioned', 'Compare these documents'].map((s) => (
                  <button key={s} onClick={() => submit(s)}
                    className="text-left px-4 py-3 rounded-xl border border-border bg-bg-card hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors text-xs text-text-secondary font-medium">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <BotAvatar />}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed prose-dm ${
                  msg.role === 'user'
                    ? 'bg-blue-600/15 border border-blue-500/25 text-text-primary'
                    : 'bg-bg-card border border-border text-text-primary'
                }`}>
                  {msg.content || (busy && msg.role === 'assistant' ? (
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : null)}
                  {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                    <Citations citations={msg.citations} />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[10px] text-text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'assistant' && <CopyBtn text={msg.content} />}
                  {msg.role === 'assistant' && i > 0 && (
                    <button onClick={() => retry(i)} title="Retry"
                      className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100">
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  {msg.content.includes('⚠️') && (
                    <AlertTriangle className="w-3 h-3 text-warning" />
                  )}
                </div>
              </div>
              {msg.role === 'user' && <UserAvatar />}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-bg-secondary/50 backdrop-blur-sm">
        <p className="text-center text-xs text-text-muted mb-2">
          Answers are grounded in your documents — citations expand below each response
        </p>
        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-2.5 rounded-2xl border border-border bg-bg-card px-4 py-3 focus-within:border-blue-500/50 transition-colors">
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm placeholder:text-text-muted focus:outline-none max-h-32 leading-relaxed"
              style={{ height: 'auto', minHeight: '1.5rem' }}
              onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 128)}px`; }}
            />
            {busy
              ? <button type="button" onClick={stop}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-danger/15 border border-danger/30 text-danger hover:bg-danger/25 transition-colors shrink-0">
                  <StopCircle className="w-4 h-4" />
                </button>
              : <button type="submit" disabled={!input.trim()}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0">
                  <Send className="w-4 h-4" />
                </button>
            }
          </div>
        </form>
      </div>
    </div>
  );
}
