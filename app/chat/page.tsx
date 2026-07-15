'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp, Bot, ChevronDown, Copy, Check,
  Loader2, MessageSquare, Plus, Sparkles,
  Trash2, Upload, X, Edit2, Zap, PanelLeftClose,
  PanelLeft, Globe, BookOpen,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useUser } from '@/lib/use-user';
import { useCollections } from '@/lib/use-collections';
import { ChatSession, ChatSessionMessage, Citation } from '@/lib/types';

type ChatMode = 'documents' | 'general';

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-bold mt-3 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-bold mt-4 mb-1.5">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h1>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1 pl-4">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>,
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 space-y-1 pl-4 list-decimal">
          {items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed ml-2" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ol>,
      );
      continue;
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={i} className="my-3 rounded-xl border border-border overflow-hidden">
          {lang && <div className="bg-bg-secondary/80 px-3 py-1 text-[10px] font-mono text-text-muted border-b border-border">{lang}</div>}
          <pre className="bg-bg-secondary/40 p-3 overflow-x-auto text-xs font-mono leading-relaxed text-text-primary whitespace-pre">
            {codeLines.join('\n')}
          </pre>
        </div>,
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="my-2 border-l-2 border-accent/40 pl-3 text-sm text-text-secondary italic">
          {line.slice(2)}
        </blockquote>,
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />,
      );
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-bg-secondary/80 border border-border rounded px-1 py-0.5 text-[11px] font-mono">$1</code>')
    .replace(/\[(\d+)\]/g, '<sup class="text-accent font-bold cursor-default">[$1]</sup>');
}

// ── Citation card ─────────────────────────────────────────────────────────────
function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(citation.score * 100);
  return (
    <div className="rounded-xl border border-border bg-bg-secondary/40 overflow-hidden transition-all hover:border-accent/20">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover/50 transition-colors"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">{index}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-text-primary">{citation.documentName}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-bg-secondary">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-text-muted">{pct}% match · chunk {citation.index + 1}</span>
          </div>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="border-t border-border/50 px-3 py-3">
          <p className="text-xs leading-relaxed text-text-secondary line-clamp-6">{citation.text}</p>
        </div>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  msg, isStreaming,
}: {
  msg: { id: string; role: string; content: string; citations?: Citation[]; createdAt: string };
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copyText = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
        isUser ? 'bg-gradient-to-br from-accent to-accent-2 text-white text-xs font-bold' : 'border border-accent/25 bg-accent/10 text-accent'
      }`}>
        {isUser ? '↑' : <Bot className="h-4 w-4" />}
      </div>

      <div className={`min-w-0 max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-bg-card border border-border rounded-tl-sm'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="text-text-primary">
              <MarkdownContent text={msg.content} />
              {isStreaming && (
                <span className="inline-flex h-4 w-1.5 ml-0.5 -mb-0.5 animate-pulse bg-accent/70 rounded-sm" />
              )}
            </div>
          )}
        </div>

        {!isUser && msg.citations && msg.citations.length > 0 && !isStreaming && (
          <div className="w-full space-y-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {msg.citations.map((c, i) => (
                <CitationCard key={c.chunkId} citation={c} index={i + 1} />
              ))}
            </div>
          </div>
        )}

        {!isStreaming && (
          <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
            <button onClick={copyText} className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors">
              {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <span className="text-[10px] text-text-muted">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Session list item ──────────────────────────────────────────────────────────
function SessionItem({
  session, active, onSelect, onDelete, onRename,
}: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    if (title.trim() && title !== session.title) onRename(title.trim());
    setEditing(false);
  };

  return (
    <div
      className={`group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
        active ? 'bg-accent/12 text-accent' : 'hover:bg-bg-hover text-text-secondary hover:text-text-primary'
      }`}
      onClick={() => !editing && onSelect()}
    >
      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={save}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="flex-1 min-w-0 bg-transparent text-xs text-text-primary border-b border-accent outline-none"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-xs">{session.title}</span>
      )}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-bg-card transition-colors">
          <Edit2 className="h-3 w-3" />
        </button>
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ── Mode toggle pill ──────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: ChatMode; onChange: (m: ChatMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-bg-secondary/60 p-0.5">
      <button
        onClick={() => onChange('documents')}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
          mode === 'documents'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        <BookOpen className="h-3 w-3" />
        Documents
      </button>
      <button
        onClick={() => onChange('general')}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
          mode === 'general'
            ? 'bg-accent text-white shadow-sm'
            : 'text-text-muted hover:text-text-primary'
        }`}
      >
        <Globe className="h-3 w-3" />
        General AI
      </button>
    </div>
  );
}

// ── Main chat page ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, capabilities } = useUser() as unknown as {
    user: { id?: string; name?: string; email?: string } | null;
    capabilities?: { ai?: boolean };
  };
  const { collections } = useCollections();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMode, setChatMode] = useState<ChatMode>('documents');

  const [messages, setMessages] = useState<{ id: string; role: string; content: string; citations?: Citation[]; createdAt: string }[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [loadingSession, setLoadingSession] = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resizeTextarea = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const loadSession = async (session: ChatSession) => {
    setActiveSessionId(session.id);
    setCollectionId(session.collectionId || '');
    setLoadingSession(true);
    try {
      const r = await fetch(`/api/chat/sessions/${session.id}`);
      const d = await r.json();
      setMessages((d.messages || []).map((m: ChatSessionMessage & { citations?: Citation[] }) => ({
        id: m.id, role: m.role, content: m.content,
        citations: m.citations || undefined, createdAt: m.createdAt,
      })));
    } catch {
      setMessages([]);
    } finally {
      setLoadingSession(false);
    }
  };

  const newSession = async () => {
    const r = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New conversation', collectionId: collectionId || undefined }),
    });
    const d = await r.json();
    if (d.session) {
      setSessions(prev => [d.session, ...prev]);
      setActiveSessionId(d.session.id);
      setMessages([]);
    }
  };

  const deleteSession = async (sessionId: string) => {
    await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) { setActiveSessionId(null); setMessages([]); }
  };

  const renameSession = async (sessionId: string, title: string) => {
    await fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  };

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Build general-AI history from current messages
    const history = chatMode === 'general'
      ? messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      : [];

    // Create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const r = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: q.slice(0, 60), collectionId: chatMode === 'documents' ? (collectionId || undefined) : undefined }),
        });
        const d = await r.json();
        if (d.session) {
          sessionId = d.session.id;
          setActiveSessionId(d.session.id);
          setSessions(prev => [d.session, ...prev]);
        }
      } catch { /* session-less mode */ }
    }

    const userMsgId = `u-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', content: q, createdAt: new Date().toISOString() }]);

    const assistantMsgId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString() }]);
    setStreaming(true);
    setStreamingId(assistantMsgId);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          mode: chatMode,
          collectionId: chatMode === 'documents' ? (collectionId || undefined) : undefined,
          sessionId,
          history,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', citations: Citation[] | undefined;
      let headerParsed = false, answerText = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!headerParsed) {
          const nlIdx = buffer.indexOf('\n');
          if (nlIdx !== -1) {
            try {
              const header = JSON.parse(buffer.slice(0, nlIdx));
              citations = header.citations;
            } catch { /* ignore */ }
            buffer = buffer.slice(nlIdx + 1);
            headerParsed = true;
          }
        }

        if (headerParsed) {
          answerText += buffer;
          buffer = '';
          const capturedAnswer   = answerText;
          const capturedCitations = citations;
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: capturedAnswer, citations: capturedCitations }
              : m,
          ));
        }
      }

      // Auto-name new session
      if (sessionId) {
        const activeSession = sessions.find(s => s.id === sessionId);
        if (!activeSession || activeSession.title === 'New conversation') {
          const title = q.slice(0, 60) + (q.length > 60 ? '…' : '');
          await fetch(`/api/chat/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
          });
          setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, content: 'Something went wrong. Please try again.' } : m,
      ));
    } finally {
      setStreaming(false);
      setStreamingId(null);
    }
  }, [input, streaming, activeSessionId, collectionId, sessions, chatMode, messages]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamingId(null);
  };

  const today = sessions.filter(s => new Date(s.updatedAt).toDateString() === new Date().toDateString());
  const older  = sessions.filter(s => new Date(s.updatedAt).toDateString() !== new Date().toDateString());

  const docPrompts  = ['What are the key findings?', 'Summarize the main points', 'What are the payment terms?', 'List all action items'];
  const genPrompts  = ['Explain quantum computing simply', 'Write a Python function to sort a list', 'What is the difference between ML and AI?', 'Help me draft a professional email'];
  const emptyPrompts = chatMode === 'documents' ? docPrompts : genPrompts;

  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden">

        {/* ── Sessions sidebar ────────────────────────────────────── */}
        <aside className={`flex flex-col border-r border-border bg-bg-secondary/30 transition-all duration-200 shrink-0 ${
          sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
        }`}>
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <button
              onClick={newSession}
              className="flex-1 flex items-center gap-2 rounded-lg bg-accent/10 border border-accent/20 text-accent px-3 py-2 text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {sessions.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquare className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-xs text-text-muted">No conversations yet</p>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Today</p>
                    {today.map(s => (
                      <SessionItem
                        key={s.id} session={s}
                        active={s.id === activeSessionId}
                        onSelect={() => loadSession(s)}
                        onDelete={() => deleteSession(s.id)}
                        onRename={(title) => renameSession(s.id, title)}
                      />
                    ))}
                  </>
                )}
                {older.length > 0 && (
                  <>
                    <p className="px-2 py-1 mt-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Earlier</p>
                    {older.map(s => (
                      <SessionItem
                        key={s.id} session={s}
                        active={s.id === activeSessionId}
                        onSelect={() => loadSession(s)}
                        onDelete={() => deleteSession(s.id)}
                        onRename={(title) => renameSession(s.id, title)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Collection scope — only shown in document mode */}
          {chatMode === 'documents' && (
            <div className="border-t border-border px-3 py-3">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 block">Scope</label>
              <select
                value={collectionId}
                onChange={e => setCollectionId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-card px-2.5 py-1.5 text-xs text-text-primary focus:border-accent outline-none"
              >
                <option value="">All collections</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </aside>

        {/* ── Chat main area ──────────────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0">

          {/* Header */}
          <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-secondary/20 shrink-0 flex-wrap gap-y-2">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors shrink-0"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>

            {/* Mode toggle — centre of header */}
            <div className="flex-1 flex justify-center">
              <ModeToggle mode={chatMode} onChange={m => { setChatMode(m); setMessages([]); setActiveSessionId(null); }} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {capabilities?.ai ? (
                <span className="flex items-center gap-1.5 text-[10px] text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5 font-medium">
                  <Zap className="h-3 w-3" /> AI ready
                </span>
              ) : (
                <Link href="/settings" className="flex items-center gap-1.5 text-[10px] text-warning bg-warning/10 border border-warning/20 rounded-full px-2.5 py-1 hover:bg-warning/20 transition-colors font-medium">
                  Configure AI →
                </Link>
              )}
              <Link
                href="/documents"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-2.5 py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                title="Upload documents"
              >
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline">Upload docs</span>
              </Link>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-6">
            {loadingSession ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
                  chatMode === 'general' ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-accent/10 border border-accent/20'
                }`}>
                  {chatMode === 'general'
                    ? <Globe className="h-8 w-8 text-purple-400" />
                    : <Sparkles className="h-8 w-8 text-accent" />
                  }
                </div>
                <h2 className="mb-2 text-xl font-bold">
                  {chatMode === 'general' ? 'General AI Assistant' : 'Ask your documents'}
                </h2>
                <p className="mb-8 max-w-md text-sm text-text-secondary leading-relaxed">
                  {chatMode === 'general'
                    ? 'Ask me anything — coding, writing, analysis, maths, or just a quick question. I have full context of our conversation.'
                    : 'Upload PDFs, Markdown, code, or any text file. DocuMind finds the most relevant passages and answers with cited sources.'
                  }
                </p>
                <div className="grid gap-2 sm:grid-cols-2 w-full max-w-lg">
                  {emptyPrompts.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                      className="rounded-xl border border-border bg-bg-card/60 px-4 py-3 text-left text-xs text-text-secondary hover:border-accent/25 hover:bg-bg-hover hover:text-text-primary transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                {chatMode === 'documents' && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                    <Link
                      href="/documents"
                      className="inline-flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/8 px-4 py-2.5 text-sm text-accent hover:bg-accent/15 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {collections.length === 0 ? 'Upload your first document' : 'Upload more documents'}
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isStreaming={streaming && msg.id === streamingId}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-bg-primary/80 backdrop-blur px-4 py-3 pb-safe-area shrink-0">
            <div className="mx-auto max-w-3xl">
              <div className={`flex items-end gap-2 rounded-2xl border p-2 focus-within:border-accent/50 transition-colors ${
                chatMode === 'general' ? 'border-purple-500/20 bg-bg-card' : 'border-border bg-bg-card'
              }`}>
                <Link
                  href="/documents"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    chatMode === 'documents'
                      ? 'text-text-muted hover:bg-bg-hover hover:text-accent'
                      : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
                  }`}
                  title="Upload documents"
                >
                  <Upload className="h-4 w-4" />
                </Link>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); resizeTextarea(); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={chatMode === 'general'
                    ? 'Ask me anything — code, writing, analysis, maths…'
                    : 'Ask anything about your documents…'
                  }
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-1.5 text-sm text-text-primary placeholder:text-text-muted outline-none leading-relaxed min-h-[36px] max-h-[200px]"
                />

                {streaming ? (
                  <button
                    onClick={stopStreaming}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    title="Stop"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity ${
                      chatMode === 'general' ? 'bg-purple-500' : 'bg-accent'
                    }`}
                    title="Send (Enter)"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-center text-[10px] text-text-muted">
                {chatMode === 'general'
                  ? 'General AI mode · Answers are not grounded in your documents'
                  : <>
                      Document mode · Answers cite your indexed files ·{' '}
                      <Link href="/documents" className="hover:text-text-secondary transition-colors">Add documents</Link>
                    </>
                }
              </p>
            </div>
          </div>
        </div>


      </div>
    </AuthGate>
  );
}
