const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let driverToken = '';
let driverId = '';
let rideId = '';

async function post(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`POST ${url} failed: ${res.status} ${txt}`);
    }
    return res.json();
}

async function get(url, token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + url, { headers });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`GET ${url} failed: ${res.status} ${txt}`);
    }
    return res.json();
}

async function patch(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(API_URL + url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`PATCH ${url} failed: ${res.status} ${txt}`);
    }
    return res.json();
}

async function runTest() {
    try {
        console.log("🚀 Starting Validation Test (Fetch Version)...");

        // 0. Ping Check
        try {
            const ping = await get('/rides/ping');
            console.log("✅ Ping Success:", ping);
        } catch (e) {
            console.log("⚠️ Ping Failed (Server might not have reloaded):", e.message);
        }

        // 1. Login as Admin
        console.log("\n1. Logging in as Admin...");
        const adminLogin = await post('/auth/login', {
            username: 'admin',
            password: 'Ashland2026'
        });
        adminToken = adminLogin.token;
        console.log("✅ Admin Logged In");

        // 2. Create/Login a Driver
        console.log("\n2. Creating/Logging in Driver 'testdriver'...");
        try {
            const driverSignup = await post('/auth/signup', {
                username: 'testdriver',
                password: 'password123',
                role: 'Driver',
                phoneNumber: '555-0101'
            });
            driverId = driverSignup._id;
            driverToken = driverSignup.token;
            console.log("✅ Driver Created:", driverId);
        } catch (e) {
            // If exists, login
            console.log("Driver might exist, logging in..."); // Simplified handling
            const driverLogin = await post('/auth/login', {
                username: 'testdriver',
                password: 'password123'
            });
            driverId = driverLogin._id;
            driverToken = driverLogin.token;
            console.log("✅ Driver Logged In explicitly:", driverId);
        }

        // 3. Create a Ride
        console.log("\n3. Creating a Ride...");
        // Need to wrap in `ride` object? Checking existing code...
        // `rideRoutes.js` expects body properties directly: const { passengerName... } = req.body;
        const newRide = {
            passengerName: "Test Passenger",
            phoneNumber: "555-5555",
            pickup: "Main St",
            dropoff: "Hospital",
            scheduledTime: new Date(Date.now() + 86400000).toISOString(),
            mileage: 5,
            userType: 'Standard',
            passengers: 1,
            riderId: driverId
        };

        // POST /api/rides
        // Wait, is it /rides or /api/rides? My helper adds /api/ prefix? 
        // Helper: `fetch(API_URL + url` -> `http://localhost:5000/api` + `/rides`
        const rideRes = await post('/rides', newRide, adminToken);

        // Response might be the ride object or { message, ride }
        rideId = rideRes._id || (rideRes.ride && rideRes.ride._id);
        console.log("✅ Ride Created:", rideId);

        // 4. Assign Driver to Ride
        console.log(`\n4. Assigning Driver ${driverId} to Ride ${rideId}...`);
        const assignRes = await patch(`/rides/${rideId}/assign`, {
            driverId: driverId,
            vehicleName: "Test Van 1"
        }, adminToken);

        const assignedId = assignRes.assignedDriver && (assignRes.assignedDriver._id || assignRes.assignedDriver);

        if (assignedId === driverId) {
            console.log("✅ Driver Assigned Successfully");
        } else {
            console.error("❌ Assignment Failed:", assignRes);
        }

        // 5. Fetch Rides as Driver
        console.log("\n5. Fetching Rides as Driver...");
        const driverRides = await get(`/rides?driverId=${driverId}`, driverToken);

        const found = driverRides.find(r => r._id === rideId);
        if (found) {
            console.log("✅ Ride found in Driver Manifest");
        } else {
            console.error("❌ Ride NOT found in Driver Manifest");
            console.log("Rides returned count:", driverRides.length);
        }

        // 6. Fetch Rides as Another Driver
        console.log("\n6. Fetching Rides with Fake Driver ID...");
        const fakeRides = await get(`/rides?driverId=000000000000000000000000`, adminToken);
        const foundFake = fakeRides.find(r => r._id === rideId);
        if (!foundFake) {
            console.log("✅ Ride correctly HIDDEN from other driver");
        } else {
            console.error("❌ Ride showed up for wrong driver!");
        }

        console.log("\n✨ VALIDATION COMPLETE ✨");

    } catch (error) {
        console.error("❌ TEST FAILED:", error.message);
    }
}

runTest();
