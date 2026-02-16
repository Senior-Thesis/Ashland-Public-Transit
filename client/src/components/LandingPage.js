import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, ArrowRight, Bus, Clock, Phone, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { getVehicles } from '../services/api';
import LeafletMap from './LeafletMap';

const LandingPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [activeCount, setActiveCount] = useState(0);

    useEffect(() => {
        const fetchFleetStatus = async () => {
            try {
                const vehicles = await getVehicles();
                const active = vehicles.filter(v => v.status === 'Active').length;
                setActiveCount(active);
            } catch (err) {
                console.error("Failed to load fleet status");
            }
        };
        fetchFleetStatus();
    }, []);

    const handleStaffAccess = () => {
        navigate('/dispatcher/login');
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-12 py-8 md:py-16">

            {/* HERO SECTION */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full items-center px-4">
                {/* TEXT CONTENT */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-left space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Live Transit System
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight relative z-10">
                        Ashland <span className="text-blue-600">Transit</span>
                    </h1>

                    <p className="text-base text-slate-600 font-medium leading-relaxed max-w-md">
                        The smart, reliable, and accessible way to move around our city.
                        Book rides instantly and track in real-time.
                    </p>

                    <div className="flex gap-4 pt-2">
                        <Link to="/book">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-3 bg-blue-600 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 hover:bg-blue-700"
                            >
                                Book a Ride <ArrowRight size={18} />
                            </motion.button>
                        </Link>

                        <Link to="/track">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-white hover:border-blue-200 transition-all flex items-center gap-2"
                            >
                                <MapPin size={18} className="text-blue-500" /> Track Ride
                            </motion.button>
                        </Link>

                        <button onClick={handleStaffAccess} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2">
                            <ShieldCheck size={18} /> Staff
                        </button>
                    </div>
                </motion.div>

                {/* MAP VISUAL */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="relative hidden md:block"
                >
                    <LeafletMap className="h-64 w-full shadow-2xl shadow-blue-900/10 rotate-1 hover:rotate-0 transition-all duration-500" />

                    {/* Floating Stats Card */}
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                            <Bus size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Active Fleet</p>
                            <p className="text-xl font-black text-slate-800">{activeCount} Vehicles</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* FEATURES GRID (Compact) */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 w-full pt-8">
                {[
                    { icon: Clock, title: "Real-Time Tracking", desc: "Live GPS updates.", color: "text-blue-600", bg: "bg-blue-50" },
                    { icon: Phone, title: "Easy Booking", desc: "Book online or via phone.", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: Shield, title: "Safe & Reliable", desc: "Verified drivers & support.", color: "text-indigo-600", bg: "bg-indigo-50" }
                ].map((feature, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (idx * 0.1) }}
                        key={idx}
                        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all"
                    >
                        <div className={`w-10 h-10 ${feature.bg} ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                            <feature.icon size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            {feature.desc}
                        </p>
                    </motion.div>
                ))}
            </div>

            <Link to="/track" className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors uppercase tracking-widest">
                Already have a ticket? Track here
            </Link>

        </div>
    );
};

export default LandingPage;
