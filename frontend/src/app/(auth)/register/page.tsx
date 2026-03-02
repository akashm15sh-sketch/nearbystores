'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types';

type VerifyMethod = 'email' | 'phone';

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [step, setStep] = useState<'contact' | 'otp' | 'credentials'>('contact');
    const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Firebase phone auth state
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const recaptchaContainerRef = useRef<HTMLDivElement>(null);
    const recaptchaVerifierRef = useRef<any>(null);

    // Cleanup recaptcha on unmount
    useEffect(() => {
        return () => {
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch (e) { /* ignore */ }
            }
        };
    }, []);

    const setupRecaptcha = async () => {
        const { auth, RecaptchaVerifier } = await import('@/lib/firebase');

        // Clear existing verifier
        if (recaptchaVerifierRef.current) {
            try { recaptchaVerifierRef.current.clear(); } catch (e) { /* ignore */ }
        }

        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
                // reCAPTCHA solved
            },
        });

        recaptchaVerifierRef.current = verifier;
        return verifier;
    };

    // Send OTP via Email (existing flow)
    const handleSendEmailOTP = async (e: React.FormEvent) => {
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

    // Send OTP via Firebase Phone
    const handleSendPhoneOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { auth, signInWithPhoneNumber } = await import('@/lib/firebase');
            const verifier = await setupRecaptcha();

            // Ensure phone has country code
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

            const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
            setConfirmationResult(result);
            setStep('otp');
        } catch (err: any) {
            console.error('Phone OTP error:', err);
            if (err.code === 'auth/invalid-phone-number') {
                setError('Invalid phone number. Make sure to include country code (e.g., +91XXXXXXXXXX)');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.message || 'Failed to send phone OTP');
            }
            // Reset recaptcha on error
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch (e) { /* ignore */ }
                recaptchaVerifierRef.current = null;
            }
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) return;

        if (verifyMethod === 'phone' && confirmationResult) {
            setLoading(true);
            setError('');
            try {
                await confirmationResult.confirm(otp);
                setStep('credentials');
            } catch (err: any) {
                setError('Invalid OTP. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            // Email OTP — just move to credentials, will verify on register
            setStep('credentials');
        }
    };

    const checkUsername = async (value: string) => {
        if (value.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        try {
            const { data } = await api.get(`/auth/check-username/${value}`);
            setUsernameAvailable(data.available);
        } catch (err) {
            setUsernameAvailable(null);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload: any = {
                username,
                password,
                otp,
            };

            if (verifyMethod === 'email') {
                payload.email = email;
            } else {
                payload.phone = phone.startsWith('+') ? phone : `+91${phone}`;
                payload.phoneVerified = true; // Firebase already verified the phone
            }

            const { data } = await api.post<AuthResponse>('/auth/register', payload);

            setAuth(data.user, data.token);
            router.push('/home');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-white flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-5xl font-bold mb-3">
                        <span className="text-gradient">NearbyStores</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Join thousands discovering local businesses</p>
                </div>

                {/* Register Card */}
                <div className="glass-card rounded-2xl p-8 animate-scale-in">
                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step === 'contact' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                                }`}>1</div>
                            <div className={`w-12 h-1 rounded transition-all ${step !== 'contact' ? 'bg-orange-500' : 'bg-gray-200'
                                }`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step === 'otp' ? 'bg-orange-500 text-white' : step === 'credentials' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-400'
                                }`}>2</div>
                            <div className={`w-12 h-1 rounded transition-all ${step === 'credentials' ? 'bg-orange-500' : 'bg-gray-200'
                                }`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${step === 'credentials' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                                }`}>3</div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                        {step === 'contact' && 'Verify Your Identity'}
                        {step === 'otp' && 'Enter Verification Code'}
                        {step === 'credentials' && 'Create Your Account'}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 animate-slide-up">
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {step === 'contact' && (
                        <>
                            {/* Email / Phone Toggle */}
                            <div className="flex items-center justify-center gap-1 mb-6 bg-gray-100 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => { setVerifyMethod('email'); setError(''); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${verifyMethod === 'email'
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    📧 Email
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setVerifyMethod('phone'); setError(''); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${verifyMethod === 'phone'
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    📱 Phone
                                </button>
                            </div>

                            {verifyMethod === 'email' ? (
                                <form onSubmit={handleSendEmailOTP} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input-modern w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 placeholder-gray-400"
                                            placeholder="your@email.com"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-2">We&apos;ll send you a verification code via email</p>
                                    </div>

                                    <button type="submit" className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Verification Code'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleSendPhoneOTP} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="flex items-center px-3 py-3 bg-gray-100 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm">
                                                🇮🇳 +91
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="input-modern flex-1 px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 placeholder-gray-400"
                                                placeholder="9876543210"
                                                maxLength={10}
                                                required
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">We&apos;ll send you a verification code via SMS</p>
                                    </div>

                                    <button type="submit" className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" disabled={loading || phone.length !== 10}>
                                        {loading ? 'Sending...' : 'Send SMS Code'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Enter Verification Code
                                </label>
                                <p className="text-sm text-gray-500 mb-4">
                                    We sent a 6-digit code to{' '}
                                    <span className="font-semibold text-gray-700">
                                        {verifyMethod === 'email' ? email : `+91${phone}`}
                                    </span>
                                </p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="input-modern w-full px-4 py-4 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 text-center text-3xl tracking-[0.5em] font-bold"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                disabled={otp.length !== 6 || loading}
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
                                className="w-full text-gray-600 hover:text-orange-600 font-medium transition-colors"
                            >
                                ← Change {verifyMethod === 'email' ? 'Email' : 'Phone Number'}
                            </button>
                        </form>
                    )}

                    {step === 'credentials' && (
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                        setUsername(value);
                                        checkUsername(value);
                                    }}
                                    className={`input-modern w-full px-4 py-3 rounded-xl bg-white border-2 focus:outline-none text-gray-900 placeholder-gray-400 ${usernameAvailable === false ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                    placeholder="username"
                                    minLength={3}
                                    maxLength={30}
                                    required
                                />
                                {usernameAvailable === true && (
                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Username available
                                    </p>
                                )}
                                {usernameAvailable === false && (
                                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Username already taken
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-modern w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 placeholder-gray-400"
                                    placeholder="••••••••"
                                    minLength={6}
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-2">At least 6 characters</p>
                            </div>

                            <button
                                type="submit"
                                className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                disabled={loading || usernameAvailable === false}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-8">
                    © 2026 NearbyStores. Connecting you with local businesses.
                </p>
            </div>
        </div>
    );
}
