# Ashland Public Transit - Distributed Fleet Management System 🚍

> **URCA Senior Thesis Project**  
> *Optimizing Rural Transit Visibility & Dispatch Efficiency*

## 📖 Abstract
This project addresses the critical inefficiencies in rural public transit systems, specifically the lack of real-time visibility for dispatchers and the manual, error-prone booking processes for riders. By implementing a **Distributed Fleet Management System**, this application synchronizes data between a central Dispatcher Portal, individual Driver Views, and a public-facing Passenger Tracker. The system aims to reduce "ghost rides" (untracked vehicles), eliminate overbooking through dynamic capacity checks, and improve accessibility for elderly/disabled populations via a simplified, high-contrast interface.

## 🛠️ Technology Stack
The application is built on the **MERN Stack** for full-stack JavaScript scalability:
*   **MongoDB**: Flexible document storage for Rides and Vehicle tracking.
*   **Express.js**: RESTful API layer handling booking logic and fleet status.
*   **React**: Dynamic frontend with `framer-motion` for fluid UX and `lucide-react` for accessible iconography.
*   **Recharts**: Data visualization for Executive Analytics.
*   **Node.js**: Scalable backend runtime.
*   **Leaflet**: Interactive mapping for route visualization.
*   **QRCode**: Digital ticketing system for "Contactless Boarding".

## ✨ New Features (Feb 2026)
*   **Dynamic Fare Engine**: Evaluation of passenger types (Veteran, Senior, Student) with automatic discounts and surcharges.
*   **Executive Dashboard**: Real-time analytics reporting Revenue, Peak Hours, and Fleet Health.
*   **Digital Boarding Pass**: Mobile-ready QR codes for confirmed passengers.
*   **Smart Dispatching**: Toggle between "Manual Review" and "Auto-Accept" modes for ride requests.

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js (v14+)
*   MongoDB (Local or Atlas URI)

### 1. Clone & Install Dependencies
The project is divided into `client` (Frontend) and `server` (Backend). You must install dependencies for both.

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Configure Environment
Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
NODE_ENV=development
```

### 3. Run the Application
Start both the backend and frontend terminals:

```bash
# Terminal 1: Server
cd server
npm run dev  # or node index.js

# Terminal 2: Client
cd client
npm start
```
*   **Frontend**: http://localhost:3000
*   **Backend**: http://localhost:5000

---

## � API Documentation (Driver Team Handoff)

The Driver Module (built by the external team) should interact with the following endpoints to ensure synchronization with the Dispatcher Dashboard.

### Base URL: `http://localhost:5000/api`

| Method | Endpoint | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| **GET** | `/rides` | **Fetch Manifest**<br>Returns all active rides. Drivers should filter by their `assignedVehicle`. | None |
| **PATCH** | `/rides/:id/status` | **Update Status**<br>Used when Driver starts or completes a ride. | `{ "status": "En-Route" \| "Completed" }` |
| **PATCH** | `/rides/:id/vehicle` | **Claim Ride**<br>Used by "Floating Drivers" to self-assign a ride from the pool. | `{ "assignedVehicle": "Van 1" }` |
| **GET** | `/vehicles` | **Fleet Check**<br>Check status of all assets (Active/In Shop). | None |
| **POST** | `/rides` | **New Booking**<br>(Public) Creates a pending ride request. | `{ "passengerName": "...", "scheduledTime": "..." }` |

> **⚠️ NOTE:** The `POST /api/rides` endpoint includes a strict **Server-Side Capacity Check**. If the requested time slot has reached fleet capacity (Active Vehicles vs. Confirmed Rides), the server will return `409 Conflict`. Handle this error gracefully by asking the user to select a different time.

---

## 🔐 Access Credentials (Demo)

### Dispatcher Portal
*   **Username**: `admin`
*   **Password**: `Ashland2026`

### Driver Portal
*   **Username**: `testdriver`
*   **Password**: `password123`

---

*Verified for Production Build - Spring 2026*
