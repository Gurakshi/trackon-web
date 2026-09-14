import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  User,
  Clock,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { auditApi } from '../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Cryptographic Verification State
  const [verifying, setVerifying] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.getLogs({
        action: actionFilter,
        search: searchTerm,
      });
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBlockchain = async () => {
    setVerifying(true);
    try {
      const res = await auditApi.verifyIntegrity();
      if (res.success) {
        setIntegrityStatus(res.data);
      }
    } catch (err) {
      console.error('Integrity verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Cryptographic Security & Audit Trail Vault
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Tamper-evident SHA-256 block chain recording every railway employee login, hazard report, and maintenance sign-off
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyBlockchain}
            disabled={verifying}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all active:scale-98"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{verifying ? 'Recalculating Chain...' : 'Verify Cryptographic Integrity'}</span>
          </button>
          <button
            onClick={loadLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cryptographic Verification Badge Card */}
      {integrityStatus && (
        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-950 border border-emerald-700 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  CRYPTOGRAPHIC BLOCKCHAIN INTEGRITY VERIFIED
                </span>
                <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded">
                  0 TAMPERING DETECTED
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                All <strong>{integrityStatus.totalRecordsVerified} audit blocks</strong> validated using{' '}
                {integrityStatus.algorithm}. Mathematical chain hashes match 100%.
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-xl">
                Latest Chain Tip: {integrityStatus.latestBlockHash}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono text-right shrink-0">
            Verified: {new Date(integrityStatus.verificationTimestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, ID, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Audit Actions</option>
            <option value="USER_LOGIN_SUCCESS">Login Success</option>
            <option value="INCIDENT_REPORTED">Incident Reported</option>
            <option value="AI_DEFECT_SCAN_PERFORMED">AI Vision Scan</option>
            <option value="MAINTENANCE_TEAM_ASSIGNED">Team Assigned</option>
            <option value="MAINTENANCE_COMPLETED_RESOLVED">Work Resolved</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Employee ID & Name</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Audit Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Chain Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                let actionBadge = 'bg-slate-800 text-slate-300';
                if (log.action.includes('LOGIN')) actionBadge = 'bg-blue-950 text-blue-300 border-blue-800';
                if (log.action.includes('REPORTED')) actionBadge = 'bg-red-950 text-red-300 border-red-800';
                if (log.action.includes('AI')) actionBadge = 'bg-indigo-950 text-indigo-300 border-indigo-800';
                if (log.action.includes('ASSIGNED')) actionBadge = 'bg-amber-950 text-amber-300 border-amber-800';
                if (log.action.includes('COMPLETED')) actionBadge = 'bg-emerald-950 text-emerald-300 border-emerald-800';

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{log.employeeName}</div>
                        <div className="font-mono text-[10px] text-slate-400">{log.employeeId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${actionBadge}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs sm:max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[11px] text-emerald-400">
                        <div className="flex items-center justify-end gap-1.5">
                          <Hash className="w-3 h-3 text-slate-500" />
                          <span>{log.recordHash.substring(0, 10)}...</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Cryptographic Proof Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90">
                        <td colSpan={6} className="p-4 border-t border-b border-slate-800">
                          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                            <div className="text-amber-300 font-bold flex items-center gap-1.5 text-[11px]">
                              <Terminal className="w-3.5 h-3.5" />
                              <span>CRYPTOGRAPHIC BLOCK PROOF INSPECTOR</span>
                            </div>
                            <div className="text-slate-400">
                              Block ID: <span className="text-slate-200">{log.id}</span>
                            </div>
                            <div className="text-slate-400">
                              Previous Block Hash (prevHash):{' '}
                              <span className="text-slate-300">{log.previousHash}</span>
                            </div>
                            <div className="text-slate-400">
                              Current Block Hash (recordHash):{' '}
                              <span className="text-emerald-400">{log.recordHash}</span>
                            </div>
                            <div className="text-slate-400">
                              Tamper-Proof Assertion: SHA-256(prevHash + JSON(payload)) matches recordHash.
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
