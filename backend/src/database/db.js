import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'railsafe_data.json');

// Haversine formula to compute great-circle distance in kilometers
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Compute SHA-256 hash
export function computeHash(data, prevHash = '') {
  return crypto
    .createHash('sha256')
    .update(prevHash + JSON.stringify(data))
    .digest('hex');
}

// Pre-seeded authorized Railway Personnel
const INITIAL_USERS = [
  {
    id: 'u-1',
    employeeId: 'IR-TI-1042',
    name: 'Ramesh Kumar',
    role: 'Track Inspector',
    email: 'ramesh.kumar@railways.gov.in',
    phone: '+91 98201 44521',
    division: 'Central Division',
    section: 'Kalyan - Kasara Section (KM 54 - KM 121)',
    stationCode: 'KYN',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'u-2',
    employeeId: 'IR-SM-2091',
    name: 'Priya Sharma',
    role: 'Station Master',
    email: 'priya.sharma@railways.gov.in',
    phone: '+91 98210 77144',
    division: 'Central Division',
    section: 'Mumbai CSMT Operations Control',
    stationCode: 'CSMT',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'u-3',
    employeeId: 'IR-MT-3084',
    name: 'David Miller',
    role: 'Maintenance Team',
    email: 'david.miller@railways.gov.in',
    phone: '+91 98332 19043',
    division: 'Central Division',
    section: 'Emergency P-Way Rapid Response Gang-04',
    stationCode: 'TNA',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'u-4',
    employeeId: 'IR-AD-4001',
    name: 'Dr. Rajesh Verma',
    role: 'Railway Administrator',
    email: 'rajesh.verma@railways.gov.in',
    phone: '+91 98111 88990',
    division: 'Railway Board HQ',
    section: 'Principal Chief Safety Engineering Directorate',
    stationCode: 'NDLS',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

// Maintenance Teams along railway lines
const INITIAL_TEAMS = [
  {
    id: 'team-1',
    name: 'Gang-04 Fast Response (P-Way)',
    division: 'Central Division',
    baseStation: 'Thane (TNA)',
    leadEngineer: 'David Miller',
    crewSize: 8,
    specialization: 'Track Fracture & Ultrasonic Welding',
    status: 'Available', // Available, Dispatched, In-Progress, Off-Duty
    contactNumber: '+91 98332 19043',
    currentLat: 19.186,
    currentLng: 72.9759,
    assignedIncidentId: null,
  },
  {
    id: 'team-2',
    name: 'Ghat Section Monsoon Gang-09',
    division: 'Central Division',
    baseStation: 'Igatpuri (IGP)',
    leadEngineer: 'Sunil Patil',
    crewSize: 12,
    specialization: 'Landslide Clearance & Rock Fall Mitigation',
    status: 'Dispatched',
    contactNumber: '+91 98224 81092',
    currentLat: 19.698,
    currentLng: 73.565,
    assignedIncidentId: 'inc-3',
  },
  {
    id: 'team-3',
    name: 'Signal & Telecommunication Unit-2',
    division: 'Central Division',
    baseStation: 'Kalyan (KYN)',
    leadEngineer: 'Amit Saxena',
    crewSize: 6,
    specialization: 'Automatic Block Signaling & Interlocking',
    status: 'In-Progress',
    contactNumber: '+91 98190 32188',
    currentLat: 19.2437,
    currentLng: 73.1355,
    assignedIncidentId: 'inc-4',
  },
  {
    id: 'team-4',
    name: 'Traction Electrical Overhaul Gang-01',
    division: 'Central Division',
    baseStation: 'Kurla (CLA)',
    leadEngineer: 'Vikas Deshmukh',
    crewSize: 10,
    specialization: '25kV AC OHE Wire Tension & Pantograph Clearances',
    status: 'Available',
    contactNumber: '+91 98675 44012',
    currentLat: 19.0657,
    currentLng: 72.8793,
    assignedIncidentId: null,
  },
  {
    id: 'team-5',
    name: 'Heavy Civil & Track Alignment Unit',
    division: 'Western Division',
    baseStation: 'Dadar (DDR)',
    leadEngineer: 'Mahesh Kulkarni',
    crewSize: 14,
    specialization: 'Tamper Machine Operations & Track Realignment',
    status: 'Available',
    contactNumber: '+91 98920 11456',
    currentLat: 19.0178,
    currentLng: 72.8478,
    assignedIncidentId: null,
  },
];

// High-detail railway track routes / coordinates for map display
export const RAILWAY_TRACKS = [
  {
    id: 'route-main-line',
    name: 'Central Trunk Corridor (CSMT - Kasara)',
    division: 'Central Division',
    gauge: 'Broad Gauge 1676mm',
    electrification: '25kV AC Overhead',
    lineColor: '#3b82f6',
    coordinates: [
      [18.9401, 72.8347], // CSMT
      [18.9696, 72.8336], // Byculla
      [19.0178, 72.8478], // Dadar
      [19.0657, 72.8793], // Kurla
      [19.0864, 72.9082], // Ghatkopar
      [19.186, 72.9759],  // Thane
      [19.1982, 72.9928], // Kalwa
      [19.2064, 73.0489], // Mumbra
      [19.1901, 73.085],  // Diva Junction
      [19.2183, 73.0975], // Dombivli
      [19.2437, 73.1355], // Kalyan Junction
      [19.298, 73.194],   // Titwala
      [19.467, 73.324],   // Asangaon
      [19.698, 73.565],   // Igatpuri / Kasara Ghat
    ],
  },
  {
    id: 'route-harbour-line',
    name: 'Harbour Line (CSMT - Panvel Corridor)',
    division: 'Central Division',
    gauge: 'Broad Gauge 1676mm',
    electrification: '25kV AC Overhead',
    lineColor: '#10b981',
    coordinates: [
      [18.9401, 72.8347], // CSMT
      [18.956, 72.842],   // Sandhurst Road
      [18.995, 72.86],    // Wadala
      [19.0657, 72.8793], // Kurla
      [19.055, 72.932],   // Chembur
      [19.046, 72.998],   // Vashi
      [19.033, 73.029],   // Sanpada
      [19.016, 73.098],   // Nerul
      [18.989, 73.118],   // Belapur
      [18.988, 73.123],   // Panvel
    ],
  },
  {
    id: 'route-western-line',
    name: 'Western Trunk Route (Churchgate - Virar)',
    division: 'Western Division',
    gauge: 'Broad Gauge 1676mm',
    electrification: '25kV AC Overhead',
    lineColor: '#f59e0b',
    coordinates: [
      [18.9322, 72.8264], // Churchgate
      [18.9667, 72.8189], // Mumbai Central
      [19.0178, 72.8478], // Dadar WR
      [19.0544, 72.8402], // Bandra
      [19.1197, 72.8464], // Andheri
      [19.2288, 72.8566], // Borivali
      [19.4542, 72.8116], // Virar
    ],
  },
];

// Pre-seeded Active and Historical Incidents
const INITIAL_INCIDENTS = [
  {
    id: 'inc-1',
    trackingNumber: 'RSA-2026-0412',
    reporterId: 'u-1',
    reporterName: 'Ramesh Kumar (Track Inspector)',
    reporterRole: 'Track Inspector',
    category: 'Track damage or cracks',
    severity: 'Critical',
    status: 'In Progress',
    latitude: 19.2312,
    longitude: 73.1205,
    trackKilometer: 'KM 51/14 - 51/18 (Up Fast Line)',
    division: 'Central Division',
    nearestStation: 'Kalyan (KYN)',
    distanceFromStationKm: 1.8,
    description:
      'Transverse fatigue fracture detected on outer rail head during foot inspection. Gap measured at approx 8mm. Audible rail joint shock detected.',
    mediaUrl:
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    aiAnalysis: {
      defectType: 'Transverse Rail Fracture',
      defectConfidence: 0.94,
      severityCalculated: 'Critical',
      crackWidthMm: 8.2,
      riskScore: 95,
      boundingBox: { ymin: 0.22, xmin: 0.35, ymax: 0.74, xmax: 0.68 },
      recommendedSOP: [
        'Impose immediate 10 km/h emergency speed restriction on Up Fast Line.',
        'Halt scheduled Express movement until fishplate clamping completed.',
        'Dispatch Ultrasonic Testing & Thermit Welding Gang-04.',
      ],
    },
    assignedTeamId: 'team-1',
    assignedTeamName: 'Gang-04 Fast Response (P-Way)',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(), // 35 min ago
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    resolvedAt: null,
    escalatedToControlCenter: true,
  },
  {
    id: 'inc-2',
    trackingNumber: 'RSA-2026-0411',
    reporterId: 'u-2',
    reporterName: 'Priya Sharma (Station Master)',
    reporterRole: 'Station Master',
    category: 'Waterlogging or flooding',
    severity: 'High',
    status: 'Assigned',
    latitude: 19.0657,
    longitude: 72.8793,
    trackKilometer: 'KM 15/02 - 15/08 (Platform 1 & 2)',
    division: 'Central Division',
    nearestStation: 'Kurla (CLA)',
    distanceFromStationKm: 0.2,
    description:
      'Heavy rain runoff accumulation above rail level at Kurla down suburban line. Track ballast submerged by 110mm; axle counter water-sensor triggered.',
    mediaUrl:
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    aiAnalysis: {
      defectType: 'Track Submergence / Waterlogging',
      defectConfidence: 0.91,
      severityCalculated: 'High',
      submergenceDepthMm: 110,
      riskScore: 82,
      boundingBox: { ymin: 0.4, xmin: 0.1, ymax: 0.95, xmax: 0.9 },
      recommendedSOP: [
        'Engage 50HP flood dewatering pumps at Kurla West sub-drain.',
        'Suspend local EMUs through Platform 1; divert to Harbor elevated span.',
        'Inspect track track circuits for false red occupancy.',
      ],
    },
    assignedTeamId: 'team-4',
    assignedTeamName: 'Traction Electrical Overhaul Gang-01',
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    resolvedAt: null,
    escalatedToControlCenter: true,
  },
  {
    id: 'inc-3',
    trackingNumber: 'RSA-2026-0409',
    reporterId: 'u-1',
    reporterName: 'Ramesh Kumar (Track Inspector)',
    reporterRole: 'Track Inspector',
    category: 'Fallen trees or obstacles',
    severity: 'High',
    status: 'In Progress',
    latitude: 19.698,
    longitude: 73.565,
    trackKilometer: 'KM 118/22 (Kasara Ghat Section)',
    division: 'Central Division',
    nearestStation: 'Igatpuri (IGP)',
    distanceFromStationKm: 3.4,
    description:
      'Large banyan tree trunk uprooted on mountain ledge and fallen across overhead catenary wire and Down-Line track clearance gauge.',
    mediaUrl:
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    aiAnalysis: {
      defectType: 'Obstruction on Clearance Gauge',
      defectConfidence: 0.96,
      severityCalculated: 'High',
      obstacleVolumeM3: 4.5,
      riskScore: 88,
      boundingBox: { ymin: 0.15, xmin: 0.2, ymax: 0.85, xmax: 0.8 },
      recommendedSOP: [
        'Isolate 25kV OHE power supply on Kasara Section Block 4.',
        'Deploy heavy motorized chain cutters and hydraulic winch.',
        'Hold Mumbai-bound superfast expresses at Kasara outer signal.',
      ],
    },
    assignedTeamId: 'team-2',
    assignedTeamName: 'Ghat Section Monsoon Gang-09',
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    resolvedAt: null,
    escalatedToControlCenter: true,
  },
  {
    id: 'inc-4',
    trackingNumber: 'RSA-2026-0407',
    reporterId: 'u-2',
    reporterName: 'Priya Sharma (Station Master)',
    reporterRole: 'Station Master',
    category: 'Signal failures',
    severity: 'Medium',
    status: 'In Progress',
    latitude: 19.2437,
    longitude: 73.1355,
    trackKilometer: 'KM 53/06 (Signal Pole S-42)',
    division: 'Central Division',
    nearestStation: 'Kalyan (KYN)',
    distanceFromStationKm: 0.4,
    description:
      'Signal S-42 locked in Danger (Red) aspect despite track block clearance. Interlocking point detection voltage dip observed on control console.',
    mediaUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    aiAnalysis: {
      defectType: 'Relay / Signal Interlocking Disruption',
      defectConfidence: 0.89,
      severityCalculated: 'Medium',
      riskScore: 65,
      boundingBox: { ymin: 0.25, xmin: 0.35, ymax: 0.8, xmax: 0.65 },
      recommendedSOP: [
        'Issue Caution Order T/369(3b) for manual paper pilotage.',
        'Check relay room battery charger circuit & fuse status.',
      ],
    },
    assignedTeamId: 'team-3',
    assignedTeamName: 'Signal & Telecommunication Unit-2',
    createdAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    resolvedAt: null,
    escalatedToControlCenter: false,
  },
  {
    id: 'inc-5',
    trackingNumber: 'RSA-2026-0405',
    reporterId: 'u-1',
    reporterName: 'Ramesh Kumar (Track Inspector)',
    reporterRole: 'Track Inspector',
    category: 'Track misalignment',
    severity: 'Low',
    status: 'Resolved',
    latitude: 19.186,
    longitude: 72.9759,
    trackKilometer: 'KM 33/12 (Loop Line)',
    division: 'Central Division',
    nearestStation: 'Thane (TNA)',
    distanceFromStationKm: 0.9,
    description:
      'Minor lateral slewing observed on siding curve due to thermal rail expansion. Deviation measured at 6mm from standard alignment profile.',
    mediaUrl:
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    aiAnalysis: {
      defectType: 'Track Alignment Deviation',
      defectConfidence: 0.88,
      severityCalculated: 'Low',
      alignmentErrorMm: 6.1,
      riskScore: 35,
      boundingBox: { ymin: 0.3, xmin: 0.2, ymax: 0.75, xmax: 0.8 },
      recommendedSOP: [
        'Deploy track hydraulic jacks and tamping bars.',
        'Re-pack sleeper ballast and verify curve versine.',
      ],
    },
    assignedTeamId: 'team-1',
    assignedTeamName: 'Gang-04 Fast Response (P-Way)',
    createdAt: new Date(Date.now() - 480 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    escalatedToControlCenter: false,
  },
];

// Predictive Track Risk Zones
export const RISK_ZONES = [
  {
    id: 'rz-1',
    sectionName: 'Kasara Ghat Mountain Corridor',
    division: 'Central Division',
    fromKm: 'KM 112/00',
    toKm: 'KM 128/50',
    vulnerabilityIndex: 89, // 0-100
    riskLevel: 'Severe',
    factors: ['Steep 1:37 Gradient', 'Monsoon Rockfall Prone', 'Heavy Axle Load Banking Locos'],
    recentIncidentsCount: 14,
    recommendedSpeedLimitKmh: 45,
    centerCoordinates: [19.698, 73.565],
  },
  {
    id: 'rz-2',
    sectionName: 'Kurla - Sion Tidal Estuary Zone',
    division: 'Central Division',
    fromKm: 'KM 13/00',
    toKm: 'KM 17/20',
    vulnerabilityIndex: 82,
    riskLevel: 'High',
    factors: ['High Tide Siltation', 'Low Elevation Ballast Waterlogging', 'Dense EMU Traffic (3 min headway)'],
    recentIncidentsCount: 11,
    recommendedSpeedLimitKmh: 65,
    centerCoordinates: [19.0657, 72.8793],
  },
  {
    id: 'rz-3',
    sectionName: 'Kalyan Junction Diamond Crossover Complex',
    division: 'Central Division',
    fromKm: 'KM 52/10',
    toKm: 'KM 56/40',
    vulnerabilityIndex: 76,
    riskLevel: 'High',
    factors: ['Complex Interlocking Point Fatigue', 'Heavy Freight Turnouts', 'Rail Thermal Expansion'],
    recentIncidentsCount: 9,
    recommendedSpeedLimitKmh: 30,
    centerCoordinates: [19.2437, 73.1355],
  },
  {
    id: 'rz-4',
    sectionName: 'Diva - Dombivli High Speed Tangent',
    division: 'Central Division',
    fromKm: 'KM 38/00',
    toKm: 'KM 48/00',
    vulnerabilityIndex: 44,
    riskLevel: 'Moderate',
    factors: ['Suburban Trespass Spots', 'Pre-stressed Concrete Sleeper Wear'],
    recentIncidentsCount: 4,
    recommendedSpeedLimitKmh: 105,
    centerCoordinates: [19.2064, 73.0489],
  },
];

// In-Memory DB State
class RailwayDatabase {
  constructor() {
    this.users = [...INITIAL_USERS];
    this.teams = [...INITIAL_TEAMS];
    this.incidents = [...INITIAL_INCIDENTS];
    this.otpStore = new Map(); // employeeId -> { otp, expiresAt }
    this.auditLogs = [];
    this.smsAlertLogs = [];

    this.ensureDataDirectory();
    this.initAuditGenesis();
    this.loadState();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  initAuditGenesis() {
    const genesis = {
      id: 'audit-0',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      employeeId: 'SYSTEM-DAEMON',
      employeeName: 'RailSafe Secure Cryptographic Kernel',
      action: 'SYSTEM_GENESIS_INITIALIZED',
      details: 'Immutable tamper-evident security audit log initialized with SHA-256 block chain.',
      ipAddress: '127.0.0.1 (Localhost Secure Gateway)',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      recordHash: '',
    };
    genesis.recordHash = computeHash(genesis, genesis.previousHash);
    this.auditLogs = [genesis];
  }

  loadState() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.incidents) this.incidents = parsed.incidents;
        if (parsed.teams) this.teams = parsed.teams;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
        if (parsed.smsAlertLogs) this.smsAlertLogs = parsed.smsAlertLogs;
      } else {
        this.saveState();
      }
    } catch (err) {
      console.error('Failed to load state from disk, using initial seeds:', err.message);
    }
  }

  saveState() {
    try {
      const dump = {
        incidents: this.incidents,
        teams: this.teams,
        auditLogs: this.auditLogs,
        smsAlertLogs: this.smsAlertLogs,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(dump, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save state to disk:', err.message);
    }
  }

  // Add an immutable audit log entry
  addAuditLog(employeeId, employeeName, action, details, ipAddress = '127.0.0.1') {
    const prev = this.auditLogs[this.auditLogs.length - 1];
    const prevHash = prev ? prev.recordHash : '0000000000000000000000000000000000000000000000000000000000000000';
    const record = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      employeeId,
      employeeName,
      action,
      details,
      ipAddress,
      previousHash: prevHash,
      recordHash: '',
    };
    record.recordHash = computeHash(record, prevHash);
    this.auditLogs.push(record);
    this.saveState();
    return record;
  }

  // Verify the entire audit chain
  verifyAuditIntegrity() {
    let valid = true;
    for (let i = 1; i < this.auditLogs.length; i++) {
      const curr = this.auditLogs[i];
      const prev = this.auditLogs[i - 1];
      if (curr.previousHash !== prev.recordHash) {
        valid = false;
        break;
      }
      const recomputed = computeHash(
        {
          id: curr.id,
          timestamp: curr.timestamp,
          employeeId: curr.employeeId,
          employeeName: curr.employeeName,
          action: curr.action,
          details: curr.details,
          ipAddress: curr.ipAddress,
          previousHash: curr.previousHash,
          recordHash: '',
        },
        curr.previousHash
      );
      if (recomputed !== curr.recordHash) {
        valid = false;
        break;
      }
    }
    return {
      isValid: valid,
      totalEntries: this.auditLogs.length,
      lastHash: this.auditLogs[this.auditLogs.length - 1]?.recordHash,
    };
  }

  // Record outbound simulated SMS & Push notification
  recordAlertDispatch(recipients, channel, message, severity, incidentId) {
    const alertEntry = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      incidentId,
      recipients,
      channel, // 'SMS_GATEWAY' | 'PUSH_APNS_FCM' | 'RADIO_TRAIN_CONTROL'
      message,
      severity,
      status: 'DELIVERED',
      networkLatencyMs: Math.floor(Math.random() * 120) + 45,
    };
    this.smsAlertLogs.unshift(alertEntry);
    if (this.smsAlertLogs.length > 100) this.smsAlertLogs.pop();
    this.saveState();
    return alertEntry;
  }
}

export const db = new RailwayDatabase();
