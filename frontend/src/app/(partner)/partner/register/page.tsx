'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import LocationPicker from '@/components/LocationPicker';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const CATEGORIES = [
    { value: 'food', label: '🍕 Food & Snacks' },
    { value: 'grocery', label: '🛒 Grocery' },
    { value: 'bakery', label: '🍞 Bakery' },
    { value: 'restaurant', label: '🍽️ Restaurant' },
    { value: 'pharmacy', label: '💊 Pharmacy' },
    { value: 'electronics', label: '📱 Electronics' },
    { value: 'clothing', label: '👕 Clothing & Fashion' },
    { value: 'beauty', label: '💄 Beauty & Wellness' },
    { value: 'sports', label: '⚽ Sports & Fitness' },
    { value: 'books', label: '📚 Books & Stationery' },
    { value: 'pets', label: '🐾 Pet Supplies' },
    { value: 'hardware', label: '🔧 Hardware & Tools' },
    { value: 'home_decor', label: '🏠 Home & Decor' },
    { value: 'general', label: '🏪 General Store' },
    { value: 'other', label: '📦 Other' },
];

type ScheduleDay = { open: string; close: string; isOpen: boolean };
type Schedule = Record<string, ScheduleDay>;

const defaultSchedule: Schedule = {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    wednesday: { open: '09:00', close: '21:00', isOpen: true },
    thursday: { open: '09:00', close: '21:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '09:00', close: '21:00', isOpen: true },
    sunday: { open: '10:00', close: '20:00', isOpen: true },
};

export default function PartnerRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        storeName: '',
        category: 'general',
        description: '',
        address: '',
        upiId: '',
        latitude: 0,
        longitude: 0,
        otp: ''
    });

    const [schedule, setSchedule] = useState<Schedule>(defaultSchedule);

    const [files, setFiles] = useState({
        images: [] as File[],
        qrCode: null as File | null,
        icon: null as File | null
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'images' | 'qrCode' | 'icon') => {
        if (e.target.files && e.target.files.length > 0) {
            if (type === 'images') {
                setFiles({ ...files, images: Array.from(e.target.files) });
            } else {
                setFiles({ ...files, [type]: e.target.files[0] });
            }
        }
    };

    const updateScheduleDay = (day: string, field: keyof ScheduleDay, value: string | boolean) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    const sendOTP = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.post('/auth/send-otp', {
                email: formData.email,
                phone: formData.phone
            });
            setOtpSent(true);
            alert(`OTP sent to ${formData.email}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = new FormData();

            // Append text data
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key as keyof typeof formData] as string | Blob);
            });

            // Append schedule as JSON string
            data.append('schedule', JSON.stringify(schedule));

            // Append files
            files.images.forEach(file => data.append('images', file));
            if (files.qrCode) data.append('qrCode', files.qrCode);
            if (files.icon) data.append('icon', files.icon);

            await api.post('/partner/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            router.push('/partner/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const TOTAL_STEPS = 5;

    return (
        <div className="max-w-3xl mx-auto py-8">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-orange-600 px-8 py-6">
                    <h1 className="text-3xl font-bold text-white">Become a Partner</h1>
                    <p className="text-orange-100 mt-2">Register your store and start selling today</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Progress Steps */}
                    <div className="flex mb-8 border-b border-gray-100 pb-6 justify-between">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {s}
                                </div>
                                <div className={`ml-2 hidden sm:block font-medium text-sm ${step >= s ? 'text-orange-600' : 'text-gray-400'
                                    }`}>
                                    {s === 1 ? 'Owner' : s === 2 ? 'Store' : s === 3 ? 'Media' : s === 4 ? 'Timing' : 'Verify'}
                                </div>
                                {s < TOTAL_STEPS && <div className="hidden sm:block w-6 h-1 bg-gray-100 mx-1"></div>}
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Step 1: Owner Details */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-gray-800">Owner Identification</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.username}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.email}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.phone}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.password}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                                >
                                    Next: Store Details →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Store Details */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-gray-800">Store Information</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                                    <input
                                        type="text"
                                        name="storeName"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.storeName}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.category}
                                    >
                                        {CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* ... Category, UPI, Address ... */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID (for payments)</label>
                                    <input
                                        type="text"
                                        name="upiId"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                        onChange={handleInputChange}
                                        value={formData.upiId}
                                        placeholder="e.g. name@upi"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    onChange={handleInputChange}
                                    value={formData.address}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    onChange={handleInputChange}
                                    value={formData.description}
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-gray-600 font-medium hover:text-gray-800"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                                >
                                    Next: Media Uploads →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Media Uploads */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-gray-800">Media & Branding</h2>
                            {/* ... existing media upload UI ... */}
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Store Images</h3>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-orange-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-orange-50">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> store photos</p>
                                        </div>
                                        <input type="file" className="hidden" multiple accept="image/*" onChange={(e) => handleFileChange(e, 'images')} />
                                    </label>
                                </div>
                                {files.images.length > 0 && (
                                    <div className="mt-2 text-sm text-green-600">✓ {files.images.length} images selected</div>
                                )}
                            </div>

                            {/* Location Picker */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-4">📍 Store Location</h3>
                                <LocationPicker
                                    onLocationSelect={(lat: number, lng: number) => {
                                        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                    }}
                                    initialLat={formData.latitude || undefined}
                                    initialLng={formData.longitude || undefined}
                                />
                                {formData.latitude !== 0 && (
                                    <p className="mt-2 text-xs text-green-600">✓ Location set: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}</p>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-gray-600 font-medium hover:text-gray-800"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                                >
                                    Next: Store Timing →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Store Timing / Schedule */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Store Timing</h2>
                                <p className="text-sm text-gray-500 mt-1">Set your opening and closing hours for each day</p>
                            </div>

                            <div className="space-y-3">
                                {DAYS.map(day => {
                                    const s = schedule[day];
                                    return (
                                        <div key={day} className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <div className="w-24">
                                                <span className="text-sm font-semibold text-gray-700 capitalize">{day}</span>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={s.isOpen}
                                                    onChange={e => updateScheduleDay(day, 'isOpen', e.target.checked)}
                                                    className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                />
                                                <span className={`text-xs font-medium ${s.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                                                    {s.isOpen ? 'Open' : 'Closed'}
                                                </span>
                                            </label>
                                            {s.isOpen && (
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <input
                                                        type="time"
                                                        value={s.open}
                                                        onChange={e => updateScheduleDay(day, 'open', e.target.value)}
                                                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                    <span className="text-gray-400 text-xs">to</span>
                                                    <input
                                                        type="time"
                                                        value={s.close}
                                                        onChange={e => updateScheduleDay(day, 'close', e.target.value)}
                                                        className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="text-gray-600 font-medium hover:text-gray-800"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(5)}
                                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium"
                                >
                                    Next: Verify & Submit →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: OTP Verification */}
                    {step === 5 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-gray-800">Verify Identity</h2>
                            <p className="text-gray-600">To finalize your registration, please verify your email/phone ({formData.email}) with an OTP.</p>

                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                {!otpSent ? (
                                    <div className="text-center">
                                        <p className="mb-4 text-sm text-gray-600">We will send a 6-digit OTP to your registered email.</p>
                                        <button
                                            type="button"
                                            onClick={sendOTP}
                                            disabled={isLoading}
                                            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 font-medium w-full sm:w-auto"
                                        >
                                            {isLoading ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="otp"
                                                placeholder="123456"
                                                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-center tracking-widest text-xl"
                                                onChange={handleInputChange}
                                                maxLength={6}
                                                value={formData.otp}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Didn't receive it? <button type="button" onClick={sendOTP} className="text-orange-600 hover:underline">Resend</button>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="text-gray-600 font-medium hover:text-gray-800"
                                >
                                    ← Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={!otpSent || !formData.otp || isLoading}
                                    className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 font-bold shadow-lg shadow-green-200 disabled:opacity-50 transition-all transform hover:scale-105"
                                >
                                    {isLoading ? 'Verifying & Creating...' : 'Complete Registration 🎉'}
                                </button>
                            </div>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
}
