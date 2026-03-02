'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email, role: 'customer' });
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-4xl font-bold mb-2"><span className="text-gradient">Reset Password</span></h1>
                    <p className="text-gray-500">Enter your registered email address</p>
                </div>

                <div className="glass-card rounded-2xl p-8 animate-scale-in">
                    {sent ? (
                        <div className="text-center py-4">
                            <div className="text-5xl mb-4">📧</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Check Your Email</h3>
                            <p className="text-gray-500 text-sm mb-6">If an account exists with this email, you&apos;ll receive a password reset link shortly.</p>
                            <Link href="/login" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                                ← Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-700 text-sm">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="input-modern w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 placeholder-gray-400"
                                    placeholder="you@example.com" required />
                            </div>
                            <button type="submit" disabled={loading}
                                className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 shadow-lg">
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">← Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
