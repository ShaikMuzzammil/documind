'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Loader2, Trash2, Download, ArrowDown,
  AlertTriangle, Settings, BookOpen, Zap, FileText, Clock,
} from 'lucide-react';
import { ChatMessage, Citation } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useCollections } from '@/lib/use-collections';
import { useUser } from '@/lib/use-user';
import AuthGate from '@/components/app/AuthGate';
import CollectionPicker from '@/components/app/CollectionPicker';
import Citations from '@/components/app/Citations';

export default function ChatPage() {
  const { collections } = useCollections();
  const { capabilities } = useUser() as { capabilities?: { ai?: boolean } };
  const [collectionId, setCollectionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const aiConfigured = capabilities?.ai;
  const messageCount = messages.filter(m => m.role === 'user').length;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCollectionId = params.get('collectionId');
    if (initialCollectionId) setCollectionId(initialCollectionId);
  }, []);

  // Scroll button visibility
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const quickPrompts = useMemo(() => [
    { icon: BookOpen, text: 'Summarize the key points across all uploaded documents.' },
    { icon: AlertTriangle, text: 'What risks, deadlines, or open questions should I pay attention to?' },
    { icon: FileText, text: 'Create a structured action list with source citations for each item.' },
    { icon: Clock, text: 'What are the most recent dates or deadlines mentioned in my documents?' },
  ], []);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  };

  const clearConversation = () => {
    if (busy) return;
    setMessages([]);
    inputRef.current?.focus();
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    const lines = messages.map(m =>
      `### ${m.role === 'user' ? 'You' : 'DocuMind'}\n${m.content}`
    );
    const md = `# DocuMind Conversation\n*Exported ${new Date().toLocaleString()}*\n\n${lines.join('\n\n---\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;

    const userMsg: ChatMessage = {
      id: generateId(), role: 'user', content: question,
      createdAt: new Date().toISOString(),
    };
    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId, role: 'assistant', content: '', citations: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
    setBusy(true);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, collectionId: collectionId || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with ${res.status}`);
      }
      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let headerParsed = false;
      let citations: Citation[] = [];
      let answer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (!headerParsed) {
          const nl = buffer.indexOf('\n');
          if (nl !== -1) {
            const headerLine = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            try { citations = JSON.parse(headerLine).citations || []; } catch { citations = []; }
            headerParsed = true;
            setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, citations } : msg)));
          }
        }

        if (headerParsed) {
          answer += buffer;
          buffer = '';
          setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, content: answer } : msg)));
          scrollToBottom();
        }
      }
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Error: ${err instanceof Error ? err.message : 'request failed'}` }
            : msg,
        ),
      );
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  };

  return (
    <AuthGate>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4 bg-bg-secondary/30 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-none">Chat</h1>
              {messageCount > 0 && (
                <p className="text-[10px] text-text-muted mt-0.5">{messageCount} question{messageCount !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} includeAll />
            {messages.length > 0 && (
              <>
                <button
                  onClick={exportChat}
                  title="Export conversation"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-bg-card text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={clearConversation}
                  disabled={busy}
                  title="Clear conversation"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-bg-card text-text-muted hover:text-danger hover:border-danger/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI not configured banner */}
        <AnimatePresence>
          {!busy && aiConfigured === false && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-warning/20 bg-warning/6 px-4 py-2.5 flex items-center gap-3 text-xs text-warning overflow-hidden shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>AI answer generation requires an API key.</span>
              <Link
                href="/settings"
                className="ml-auto flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 hover:bg-warning/20 transition-colors font-medium shrink-0"
              >
                <Settings className="h-3 w-3" />
                Configure in Settings
              </Link>
            </motion.div>
          )}
          {!busy && aiConfigured === true && messages.length === 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="border-b border-success/20 bg-success/5 px-4 py-2 flex items-center gap-2 text-xs text-success overflow-hidden shrink-0"
            >
              <Zap className="h-3 w-3" />
              Answer engine ready — ask anything about your documents.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 relative">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Ask anything about your documents</h2>

                {collections.length === 0 ? (
                  <p className="text-sm text-text-muted max-w-sm mx-auto">
                    You need at least one collection with documents before chatting.{' '}
                    <Link href="/collections" className="text-accent hover:underline">Create a collection</Link>{' '}
                    then{' '}
                    <Link href="/documents" className="text-accent hover:underline">upload documents</Link>.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-text-muted max-w-sm mx-auto mb-6">
                      Select a collection above or search across{' '}
                      <span className="text-text-primary">all collections</span>. Answers include inline citations.
                    </p>
                    <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                      {quickPrompts.map(({ icon: Icon, text }) => (
                        <button
                          key={text}
                          onClick={() => { setInput(text); inputRef.current?.focus(); }}
                          className="rounded-xl border border-border bg-bg-card/60 px-4 py-3 text-left text-xs text-text-secondary transition-all hover:border-accent/30 hover:text-text-primary hover:bg-accent/5 flex items-start gap-2.5 group"
                        >
                          <Icon className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                          {text}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : 'glass'
                  }`}
                >
                  {msg.role === 'assistant' && !msg.content && busy ? (
                    <span className="flex items-center gap-2 text-text-muted text-sm">
                      <span className="flex gap-1">
                        {[0,1,2].map(i => (
                          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-accent inline-block"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          />
                        ))}
                      </span>
                      Thinking…
                    </span>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose-sm text-sm leading-relaxed [&_p]:mb-2 [&_code]:text-accent-2 [&_strong]:text-text-primary [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {msg.role === 'assistant' && msg.citations && (
                    <Citations citations={msg.citations} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollToBottom()}
                className="fixed bottom-24 right-6 z-10 w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:brightness-110 transition-all"
              >
                <ArrowDown className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Composer */}
        <div className="border-t border-border px-4 sm:px-6 py-4 pb-20 lg:pb-4 bg-bg-secondary/20 shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask a question about your documents… (Enter to send, Shift+Enter for newline)"
                className="w-full resize-none bg-bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40 max-h-40 transition-colors"
                style={{ minHeight: '48px' }}
              />
            </div>
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="shrink-0 w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] text-text-muted mt-2">
            DocuMind retrieves passages from your documents and generates grounded answers with citations.
          </p>
        </div>
      </div>
    </AuthGate>
  );
}
