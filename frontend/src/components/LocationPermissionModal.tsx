'use client';

import { useEffect, useState } from 'react';

interface LocationPermissionModalProps {
    onAllow: () => void;
    onDeny: () => void;
    isOpen: boolean;
}

export default function LocationPermissionModal({ onAllow, onDeny, isOpen }: LocationPermissionModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Small delay for smooth animation
            setTimeout(() => setShow(true), 10);
        } else {
            setShow(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${show ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onDeny}
            />

            {/* Modal */}
            <div
                className={`relative glass-card max-w-md w-full p-6 rounded-2xl transform transition-all duration-300 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full gradient-orange flex items-center justify-center">
                        <span className="text-3xl">📍</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                    Enable Location Access
                </h2>

                {/* Description */}
                <p className="text-gray-600 text-center mb-6">
                    We need your location to show nearby stores and provide accurate distance information.
                    Your location data is only used to enhance your shopping experience.
                </p>

                {/* Benefits */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🏪</span>
                        <div>
                            <p className="font-semibold text-gray-800">Find Nearby Stores</p>
                            <p className="text-sm text-gray-600">Discover stores closest to you</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">📏</span>
                        <div>
                            <p className="font-semibold text-gray-800">Accurate Distances</p>
                            <p className="text-sm text-gray-600">See exact distance to each store</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🔔</span>
                        <div>
                            <p className="font-semibold text-gray-800">Proximity Alerts</p>
                            <p className="text-sm text-gray-600">Get notified when near your favorite stores</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onDeny}
                        className="flex-1 btn-secondary"
                    >
                        Not Now
                    </button>
                    <button
                        onClick={onAllow}
                        className="flex-1 btn-primary"
                    >
                        Allow Access
                    </button>
                </div>

                {/* Privacy Note */}
                <p className="text-xs text-gray-500 text-center mt-4">
                    🔒 Your privacy is important. We never share your location data.
                </p>
            </div>
        </div>
    );
}
