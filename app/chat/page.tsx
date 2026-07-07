'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Loader2, Download, ArrowDown,
  AlertTriangle, Settings, BookOpen, Zap, FileText, Clock,
  Upload, FolderPlus, MessageSquare, ChevronRight, RotateCcw,
  Copy, Check, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { ChatMessage, Citation } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useCollections } from '@/lib/use-collections';
import { useUser } from '@/lib/use-user';
import AuthGate from '@/components/app/AuthGate';
import CollectionPicker from '@/components/app/CollectionPicker';
import Citations from '@/components/app/Citations';

const QUICK_PROMPTS = [
  { icon: BookOpen,      text: 'Summarize the key points across all my documents.' },
  { icon: AlertTriangle, text: 'What risks, deadlines, or open questions should I know about?' },
  { icon: FileText,      text: 'Give me a structured action list with source citations.' },
  { icon: Clock,         text: 'What are the most recent dates or deadlines mentioned?' },
];

export default function ChatPage() {
  const { collections } = useCollections();
  const { capabilities } = useUser() as { capabilities?: { ai?: boolean } };
  const [collectionId, setCollectionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [docCount, setDocCount] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const aiReady = capabilities?.ai;
  const hasMessages = messages.length > 0;
  const userMessages = messages.filter(m => m.role === 'user').length;

  // Load initial state from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('collectionId')) setCollectionId(params.get('collectionId')!);
    if (params.get('q')) setInput(params.get('q')!);
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => setDocCount((d.documents || []).filter((doc: { status: string }) => doc.status === 'ready').length))
      .catch(() => setDocCount(0));
  }, []);

  // Scroll detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const h = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    });
  }, []);

  const clearChat = () => { if (!busy) { setMessages([]); setTimeout(() => inputRef.current?.focus(), 50); } };

  const exportChat = () => {
    if (!messages.length) return;
    const md = `# DocuMind Chat Export\n*${new Date().toLocaleString()}*\n\n` +
      messages.map(m => `### ${m.role === 'user' ? 'You' : 'DocuMind'}\n${m.content}`).join('\n\n---\n\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([md], { type: 'text/markdown' })),
      download: `chat-${new Date().toISOString().slice(0, 10)}.md`,
    });
    a.click();
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Core send — accepts the question directly to avoid stale closure on input state
  const sendQuestion = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;

    const userId = generateId();
    const assistantId = generateId();
    const now = new Date().toISOString();

    const userMsg: ChatMessage = { id: userId, role: 'user', content: q, createdAt: now };
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', citations: [], createdAt: now };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setBusy(true);
    setTimeout(() => scrollToBottom(), 60);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, collectionId: collectionId || undefined }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let headerParsed = false;
      let citations: Citation[] = [];
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        if (!headerParsed) {
          const nl = buf.indexOf('\n');
          if (nl !== -1) {
            try { citations = JSON.parse(buf.slice(0, nl)).citations || []; } catch { citations = []; }
            buf = buf.slice(nl + 1);
            headerParsed = true;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, citations } : m));
          }
        }
        if (headerParsed) {
          answer += buf;
          buf = '';
          const captured = answer;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: captured } : m));
          scrollToBottom();
        }
      }
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Request failed';
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `⚠ ${errText}` } : m));
    } finally {
      setBusy(false);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [busy, collectionId, scrollToBottom]);

  const handleSend = () => sendQuestion(input);
  const handlePrompt = (text: string) => sendQuestion(text);

  const hasCollections = collections.length > 0;
  const hasIndexedDocs = docCount !== null && docCount > 0;

  return (
    <AuthGate>
      <div className="flex flex-col h-screen overflow-hidden">

        {/* ── Top bar ── */}
        <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3 bg-bg-secondary/40 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm leading-none">Chat</h1>
              {userMessages > 0 && (
                <p className="text-[10px] text-text-muted mt-0.5">{userMessages} question{userMessages !== 1 ? 's' : ''} this session</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} includeAll />
            {hasMessages && (
              <>
                <button onClick={exportChat} title="Export as Markdown"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button onClick={clearChat} disabled={busy} title="Clear conversation"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/30 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Status banners ── */}
        <AnimatePresence>
          {aiReady === false && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              className="border-b border-warning/20 bg-warning/6 px-5 py-2.5 flex items-center gap-3 text-xs text-warning overflow-hidden shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>AI answers need an API key configured.</span>
              <Link href="/settings" className="ml-auto flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 hover:bg-warning/20 font-medium shrink-0 transition-colors">
                <Settings className="h-3 w-3" /> Configure
              </Link>
            </motion.div>
          )}
          {aiReady === true && !hasMessages && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
              className="border-b border-success/15 bg-success/5 px-5 py-2 flex items-center gap-2 text-xs text-success overflow-hidden shrink-0"
            >
              <Zap className="h-3 w-3" /> Answer engine ready — ask anything about your documents.
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Scrollable message area ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Empty / Welcome state */}
            {!hasMessages && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-2/10 border border-accent/20 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/10">
                  <Sparkles className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ask DocuMind anything</h2>
                <p className="text-sm text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">
                  Get grounded, cited answers straight from your own documents.
                </p>

                {/* Setup wizard if not ready */}
                {!hasCollections ? (
                  <div className="glass rounded-2xl p-6 max-w-md mx-auto">
                    <p className="text-sm font-bold text-text-secondary mb-4 tracking-wide">GET STARTED IN 3 STEPS</p>
                    {[
                      { href: '/collections', icon: FolderPlus, label: '1. Create a collection', sub: 'Organize docs by project or topic' },
                      { href: '/documents',   icon: Upload,     label: '2. Upload documents',    sub: 'PDF, TXT, MD, CSV, JSON, code files' },
                    ].map(({ href, icon: Icon, label, sub }) => (
                      <Link key={href} href={href}
                        className="flex items-center gap-3 rounded-xl border border-border bg-bg-card/60 px-4 py-3 text-left hover:border-accent/30 hover:bg-accent/5 transition-all group mb-2"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-xs text-text-muted">{sub}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-accent ml-auto transition-colors" />
                      </Link>
                    ))}
                    <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">3. Ask questions here</p>
                        <p className="text-xs text-text-muted">Get cited answers from your documents</p>
                      </div>
                    </div>
                  </div>
                ) : !hasIndexedDocs ? (
                  <div className="glass rounded-2xl p-8 max-w-sm mx-auto text-center">
                    <Upload className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-30" />
                    <p className="font-bold mb-2">No indexed documents yet</p>
                    <p className="text-sm text-text-muted mb-5">Upload at least one document so DocuMind has content to search through.</p>
                    <Link href="/documents"
                      className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      <Upload className="h-4 w-4" /> Upload documents
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-bold tracking-widest text-text-muted mb-4">SUGGESTED QUESTIONS</p>
                    <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                      {QUICK_PROMPTS.map(({ icon: Icon, text }) => (
                        <button key={text} onClick={() => handlePrompt(text)}
                          className="rounded-xl border border-border bg-bg-card/70 px-4 py-3 text-left text-xs text-text-secondary hover:border-accent/30 hover:text-text-primary hover:bg-accent/5 flex items-start gap-2.5 transition-all active:scale-[0.98]"
                        >
                          <Icon className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                          {text}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-text-muted mt-5">
                      {docCount} document{docCount !== 1 ? 's' : ''} indexed
                      {collectionId ? ' in selected collection' : ' across all collections'}
                    </p>
                  </>
                )}
              </motion.div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div className={`group relative max-w-[88%] rounded-2xl ${
                  msg.role === 'user' ? 'bg-accent text-white px-4 py-3' : 'glass px-4 py-4'
                }`}>
                  {/* Assistant thinking indicator */}
                  {msg.role === 'assistant' && !msg.content && busy ? (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <span className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }}
                          />
                        ))}
                      </span>
                      Searching your documents…
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <>
                      <div className="prose-sm text-sm leading-relaxed text-text-secondary [&_p]:mb-2 [&_p:last-child]:mb-0 [&_code]:text-accent [&_code]:bg-bg-secondary/60 [&_code]:px-1 [&_code]:rounded [&_strong]:text-text-primary [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.citations && <Citations citations={msg.citations} />}
                      {/* Message actions */}
                      {msg.content && !busy && (
                        <div className="mt-3 pt-2 border-t border-border/40 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copyMessage(msg.id, msg.content)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                          >
                            {copiedId === msg.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                            {copiedId === msg.id ? 'Copied' : 'Copy'}
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-text-muted hover:text-success transition-colors">
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-text-muted hover:text-danger transition-colors">
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                onClick={() => scrollToBottom()}
                className="fixed bottom-28 right-6 z-10 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
              >
                <ArrowDown className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Composer ── */}
        <div className="border-t border-border px-4 sm:px-6 py-3 pb-20 lg:pb-3 bg-bg-secondary/20 shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              {/* Upload shortcut */}
              <Link href="/documents" title="Upload documents"
                className="shrink-0 w-11 h-11 rounded-xl border border-border bg-bg-card text-text-muted flex items-center justify-center hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
              >
                <Upload className="w-4 h-4" />
              </Link>

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  rows={1}
                  placeholder="Ask anything about your documents… (Enter to send)"
                  className="w-full resize-none bg-bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40 transition-colors max-h-36"
                  style={{ minHeight: 48 }}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = 'auto';
                    t.style.height = Math.min(t.scrollHeight, 144) + 'px';
                  }}
                />
              </div>
              <button onClick={handleSend} disabled={busy || !input.trim()}
                className="shrink-0 w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-text-muted mt-2">
              DocuMind searches your indexed documents and generates cited answers · <Link href="/documents" className="hover:text-accent transition-colors underline underline-offset-2">Add documents</Link>
            </p>
          </div>
        </div>

      </div>
    </AuthGate>
  );
}
