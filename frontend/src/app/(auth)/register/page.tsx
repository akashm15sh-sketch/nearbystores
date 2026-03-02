'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types';

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [step, setStep] = useState<'contact' | 'otp' | 'credentials'>('contact');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/send-otp', { email });
            setStep('otp');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) return;
        setStep('credentials');
    };

    const checkUsername = async (value: string) => {
        if (value.length < 3) { setUsernameAvailable(null); return; }
        try {
            const { data } = await api.get(`/auth/check-username/${value}`);
            setUsernameAvailable(data.available);
        } catch { setUsernameAvailable(null); }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await api.post<AuthResponse>('/auth/register', {
                username, password, otp, email
            });
            setAuth(data.user, data.token);
            router.push('/home');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                        NearbyStores
                    </h1>
                    <p className="text-gray-500 text-lg font-medium">Join thousands discovering local businesses</p>
                </div>

                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-orange-100/50 border border-white/60">
                    {/* Progress */}
                    <div className="flex items-center justify-center mb-8">
                        {['contact', 'otp', 'credentials'].map((s, i) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === s ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' :
                                        ['contact', 'otp', 'credentials'].indexOf(step) > i ? 'bg-orange-100 text-orange-600' :
                                            'bg-gray-100 text-gray-400'
                                    }`}>{i + 1}</div>
                                {i < 2 && <div className={`w-12 h-1 mx-1 rounded-full transition-all duration-300 ${['contact', 'otp', 'credentials'].indexOf(step) > i ? 'bg-orange-400' : 'bg-gray-200'
                                    }`} />}
                            </div>
                        ))}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        {step === 'contact' && 'Verify Your Email'}
                        {step === 'otp' && 'Enter Verification Code'}
                        {step === 'credentials' && 'Create Your Account'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl mb-6">
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {step === 'contact' && (
                        <form onSubmit={handleSendOTP} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="your@email.com" required />
                                <p className="text-sm text-gray-400 mt-2">We&apos;ll send a 6-digit verification code</p>
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/60 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Sending...' : 'Send Verification Code →'}
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-5">
                            <div>
                                <p className="text-sm text-gray-500 mb-4">Code sent to <span className="font-semibold text-gray-700">{email}</span></p>
                                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-900 text-center text-3xl tracking-[0.5em] font-bold"
                                    placeholder="000000" maxLength={6} required />
                            </div>
                            <button type="submit" disabled={otp.length !== 6 || loading}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? 'Verifying...' : 'Verify Code →'}
                            </button>
                            <button type="button" onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
                                className="w-full text-gray-500 hover:text-orange-600 font-medium transition-colors py-2">
                                ← Change Email
                            </button>
                        </form>
                    )}

                    {step === 'credentials' && (
                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                                <input type="text" value={username}
                                    onChange={(e) => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); setUsername(v); checkUsername(v); }}
                                    className={`w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-2 focus:outline-none transition-all text-gray-900 placeholder-gray-400 ${usernameAvailable === false ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-orange-400 focus:bg-white'}`}
                                    placeholder="username" minLength={3} maxLength={30} required />
                                {usernameAvailable === true && <p className="text-sm text-green-600 mt-2">✓ Username available</p>}
                                {usernameAvailable === false && <p className="text-sm text-red-600 mt-2">✗ Username taken</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-orange-400 focus:bg-white focus:outline-none transition-all text-gray-900 placeholder-gray-400"
                                    placeholder="••••••••" minLength={6} required />
                                <p className="text-sm text-gray-400 mt-2">At least 6 characters</p>
                            </div>
                            <button type="submit" disabled={loading || usernameAvailable === false}
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200/50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        Creating Account...
                                    </span>
                                ) : 'Create Account 🎉'}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-gray-500">Already have an account?{' '}
                            <Link href="/login" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">Sign in</Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-gray-400 text-sm mt-8">© 2026 NearbyStores. Connecting you with local businesses.</p>
            </div>
        </div>
    );
}
