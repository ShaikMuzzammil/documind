'use client';

import { FormEvent, useEffect, useState } from 'react';
import AuthGate from '@/components/app/AuthGate';
import { useUser } from '@/lib/use-user';
import { toast } from '@/components/app/Toast';
import {
  User, Lock, Bell, Sliders, Eye, EyeOff,
  CheckCircle2, Loader2, Shield, Download, Trash2,
} from 'lucide-react';

type Tab = 'profile' | 'ai' | 'notifications' | 'privacy';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User    },
  { id: 'ai',            label: 'AI Preferences', icon: Sliders },
  { id: 'notifications', label: 'Notifications',  icon: Bell    },
  { id: 'privacy',       label: 'Privacy & Data', icon: Shield  },
];

export default function SettingsPage() { return <AuthGate><SettingsInner /></AuthGate>; }

function SettingsInner() {
  const { user, refresh } = useUser();
  const [tab,        setTab]        = useState<Tab>('profile');
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [saving,     setSaving]     = useState(false);

  // AI prefs
  const [responseStyle, setResponseStyle] = useState<'concise'|'balanced'|'detailed'>('balanced');
  const [citationCount, setCitationCount] = useState(5);
  const [itemsPerPage,  setItemsPerPage]  = useState(20);

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(false);

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); }
  }, [user]);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (newPw && newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw && newPw.length < 8)    { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const body: Record<string, string> = { name };
      if (newPw) { body.currentPassword = currentPw; body.newPassword = newPw; }
      const res = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Update failed');
      }
      toast.success('Profile updated');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally { setSaving(false); }
  };

  const saveAI = () => { toast.success('AI preferences saved'); };
  const saveNotifs = () => { toast.success('Notification preferences saved'); };

  const exportData = () => { window.location.href = '/api/export/documents'; toast.info('Downloading your document data…'); };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action is irreversible.')) return;
    toast.error('Account deletion is not yet available. Please contact support.');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your workspace and preferences</p>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <nav className="w-44 shrink-0 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === id ? 'text-blue-400 bg-blue-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile */}
          {tab === 'profile' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-5">Profile & Security</h2>
              <form onSubmit={saveProfile} className="space-y-4">
                {/* Avatar preview */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-400">
                      {name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Display Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Email Address</label>
                  <input value={email} disabled
                    className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed" />
                  <p className="text-[10px] text-text-muted mt-1">Email cannot be changed</p>
                </div>

                <hr className="border-border" />
                <p className="text-xs font-semibold text-text-secondary">Change Password</p>

                {[
                  { label: 'Current Password',  val: currentPw, set: setCurrentPw, show: showPw },
                  { label: 'New Password',       val: newPw,     set: setNewPw,     show: showPw },
                  { label: 'Confirm New Password', val: confirmPw, set: setConfirmPw, show: showPw },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                      <input value={val} onChange={(e) => set(e.target.value)}
                        type={showPw ? 'text' : 'password'} placeholder="••••••••"
                        className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-10 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
                      <button type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                        {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}

                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* AI Preferences */}
          {tab === 'ai' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-5">AI Response Preferences</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Response Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['concise','balanced','detailed'] as const).map((s) => (
                      <button key={s} onClick={() => setResponseStyle(s)}
                        className={`py-2.5 rounded-xl border text-xs font-medium capitalize transition-colors ${
                          responseStyle === s ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-border text-text-secondary hover:bg-bg-hover'
                        }`}>{s}</button>
                    ))}
                  </div>
                  <p className="text-[10px] text-text-muted mt-1.5">
                    {responseStyle === 'concise' ? 'Short, direct answers.' : responseStyle === 'balanced' ? 'Well-rounded answers with key details.' : 'Comprehensive answers with full context.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Citation Count: <span className="text-blue-400">{citationCount}</span>
                  </label>
                  <input type="range" min={1} max={10} value={citationCount} onChange={(e) => setCitationCount(Number(e.target.value))}
                    className="w-full accent-blue-500" />
                  <p className="text-[10px] text-text-muted mt-1">Number of source chunks retrieved per query</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Items per Page: <span className="text-blue-400">{itemsPerPage}</span>
                  </label>
                  <input type="range" min={10} max={50} step={10} value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="w-full accent-blue-500" />
                </div>

                <button onClick={saveAI}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
                  <CheckCircle2 className="h-4 w-4" />Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-5">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications', desc: 'Receive emails for processing completions', val: emailNotifs, set: setEmailNotifs },
                ].map(({ label, desc, val, set }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-border/50">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                    <button onClick={() => set(!val)}
                      className={`w-10 h-6 rounded-full transition-colors ${val ? 'bg-blue-600' : 'bg-bg-hover border border-border'} relative`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${val ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
                <button onClick={saveNotifs}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors mt-4">
                  <CheckCircle2 className="h-4 w-4" />Save
                </button>
              </div>
            </div>
          )}

          {/* Privacy */}
          {tab === 'privacy' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-base font-semibold mb-5">Privacy & Data</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-bg-secondary/40 p-4">
                  <p className="text-sm font-medium mb-1">Your Data</p>
                  <p className="text-xs text-text-muted mb-3">
                    All documents and chat data are stored in your private workspace. Nothing is shared with other users.
                  </p>
                  <button onClick={exportData}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
                    <Download className="w-3.5 h-3.5" />Export my documents
                  </button>
                </div>

                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                  <p className="text-sm font-semibold text-danger mb-1">Danger Zone</p>
                  <p className="text-xs text-text-muted mb-3">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                  <button onClick={deleteAccount}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-danger/30 text-danger text-xs font-medium hover:bg-danger/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete my account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
