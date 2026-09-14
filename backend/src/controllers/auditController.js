import { db } from '../database/db.js';

// Get audit logs
export function getAuditLogs(req, res) {
  const { action, employeeId, search } = req.query;

  let logs = [...db.auditLogs];

  if (action && action !== 'ALL') {
    logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
  }

  if (employeeId) {
    logs = logs.filter((l) => l.employeeId.toLowerCase() === employeeId.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.details.toLowerCase().includes(q) ||
        l.employeeName.toLowerCase().includes(q) ||
        l.employeeId.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
    );
  }

  // Reverse so newest first
  logs.reverse();

  return res.json({
    success: true,
    total: logs.length,
    data: logs,
  });
}

// Verify cryptographic integrity of audit blockchain
export function verifyIntegrity(req, res) {
  const check = db.verifyAuditIntegrity();
  return res.json({
    success: true,
    data: {
      integrityValid: check.isValid,
      algorithm: 'SHA-256 Block Chaining',
      totalRecordsVerified: check.totalEntries,
      latestBlockHash: check.lastHash,
      verificationTimestamp: new Date().toISOString(),
      tamperEvidenceStatus: check.isValid ? 'SECURE_AND_VERIFIED' : 'TAMPER_DETECTED',
    },
  });
}

// Get simulated SMS and push notification dispatch history
export function getAlertLogs(req, res) {
  return res.json({
    success: true,
    total: db.smsAlertLogs.length,
    data: db.smsAlertLogs,
  });
}
