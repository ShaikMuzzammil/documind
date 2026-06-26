'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, Loader2, Copy, CheckCheck, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/app/Toast';

interface PIIMatch {
  type:   string;
  risk:   'high' | 'medium' | 'low';
  masked: string;
  start:  number;
  end:    number;
}

interface ScanResult {
  totalMatches: number;
  riskLevel:    'none' | 'low' | 'medium' | 'high';
  riskScore:    number;
  summary:      Record<string, number>;
  matches:      PIIMatch[];
  redacted:     string | null;
  redactedCount:number;
}

const RISK_COLORS = {
  none:   { border: 'border-emerald-500/25', bg: 'bg-emerald-500/8',  text: 'text-emerald-400', icon: CheckCircle2 },
  low:    { border: 'border-blue-500/25',    bg: 'bg-blue-500/8',    text: 'text-blue-400',    icon: Shield        },
  medium: { border: 'border-amber-500/25',   bg: 'bg-amber-500/8',   text: 'text-amber-400',   icon: AlertTriangle },
  high:   { border: 'border-red-500/25',     bg: 'bg-red-500/8',     text: 'text-red-400',     icon: AlertTriangle },
};

const TYPE_LABELS: Record<string, string> = {
  email:        'Email Address',
  phone:        'Phone Number',
  ssn:          'Social Security No.',
  credit_card:  'Credit Card',
  ip_address:   'IP Address',
  passport:     'Passport No.',
  bank_account: 'Bank Account',
  dob:          'Date of Birth',
};

export default function PIIScanner() {
  const [text,      setText]      = useState('');
  const [result,    setResult]    = useState<ScanResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [redacted,  setRedacted]  = useState(false);
  const [showText,  setShowText]  = useState(true);
  const [expanded,  setExpanded]  = useState(false);
  const [copied,    setCopied]    = useState(false);

  const scan = async () => {
    if (!text.trim()) { toast.error('Enter some text to scan'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/pii-detect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, redact: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally { setLoading(false); }
  };

  const copyRedacted = async () => {
    if (!result?.redacted) return;
    await navigator.clipboard.writeText(result.redacted).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    toast.success('Redacted text copied');
  };

  const riskConfig = result ? RISK_COLORS[result.riskLevel] : null;
  const RiskIcon   = riskConfig?.icon ?? Shield;

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">Paste text to scan</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste document content, emails, contracts, or any text to check for personally identifiable information…"
          rows={6}
          className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition resize-none font-mono"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-text-muted">{text.length.toLocaleString()} characters</p>
          <button onClick={scan} disabled={loading || !text.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            {loading ? 'Scanning…' : 'Scan for PII'}
          </button>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && riskConfig && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Risk banner */}
            <div className={`flex items-center gap-3 rounded-xl border p-4 mb-4 ${riskConfig.border} ${riskConfig.bg}`}>
              <RiskIcon className={`w-5 h-5 shrink-0 ${riskConfig.text}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold capitalize ${riskConfig.text}`}>
                  {result.riskLevel === 'none' ? 'No PII Detected' : `${result.riskLevel} Risk — ${result.totalMatches} PII item${result.totalMatches !== 1 ? 's' : ''} found`}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  Risk score: {result.riskScore} · {result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''} detected
                </p>
              </div>
            </div>

            {/* Summary by type */}
            {Object.keys(result.summary).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {Object.entries(result.summary).map(([type, count]) => (
                  <div key={type} className="glass rounded-xl px-3 py-2.5 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{TYPE_LABELS[type] ?? type}</p>
                      <p className="text-[10px] text-text-muted">{count} found</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Matches detail */}
            {result.matches.length > 0 && (
              <div className="glass rounded-xl overflow-hidden mb-4">
                <button onClick={() => setExpanded((v) => !v)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-white/3 transition-colors">
                  <span>Detected items ({result.matches.length})</span>
                  {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="border-t border-border divide-y divide-border/50 max-h-48 overflow-y-auto">
                        {result.matches.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                            <span className={`px-1.5 py-0.5 rounded font-mono shrink-0 ${
                              m.risk === 'high' ? 'bg-red-500/10 text-red-400' :
                              m.risk === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-blue-500/10 text-blue-400'
                            }`}>{m.risk}</span>
                            <span className="text-text-secondary font-medium shrink-0">{TYPE_LABELS[m.type] ?? m.type}</span>
                            <span className="text-text-muted font-mono truncate">{m.masked}</span>
                            <span className="text-text-muted ml-auto shrink-0 font-mono">pos {m.start}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Redacted output */}
            {result.redacted && (
              <div className="glass rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-medium">Redacted Output</p>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      {result.redactedCount} item{result.redactedCount !== 1 ? 's' : ''} redacted
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowText((v) => !v)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors">
                      {showText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={copyRedacted}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-hover transition-colors">
                      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </button>
                  </div>
                </div>
                {showText && (
                  <div className="px-4 py-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
                      {result.redacted}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
