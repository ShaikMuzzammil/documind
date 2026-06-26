'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, FolderOpen, MessageSquare, ArrowRight, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    icon:  FolderOpen,
    color: 'blue',
    title: 'Create a Collection',
    desc:  'Collections are workspaces for related documents. Start by creating one — e.g. "Research Papers", "Legal Contracts", or "Project Docs".',
    action: { label: 'Go to Collections', href: '/collections' },
  },
  {
    icon:  Upload,
    color: 'emerald',
    title: 'Upload Your Documents',
    desc:  'Drop PDFs, text files, Markdown, CSV, JSON or code files into the Documents page. Multiple files supported. We\'ll index them automatically.',
    action: { label: 'Upload Documents', href: '/documents' },
  },
  {
    icon:  MessageSquare,
    color: 'blue',
    title: 'Start Chatting',
    desc:  'Head to Chat and ask anything about your documents in plain language. Every response includes citations so you can verify the source.',
    action: { label: 'Open Chat', href: '/chat' },
  },
];

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function OnboardingModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon    = current.icon;
  const isLast  = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1,  scale: 1,    y: 0   }}
            exit={{    opacity: 0,  scale: 0.94, y: 20  }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass rounded-2xl border border-border shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold">Welcome to DocuMind</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicators */}
              <div className="flex gap-1.5 px-5 py-3 border-b border-border/50">
                {STEPS.map((_, i) => (
                  <button key={i} onClick={() => setStep(i)}
                    className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-blue-500' : 'bg-border'}`} />
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0  }}
                  exit={{    opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className="p-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                    current.color === 'blue' ? 'bg-blue-600/15 border border-blue-500/25' : 'bg-emerald-500/15 border border-emerald-500/25'
                  }`}>
                    <Icon className={`w-7 h-7 ${current.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`} />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Step {step + 1} of {STEPS.length}</span>
                  </div>
                  <h3 className="text-lg font-bold text-center mb-3">{current.title}</h3>
                  <p className="text-sm text-text-secondary text-center leading-relaxed">{current.desc}</p>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                {step > 0 && (
                  <button onClick={() => setStep((p) => p - 1)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-hover transition-colors font-medium">
                    Back
                  </button>
                )}
                {isLast ? (
                  <Link href={current.action.href} onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
                    <CheckCircle2 className="w-4 h-4" />Get Started
                  </Link>
                ) : (
                  <>
                    <Link href={current.action.href} onClick={onClose}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-bg-hover transition-colors">
                      {current.action.label}
                    </Link>
                    <button onClick={() => setStep((p) => p + 1)}
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shrink-0">
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
