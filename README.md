# Ashland Transit: Smart Scheduling System

**Team:** EagleLink Systems  
**Members:** Dhruval Anandkar, Ian Kichurchak, Noah Crenshaw

---

## 📌 Project Overview

This is a full-stack **MERN** application built to modernize **Ashland Public Transit**.  
The core of the project is a **Resource-Aware Engine** that prevents overbooking by tracking a **finite fleet of 7 vehicles**, rather than simply counting passenger seats.

---

## 🚀 Step-by-Step Setup Guide

### 1. Clone & Install

# Clone the repository
git clone (https://github.com/Senior-Thesis/Ashland-Public-Transit.git)

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install

# 2. Environment Configuration
Ensure your .env file inside the server directory contains the correct MongoDB connection string.

# 3. Running the System
You must run both backend and frontend simultaneously.
Terminal 1 (Backend):
cd server
node server.js

Terminal 2 (Frontend):
cd client
npm start


# 🛠 Key Technical Features (The Core Engine)
🔒 The Fleet-Lock Algorithm
Location: BookingForm.js and backend controller logic.


When a user selects a time, the frontend calls checkCapacity()


The system counts how many rides are already Confirmed for that hour


Fleet Limit: 7 vehicles


If confirmed rides reach 7, the Confirm Booking button locks automatically


This guarantees physical fleet constraints are never violated.

# 📊 Dispatcher Command Center (DispatcherDashboard.js)
Local-Time Sync


Uses toLocaleDateString('en-CA') to ensure dates align with Ashland’s local timezone (not UTC)


Heatmap Manifest
Visual deployment bars
🟦 Blue = Available
🟧 Amber = Busy
🟥 Red = Full

Priority Sorting
Elderly / Disabled users (Priority #1, #2)
First-Come-First-Served (FCFS) based on booking timestamp

# 📝 Teammate Task Checklist
If you are working on the code today, follow this priority order:
Test Data
Use January 27, 2026 as the test date
Several "Dhruval" test cases already exist to demonstrate the Overbooked alert
Asset Allocation
Assign a vehicle per ride using the dropdown
Options: Large Van or Small Car
Conflict Resolution
If the header shows OVERBOOKED
Locate rides marked with the red Conflict badge
Click the X (Reject) button on the lowest-priority ride
Continue until fleet usage returns to 7/7

# 📅 URCA Abstract Information
Presentation Title:
Modernizing Local Transit: A Resource-Locked Scheduling System for Ashland Public Transit
Key Innovation:
Transition from seat-counting to Physical Asset Management
Advisor:
Dr. Shanmugam

# 📤 GitHub Workflow
When pushing changes, use clear and consistent commit prefixes:
feat: — New features (e.g., Driver View)
fix: — Bug fixes (e.g., timezone issues)
docs: — Documentation updates
Current Goal:
Bridge the Communication Gap by implementing a read-only Driver View so drivers can clearly see their daily assignments.
If you want, I can also:
- Tighten this for a **research submission**
- Add **architecture diagrams**
- Split it into `README.md` + `CONTRIBUTING.md`
