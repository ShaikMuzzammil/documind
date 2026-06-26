'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

const SHORTCUTS = [
  { group: 'Navigation', items: [
    { keys: ['⌘', 'K'],       desc: 'Open search'             },
    { keys: ['G', 'C'],       desc: 'Go to Chat'              },
    { keys: ['G', 'D'],       desc: 'Go to Documents'         },
    { keys: ['G', 'L'],       desc: 'Go to Collections'       },
    { keys: ['G', 'A'],       desc: 'Go to Analytics'         },
    { keys: ['G', 'E'],       desc: 'Go to Export'            },
    { keys: ['G', 'S'],       desc: 'Go to Settings'          },
  ]},
  { group: 'Chat', items: [
    { keys: ['Enter'],        desc: 'Send message'            },
    { keys: ['Shift','↵'],    desc: 'New line in message'     },
    { keys: ['Esc'],          desc: 'Stop generation'         },
    { keys: ['⌘', 'E'],       desc: 'Export chat'            },
    { keys: ['⌘', 'Shift', 'K'], desc: 'Clear chat'          },
  ]},
  { group: 'Documents', items: [
    { keys: ['⌘', 'U'],       desc: 'Open file picker'        },
    { keys: ['⌘', 'A'],       desc: 'Select all documents'    },
    { keys: ['Del'],          desc: 'Delete selected'         },
    { keys: ['⌘', 'R'],       desc: 'Refresh list'            },
  ]},
  { group: 'General', items: [
    { keys: ['?'],            desc: 'Show keyboard shortcuts' },
    { keys: ['Esc'],          desc: 'Close modals / cancel'   },
    { keys: ['⌘', '/'],       desc: 'Toggle shortcuts help'   },
  ]},
];

function Key({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md border border-border bg-bg-secondary text-[10px] font-mono font-semibold text-text-secondary shadow-sm">
      {k}
    </kbd>
  );
}

export default function KeyboardShortcuts({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1,  scale: 1    }}
            exit={{    opacity: 0,  scale: 0.96 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="glass rounded-2xl border border-border shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-semibold">Keyboard Shortcuts</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto p-5 grid sm:grid-cols-2 gap-6">
                {SHORTCUTS.map(({ group, items }) => (
                  <div key={group}>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted mb-3">{group}</p>
                    <div className="space-y-2">
                      {items.map(({ keys, desc }) => (
                        <div key={desc} className="flex items-center justify-between gap-4">
                          <span className="text-xs text-text-secondary">{desc}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {keys.map((k, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <Key k={k} />
                                {i < keys.length - 1 && <span className="text-[10px] text-text-muted">+</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
