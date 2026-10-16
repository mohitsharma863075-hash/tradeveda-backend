import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldAlert,
  Sparkles,
  Smartphone,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  initialEmail?: string;
  duelPrompt?: boolean;
}

interface StoredAccount {
  name: string;
  email: string;
  avatar?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  duelPrompt = false,
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Stored recent accounts on this device
  const [savedAccounts, setSavedAccounts] = useState<StoredAccount[]>(() => {
    try {
      const stored = localStorage.getItem('tradeveda_saved_google_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  if (!isOpen) return null;

  // Real Google Sign-In: Opens Google's official account selector screen
  const handleRealGoogleSignIn = async (knownEmail?: string) => {
    setError(null);
    setLoading(true);

    try {
      if (knownEmail) {
        await loginWithGoogle({ email: knownEmail });
      } else {
        // Launches real Google accounts.google.com window!
        await loginWithGoogle();
      }

      // Save user to device list
      const currentUser = JSON.parse(localStorage.getItem('tradeveda_user') || '{}');
      if (currentUser?.email) {
        const updated = [
          { name: currentUser.name || currentUser.email.split('@')[0], email: currentUser.email },
          ...savedAccounts.filter(a => a.email.toLowerCase() !== currentUser.email.toLowerCase()),
        ];
        setSavedAccounts(updated);
        localStorage.setItem('tradeveda_saved_google_users', JSON.stringify(updated));
      }

      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="p-5 bg-[#0b0f19] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-base">
                {duelPrompt ? 'Login with Google to Play' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-slate-400">
                Apne phone ke real Gmail account se 1-Tap Login karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* MAIN GOOGLE LOGIN BUTTON (Opens Google's real account picker) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleRealGoogleSignIn()}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-900 font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/10 cursor-pointer border border-slate-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Phone me jo Gmail ho usse Login karein</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-bold text-center">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Free • ₹10,00,000 Virtual Trading Cash</span>
            </div>
          </div>

          {/* If user logged in before on this phone, show quick 1-tap re-login */}
          {savedAccounts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Recently Used on this Phone:
              </span>
              <div className="space-y-1.5">
                {savedAccounts.map((acc, i) => (
                  <button
                    key={acc.email + i}
                    type="button"
                    onClick={() => handleRealGoogleSignIn(acc.email)}
                    disabled={loading}
                    className="w-full p-3 rounded-2xl bg-[#0b0f19] hover:bg-[#131b2e] border border-slate-800 hover:border-blue-500/50 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30">
                        {acc.name[0]?.toUpperCase() || 'G'}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block group-hover:text-blue-300">
                          {acc.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono-num">
                          {acc.email}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Explanatory Info Card */}
          <div className="p-3.5 rounded-2xl bg-[#0b0f19] border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span>Real Google Account Selector</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Button par click karte hi Google ka official prompt khulega jisme aapke phone me logged-in saari Gmail IDs dikhengi. Aap jis Gmail par tap karenge, aap usi se jud jayenge aur dosto ke sath live trading kar sakenge!
            </p>
          </div>

          {/* Email / Password fallback toggle */}
          <div className="pt-1">
            {!showManualForm ? (
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="w-full py-1.5 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Or use email & password instead
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                <div className="grid grid-cols-2 p-1 bg-[#0b0f19] rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`py-1.5 rounded-lg transition-all ${
                      mode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`py-1.5 rounded-lg transition-all ${
                      mode === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
                  {mode === 'register' && (
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono-num"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer mt-1"
                  >
                    {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
