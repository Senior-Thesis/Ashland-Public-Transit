const mongoose = require('mongoose');

/**
 * Ride Schema - Resource Management Version
 * This model tracks passenger requests and physical vehicle assignments
 * for the Ashland Public Transit Fleet (7 Vehicles Total).
 */
const RideSchema = new mongoose.Schema({
    // 1. Core Passenger Data
    passengerName: {
        type: String,
        required: [true, 'Passenger name is required for the manifest']
    },
    riderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for now to support legacy guests
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required for dispatch communication']
    },

    // 1b. Digital Ticketing (Expert Feature)
    ticketId: {
        type: String,
        unique: true
    },

    // 2. Location Logic
    pickup: { type: String, required: true },
    pickupDetails: { type: String }, // "Last 100 Feet" precision
    dropoff: { type: String, required: true },
    isOutOfTown: { type: Boolean, default: false },
    mileage: { type: Number, default: 0 },

    // 3. Trip Logic
    userType: {
        type: String,
        enum: ['Standard', 'Senior', 'Student', 'Veteran', 'Elderly/Disabled', 'Child'], // Expanded Enums
        required: true
    },
    isSameDay: { type: Boolean, default: false },
    passengers: {
        type: Number,
        default: 1,
        min: [1, 'At least one passenger is required'],
        max: [5, 'Groups larger than 5 require a special high-capacity request']
    },
    accessibility: {
        type: Boolean,
        default: false
    },
    estimatedPrice: {
        type: Number
    },

    passengerDetails: {
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        elderly: { type: Number, default: 0 }
    },

    // 4. Financial Tracking & Billing (Phase 3)
    fare: { type: Number, required: true },
    fareType: {
        type: String,
        enum: ['SameDay', 'Scheduled', 'Elderly', 'Standard'],
        default: 'SameDay'
    },
    finalizedFare: { type: Number }, // LOCKED Revenue
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Invoiced'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'Digital Pass', 'Account'],
        default: 'Cash'
    },

    // 5. Dispatcher Control Logic
    status: {
        type: String,
        enum: [
            'Pending', // Default
            'Pending Review', // Legacy support
            'Approved', // New Request
            'Confirmed',
            'Rejected',
            'En-Route',
            'Completed',
            'No-Show',
            'Cancelled'
        ],
        default: 'Pending'
    },

    // 6. AUDIT TRAIL (Liz's Request)
    logs: [{
        user: String, // e.g. "Dispatcher", "Admin", "System"
        action: String, // e.g. "Confirmed Ride"
        timestamp: { type: Date, default: Date.now },
        details: String
    }],

    // 6. FLEET OPTIMIZATION FIELD
    // This allows Liz to "Shuffle" passengers to the most efficient vehicle
    // Relaxed validation to allow specific vehicle names (e.g. "Bus 101")
    assignedVehicle: {
        type: String,
        default: 'Unassigned'
    },

    // 6b. INDIVIDUALIZED DRIVER ASSIGNMENT
    // Links a specific human driver (User) to this ride
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    dispatcherNotes: { type: String },

    // 7. Scheduling
    scheduledTime: {
        type: Date,
        required: [true, 'A specific date and time is required for scheduling']
    }
}, {
    timestamps: true // Automatically tracks 'Created At' and 'Updated At'
});

// Expert Indexing: Helps the Dashboard load faster when Liz has hundreds of rides
RideSchema.index({ scheduledTime: 1, status: 1 });

module.exports = mongoose.model('Ride', RideSchema);