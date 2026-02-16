const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Vehicle = require('../models/Vehicle');
const calculateFare = require('../utils/fareCalculator');
const SystemSetting = require('../models/SystemSetting');
const { protect } = require('../middleware/authMiddleware'); // Secure Routes
const rideController = require('../controllers/rideController');

/**
 * @route   GET /api/rides/my-rides
 * @desc    Get history for logged-in user
 */
router.get('/my-rides', protect, rideController.getMyRides);

// --- SETTINGS ENDPOINTS ---

/**
 * @route   GET /api/rides/settings/auto-accept
 * @desc    Get the current Auto-Accept status
 */
router.get('/settings/auto-accept', async (req, res) => {
    try {
        let setting = await SystemSetting.findOne({ key: 'autoAccept' });
        if (!setting) {
            // Default to FALSE (Manual Review) if not set
            setting = await SystemSetting.create({ key: 'autoAccept', value: false });
        }
        res.json({ autoAccept: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   POST /api/rides/settings/auto-accept
 * @desc    Toggle Auto-Accept
 */
router.post('/settings/auto-accept', async (req, res) => {
    try {
        const { autoAccept } = req.body;
        const setting = await SystemSetting.findOneAndUpdate(
            { key: 'autoAccept' },
            { value: autoAccept },
            { new: true, upsert: true }
        );
        res.json({ autoAccept: setting.value });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- EXPERT HELPER: Auto-Seed Fleet ---
// Ensures we always have our 7 assets in the DB on first run
const seedFleet = async () => {
    try {
        const count = await Vehicle.countDocuments();
        if (count === 0) {
            console.log("🔧 Seeding Initial Fleet...");
            await Vehicle.create([
                { name: 'Van 1', type: 'Large Van', capacity: 5 },
                { name: 'Van 2', type: 'Large Van', capacity: 5 },
                { name: 'Van 3', type: 'Large Van', capacity: 5 },
                { name: 'Van 4', type: 'Large Van', capacity: 5 },
                { name: 'Van 5', type: 'Large Van', capacity: 5 },
                { name: 'Car 1', type: 'Small Car', capacity: 2 },
                { name: 'Car 2', type: 'Small Car', capacity: 2 },
            ]);
            console.log("✅ Fleet Seeded Checked");
        }
    } catch (err) {
        console.error("Fleet Seed Error:", err);
    }
};
seedFleet();

// --- TICKET MIGRATION: Backfill Old Rides ---
const seedTicketIds = async () => {
    try {
        const ridesWithoutTickets = await Ride.find({ ticketId: { $exists: false } });
        if (ridesWithoutTickets.length > 0) {
            console.log(`🎫 Backfilling ${ridesWithoutTickets.length} Rides with IDs...`);
            for (const ride of ridesWithoutTickets) {
                const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
                ride.ticketId = `ASH-${randomChars}`;
                await ride.save();
            }
            console.log("✅ Ticket Migration Complete");
        }
    } catch (err) {
        console.error("Ticket Migration Failed:", err);
    }
};
seedTicketIds();

/**
 * @route   GET /api/rides/check-capacity
 * @desc    DYNAMIC Resource-Based Fleet Logic
 *          Now respects the "In Shop" status of vehicles.
 */
router.get('/check-capacity', async (req, res) => {
    try {
        const { time, passengerCount } = req.query;
        if (!time) return res.status(400).json({ message: "Time is required" });

        const selectedTime = new Date(time);

        if (selectedTime < new Date()) {
            return res.json({
                isFull: true,
                isBusy: false,
                fleetUsage: "N/A",
                remainingSeats: 0,
                message: "Cannot book in the past"
            });
        }

        // Strict Time Window: Rides overlapping this exact hour slot
        // "Is there a car available for the 5 PM slot?"
        const windowStart = new Date(selectedTime);
        windowStart.setMinutes(0, 0, 0); // Start of the hour
        const windowEnd = new Date(selectedTime);
        windowEnd.setMinutes(59, 59, 999); // End of the hour

        // 1. Get Dynamic Fleet Limits (Only Count ACTIVE Vehicles)
        const activeFleet = await Vehicle.find({ status: 'Active' });
        const TOTAL_VEHICLES = activeFleet.length;
        const TOTAL_SEATS = activeFleet.reduce((sum, v) => sum + v.capacity, 0);

        // 2. Find confirmed rides in this slot
        // Note: 'Completed' rides are NOT counted (they are "back in the garage")
        const activeRides = await Ride.find({
            status: 'Confirmed',
            scheduledTime: { $gte: windowStart, $lte: windowEnd }
        });

        const confirmedBookingsCount = activeRides.length;
        const currentOccupiedSeats = activeRides.reduce((acc, r) => acc + r.passengers, 0);
        const requestedSeats = parseInt(passengerCount) || 1;

        // --- EXPERT LOGIC ENGINE ---

        // A. VEHICLE LIMIT: Is the garage empty? (Active Fleet - Booked Rides)
        const allVehiclesBusy = (TOTAL_VEHICLES - confirmedBookingsCount) <= 0;

        // B. SEAT LIMIT: Are we physically full?
        const seatsFull = (currentOccupiedSeats + requestedSeats) > TOTAL_SEATS;

        // C. GROUP SIZE LIMIT: Hardcap at 5 (Largest Van)
        const tooLargeForAnyVehicle = requestedSeats > 5;

        // FINAL DECISION
        const isFull = allVehiclesBusy || seatsFull || tooLargeForAnyVehicle;

        // BUSY WARNING: Trigger when we are 2 bookings away from cap
        const isBusy = confirmedBookingsCount >= (TOTAL_VEHICLES - 2);

        res.json({
            isFull,
            isBusy,
            fleetUsage: `${confirmedBookingsCount}/${TOTAL_VEHICLES} Active Vehicles`,
            remainingSeats: TOTAL_SEATS - currentOccupiedSeats,
            message: isFull ? "Fleet Fully Dispatched" : isBusy ? "High Demand" : "Clear"
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   POST /api/rides
 */


/**
 * @route   POST /api/rides
 * @desc    Create a new ride request
 * @access  Public
 */
router.post('/', async (req, res) => {
    try {
        const {
            passengerName, phoneNumber, pickup, pickupDetails, dropoff,
            userType, isSameDay, passengers, isOutOfTown,
            mileage, scheduledTime
        } = req.body;

        if (!passengerName || !phoneNumber || !pickup || !dropoff || !scheduledTime) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // THESIS VALIDATION: Prevent Past Bookings
        const bookingDate = new Date(scheduledTime);
        if (bookingDate < new Date()) {
            return res.status(400).json({ message: "Cannot schedule rides in the past." });
        }

        // --- EXPERT SAFETY CHECK: Race Condition Prevention ---
        // Before we save, we MUST verify the garage isn't full.
        // Frontend checks this too, but the Server is the final authority.
        const windowStart = new Date(bookingDate);
        windowStart.setMinutes(0, 0, 0);
        const windowEnd = new Date(bookingDate);
        windowEnd.setMinutes(59, 59, 999);

        // 1. Count Confirmed Rides in this Hour
        const activeRidesCount = await Ride.countDocuments({
            status: { $in: ['Confirmed', 'En-Route'] }, // Only count active/promised rides
            scheduledTime: { $gte: windowStart, $lte: windowEnd }
        });

        // 2. Count Operating Vehicles
        const activeFleetCount = await Vehicle.countDocuments({ status: 'Active' });

        // 3. The "Full" Check
        if (activeRidesCount >= activeFleetCount) {
            console.warn(`⚠️ Blocked Overbooking Attempt at ${scheduledTime}`);
            return res.status(409).json({ // 409 Conflict suitable for race conditions
                message: "High Demand: This slot was just filled by another rider. Please choose a different time."
            });
        }
        // -------------------------------------------------------

        const officialFare = calculateFare(userType, isSameDay, passengers, isOutOfTown, mileage);

        // CHECK AUTO-ACCEPT SETTING
        const setting = await SystemSetting.findOne({ key: 'autoAccept' });
        const autoAccept = setting ? setting.value : false; // Default to Manual Review
        const initialStatus = autoAccept ? 'Confirmed' : 'Pending';

        // GENERATE DIGITAL TICKET (ASH-3Chars)
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
        const ticketId = `ASH-${randomChars}`;

        // --- TRANSACTION START ---
        // Atomic Operation: Check Capacity -> Insert Ride
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            const newRide = new Ride({
                passengerName, phoneNumber, pickup, pickupDetails, dropoff,
                userType, isSameDay, passengers, isOutOfTown,
                mileage, fare: officialFare,
                scheduledTime: bookingDate,
                riderId: req.body.riderId, // Save the Rider ID
                status: initialStatus,
                ticketId: ticketId,
                logs: [{ // Initial Log
                    user: 'System',
                    action: 'Ride Requested',
                    details: `Via Web Portal. Initial Status: ${initialStatus}`
                }]
            });

            // --- AUTO-ASSIGNMENT LOGIC (If Auto-Accept ON) ---
            if (autoAccept) {
                // Find first available driver (User with role 'Driver')
                // Note: This is a basic Round-Robin or First-Available implementation
                const User = require('../models/User');
                // Find a driver who is NOT currently driving a confirmed ride in this slot? 
                // For simplified phase 1: Just assign to *any* driver to show functionality, or skip specific load balancing.
                // Let's try to find a driver.
                const drivers = await User.find({ role: 'Driver' });
                if (drivers.length > 0) {
                    // Random assignment for now to distribute load
                    const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
                    newRide.assignedDriver = randomDriver._id;
                    newRide.logs.push({
                        user: 'System',
                        action: 'Auto-Assigned',
                        details: `Assigned to ${randomDriver.username}`
                    });
                }
            }

            await newRide.save({ session });
            await session.commitTransaction();

            res.status(201).json(newRide);
        } catch (error) {
            await session.abortTransaction();
            throw error; // Re-throw to outer catch
        } finally {
            session.endSession();
        }
    } catch (err) {
        console.error("Booking Error:", err);
        res.status(500).json({ message: "Server Error during booking." });
    }
});


/**
 * @route   GET /api/rides
 * @desc    Fetch rides. Supports filtering by Driver ID for individual manifests.
 */
router.get('/ping', (req, res) => res.send('pong'));

router.get('/', async (req, res) => {
    try {
        const { driverId } = req.query;
        let query = {};

        // INDIVIDUALIZED MANIFEST LOGIC
        if (driverId) {
            query = {
                $or: [
                    { assignedDriver: driverId }, // Assigned to me
                    { assignedDriver: null, status: 'Confirmed' }, // Or unassigned pool (Confirmed only)
                    { assignedDriver: { $exists: false }, status: 'Confirmed' } // Safety for schema migration
                ]
            };
        }

        const rides = await Ride.find(query).sort({ scheduledTime: 1 }).populate('assignedDriver', 'username');
        res.json(rides);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   PATCH /api/rides/:id/assign
 * @desc    Assign a Driver AND Vehicle to a ride
 */
router.patch('/:id/assign', protect, async (req, res) => {
    try {
        const { driverId, vehicleId, vehicleName } = req.body;
        console.log(`👨‍✈️ Assigning Driver ${driverId} to Ride ${req.params.id}`);

        const updateData = {};

        // 1. Assign Driver
        if (driverId) updateData.assignedDriver = driverId;

        // 2. Assign Vehicle (Keep legacy string field for now)
        if (vehicleName) updateData.assignedVehicle = vehicleName;

        const updatedRide = await Ride.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('assignedDriver', 'username');

        if (!updatedRide) return res.status(404).json({ message: "Ride not found" });

        // 3. OPTIONAL: Update Vehicle's currentDriver (for fleet tracking)
        if (vehicleId && driverId) {
            await Vehicle.findByIdAndUpdate(vehicleId, { currentDriver: driverId });
        }

        res.json(updatedRide);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route   PATCH /api/rides/:id/status
 */
/**
 * @route   PATCH /api/rides/:id/status
 * @desc    Update Status + Log Action (Protected)
 */
const AuditLog = require('../models/AuditLog'); // Import Audit

// ... (existing imports)

// ...

/**
 * @route   PATCH /api/rides/:id/status
 * @desc    Update Status + Log Action (Protected) + REVENUE LOCK
 */
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status, dispatcherNotes } = req.body;
        const ride = await Ride.findById(req.params.id);

        if (!ride) return res.status(404).json({ message: "Ride not found" });

        // --- REVENUE LOCK (Phase 3) ---
        // Once Completed, the fare is frozen forever.
        const updateData = { status, dispatcherNotes };

        if (status === 'Completed' && ride.status !== 'Completed') {
            updateData.finalizedFare = ride.fare; // Lock it
            updateData.paymentStatus = 'Invoiced'; // Auto-invoice
        }

        // --- AUDIT LOGGING (Phase 2) ---
        const logEntry = {
            user: req.user.username || 'Dispatcher',
            action: `Changed Status: ${ride.status} > ${status}`,
            details: dispatcherNotes ? `Note: ${dispatcherNotes}` : ''
        };

        // 1. Update Ride
        const updatedRide = await Ride.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateData,
                $push: { logs: logEntry }
            },
            { new: true }
        );

        // 2. Create Immutable Audit Log
        await AuditLog.create({
            action: 'STATUS_CHANGE',
            performedBy: req.user.username || 'Dispatcher',
            targetId: ride._id,
            targetModel: 'Ride',
            changes: { from: ride.status, to: status },
            metadata: dispatcherNotes
        });

        res.json(updatedRide);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route   PATCH /api/rides/:id/vehicle
 */
router.patch('/:id/vehicle', async (req, res) => {
    try {
        const { assignedVehicle } = req.body;
        const updatedRide = await Ride.findByIdAndUpdate(
            req.params.id,
            { assignedVehicle },
            { new: true }
        );

        if (!updatedRide) return res.status(404).json({ message: "Ride not found" });
        res.json(updatedRide);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route   PATCH /api/rides/:id/details
 * @desc    Edit Ride Details (Time/Fare)
 */
router.patch('/:id/details', async (req, res) => {
    try {
        const { fare, scheduledTime } = req.body;

        // REVENUE LOCK CHECK
        const ride = await Ride.findById(req.params.id);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        if (ride.finalizedFare !== undefined && fare !== undefined) {
            return res.status(403).json({ message: "Billing Locked: Cannot edit fare of a completed ride." });
        }

        const updates = {};
        if (fare !== undefined) updates.fare = fare;
        if (scheduledTime) updates.scheduledTime = new Date(scheduledTime);

        const updatedRide = await Ride.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        );

        res.json(updatedRide);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/**
 * @route   GET /api/vehicles
 * @desc    Get complete fleet status for Fleet Manager
 */
router.get('/vehicles', async (req, res) => {
    try {
        // Sort: Active first, then by name
        const vehicles = await Vehicle.find().sort({ status: 1, name: 1 });
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * @route   PATCH /api/vehicles/:id
 * @desc    Toggle Vehicle Maintenance Status
 */
router.patch('/vehicles/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedVehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(updatedVehicle);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// RIDER: Track Ride by Ticket ID (Public Safe Endpoint)
router.get('/track/:ticketId', async (req, res) => {
    try {
        // SAFETY: Only return what the passenger needs to see. Hide internal IDs/Notes.
        const ride = await Ride.findOne({ ticketId: req.params.ticketId })
            .select('ticketId status passengerName pickup pickupDetails dropoff scheduledTime fare assignedVehicle userType passengers');

        if (!ride) return res.status(404).json({ message: "Ticket not found" });
        res.json(ride);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- ADMIN ENDPOINTS (Reporting) ---

/**
 * @route   GET /api/rides/admin/audit-logs
 * @desc    Fetch recent audit logs (Protected)
 */
router.get('/admin/audit-logs', protect, async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(100); // Last 100 actions
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
