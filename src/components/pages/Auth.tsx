import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  Fingerprint
} from 'lucide-react';
import { User, ActiveView } from '../../types';

interface AuthPageProps {
  onSuccessRedirect?: ActiveView;
}

export const Auth: React.FC<AuthPageProps> = ({ onSuccessRedirect }) => {
  const { login, setActiveView, user } = useApp();
  
  // Auth view states: 'login' | 'register' | 'verify' | 'forgot' | 'reset'
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>('login');
  
  // Forms States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Code verification & recovery
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Feedback alerts
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Sandbox helper storage to provide friendly "auto-fill OTP" helpers in UI
  const [capturedVerifyPin, setCapturedVerifyPin] = useState<string | null>(null);
  const [capturedResetPin, setCapturedResetPin] = useState<string | null>(null);

  // Clear alerts helper
  const clearMessages = () => {
    setErrorStatus(null);
    setSuccessStatus(null);
  };

  // 1. Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (password !== confirmPassword) {
      setErrorStatus('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Log the user in to populate token, but they are still unverified
      login(data.user, data.token);
      setSuccessStatus(data.message || 'Account created successfully!');
      
      // Look for the debug PIN returned in development
      if (data._debugOnlyToken) {
        setCapturedVerifyPin(data._debugOnlyToken);
      }
      
      // Move to verification tab
      setAuthView('verify');
    } catch (err: any) {
      setErrorStatus(err.message || 'Network error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      login(data.user, data.token);
      setSuccessStatus('Success! Logged in as ' + data.user.name);
      
      // Switch view after successful authentication
      setTimeout(() => {
        const storedRedirect = localStorage.getItem('auth_redirect_target') as ActiveView;
        if (storedRedirect) {
          localStorage.removeItem('auth_redirect_target');
          setActiveView(storedRedirect);
          return;
        }
        if (data.user.role === 'admin') {
          setActiveView(onSuccessRedirect || 'admin-dashboard');
        } else {
          setActiveView(onSuccessRedirect || 'home');
        }
      }, 800);
    } catch (err: any) {
      setErrorStatus(err.message || 'Invalid email credentials or password.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Account Code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    const targetEmail = email || (user ? user.email : '');
    
    try {
      const response = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: verificationCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setSuccessStatus('Verification success! Your account is now fully active.');
      setCapturedVerifyPin(null);
      
      // Try to sync with existing context
      if (user) {
        user.isVerified = true;
      }
      
      setTimeout(() => {
        const storedRedirect = localStorage.getItem('auth_redirect_target') as ActiveView;
        if (storedRedirect) {
          localStorage.removeItem('auth_redirect_target');
          setActiveView(storedRedirect);
          return;
        }
        setActiveView(onSuccessRedirect || 'home');
      }, 1200);
    } catch (err: any) {
      setErrorStatus(err.message || 'Incorrect or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // 4. Resend Verification Link / PIN
  const handleResendCode = async () => {
    clearMessages();
    const targetEmail = email || (user ? user.email : '');
    if (!targetEmail) {
      setErrorStatus('Please provide your email address to resend confirmation code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Process failed');
      }

      setSuccessStatus('A fresh confirmation code was generated!');
      if (data._debugOnlyToken) {
        setCapturedVerifyPin(data._debugOnlyToken);
      }
    } catch (err: any) {
      setErrorStatus(err.message || 'Unable to generate code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email) {
      setErrorStatus('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/forgotpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Forgot password lookup failed');
      }

      setSuccessStatus('Security code emailed! Please enter it to recover access.');
      if (data._debugOnlyToken) {
        setCapturedResetPin(data._debugOnlyToken);
      }
      setAuthView('reset');
    } catch (err: any) {
      setErrorStatus(err.message || 'No account registered with this email.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!email || !resetCode || !newPassword) {
      setErrorStatus('All fields are strictly required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/resetpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Reset password action failed');
      }

      setSuccessStatus(data.message || 'Password successfully rewritten!');
      setCapturedResetPin(null);
      
      // Shift back to login with updated credentials
      setTimeout(() => {
        setAuthView('login');
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Invalid verification code or code expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white/85 p-8 shadow-xl dark:border-zinc-850 dark:bg-zinc-950/70 backdrop-blur-md">
        
        {/* Logo / Header Branding */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#ff4747] to-[#ff7a7a] text-white shadow-md">
            <Fingerprint className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
            {authView === 'login' && 'Sign In'}
            {authView === 'register' && 'Create Account'}
            {authView === 'verify' && 'Verify Email Address'}
            {authView === 'forgot' && 'Account Recovery'}
            {authView === 'reset' && 'Reset Your Password'}
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 font-sans">
            {authView === 'login' && 'Enter your Luxe credentials to access your customer operations cabin.'}
            {authView === 'register' && 'Register your boutique account to join Luxe Market benefits.'}
            {authView === 'verify' && 'Please confirm the 6-digit PIN code to secure and activate your account.'}
            {authView === 'forgot' && 'Enter your registered email to receive a recovery code.'}
            {authView === 'reset' && 'Create a brand new security password for your profile.'}
          </p>
        </div>

        {/* Global Alert Notification block */}
        {errorStatus && (
          <div className="mb-4 flex items-start space-x-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-950/40 dark:bg-red-950/10 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorStatus}</span>
          </div>
        )}

        {successStatus && (
          <div className="mb-4 flex items-start space-x-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successStatus}</span>
          </div>
        )}

        {/* ==================== 1. VIEW: LOGIN ==================== */}
        {authView === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Username or Email Address</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="omar or admin@luxemarket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                />
                <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Password</label>
                <button
                  type="button"
                  onClick={() => { clearMessages(); setAuthView('forgot'); }}
                  className="text-[10px] font-mono text-neutral-400 hover:text-red-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                />
                <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer justify-center rounded-2xl bg-zinc-950 py-3 text-xs font-bold text-white transition-all transform hover:scale-[1.01] hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 uppercase tracking-widest"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* Quick Demo Accounts */}
            <div className="rounded-2xl border border-dashed border-gray-200 p-3 bg-slate-50/50 dark:border-zinc-805 dark:bg-zinc-900/30 text-center">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                ⚡ Quick Boutique Demo Logins
              </span>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('omar');
                    setPassword('omar2006$$$');
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-mono transition-all shadow-sm"
                >
                  Admin Username (omar)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@luxemarket.com');
                    setPassword('omar2006$$$');
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-mono transition-all shadow-sm"
                >
                  Admin Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('user@luxemarket.com');
                    setPassword('password');
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-white hover:bg-neutral-50 border border-gray-150 rounded-lg text-[10px] font-mono text-slate-750 transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                >
                  Guest
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('name@atelier.com');
                    setPassword('password');
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-white hover:bg-neutral-50 border border-gray-150 rounded-lg text-[10px] font-mono text-slate-750 transition-all shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                >
                  Atelier
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-gray-400 dark:text-zinc-500">
              Don't have a Luxe account?{' '}
              <button
                type="button"
                onClick={() => { clearMessages(); setAuthView('register'); }}
                className="font-bold text-red-500 hover:underline"
              >
                Register
              </button>
            </div>
          </form>
        )}

        {/* ==================== 2. VIEW: REGISTER ==================== */}
        {authView === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Full Signature Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Mr. Luxe Customer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                />
                <UserIcon className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@atelier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                />
                <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer justify-center rounded-2xl bg-zinc-950 py-3 text-xs font-bold text-white transition-all transform hover:scale-[1.01] hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 uppercase tracking-widest"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="mt-4 text-center text-xs text-gray-400 dark:text-zinc-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { clearMessages(); setAuthView('login'); }}
                className="font-bold text-red-500 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ==================== 3. VIEW: VERIFY ==================== */}
        {authView === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4 font-sans">
            {/* Captured sandbox pin display for developer ease of test */}
            {(import.meta as any).env?.DEV && capturedVerifyPin && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-955/40 dark:bg-amber-955/20">
                <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wide">Developer Sandbox Assistant</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                  Simulated outgoing code discovered!
                </p>
                <button
                  type="button"
                  onClick={() => setVerificationCode(capturedVerifyPin)}
                  className="mt-2 inline-flex items-center space-x-1 rounded bg-amber-500 px-2.5 py-1 text-[10px] font-black uppercase text-zinc-950 hover:bg-amber-400"
                >
                  <span>Auto-fill PIN: {capturedVerifyPin}</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Verification Email</label>
              <input
                type="email"
                required
                placeholder="registered@email.com"
                value={email || (user ? user.email : '')}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/75 py-2.5 px-4 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">6-Digit Confirmation PIN</label>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-[10px] font-mono text-[#ff4747] hover:underline"
                >
                  Resend confirmation pin
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center rounded-2xl border-2 border-dashed border-red-200 bg-white py-3 font-mono text-2xl font-black tracking-[10px] outline-none focus:border-red-500 focus:border-solid dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer justify-center rounded-2xl bg-zinc-950 py-3 text-xs font-bold text-white transition-all transform hover:scale-[1.01] hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 uppercase tracking-widest"
            >
              {loading ? 'Confirming code...' : 'Verify & Activate'}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { clearMessages(); setAuthView('login'); }}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-gray-950 dark:text-zinc-500 dark:hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to login screen</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================== 4. VIEW: FORGOT PASSWORD ==================== */}
        {authView === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 font-sans">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Registered Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="registered@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs tracking-tight outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                />
                <Mail className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-555" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer justify-center rounded-2xl bg-[#ff4747] py-3 text-xs font-bold text-white transition-all transform hover:scale-[1.01] hover:bg-[#ff3030] uppercase tracking-widest"
            >
              {loading ? 'Processing lookup...' : 'Request Reset PIN'}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { clearMessages(); setAuthView('login'); }}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-gray-950 dark:text-zinc-500 dark:hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Return to logging in</span>
              </button>
            </div>
          </form>
        )}

        {/* ==================== 5. VIEW: RESET PASSWORD ==================== */}
        {authView === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4 font-sans">
            
            {/* Sandbox helper to grab simulated Reset Token in Dev Mode */}
            {(import.meta as any).env?.DEV && capturedResetPin && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm dark:border-red-950/40 dark:bg-red-950/20">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                  <KeyRound className="h-4 w-4 shrink-0 font-bold" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wide">Developer Sandbox Assistant</span>
                </div>
                <p className="mt-1 text-[11px] text-red-650 dark:text-red-400">
                  Password recovery authorization pin captured!
                </p>
                <button
                  type="button"
                  onClick={() => setResetCode(capturedResetPin)}
                  className="mt-2 inline-flex items-center space-x-1 rounded bg-red-600 px-2.5 py-1 text-[10px] font-black uppercase text-white hover:bg-red-500"
                >
                  <span>Auto-fill RESET CODE: {capturedResetPin}</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Recovery Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-55/70 py-2.5 px-4 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">6-Digit Security Reset PIN</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center rounded-2xl border border-gray-200 bg-white py-2 text-lg font-mono tracking-widest outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/65 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500">Enter New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-white"
                />
                <Lock className="absolute left-3.5 top-3.5 h-3.5 w-3.5 text-gray-400 dark:text-zinc-550" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full cursor-pointer justify-center rounded-2xl bg-zinc-950 py-3 text-xs font-bold text-white transition-all transform hover:scale-[1.01] hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 uppercase tracking-widest"
            >
              {loading ? 'Re-writing security...' : 'Save New Password'}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { clearMessages(); setAuthView('login'); }}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-gray-950 dark:text-zinc-500 dark:hover:text-white"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to credentials sign in</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
