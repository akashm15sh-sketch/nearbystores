'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function AdminForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email, role: 'admin' });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                        <span className="text-3xl">🔐</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Reset Password</h1>
                    <p className="text-slate-400">Enter your registered email address</p>
                </div>

                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    {sent ? (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">📧</div>
                            <h3 className="text-lg font-bold text-white mb-2">Check Your Email</h3>
                            <p className="text-slate-400 text-sm mb-6">If an account exists with this email, you&apos;ll receive a password reset link shortly.</p>
                            <Link href="/admin/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                                ← Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="admin@example.com" required />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25">
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                    <div className="mt-6 text-center">
                        <Link href="/admin/login" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
