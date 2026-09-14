import { db, calculateDistance } from '../database/db.js';

let ioInstance = null;
export function setIoInstance(io) {
  ioInstance = io;
}

// Get all incidents with rich filters
export function getIncidents(req, res) {
  const { severity, status, division, category, search } = req.query;

  let filtered = [...db.incidents];

  if (severity && severity !== 'ALL') {
    filtered = filtered.filter((i) => i.severity.toLowerCase() === severity.toLowerCase());
  }

  if (status && status !== 'ALL') {
    filtered = filtered.filter((i) => i.status.toLowerCase() === status.toLowerCase());
  }

  if (division && division !== 'ALL') {
    filtered = filtered.filter((i) => i.division.toLowerCase() === division.toLowerCase());
  }

  if (category && category !== 'ALL') {
    filtered = filtered.filter((i) => i.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.trackingNumber.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.nearestStation.toLowerCase().includes(q) ||
        i.trackKilometer.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }

  // Sort: Critical first, then by date descending
  const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  filtered.sort((a, b) => {
    if (a.status === 'Resolved' && b.status !== 'Resolved') return 1;
    if (b.status === 'Resolved' && a.status !== 'Resolved') return -1;
    const diff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.json({
    success: true,
    total: filtered.length,
    data: filtered,
  });
}

// Get incident by ID
export function getIncidentById(req, res) {
  const incident = db.incidents.find((i) => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }

  // Find nearest teams with distances
  const teamsWithDist = db.teams.map((t) => ({
    ...t,
    distanceKm: calculateDistance(incident.latitude, incident.longitude, t.currentLat, t.currentLng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  return res.json({
    success: true,
    data: {
      ...incident,
      nearbyMaintenanceTeams: teamsWithDist,
    },
  });
}

// Create new incident
export function createIncident(req, res) {
  const {
    category,
    severity = 'Medium',
    latitude,
    longitude,
    trackKilometer,
    division = 'Central Division',
    nearestStation,
    description,
    mediaUrl,
    aiAnalysis,
  } = req.body;

  if (!category || !description) {
    return res.status(400).json({ success: false, error: 'Category and description are required.' });
  }

  // Generate tracking number
  const serial = Math.floor(1000 + Math.random() * 9000);
  const trackingNumber = `RSA-2026-${serial}`;
  const id = `inc-${Date.now()}`;

  const lat = parseFloat(latitude) || 19.2437;
  const lng = parseFloat(longitude) || 73.1355;

  // Calculate nearest team
  let nearestTeam = null;
  let minDistance = Infinity;
  db.teams.forEach((t) => {
    const dist = calculateDistance(lat, lng, t.currentLat, t.currentLng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestTeam = t;
    }
  });

  const reporter = req.user || {
    id: 'u-1',
    name: 'Field Track Inspector',
    employeeId: 'IR-TI-1042',
    role: 'Track Inspector',
  };

  const newIncident = {
    id,
    trackingNumber,
    reporterId: reporter.id,
    reporterName: `${reporter.name} (${reporter.role})`,
    reporterRole: reporter.role,
    category,
    severity,
    status: 'Reported',
    latitude: lat,
    longitude: lng,
    trackKilometer: trackKilometer || 'KM 48/12 - 48/16',
    division,
    nearestStation: nearestStation || 'Kalyan Junction (KYN)',
    distanceFromStationKm: 1.4,
    description,
    mediaUrl:
      mediaUrl ||
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    aiAnalysis: aiAnalysis || null,
    assignedTeamId: null,
    assignedTeamName: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    escalatedToControlCenter: severity === 'Critical' || severity === 'High',
  };

  db.incidents.unshift(newIncident);
  db.saveState();

  // Audit Log
  db.addAuditLog(
    reporter.employeeId,
    reporter.name,
    'INCIDENT_REPORTED',
    `Reported ${severity} incident ${trackingNumber} [${category}] at ${newIncident.trackKilometer}`,
    req.ip || '127.0.0.1'
  );

  // Send Push & SMS notifications
  const alertRecipients = [`Loco-Pilots on Section`, `Station Master (${newIncident.nearestStation})`];
  if (nearestTeam) {
    alertRecipients.push(`Lead: ${nearestTeam.leadEngineer} (${minDistance} km away)`);
  }

  const alertLog = db.recordAlertDispatch(
    alertRecipients,
    severity === 'Critical' ? 'RADIO_TRAIN_CONTROL' : 'PUSH_APNS_FCM',
    `EMERGENCY ALERT [${severity}]: ${category} reported at ${newIncident.trackKilometer}. Track section affected. Nearest team: ${nearestTeam?.name || 'Central Dispatch'}.`,
    severity,
    id
  );

  // Broadcast real-time via Socket.IO
  if (ioInstance) {
    ioInstance.emit('incident:created', {
      incident: newIncident,
      alertLog,
      isEmergency: severity === 'Critical' || severity === 'High',
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Incident reported and broadcasted to emergency network.',
    data: newIncident,
    nearestTeam: nearestTeam ? { ...nearestTeam, distanceKm: minDistance } : null,
  });
}

// Update incident status
export function updateIncidentStatus(req, res) {
  const { id } = req.params;
  const { status, notes, assignedTeamId } = req.body;

  const incident = db.incidents.find((i) => i.id === id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }

  const oldStatus = incident.status;
  if (status) incident.status = status;
  incident.updatedAt = new Date().toISOString();

  if (status === 'Resolved') {
    incident.resolvedAt = new Date().toISOString();
  }

  if (assignedTeamId) {
    const team = db.teams.find((t) => t.id === assignedTeamId);
    if (team) {
      incident.assignedTeamId = team.id;
      incident.assignedTeamName = team.name;
      team.status = status === 'Resolved' ? 'Available' : 'Dispatched';
      team.assignedIncidentId = status === 'Resolved' ? null : incident.id;
    }
  }

  db.saveState();

  // Audit log
  const user = req.user || { employeeId: 'IR-SYS-1', name: 'Railway Controller' };
  db.addAuditLog(
    user.employeeId,
    user.name,
    'INCIDENT_STATUS_UPDATED',
    `Incident ${incident.trackingNumber} status transitioned from ${oldStatus} to ${incident.status}. Note: ${notes || 'None'}`,
    req.ip || '127.0.0.1'
  );

  if (ioInstance) {
    ioInstance.emit('incident:updated', { incident });
  }

  return res.json({
    success: true,
    message: `Status updated to ${incident.status}`,
    data: incident,
  });
}

// Nearby teams and personnel radius query
export function getNearbyPersonnel(req, res) {
  const { lat, lng, radiusKm = 25 } = req.query;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ success: false, error: 'Valid lat and lng query params required.' });
  }

  const radius = parseFloat(radiusKm);

  const nearbyTeams = db.teams
    .map((team) => ({
      ...team,
      distanceKm: calculateDistance(latitude, longitude, team.currentLat, team.currentLng),
    }))
    .filter((team) => team.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return res.json({
    success: true,
    center: { lat: latitude, lng: longitude },
    radiusKm: radius,
    totalFound: nearbyTeams.length,
    data: nearbyTeams,
  });
}
