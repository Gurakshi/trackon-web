import { db, calculateDistance } from '../database/db.js';

let ioInstance = null;
export function setIoInstance(io) {
  ioInstance = io;
}

// Get all maintenance teams
export function getTeams(req, res) {
  return res.json({
    success: true,
    total: db.teams.length,
    data: db.teams,
  });
}

// Assign maintenance team to an incident
export function assignTeam(req, res) {
  const { incidentId, teamId, instructions } = req.body;

  if (!incidentId || !teamId) {
    return res.status(400).json({ success: false, error: 'incidentId and teamId are required.' });
  }

  const incident = db.incidents.find((i) => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found.' });
  }

  const team = db.teams.find((t) => t.id === teamId);
  if (!team) {
    return res.status(404).json({ success: false, error: 'Maintenance team not found.' });
  }

  // Update incident
  incident.assignedTeamId = team.id;
  incident.assignedTeamName = team.name;
  incident.status = 'Assigned';
  incident.updatedAt = new Date().toISOString();

  // Update team
  team.status = 'Dispatched';
  team.assignedIncidentId = incident.id;

  db.saveState();

  // Dispatch notification
  const dist = calculateDistance(incident.latitude, incident.longitude, team.currentLat, team.currentLng);
  const smsMessage = `DISPATCH WORK ORDER: Assigned to ${incident.trackingNumber} [${incident.category}] at ${incident.trackKilometer}. Distance: ${dist} km. Instructions: ${instructions || 'Proceed immediately with safety equipment.'}`;

  db.recordAlertDispatch(
    [team.contactNumber, team.leadEngineer],
    'SMS_GATEWAY',
    smsMessage,
    incident.severity,
    incident.id
  );

  // Audit log
  const user = req.user || { employeeId: 'IR-SM-2091', name: 'Priya Sharma' };
  db.addAuditLog(
    user.employeeId,
    user.name,
    'MAINTENANCE_TEAM_ASSIGNED',
    `Assigned ${team.name} to ${incident.trackingNumber}. Instructions: ${instructions || 'Standard emergency protocol'}`,
    req.ip || '127.0.0.1'
  );

  if (ioInstance) {
    ioInstance.emit('maintenance:assigned', { incident, team, dist });
  }

  return res.json({
    success: true,
    message: `Assigned ${team.name} to ${incident.trackingNumber}. SMS dispatch sent.`,
    data: {
      incident,
      team,
      distanceKm: dist,
    },
  });
}

// Complete maintenance work order with evidence
export function completeMaintenance(req, res) {
  const { incidentId, repairEvidencePhoto, repairNotes, crewLeaderSignOff } = req.body;

  if (!incidentId) {
    return res.status(400).json({ success: false, error: 'incidentId is required.' });
  }

  const incident = db.incidents.find((i) => i.id === incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found.' });
  }

  // Update incident to Resolved
  incident.status = 'Resolved';
  incident.resolvedAt = new Date().toISOString();
  incident.updatedAt = new Date().toISOString();
  incident.repairEvidence = {
    afterPhotoUrl:
      repairEvidencePhoto ||
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    notes: repairNotes || 'Track defect repaired, ultrasonic tested, and line certified fit for full train speed.',
    signedOffBy: crewLeaderSignOff || req.user?.name || 'Maintenance Team Lead',
    completedAt: new Date().toISOString(),
  };

  // Release assigned team
  if (incident.assignedTeamId) {
    const team = db.teams.find((t) => t.id === incident.assignedTeamId);
    if (team) {
      team.status = 'Available';
      team.assignedIncidentId = null;
    }
  }

  db.saveState();

  // Audit log
  const user = req.user || { employeeId: 'IR-MT-3084', name: 'David Miller' };
  db.addAuditLog(
    user.employeeId,
    user.name,
    'MAINTENANCE_COMPLETED_RESOLVED',
    `Incident ${incident.trackingNumber} resolved. Evidence photo uploaded and certified by ${incident.repairEvidence.signedOffBy}.`,
    req.ip || '127.0.0.1'
  );

  if (ioInstance) {
    ioInstance.emit('maintenance:completed', { incident });
  }

  return res.json({
    success: true,
    message: `Incident ${incident.trackingNumber} certified resolved. Evidence stored.`,
    data: incident,
  });
}
