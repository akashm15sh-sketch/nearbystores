'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function PartnerLoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user } = useAuthStore();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in as partner, redirect
    useEffect(() => {
        if (isAuthenticated && user?.role === 'store_owner') {
            router.push('/partner/dashboard');
        }
    }, [isAuthenticated, user, router]);

    // Load Remember Me preference
    useEffect(() => {
        const pref = localStorage.getItem('nearbyStores_partner_rememberMe');
        if (pref === 'true') {
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { data } = await api.post('/auth/login', { ...formData, role: 'store_owner' });

            if (rememberMe) {
                localStorage.setItem('nearbyStores_partner_rememberMe', 'true');
            } else {
                localStorage.removeItem('nearbyStores_partner_rememberMe');
            }

            login(data.token, data.user);
            router.push('/partner/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen gradient-white flex items-center justify-center px-4 py-8 sm:py-12">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-6 sm:mb-8 animate-fade-in">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                        <span className="text-white text-3xl sm:text-4xl">🏪</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                        <span className="text-gradient">Partner Portal</span>
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base">Sign in to manage your store</p>
                </div>

                {/* Login Card */}
                <div className="glass-card rounded-2xl p-6 sm:p-8 animate-scale-in">
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg animate-slide-up">
                                <p className="text-red-700 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input-modern w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 placeholder-gray-400 text-base"
                                placeholder="Enter your username"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-modern w-full px-4 py-3 pr-12 rounded-xl bg-white border-2 border-gray-200 focus:outline-none text-gray-900 placeholder-gray-400 text-base"
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="partnerRememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">Remember me</span>
                            </label>
                            <Link href="/partner/forgot-password" className="text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-modern w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-300/50 transition-all"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Sign In
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 sm:mt-8 text-center">
                        <p className="text-gray-600 text-sm sm:text-base">
                            Don't have a partner account?{' '}
                            <Link href="/partner/register" className="text-orange-600 font-semibold hover:text-orange-700 transition-colors">
                                Register your store
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link href="/login" className="text-gray-400 hover:text-gray-600 text-xs sm:text-sm transition-colors">
                            ← Back to customer login
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-400 text-xs sm:text-sm mt-6 sm:mt-8">
                    © 2026 NearbyStores. Partner Portal.
                </p>
            </div>
        </div>
    );
}
