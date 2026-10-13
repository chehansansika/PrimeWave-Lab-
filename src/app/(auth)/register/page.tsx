'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signUp } from '@/lib/actions/auth';
import { validateEmail, validatePassword, validateFullName } from '@/lib/validations/schemas';
import { UserPlus, Mail, Lock, User, Loader2, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    // Client-side validation
    const errors: Record<string, string> = {};
    const nameError = validateFullName(fullName);
    if (nameError) errors.full_name = nameError;
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (password !== confirmPassword) errors.confirm_password = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(formData);
      if (result.success) {
        setSuccess(result.message);
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
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="text-slate-500 mt-1">Get started with ReserveHub</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {success}{' '}
          <Link href="/login" className="font-medium underline">
            Sign in now
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="full_name"
              name="full_name"
              type="text"
              className={`input pl-10 ${fieldErrors.full_name ? 'input-error' : ''}`}
              placeholder="John Doe"
            />
          </div>
          {fieldErrors.full_name && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.full_name}</p>
          )}
        </div>

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
              className={`input pl-10 ${fieldErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              className={`input pl-10 ${fieldErrors.confirm_password ? 'input-error' : ''}`}
              placeholder="••••••••"
            />
          </div>
          {fieldErrors.confirm_password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.confirm_password}</p>
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
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-navy-600 font-medium hover:text-navy-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
