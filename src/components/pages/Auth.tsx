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
  Fingerprint,
  ShoppingBag,
  Globe,
  CreditCard
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
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [adminSecretCode, setAdminSecretCode] = useState('');
  
  // Code verification & recovery
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Feedback alerts
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Clear alerts helper
  const clearMessages = () => {
    setErrorStatus(null);
    setSuccessStatus(null);
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return emailStr;
    const [local, domain] = parts;
    if (local.length <= 4) {
      return local.charAt(0) + '*'.repeat(local.length - 1) + '@' + domain;
    }
    const first = local.slice(0, 2);
    const last = local.slice(-2);
    const stars = '*'.repeat(local.length - 4);
    return `${first}${stars}${last}@${domain}`;
  };

  const switchView = (view: typeof authView) => {
    clearMessages();
    setAuthLoading(false);
    setGoogleLoading(false);
    setAuthView(view);
  };

  // Google Auth Listener
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const payload = event.data.payload;
        login(payload.user, payload.token);
        setSuccessStatus('Success! Logged in with Google.');
        setGoogleLoading(false);
        setAuthLoading(false);
        
        // Switch view after successful authentication
        setTimeout(() => {
          const storedRedirect = localStorage.getItem('auth_redirect_target') as ActiveView;
          if (storedRedirect) {
            localStorage.removeItem('auth_redirect_target');
            setActiveView(storedRedirect);
            return;
          }
          if (payload.user.role === 'admin') {
            setActiveView(onSuccessRedirect || 'admin-dashboard');
          } else {
            setActiveView(onSuccessRedirect || 'home');
          }
        }, 800);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setErrorStatus(event.data.payload || 'Failed to authenticate with Google.');
        setGoogleLoading(false);
        setAuthLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login, onSuccessRedirect, setActiveView]);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      clearMessages();
      const origin = encodeURIComponent(window.location.origin);
      const response = await fetch(`/api/users/google/url?origin=${origin}`);
      if (!response.ok) {
        throw new Error('Failed to connect to Google Auth provider. Is GOOGLE_CLIENT_ID configured?');
      }
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        throw new Error('Please allow popups to continue with Google.');
      }
      
      const checkPopup = setInterval(() => {
        if (!authWindow || authWindow.closed || authWindow.closed === undefined) {
          clearInterval(checkPopup);
          setGoogleLoading(false);
        }
      }, 1000);
      
    } catch (err: any) {
      setErrorStatus(err.message || 'Google Auth Error occurred.');
      setGoogleLoading(false);
    }
  };

  // 1. Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (password !== confirmPassword) {
      setErrorStatus('Passwords do not match');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, adminSecretCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Log the user in to populate token, but they are still unverified
      login(data.user, data.token);
      setSuccessStatus(data.message || 'Account created successfully!');
      
      // Move to verification tab
      setAuthView('verify');
    } catch (err: any) {
      setErrorStatus(err.message || 'Network error occurred during registration.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setAuthLoading(true);
    
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
      setAuthLoading(false);
    }
  };

  // 3. Verify Account Code
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setAuthLoading(true);

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
      setAuthLoading(false);
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

    setAuthLoading(true);
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
      setResendCooldown(60);
    } catch (err: any) {
      setErrorStatus(err.message || 'Unable to generate code.');
    } finally {
      setAuthLoading(false);
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

    setAuthLoading(true);
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
      setAuthView('reset');
    } catch (err: any) {
      setErrorStatus(err.message || 'No account registered with this email.');
    } finally {
      setAuthLoading(false);
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

    setAuthLoading(true);
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
      
      // Shift back to login with updated credentials
      setTimeout(() => {
        setAuthView('login');
      }, 1500);
    } catch (err: any) {
      setErrorStatus(err.message || 'Invalid verification code or code expired.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-zinc-950 font-sans">
      {/* Left Side - Visual / Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between overflow-hidden bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 p-12">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/20" />
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center space-x-3 text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white uppercase">
          <div className="flex h-10 w-10 items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <path d="M10 12V8C10 4.686 12.686 2 16 2C19.314 2 22 4.686 22 8V12" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="4" y="10" width="24" height="20" rx="3" fill="#2563eb" />
              <path d="M9 23V15L16 21L23 15V23" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span>MORVEX</span>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 my-auto max-w-xl self-center">
          <h1 className="font-serif text-5xl font-bold leading-tight text-slate-900 dark:text-white mb-6">
            Global Shopping. <br />Smarter Choices.
          </h1>
          <p className="text-lg text-slate-600 dark:text-zinc-400 mb-12 leading-relaxed">
            Discover curations of the finest international products, seamlessly shipped to your doorstep with guaranteed buyer protection.
          </p>

          {/* Trust Elements */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Secure Checkout</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Worldwide Shipping</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Buyer Protection</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Trusted Payments</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="relative z-10 flex items-center space-x-6 text-sm font-medium text-slate-500 dark:text-zinc-500">
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact Support</a>
          <span className="ml-auto">© 2026 MORVEX</span>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="flex w-full lg:w-2/5 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          
          {/* Mobile Logo (Visible only on mobile/tablet) */}
          <div className="lg:hidden flex flex-col items-center justify-center mb-8">
            <div className="flex items-center space-x-2 text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white uppercase">
              <div className="flex h-8 w-8 items-center justify-center">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path d="M10 12V8C10 4.686 12.686 2 16 2C19.314 2 22 4.686 22 8V12" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
                  <rect x="4" y="10" width="24" height="20" rx="3" fill="#2563eb" />
                  <path d="M9 23V15L16 21L23 15V23" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span>MORVEX</span>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">Global Shopping. Smarter Choices.</p>
          </div>

          {/* Auth Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {authView === 'login' && 'Log in to your account'}
              {authView === 'register' && 'Create an account'}
              {authView === 'verify' && 'Verify your email'}
              {authView === 'forgot' && 'Reset your password'}
              {authView === 'reset' && 'Create new password'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              {authView === 'login' && 'Welcome back! Please enter your details.'}
              {authView === 'register' && 'Join MORVEX for premium global shopping.'}
              {authView === 'verify' && 'We sent a 6-digit PIN code to secure your account.'}
              {authView === 'forgot' && 'Enter your email to receive a recovery code.'}
              {authView === 'reset' && 'Enter your new secure password below.'}
            </p>
          </div>

          {/* Global Alert Notification block */}
          {errorStatus && (
            <div className="mb-6 flex items-start space-x-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorStatus}</span>
            </div>
          )}

          {successStatus && (
            <div className="mb-6 flex items-start space-x-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-400 shadow-sm">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successStatus}</span>
            </div>
          )}

          {/* Form Container (Card on mobile, flat on desktop) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none dark:border-zinc-800 dark:bg-zinc-900 lg:dark:bg-transparent lg:dark:shadow-none dark:shadow-none backdrop-blur-sm lg:backdrop-blur-none transition-all">
            
            {/* ==================== 1. VIEW: LOGIN ==================== */}
            {authView === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Email Address</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Password</label>
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading || googleLoading}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Authenticating...' : 'Sign in'}
                </button>

                <div className="relative mt-8 mb-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-sm font-medium leading-6">
                    <span className="bg-white px-4 text-slate-500 dark:bg-zinc-900 lg:bg-slate-50 lg:dark:bg-zinc-950 rounded-full transition-colors">Or continue with</span>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button 
                    type="button" 
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || authLoading}
                    className="flex w-full max-w-sm items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                  Don't have a MORVEX account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('register')}
                    className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            )}

            {/* ==================== 2. VIEW: REGISTER ==================== */}
            {authView === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4 font-sans">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Confirm Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500 appearance-none bg-no-repeat"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}
                  >
                    <option value="user">Member (Default)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {role === 'admin' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Admin Secret Code</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter admin code"
                      value={adminSecretCode}
                      onChange={(e) => setAdminSecretCode(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading || googleLoading}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="relative mt-8 mb-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-sm font-medium leading-6">
                    <span className="bg-white px-4 text-slate-500 dark:bg-zinc-900 lg:bg-slate-50 lg:dark:bg-zinc-950 rounded-full transition-colors">Or sign up with</span>
                  </div>
                </div>

                <div className="flex justify-center mt-6">
                  <button 
                    type="button" 
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || authLoading}
                    className="flex w-full max-w-sm items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500 dark:text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Log in
                  </button>
                </div>
              </form>
            )}

            {/* ==================== 3. VIEW: VERIFY ==================== */}
            {authView === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-5 font-sans">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Verification Email</label>
                  <input
                    type="email"
                    required
                    readOnly
                    value={maskEmail(email || (user ? user.email : ''))}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">6-Digit PIN</label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={authLoading || resendCooldown > 0}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend PIN (${resendCooldown}s)` : 'Resend PIN'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center rounded-xl border border-slate-200 bg-white px-4 py-4 text-2xl font-mono tracking-[0.5em] text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Confirming...' : 'Verify Email'}
                </button>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="inline-flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to login</span>
                  </button>
                </div>
              </form>
            )}

            {/* ==================== 4. VIEW: FORGOT PASSWORD ==================== */}
            {authView === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-5 font-sans">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Sending code...' : 'Send Recovery Code'}
                </button>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="inline-flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to login</span>
                  </button>
                </div>
              </form>
            )}

            {/* ==================== 5. VIEW: RESET PASSWORD ==================== */}
            {authView === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-5 font-sans">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Recovery Email</label>
                  <input
                    type="email"
                    required
                    readOnly
                    value={maskEmail(email)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm outline-none dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">6-Digit PIN</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-xl font-mono tracking-widest text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? 'Changing password...' : 'Save New Password'}
                </button>

                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="inline-flex items-center space-x-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to login</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
