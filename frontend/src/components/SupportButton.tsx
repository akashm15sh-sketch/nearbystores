'use client';

import { useState } from 'react';
import api from '@/lib/api';

interface SupportButtonProps {
    userRole?: string;
}

export default function SupportButton({ userRole }: SupportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [contactPreference, setContactPreference] = useState<'call' | 'text' | 'email'>('text');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!message.trim()) return;
        setSending(true);
        setError('');
        try {
            await api.post('/support', { message, contactPreference });
            setSent(true);
            setMessage('');
            setTimeout(() => {
                setSent(false);
                setIsOpen(false);
            }, 2500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-semibold"
            >
                💬 Get Support
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-lg">Get Support</h3>
                                <p className="text-blue-100 text-xs">We're here to help!</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white text-xl">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {sent ? (
                                <div className="text-center py-6">
                                    <div className="text-5xl mb-3">✅</div>
                                    <p className="text-lg font-bold text-gray-800">Message Sent!</p>
                                    <p className="text-sm text-gray-500">Our admin team will get back to you soon.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Contact Preference */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">How would you like us to reach you?</label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: 'call' as const, icon: '📞', label: 'Call' },
                                                { value: 'text' as const, icon: '💬', label: 'Text' },
                                                { value: 'email' as const, icon: '📧', label: 'Email' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setContactPreference(opt.value)}
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${contactPreference === opt.value
                                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your message</label>
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Describe your issue or question..."
                                            rows={4}
                                            maxLength={1000}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none text-gray-800"
                                        />
                                        <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
                                    </div>

                                    {error && (
                                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                                    )}

                                    <button
                                        onClick={handleSubmit}
                                        disabled={sending || !message.trim()}
                                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:shadow-lg transition-all"
                                    >
                                        {sending ? 'Sending...' : 'Send Message'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
