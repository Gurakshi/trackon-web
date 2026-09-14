# TRACKON 🚆⚠️

**TRACKON** is an enterprise-grade mobile and web platform engineered exclusively for authorized railway personnel. It provides real-time alerts, incident reporting, computer vision track defect analysis, and maintenance tracking to improve railway safety and operational efficiency.

---

## 🌟 Key Features

* **User Authentication & Role-Based Access Control**:
  * Exclusively restricted to verified railway employees.
  * Multi-factor verification via official Railway Employee ID, email, and OTP.
  * Role tailored workspaces:
    1. **Track Inspector** (Field reporting, GPS capture, camera defect scanning)
    2. **Station Master** (Operations control, emergency train halt broadcasting)
    3. **Maintenance Team** (Dispatched gang tracking, before/after repair evidence upload)
    4. **Railway Administrator** (Executive safety KPIs, SHA-256 blockchain audit vault)

* **Incident Reporting**:
  * Covers 8 hazard categories: Track damage/cracks, Waterlogging/flooding, Fallen trees/obstacles, Signal failures, Track misalignment, Landslides, Unauthorized access, and 25kV Electrical faults.
  * Automatic GPS geolocation with reverse track chainage and nearest station lookup.
  * Photo/video evidence upload with camera capture.
  * Real-time emergency broadcast upon submission.

* **Real-Time Alert System**:
  * Instant WebSocket notifications with Web Audio emergency siren.
  * Simulated SMS Gateway & Push Notification delivery logs.
  * Color-coded emergency severity triage (Critical, High, Medium, Low).

* **Interactive GIS Map Dashboard**:
  * Leaflet railway track lines with kilometer nodes and stations.
  * Pulsating emergency markers with 1.2km safety exclusion zones.
  * Nearest maintenance teams tracking and one-click dispatch flyout.

* **AI-Powered Defect Vision & Intelligence**:
  * Computer vision flaw segmentation with bounding box overlays on defective rails.
  * Predictive Track Vulnerability Index (TVI) identifying high-risk segments.
  * Standard Operating Procedure (SOP) recommendation engine.
  * Automated executive maintenance digest generation.

* **Maintenance Workflow Pipeline**:
  * 4-Stage Kanban Workflow (`Reported` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`).
  * Mandatory before/after repair photo verification and supervisor sign-off.

* **Cryptographic Security & Audit Trail**:
  * Immutable SHA-256 block chain recording all system transactions with 1-click integrity verification.

---

## 🚀 Running the Application

### 1. Backend Server
```bash
cd backend
npm install
npm start
# Runs on http://localhost:5000 (REST API & Socket.IO)
```

### 2. Frontend Web & Mobile App
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 (Proxies API to port 5000)
```

---

## 🔑 Quick Testing Credentials

Use any of the 4 demo profiles with the standard evaluation OTP `849201`:
* **Track Inspector**: `IR-TI-1042` (Ramesh Kumar)
* **Station Master**: `IR-SM-2091` (Priya Sharma)
* **Maintenance Lead**: `IR-MT-3084` (David Miller)
* **Railway Administrator**: `IR-AD-4001` (Dr. Rajesh Verma)
