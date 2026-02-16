import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, LogIn } from 'lucide-react';

const LoginModal = ({ isOpen, onClose, onLogin, title = "Access Portal", showUsername = false, onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // If showUsername is false, force 'admin' (Legacy Dispatcher Mode)
            const user = showUsername ? username : 'admin';
            const data = await onLogin(user, password);
            if (data) {
                setUsername('');
                setPassword('');
                setError(false);
                if (onLoginSuccess) {
                    onLoginSuccess();
                } else {
                    onClose();
                }
            }
        } catch (err) {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* MODAL */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Lock size={20} className="text-blue-600" /> {title}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* USERNAME FIELD (Conditional) */}
                            {showUsername && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Username</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-lg text-slate-800 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                                        placeholder="Enter Username"
                                    />
                                </div>
                            )}

                            {/* PASSWORD FIELD */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{showUsername ? 'Password' : 'Access Code'}</label>
                                <input
                                    type="password"
                                    autoFocus={!showUsername}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full p-4 bg-slate-50 border-2 rounded-2xl font-black text-lg ${!showUsername && 'text-center tracking-widest'} outline-none transition-all ${error ? 'border-red-400 bg-red-50 text-red-600 animate-pulse' : 'border-slate-100 focus:border-blue-500 text-slate-800'}`}
                                    placeholder={showUsername ? "••••••••" : "••••••••"}
                                />
                                {error && <p className="text-xs font-bold text-red-500 text-center animate-bounce">Access Denied</p>}
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            <LogIn size={20} /> Authenticate
                        </button>
                    </form>
                </div>

                {/* DECORATIVE BOTTOM BAR */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            </motion.div>
        </div>
    );
};

export default LoginModal;
