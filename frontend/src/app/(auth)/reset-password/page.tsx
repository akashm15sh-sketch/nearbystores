'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ResetPasswordForm() {
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
                <h3 className="text-lg font-bold text-gray-800 mb-2">Invalid Link</h3>
                <p className="text-gray-500 text-sm mb-4">This password reset link is invalid or has expired.</p>
                <Link href="/forgot-password" className="text-orange-600 font-semibold">Request a new link →</Link>
            </div>
        );
    }

    return success ? (
        <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Password Reset!</h3>
            <p className="text-gray-500 text-sm mb-6">Your password has been updated. You can now log in.</p>
            <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg inline-block">
                Go to Login →
            </Link>
        </div>
    ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-700 text-sm">{error}</div>}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="input-modern w-full px-4 py-3 pr-12 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900"
                        placeholder="Enter new password" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm font-medium">
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-modern w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900"
                    placeholder="Confirm new password" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
                className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 shadow-lg">
                {loading ? 'Resetting...' : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen gradient-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-4xl font-bold mb-2"><span className="text-gradient">New Password</span></h1>
                    <p className="text-gray-500">Create a new password for your account</p>
                </div>
                <div className="glass-card rounded-2xl p-8 animate-scale-in">
                    <Suspense fallback={<div className="text-center py-8"><div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div></div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
