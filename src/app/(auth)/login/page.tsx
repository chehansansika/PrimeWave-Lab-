'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';
import { validateEmail, validatePassword } from '@/lib/validations/schemas';
import { LogIn, Mail, Lock, Loader2, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Client-side validation
    const errors: Record<string, string> = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(formData);
      if (result.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-navy-600 text-white mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-500 mt-1">Sign in to ReserveHub</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`input pl-10 ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="you@company.com"
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`input pl-10 ${fieldErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full btn-lg"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-navy-600 font-medium hover:text-navy-700">
          Create account
        </Link>
      </p>
    </div>
  );
}
