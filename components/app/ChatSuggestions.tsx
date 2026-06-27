'use client';

import { Sparkles } from 'lucide-react';

interface Props {
  collectionName?: string;
  docCount?:       number;
  onSelect:        (q: string) => void;
}

const GENERAL_SUGGESTIONS = [
  'Summarize the key points across all documents',
  'What are the most important dates mentioned?',
  'List all entities, people, or organizations referenced',
  'What risks or issues are highlighted?',
  'Extract all numerical data and statistics',
  'What conclusions or recommendations are made?',
];

const COLLECTION_SUGGESTIONS: Record<string, string[]> = {
  contract: [
    'What are the payment terms?',
    'List all obligations of each party',
    'What are the termination conditions?',
    'Are there any penalty clauses?',
  ],
  research: [
    'What methodology was used?',
    'What are the main findings?',
    'What limitations are mentioned?',
    'What future work is suggested?',
  ],
  finance: [
    'What is the total revenue?',
    'What are the main expense categories?',
    'Are there any budget variances?',
    'What is the financial forecast?',
  ],
  legal: [
    'What jurisdiction applies?',
    'What are the key definitions?',
    'What compliance requirements are mentioned?',
    'Are there any dispute resolution clauses?',
  ],
};

function getSuggestions(collectionName?: string): string[] {
  if (collectionName) {
    const lower = collectionName.toLowerCase();
    for (const [key, suggestions] of Object.entries(COLLECTION_SUGGESTIONS)) {
      if (lower.includes(key)) return suggestions;
    }
  }
  return GENERAL_SUGGESTIONS;
}

export default function ChatSuggestions({ collectionName, docCount = 0, onSelect }: Props) {
  const suggestions = getSuggestions(collectionName).slice(0, 6);

  if (docCount === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
        <p className="text-sm font-medium text-text-primary mb-1">No documents yet</p>
        <p className="text-xs text-text-muted">
          Upload documents first, then ask questions about them here.
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <p className="text-xs font-medium text-text-muted">
          {collectionName ? `Suggested for "${collectionName}"` : 'Suggested questions'}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => onSelect(s)}
            className="text-left px-4 py-3 rounded-xl border border-border bg-bg-card hover:border-blue-500/30 hover:bg-blue-500/4 transition-all text-xs text-text-secondary font-medium leading-relaxed group">
            <span className="text-blue-400/60 mr-1.5 group-hover:text-blue-400 transition-colors">→</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
