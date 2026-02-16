import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRides, updateRideStatus, updateRideVehicle, login, assignDriver, getVehicles, updateUserVehicle } from '../services/api'; // Import getVehicles & updateUserVehicle
import { MapPin, CheckCircle, Clock, Truck, User, Hand, X, AlertTriangle, CarFront } from 'lucide-react';
import LoginModal from './LoginModal';
import Toast from './Toast';
import { AnimatePresence, motion } from 'framer-motion';

const DriverView = () => {
    const navigate = useNavigate();
    // CHECK FOR TOKEN & USER ID ON MOUNT
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
    const [userId, setUserId] = useState(() => localStorage.getItem('userId')); // NEW: ID required for filtering
    const [myRides, setMyRides] = useState([]);
    const [availableRides, setAvailableRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]); // Fleet for selection
    const [currentVehicle, setCurrentVehicle] = useState(null); // Selected Vehicle ID
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false); // Modal State
    const [toasts, setToasts] = useState([]);

    // Custom Confirmation State
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'claim'|'update', id: '', status: '', message: '' }

    // TIME TRAVEL ENABLED: Drivers can now look ahead/behind
    const [viewDate, setViewDate] = useState(new Date().toLocaleDateString('en-CA'));

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // SECURE LOGIN HANDLER
    const handleLogin = async (username, password) => {
        try {
            const data = await login(username, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data._id); // Store ID
                setIsAuthenticated(true);
                setUserId(data._id);
                // Prompt for vehicle if not set (Need to check user profile, but for now just open modal on login)
                setIsVehicleModalOpen(true);
                return true;
            }
        } catch (error) {
            console.error("Driver Login Error", error);
            return false;
        }
        return false;
    };

    // Load Fleet for Selection
    useEffect(() => {
        if (isAuthenticated) {
            getVehicles().then(setVehicles).catch(console.error);
        }
    }, [isAuthenticated]);

    const handleVehicleSelect = async (vehicleId) => {
        try {
            await updateUserVehicle(vehicleId);
            const v = vehicles.find(v => v._id === vehicleId);
            setCurrentVehicle(v);
            setIsVehicleModalOpen(false);
            addToast(`Selected Vehicle: ${v.name}`, 'success');
        } catch (err) {
            addToast("Failed to select vehicle", 'error');
        }
    };

    const loadManifest = useCallback(async () => {
        if (!userId) return; // Wait for login
        setLoading(true);
        try {
            // PASS DRIVER ID TO FILTER ON SERVER (OR FILTER LOCALLY)
            // For now, we fetch all and filter locally, OR use the new server query support
            // Let's us the server query if possible, but the `getRides` in api.js just calls GET /
            // We should update getRides to accept params, but `api.js` `getRides` takes no args.
            // Let's just fetch all and filter in memory for now to match verified `api.js` state, 
            // OR update `api.js` to pass params. `getRides` in `api.js` is: const response = await axios.get(API_URL);

            // To be safe and minimal: Fetch all (as current) and filter using the logic from the plan.
            const allRides = await getRides();
            // EXPERT SYNC: Use the selected viewDate
            const targetDateStr = viewDate;

            const myRides = allRides.filter(r => {
                const rideDate = new Date(r.scheduledTime).toLocaleDateString('en-CA');
                const isDateMatch = rideDate === targetDateStr;

                // NEW: Check assignedDriver (if populated object, check ._id, else string comparison)
                const assignedDriverId = r.assignedDriver ? (r.assignedDriver._id || r.assignedDriver) : null;
                const isMe = assignedDriverId === userId;

                return (
                    isMe &&
                    (r.status === 'Confirmed' || r.status === 'En-Route') &&
                    isDateMatch
                );
            });

            const poolRides = allRides.filter(r => {
                const rideDate = new Date(r.scheduledTime).toLocaleDateString('en-CA');
                const isDateMatch = rideDate === targetDateStr;

                // POOL: Unassigned OR Explicitly Null/Unassigned string
                const assignedDriverId = r.assignedDriver ? (r.assignedDriver._id || r.assignedDriver) : null;
                const isUnassigned = !assignedDriverId;

                return (
                    isUnassigned &&
                    r.status === 'Confirmed' &&
                    isDateMatch
                );
            });

            setMyRides(myRides);
            setAvailableRides(poolRides);
        } catch (error) {
            console.error("Manifest Error", error);
        } finally {
            setLoading(false);
        }
    }, [userId, viewDate]);

    useEffect(() => {
        loadManifest();
    }, [loadManifest]);

    const executeUpdateStatus = async () => {
        if (!confirmAction) return;
        const { id, status } = confirmAction;

        try {
            await updateRideStatus(id, status);
            loadManifest();
            addToast(`Status updated to ${status}`, 'success');
        } catch (error) {
            addToast("Error updating status", 'error');
        } finally {
            setConfirmAction(null);
        }
    };

    const executeClaimRide = async () => {
        if (!confirmAction) return;
        const { id } = confirmAction;

        try {
            // SELF-ASSIGNMENT: We use the new assign endpoint or just update vehicle? 
            // The user wanted "Claim" to work. 
            // We need to assign `assignedDriver` to `userId`.
            // We use `assignDriver` from api.js ideally, but `DriverView` doesn't import it yet.
            // Let's import `assignDriver` at the top first, OR just use `updateRideVehicle` legacy if it handled it?
            // No, `updateRideVehicle` only does vehicle. 
            // I need to add `assignDriver` to imports.

            // Wait, I can't add imports easily with replace_content in valid JS scope without potentially breaking if I miss the import line.
            // I'll assume for this chunk I can modify the import. 
            // BUT wait, checking `DriverView.js` imports... line 2.

            // I'll handle the import in a separate call or careful replacement.
            // For now, let's implement the logic assuming `assignDriver` is available or use a direct axios call if needed, 
            // BUT `api.js` is the standard. I should update the import.

            // Let's assume I'll update the import in a separate tool call to be safe.
            // Actually, I can do it in one go if I include the top of the file.

            // For `executeClaimRide`, we need to call `assignDriver(id, userId, null, null)`.
            // But verify `assignDriver` signature: (rideId, driverId, vehicleId, vehicleName)

            // NOTE: The previous `updateRideVehicle(id, selectedVehicle)` is GONE because we removed `selectedVehicle`.
            // So we are just claiming it for *ourselves*, not a specific van yet (unless we want to hardcode or ask).
            // The requirement said "Remove the requirement for drivers to manually select a car to see rides."
            // But when claiming, do they select a car? 
            // "Retain the 'Claim,' 'Start,' and 'End' status update functionality".
            // Since `selectedVehicle` is gone, we can't assign a vehicle on claim unless we prompt or have a setting.
            // For now, we just assign the DRIVER. The dispatcher can assign the vehicle, or we can add a persistent "My Vehicle" setting later.
            // I will just assign the driver for now.



            await assignDriver(id, userId); // Only assign driver
            await updateRideStatus(id, 'Confirmed');

            loadManifest();
            addToast("Ride Claimed Successfully", 'success');
        } catch (error) {
            console.error(error);
            addToast("Error claiming ride", 'error');
        } finally {
            setConfirmAction(null);
        }
    };

    const requestUpdate = (id, status) => {
        setConfirmAction({
            type: 'update',
            id,
            status,
            message: `Update ride status to ${status}?`
        });
    };

    const requestClaim = (id) => {
        setConfirmAction({
            type: 'claim',
            id,
            message: `Claim ride #${id.substring(id.length - 4)}?`
        });
    };

    const changeDate = (days) => {
        const d = new Date(viewDate + "T12:00:00");
        d.setDate(d.getDate() + days);
        setViewDate(d.toLocaleDateString('en-CA'));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        setIsAuthenticated(false);
        setUserId(null);
    };

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <LoginModal
                isOpen={true}
                onClose={() => navigate('/')}
                onLogin={handleLogin}
                onLoginSuccess={() => { }} // Do nothing on success (Component will unmount)
                title="Driver Portal"
                showUsername={true}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 pb-20 font-sans">

            {/* VEHICLE SELECTION MODAL */}
            <AnimatePresence>
                {isVehicleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 shadow-2xl space-y-4"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Truck size={32} />
                                </div>
                                <h2 className="text-xl font-black text-white">Select Your Vehicle</h2>
                                <p className="text-sm text-slate-400">Which vehicle are you driving today?</p>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {vehicles.filter(v => v.status === 'Active').map(v => (
                                    <button
                                        key={v._id}
                                        onClick={() => handleVehicleSelect(v._id)}
                                        className="w-full p-4 bg-slate-700/50 hover:bg-blue-600/20 border border-slate-600 hover:border-blue-500 rounded-xl flex items-center gap-4 transition-all group"
                                    >
                                        <div className="font-bold text-white group-hover:text-blue-200">{v.name}</div>
                                        <div className="text-xs text-slate-500 ml-auto">{v.capacity} Seats</div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsVehicleModalOpen(false)}
                                className="w-full py-3 bg-transparent text-slate-500 text-xs font-bold hover:text-white transition-colors"
                            >
                                Skip for Now
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-wider text-blue-400">Driver Mode</h1>

                    {/* EXPERT DATE PICKER */}
                    <div className="flex items-center gap-3 mt-1">
                        <button onClick={() => changeDate(-1)} className="p-1 bg-slate-800 rounded hover:bg-blue-600 transition-colors">←</button>
                        <input
                            type="date"
                            value={viewDate}
                            onChange={(e) => setViewDate(e.target.value)}
                            className="bg-slate-800 text-white text-xs font-bold border-none rounded p-1 outline-none"
                        />
                        <button onClick={() => changeDate(1)} className="p-1 bg-slate-800 rounded hover:bg-blue-600 transition-colors">→</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Vehicle Indicator */}
                    <button onClick={() => setIsVehicleModalOpen(true)} className={`text-[10px] px-2 py-1 rounded font-bold border transition-all flex items-center gap-1 ${currentVehicle ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700'}`}>
                        <Truck size={10} />
                        {currentVehicle ? currentVehicle.name : 'No Vehicle'}
                    </button>

                    <button onClick={handleLogout} className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-colors">Sign Out</button>
                </div>
            </div>

            {/* REMOVED VEHICLE SELECTOR */}

            <div className="space-y-8">

                {/* SECTION 1: MY ACTIVE MANIFEST */}
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Truck size={14} /> My Manifest ({myRides.length})
                    </h2>
                    {loading ? (
                        <div className="animate-pulse h-20 bg-slate-800 rounded-xl"></div>
                    ) : myRides.length === 0 ? (
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-center">
                            <p className="text-slate-500 font-bold text-sm">No active rides assigned.</p>
                            <p className="text-[10px] text-slate-600 uppercase mt-1">Check the pool below</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myRides.map(ride => (
                                <RideCard key={ride._id} ride={ride} isAssigned={true} onAction={requestUpdate} />
                            ))}
                        </div>
                    )}
                </div>

                {/* SECTION 2: AVAILABLE POOL */}
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Hand size={14} /> Available Pool ({availableRides.length})
                    </h2>
                    {loading ? (
                        <div className="animate-pulse h-20 bg-slate-800 rounded-xl"></div>
                    ) : availableRides.length === 0 ? (
                        <div className="p-6 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-center">
                            <p className="text-slate-500 font-bold text-sm">No Open Rides in Pool.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {availableRides.map(ride => (
                                <RideCard key={ride._id} ride={ride} isAssigned={false} onAction={requestClaim} />
                            ))}
                        </div>
                    )}
                </div>

            </div>
            {/* TOASTS */}
            <div className="fixed top-4 right-4 z-[110] flex flex-col items-end">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>

            {/* CONFIRMATION MODAL */}
            <AnimatePresence>
                {confirmAction && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmAction(null)}></div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-2xl p-6 relative z-10 shadow-2xl"
                        >
                            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertTriangle className="text-amber-500" /> Confirm Action
                            </h3>
                            <p className="text-slate-300 font-bold mb-6">{confirmAction.message}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setConfirmAction(null)} className="py-3 bg-slate-700 text-slate-300 font-black rounded-xl hover:bg-slate-600 transition-all uppercase tracking-widest">
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction.type === 'claim' ? executeClaimRide : executeUpdateStatus}
                                    className="py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all uppercase tracking-widest"
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// SUB-COMPONENT FOR CLEANER CODE
const RideCard = ({ ride, isAssigned, onAction }) => (
    <div className={`bg-slate-800 rounded-2xl p-5 border shadow-xl relative overflow-hidden transition-all ${!isAssigned ? 'border-amber-500/30 ring-1 ring-amber-500/20' :
        ride.status === 'En-Route' ? 'border-blue-500/50 ring-1 ring-blue-500/30' :
            'border-slate-700'
        }`}>
        <div className="absolute top-0 right-0 bg-slate-700 px-3 py-1 rounded-bl-xl z-10">
            <span className="text-[10px] font-mono text-slate-400">#{ride.ticketId || '---'}</span>
        </div>

        {ride.status === 'En-Route' && (
            <div className="absolute top-0 left-0 bg-blue-600 px-3 py-1 rounded-br-xl z-10">
                <span className="text-[10px] font-black text-white uppercase flex items-center gap-1"><Truck size={10} /> En-Route</span>
            </div>
        )}

        <div className="flex items-start gap-4 mb-4 mt-6">
            <div className="bg-blue-600/20 p-3 rounded-xl text-blue-400">
                <User size={24} />
            </div>
            <div>
                <h3 className="font-black text-lg">{ride.passengerName}</h3>
                <div className="flex gap-2 mt-2">
                    <span className="bg-blue-900 text-blue-200 text-[10px] px-2 py-0.5 rounded font-bold">{ride.passengers} Pax</span>
                    {ride.userType === 'Elderly/Disabled' && (
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Priority</span>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-3 mb-6 bg-slate-900/50 p-4 rounded-xl">
            <div className="flex gap-3">
                <Clock size={16} className="text-amber-400 mt-1" />
                <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase">Time</p>
                    <p className="font-mono font-bold text-lg">{new Date(ride.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <MapPin size={16} className="text-emerald-400 mt-1" />
                <div className="w-full text-base">
                    <p className="font-bold text-slate-200">{ride.pickup}</p>
                    <div className="h-4 border-l-2 border-dashed border-slate-600 ml-2 my-1"></div>
                    <p className="font-bold text-slate-200">{ride.dropoff}</p>
                </div>
            </div>
        </div>

        {!isAssigned ? (
            <button onClick={() => onAction(ride._id)} className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 text-lg shadow-lg shadow-amber-900/20 active:scale-95 transition-all">
                <Hand size={24} /> Claim Ride
            </button>
        ) : ride.status === 'Confirmed' ? (
            <button onClick={() => onAction(ride._id, 'En-Route')} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                <Truck size={24} /> Start Trip
            </button>
        ) : (
            <button onClick={() => onAction(ride._id, 'Completed')} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 text-lg shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                <CheckCircle size={24} /> Complete
            </button>
        )}
    </div>
);

// REMOVED OLD LoginScreen COMPONENT Since we reuse LoginModal
export default DriverView;
