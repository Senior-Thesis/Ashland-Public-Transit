import axios from 'axios';

const API_URL = 'http://localhost:5000/api/rides';
const AUTH_URL = 'http://localhost:5000/api/auth';

// JWT INTERCEPTOR: Automatically attaches token to every request
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// AUTH: Login to get JWT
export const login = async (username, password) => {
    try {
        const response = await axios.post(`${AUTH_URL}/login`, { username, password });
        return response.data;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

// RIDER: Create a new request
export const createRide = async (rideData) => {
    const response = await axios.post(API_URL, rideData);
    return response.data;
};

// STAFF: Get the full manifest
export const getRides = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// STAFF: Update Approve/Reject status
export const updateRideStatus = async (id, status, dispatcherNotes = "") => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status, dispatcherNotes });
    return response.data;
};

// RIDER: Live check if vehicle has seats (Now includes passenger count for better math)
export const checkCapacity = async (time, passengerCount = 1) => {
    try {
        const response = await axios.get(`${API_URL}/check-capacity?time=${time}&passengerCount=${passengerCount}`);
        return response.data; // Returns { confirmedCount, isFull, isBusy }
    } catch (error) {
        console.error("Error checking capacity:", error);
        return { isFull: false, isBusy: false };
    }
};

// STAFF: Assign specific vehicle (Large Van vs Small Car)
export const updateRideVehicle = async (id, assignedVehicle) => {
    try {
        const response = await axios.patch(`${API_URL}/${id}/vehicle`, { assignedVehicle });
        return response.data;
    } catch (error) {
        console.error("Error updating vehicle assignment:", error);
        throw error;
    }
};


// EXPERT: Fleet Management
export const getVehicles = async () => {
    const response = await axios.get(`${API_URL}/vehicles`);
    return response.data;
};

export const updateVehicleStatus = async (id, status) => {
    const response = await axios.patch(`${API_URL}/vehicles/${id}`, { status });
    return response.data;
};

// STAFF: Edit Ride Details (Time/Fare)
export const updateRideDetails = async (id, details) => {
    try {
        const response = await axios.patch(`${API_URL}/${id}/details`, details);
        return response.data;
    } catch (error) {
        console.error("Error updating ride details:", error);
        throw error;
    }
};

// RIDER: Track specific ride
export const getRideByTicket = async (ticketId) => {
    try {
        // ENCODE ID: Handles '#' characters correctly (e.g. #ASH-123 -> %23ASH-123)
        const response = await axios.get(`${API_URL}/track/${encodeURIComponent(ticketId)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching ticket:", error);
        throw error;
    }
};
// ADMIN: Global Settings (Auto-Accept)
export const getAutoAccept = async () => {
    try {
        const response = await axios.get(`${API_URL}/settings/auto-accept`);
        return response.data;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return { autoAccept: false }; // Safe default
    }
};

export const updateAutoAccept = async (autoAccept) => {
    try {
        const response = await axios.post(`${API_URL}/settings/auto-accept`, { autoAccept });
        return response.data;
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

// ADMIN: Get Audit Logs
export const getAuditLogs = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/audit-logs`);
        return response.data;
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return [];
    }
};

// DISPATCHER: Get All Drivers
export const getDrivers = async () => {
    try {
        const response = await axios.get(`${AUTH_URL}/users?role=Driver`);
        return response.data;
    } catch (error) {
        console.error("Error fetching drivers:", error);
        return [];
    }
};

// DRIVER: Update Self Current Vehicle
export const updateUserVehicle = async (vehicleId) => {
    try {
        // vehicleId can be null to unassign
        const response = await axios.patch(`${AUTH_URL}/vehicle`, { vehicleId });
        return response.data;
    } catch (error) {
        console.error("Error updating user vehicle:", error);
        throw error;
    }
};

// DISPATCHER: Assign Driver to Ride
export const assignDriver = async (rideId, driverId, vehicleId, vehicleName) => {
    try {
        const response = await axios.patch(`${API_URL}/${rideId}/assign`, { driverId, vehicleId, vehicleName });
        return response.data;
    } catch (error) {
        console.error("Error assigning driver:", error);
        throw error;
    }
};
