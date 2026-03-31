'use client';

import { useState } from 'react';
import { signUpUser, loginUser, subscribeToPlan, supabase } from '@/lib/supabase-service';
import Link from 'next/link';

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'subscribe'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await signUpUser(email, password, fullName);

    if (result.success) {
      setSuccess('Account created! Check your email to confirm.');
      setMode('subscribe');
    } else {
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginUser(email, password);

    if (result.success) {
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => (window.location.href = '/dashboard'), 1000);
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get user ID from session
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setError('Please sign up first');
      setMode('signup');
      setLoading(false);
      return;
    }

    const result = await subscribeToPlan(data.user.id, plan);

    if (result.success) {
      setSuccess(`Subscribed to ${plan} plan!`);
      setTimeout(() => (window.location.href = '/dashboard'), 1000);
    } else {
      setError(result.error || 'Subscription failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-black to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-blue-500 to-green-500 mb-2">
            AI-WONDERLAND
          </h1>
          <p className="text-white/60">Create & build with AI engines</p>
        </div>

        {/* Form Card */}
        <div className="border border-cyan-500/30 rounded-lg p-8 bg-black/50 backdrop-blur">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 border-b border-cyan-500/30">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m as 'login' | 'signup')}
                className={`px-4 py-2 font-semibold transition border-b-2 ${
                  mode === m ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-white/60'
                }`}
              >
                {m === 'login' ? '🔐 Sign In' : '✍️ Sign Up'}
              </button>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-3 rounded bg-green-500/20 border border-green-500/50 text-green-300 text-sm">
              ✓ {success}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-black/50 border border-cyan-500/30 focus:border-cyan-400 outline-none transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-black/50 border border-cyan-500/30 focus:border-cyan-400 outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-black/50 border border-cyan-500/30 focus:border-cyan-400 outline-none transition"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-black/50 border border-cyan-500/30 focus:border-cyan-400 outline-none transition"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-black/50 border border-cyan-500/30 focus:border-cyan-400 outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Subscribe Form */}
          {mode === 'subscribe' && (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <p className="text-sm text-white/60 mb-4">Choose your plan to get started</p>

              <div className="space-y-2">
                {[
                  { value: 'free', label: 'Free - 100 MB Storage', price: '$0' },
                  { value: 'pro', label: 'Pro - 1 GB Storage', price: '$29/mo' },
                  { value: 'enterprise', label: 'Enterprise - Custom', price: 'Contact us' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center p-3 rounded border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={option.value}
                      checked={plan === option.value}
                      onChange={(e) => setPlan(e.target.value as any)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-sm text-white/60">{option.price}</div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Subscribing...' : 'Subscribe & Continue'}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm">
            <Link href="/" className="text-cyan-400 hover:text-cyan-300">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
