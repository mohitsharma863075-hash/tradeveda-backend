import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Users,
  LineChart,
  Wallet,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface LoginGateProps {
  duelCode?: string | null;
}

export const LoginGate: React.FC<LoginGateProps> = ({ duelCode }) => {
  const { loginWithGoogle, login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/30 mb-2">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>Trade</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Veda
            </span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Indian Stock Market Virtual Paper Trading & Friend Battles (NSE / BSE)
          </p>
        </div>

        {/* Duel Invite Alert if applicable */}
        {duelCode && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs mb-1">
              <Users className="w-4 h-4 text-amber-400" />
              <span>1v1 Battle Invitation Received!</span>
            </div>
            <p className="text-xs text-slate-300">
              Aapke friend ne aapko Room Code <strong className="text-amber-300 font-mono-num font-black">{duelCode}</strong> me challenge kiya hai. Room me enter hone ke liye apni Gmail se login karein.
            </p>
          </div>
        )}

        {/* Main Login Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative">
          <div className="space-y-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Login Required for App Access</span>
            </div>
            <h2 className="text-lg font-black text-white pt-2">
              App me aane ke liye Login karein
            </h2>
            <p className="text-xs text-slate-400">
              Bina Gmail login ke app access allowed nahi hai. 100% Free virtual trading cash milega.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Big Official Google Sign-In Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-900 font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/10 cursor-pointer border border-slate-200"
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
                  <span>Phone ki Gmail se Login Karein (Free)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant ₹10,00,000 Free Virtual Balance</span>
            </div>
          </div>

          {/* Features Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-left text-xs">
            <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Wallet className="w-3.5 h-3.5" />
                <span>₹10L Cash</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Zero real money risk
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0b0f19] border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Trade w/ Friends</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Real 1v1 battles
              </p>
            </div>
          </div>

          {/* Fallback Email/Password Toggle */}
          <div className="pt-2">
            {!showEmailForm ? (
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 cursor-pointer"
              >
                Or sign in with email & password
              </button>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-3 pt-2 border-t border-slate-800 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">
                    {isRegister ? 'Register Account' : 'Email Login'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-blue-400 hover:underline text-[11px]"
                  >
                    {isRegister ? 'Already have account? Login' : 'Create new account'}
                  </button>
                </div>

                {isRegister && (
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
                  />
                )}

                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono-num"
                />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 font-mono-num"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {loading ? 'Please wait...' : isRegister ? 'Register' : 'Log In'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Legal & Educational Disclaimer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Educational Paper Trading Platform • Strictly Zero Real Money Risk</span>
        </div>
      </div>
    </div>
  );
};
