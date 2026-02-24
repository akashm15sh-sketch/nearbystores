'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminRegisterPage() {
    const router = useRouter();
    const { login, isAuthenticated, user, _hasHydrated } = useAuthStore();
    const [step, setStep] = useState<1 | 2>(1); // 1 = form, 2 = OTP
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminSecret: '',
    });
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    useEffect(() => {
        if (!_hasHydrated) return;
        if (isAuthenticated && user?.role === 'admin') {
            router.push('/admin/dashboard');
        }
    }, [isAuthenticated, user, router, _hasHydrated]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('/admin/send-otp', { email: formData.email });
            setOtpSent(true);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data } = await api.post('/admin/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                otp,
                adminSecret: formData.adminSecret,
            });

            login(data.token, data.user);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">Admin Registration</h1>
                    <p className="text-slate-400">Create a new admin account</p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-700/50 text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
                        Details
                    </div>
                    <div className="w-8 h-0.5 bg-slate-600"></div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-700/50 text-slate-400'}`}>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
                        Verify OTP
                    </div>
                </div>

                {/* Card */}
                <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium mb-5">
                            ⚠️ {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Admin Secret Key</label>
                                <input
                                    type="password"
                                    value={formData.adminSecret}
                                    onChange={(e) => setFormData({ ...formData, adminSecret: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Enter the admin secret key"
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-1">Required to create admin accounts</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Min 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Re-enter password"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25 mt-2"
                            >
                                {loading ? 'Sending OTP...' : 'Send OTP & Continue'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyAndRegister} className="space-y-5">
                            <div className="text-center mb-4">
                                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl">📧</span>
                                </div>
                                <p className="text-slate-300 text-sm">
                                    OTP sent to <span className="font-semibold text-white">{formData.email}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Enter OTP</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-4 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="• • • • • •"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/25"
                            >
                                {loading ? 'Creating Account...' : 'Verify & Create Account'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep(1); setOtp(''); setError(''); }}
                                className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
                            >
                                ← Back to details
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link href="/admin/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    NearbyStores Admin Portal • Authorized personnel only
                </p>
            </div>
        </div>
    );
}
