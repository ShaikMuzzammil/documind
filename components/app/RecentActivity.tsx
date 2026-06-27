'use client';

import { FileText, FolderOpen, MessageSquare, Upload, Download, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

export interface ActivityEvent {
  id:        string;
  type:      'upload' | 'delete' | 'chat' | 'collection_create' | 'export' | 'extract';
  label:     string;
  detail?:   string;
  timestamp: string;
}

const TYPE_CONFIG = {
  upload:             { icon: Upload,      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  delete:             { icon: Trash2,      color: 'text-red-400 bg-red-500/10 border-red-500/20'             },
  chat:               { icon: MessageSquare, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'        },
  collection_create:  { icon: FolderOpen,  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'   },
  export:             { icon: Download,    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'       },
  extract:            { icon: FileText,    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'          },
};

interface Props {
  events:    ActivityEvent[];
  maxItems?: number;
  compact?:  boolean;
}

export default function RecentActivity({ events, maxItems = 8, compact = false }: Props) {
  const shown = events.slice(0, maxItems);

  if (shown.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <MessageSquare className="w-7 h-7 text-text-muted mb-2" />
        <p className="text-sm text-text-muted">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {shown.map((event) => {
        const cfg  = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.upload;
        const Icon = cfg.icon;
        return (
          <div key={event.id}
            className={`flex items-center gap-3 ${compact ? 'py-2' : 'py-2.5'} border-b border-border/40 last:border-b-0`}>
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${cfg.color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-text-primary truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                {event.label}
              </p>
              {event.detail && !compact && (
                <p className="text-xs text-text-muted truncate">{event.detail}</p>
              )}
            </div>
            <span className={`shrink-0 text-text-muted font-mono ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {formatRelativeTime(event.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
