import express from 'express';
import * as authCtrl from '../controllers/authController.js';
import * as incidentCtrl from '../controllers/incidentController.js';
import * as aiCtrl from '../controllers/aiController.js';
import * as maintCtrl from '../controllers/maintenanceController.js';
import * as analyticsCtrl from '../controllers/analyticsController.js';
import * as auditCtrl from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { RAILWAY_TRACKS } from '../database/db.js';

const router = express.Router();

// Auth routes
router.post('/auth/request-otp', authCtrl.requestOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);
router.get('/auth/demo-users', authCtrl.getDemoUsers);
router.get('/auth/me', authenticateToken, authCtrl.getMe);

// Incident routes
router.get('/incidents', incidentCtrl.getIncidents);
router.get('/incidents/nearby', incidentCtrl.getNearbyPersonnel);
router.get('/incidents/:id', incidentCtrl.getIncidentById);
router.post('/incidents', authenticateToken, incidentCtrl.createIncident);
router.patch('/incidents/:id', authenticateToken, incidentCtrl.updateIncidentStatus);

// AI Defect & Risk routes
router.post('/ai/scan-defect', aiCtrl.scanDefect);
router.get('/ai/risk-zones', aiCtrl.getRiskZones);
router.get('/ai/maintenance-report', aiCtrl.generateMaintenanceReport);

// Maintenance Workflow routes
router.get('/maintenance/teams', maintCtrl.getTeams);
router.post('/maintenance/assign', authenticateToken, maintCtrl.assignTeam);
router.post('/maintenance/complete', authenticateToken, maintCtrl.completeMaintenance);

// Analytics & Reports
router.get('/analytics/overview', analyticsCtrl.getAnalyticsOverview);

// Cryptographic Audit & Outbound Alert Logs
router.get('/audit-logs', auditCtrl.getAuditLogs);
router.get('/audit-logs/verify-integrity', auditCtrl.verifyIntegrity);
router.get('/alerts/history', auditCtrl.getAlertLogs);

// Railway tracks geospatial coordinates
router.get('/railway-tracks', (req, res) => {
  res.json({
    success: true,
    totalLines: RAILWAY_TRACKS.length,
    data: RAILWAY_TRACKS,
  });
});

export default router;
