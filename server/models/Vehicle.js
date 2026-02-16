const mongoose = require('mongoose');

/**
 * Vehicle Schema
 * Core asset for the new "Dynamic Fleet-Lock" logic.
 * Allows Dispatch to mark vehicles as 'In Shop' to reduce capacity.
 */
const VehicleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['Large Van', 'Small Car'],
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'In Shop'],
        default: 'Active'
    },
    // --- DRIVER ASSIGNMENT ---
    // Tracks who is currently driving this vehicle (for the day/shift)
    currentDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // --- MAINTENANCE TRACKING ---
    engineHours: {
        type: Number,
        default: 0
    },
    lastServiceDate: {
        type: Date
    },
    maintenanceHistory: [{
        type: { type: String, required: true }, // e.g. 'Oil Change', 'Tire Rotation'
        date: { type: Date, default: Date.now },
        cost: { type: Number, default: 0 },
        notes: String,
        engineHoursAtService: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
