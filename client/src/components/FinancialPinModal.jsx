import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { verifyFinancialPin } from '../services/settingsApi';
import toast from 'react-hot-toast';

const FinancialPinModal = ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    title = "Financial Security", 
    description = "Please enter your 4-digit PIN to authorize this action." 
}) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setError('');
            setIsVerified(false);
            // Autofocus first input
            setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
    }, [isOpen]);

    const handleChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1); // Take last char if multiple pasted
        setPin(newPin);

        // Move to next input if value entered
        if (value && index < 3) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleVerify = async () => {
        const pinString = pin.join('');
        if (pinString.length !== 4) {
            setError('Please enter all 4 digits');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await verifyFinancialPin(pinString);
            if (response.success && response.verified) {
                setIsVerified(true);
                toast.success('PIN Verified');
                setTimeout(() => {
                    onSuccess(pinString);
                    onClose();
                }, 800);
            } else {
                setError(response.error || 'Invalid PIN. Please try again.');
                setPin(['', '', '', '']);
                inputRefs[0].current.focus();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-verify when 4th digit is entered
    useEffect(() => {
        if (pin.every(digit => digit !== '') && isOpen && !isVerified && !isLoading) {
            handleVerify();
        }
    }, [pin]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#121212] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px]" />

                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500 ${isVerified ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'}`}>
                            {isVerified ? <CheckCircle2 size={32} /> : <Lock size={32} />}
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-[280px]">
                            {description}
                        </p>

                        <div className="flex gap-4 mb-8">
                            {pin.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={isLoading || isVerified}
                                    className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border transition-all duration-300 outline-none
                                        ${error ? 'border-red-500/50 bg-red-500/5 text-red-500' : 'border-white/10 bg-white/5 text-white'}
                                        ${digit ? 'border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : ''}
                                        focus:border-primary focus:ring-1 focus:ring-primary/20
                                        disabled:opacity-50 disabled:cursor-not-allowed`}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center gap-2 text-red-500 text-sm mb-6 bg-red-500/10 px-4 py-2 rounded-full"
                                >
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {isLoading && (
                            <div className="flex items-center gap-3 text-primary font-medium animate-pulse">
                                <Loader2 size={18} className="animate-spin" />
                                <span>Verifying...</span>
                            </div>
                        )}

                        <div className="mt-4 text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                            Secured by Antigravity Financial Engine
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default FinancialPinModal;
