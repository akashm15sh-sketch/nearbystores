'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center py-8">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-white mb-2">Invalid Link</h3>
                <p className="text-slate-400 text-sm mb-4">This reset link is invalid or has expired.</p>
                <Link href="/admin/forgot-password" className="text-blue-400 font-semibold">Request a new link →</Link>
            </div>
        );
    }

    return success ? (
        <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-white mb-2">Password Reset!</h3>
            <p className="text-slate-400 text-sm mb-6">You can now log in with your new password.</p>
            <Link href="/admin/login" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg inline-block">
                Go to Login →
            </Link>
        </div>
    ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">{error}</div>}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-16 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Enter new password" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm font-medium">
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Confirm new password" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25">
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function AdminResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">New Password</h1>
                    <p className="text-slate-400">Create a new password for your account</p>
                </div>
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    <Suspense fallback={<div className="text-center py-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div></div>}>
                        <ResetForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
