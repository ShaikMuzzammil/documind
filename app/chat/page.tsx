'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage, Citation } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useCollections } from '@/lib/use-collections';
import AuthGate from '@/components/app/AuthGate';
import CollectionPicker from '@/components/app/CollectionPicker';
import Citations from '@/components/app/Citations';

export default function ChatPage() {
  const { collections } = useCollections();
  const [collectionId, setCollectionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCollectionId = params.get('collectionId');
    if (initialCollectionId) setCollectionId(initialCollectionId);
  }, []);

  const quickPrompts = useMemo(
    () => [
      'Summarize the most important points across these documents.',
      'What risks, deadlines, or open questions should I pay attention to?',
      'Create an action list with citations for each item.',
    ],
    [],
  );

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
    };
    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      citations: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput('');
    setBusy(true);
    scrollToBottom();

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
            try {
              citations = JSON.parse(headerLine).citations || [];
            } catch {
              citations = [];
            }
            headerParsed = true;
            setMessages((m) =>
              m.map((msg) => (msg.id === assistantId ? { ...msg, citations } : msg)),
            );
          }
        }

        if (headerParsed) {
          answer += buffer;
          buffer = '';
          setMessages((m) =>
            m.map((msg) => (msg.id === assistantId ? { ...msg, content: answer } : msg)),
          );
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
      <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Chat
        </h1>
        <CollectionPicker
          collections={collections}
          value={collectionId}
          onChange={setCollectionId}
          includeAll
        />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-accent-soft border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Ask anything about your documents</h2>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Upload files in{' '}
                <Link href="/documents" className="text-accent hover:underline">
                  Documents
                </Link>{' '}
                first, then ask a question here. Answers come with citations.
              </p>
              <div className="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-xl border border-border bg-bg-card px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                  </span>
                ) : msg.role === 'assistant' ? (
                  <div className="prose-sm text-sm leading-relaxed [&_p]:mb-2 [&_code]:text-accent-2">
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
      </div>

      {/* Composer */}
      <div className="border-t border-border px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask a question about your documents..."
            className="flex-1 resize-none bg-bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/40 max-h-40"
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-xl bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
      </div>
    </AuthGate>
  );
}
