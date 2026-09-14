import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle,
  Clock,
  ArrowRight,
  UserCheck,
  Send,
  AlertTriangle,
  Upload,
  Camera,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { incidentApi, maintenanceApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function MaintenanceWorkflow() {
  const { user, role } = useAuth();
  const { socket } = useSocket();

  const [incidents, setIncidents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Modal
  const [assignModalIncident, setAssignModalIncident] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Resolve Modal
  const [resolveModalIncident, setResolveModalIncident] = useState(null);
  const [repairNotes, setRepairNotes] = useState('Track flaw ground flush, fishplates clamped, and Ultrasonic Flaw Detection (USFD) tested clear for full operational speed.');
  const [afterPhoto, setAfterPhoto] = useState('https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80');
  const [resolving, setResolving] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, teamRes] = await Promise.all([
        incidentApi.getAll(),
        maintenanceApi.getTeams(),
      ]);
      if (incRes.success) setIncidents(incRes.data);
      if (teamRes.success) setTeams(teamRes.data);
    } catch (err) {
      console.error('Error fetching maintenance workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time updates via Socket
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => loadData();
    socket.on('incident:created', handleUpdate);
    socket.on('incident:updated', handleUpdate);
    socket.on('maintenance:assigned', handleUpdate);
    socket.on('maintenance:completed', handleUpdate);

    return () => {
      socket.off('incident:created', handleUpdate);
      socket.off('incident:updated', handleUpdate);
      socket.off('maintenance:assigned', handleUpdate);
      socket.off('maintenance:completed', handleUpdate);
    };
  }, [socket]);

  // Handle Team Dispatch
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalIncident || !selectedTeamId) return;
    setAssigning(true);
    try {
      const res = await maintenanceApi.assignTeam(
        assignModalIncident.id,
        selectedTeamId,
        assignNotes || 'Standard P-Way repair gang dispatch.'
      );
      if (res.success) {
        setAssignModalIncident(null);
        setSelectedTeamId('');
        loadData();
      }
    } catch (err) {
      console.error('Failed to assign team:', err);
    } finally {
      setAssigning(false);
    }
  };

  // Handle Quick Advance to "In Progress"
  const handleStartWork = async (incidentId) => {
    try {
      await incidentApi.updateStatus(incidentId, 'In Progress', 'Crew arrived at track chainage. Work underway.');
      loadData();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Handle Complete Repair with Evidence
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalIncident) return;
    setResolving(true);
    try {
      const res = await maintenanceApi.completeTask(
        resolveModalIncident.id,
        afterPhoto,
        repairNotes,
        user?.name || 'Maintenance Lead'
      );
      if (res.success) {
        setResolveModalIncident(null);
        loadData();
      }
    } catch (err) {
      console.error('Failed to resolve incident:', err);
    } finally {
      setResolving(false);
    }
  };

  // Pipeline Columns
  const COLUMNS = [
    {
      id: 'Reported',
      title: 'Reported (Pending Triage)',
      count: incidents.filter((i) => i.status === 'Reported').length,
      color: 'border-red-500/50 bg-red-950/20 text-red-300',
    },
    {
      id: 'Assigned',
      title: 'Assigned (Gang En Route)',
      count: incidents.filter((i) => i.status === 'Assigned').length,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
    },
    {
      id: 'In Progress',
      title: 'In Progress (On Track)',
      count: incidents.filter((i) => i.status === 'In Progress').length,
      color: 'border-blue-500/50 bg-blue-950/20 text-blue-300',
    },
    {
      id: 'Resolved',
      title: 'Resolved (Evidence Certified)',
      count: incidents.filter((i) => i.status === 'Resolved').length,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Permanent-Way Maintenance Workflow Pipeline
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch response teams, monitor live repair progression, and review before/after photographic evidence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-300">
            Available Gangs: <strong>{teams.filter((t) => t.status === 'Available').length} / {teams.length}</strong>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Available Teams Bar */}
      <div className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Maintenance Gang Field Statuses
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {teams.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200 truncate">{t.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      t.status === 'Available'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{t.specialization}</div>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                Lead: {t.leadEngineer} ({t.crewSize} crew)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Column Pipeline Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnIncidents = incidents.filter((i) => i.status === col.id);

          return (
            <div
              key={col.id}
              className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="font-bold text-xs text-slate-200 tracking-wide">{col.title}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${col.color}`}
                >
                  {columnIncidents.length}
                </span>
              </div>

              {/* Column Incident Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {columnIncidents.map((incident) => {
                  const isCritical = incident.severity === 'Critical';
                  const isHigh = incident.severity === 'High';

                  return (
                    <div
                      key={incident.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Tracking Number & Severity */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {incident.trackingNumber}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                              isCritical
                                ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                                : isHigh
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                            }`}
                          >
                            {incident.severity}
                          </span>
                        </div>

                        {/* Title & Location */}
                        <div className="font-bold text-xs text-slate-100 mb-1 leading-snug">
                          {incident.category}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {incident.trackKilometer}
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          Near {incident.nearestStation}
                        </div>

                        {/* Assigned Team badge if assigned */}
                        {incident.assignedTeamName && (
                          <div className="mb-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-amber-300 font-mono">
                            🔧 {incident.assignedTeamName}
                          </div>
                        )}

                        {/* Repair Evidence Preview if Resolved */}
                        {incident.repairEvidence && (
                          <div className="mb-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[10px] text-emerald-200">
                            <div className="font-bold text-emerald-300">✓ Repair Certified</div>
                            <div className="text-slate-400 mt-0.5 truncate">
                              Signed: {incident.repairEvidence.signedOffBy}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons based on status */}
                      <div className="pt-2 border-t border-slate-800/80 mt-2">
                        {incident.status === 'Reported' && (
                          <button
                            onClick={() => {
                              setAssignModalIncident(incident);
                              if (teams.length > 0) setSelectedTeamId(teams[0].id);
                            }}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Assign Maintenance Team</span>
                          </button>
                        )}

                        {incident.status === 'Assigned' && (
                          <button
                            onClick={() => handleStartWork(incident.id)}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Mark In Progress</span>
                          </button>
                        )}

                        {incident.status === 'In Progress' && (
                          <button
                            onClick={() => setResolveModalIncident(incident)}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Complete & Upload Evidence</span>
                          </button>
                        )}

                        {incident.status === 'Resolved' && (
                          <div className="text-center text-[11px] text-emerald-400 font-semibold py-1">
                            Line Certified Clear
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {columnIncidents.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No incidents in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Assign Maintenance Team */}
      {assignModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Assign Team to {assignModalIncident.trackingNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Location: {assignModalIncident.trackKilometer}, {assignModalIncident.nearestStation}
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select P-Way Maintenance Unit
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status}) &bull; Base: {t.baseStation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dispatch Directive & Specific Instructions
                </label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Carry emergency fishplates, ultrasonic gauge, and 25kV safety grounding gear."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalIncident(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{assigning ? 'Transmitting Dispatch...' : 'Dispatch Gang via SMS'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Complete & Upload Repair Evidence */}
      {resolveModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Certify Repair & Upload Evidence: {resolveModalIncident.trackingNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Permanent-Way sign-off requires photographic evidence before clearing track block.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  After-Repair Evidence Image URL
                </label>
                <input
                  type="text"
                  value={afterPhoto}
                  onChange={(e) => setAfterPhoto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
                {afterPhoto && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 h-28">
                    <img src={afterPhoto} alt="Repair Evidence" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Engineering Repair Notes & Quality Verification
                </label>
                <textarea
                  rows={3}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
                Supervisor Sign-Off: <strong>{user?.name || 'Authorized Lead Engineer'}</strong> ({user?.role || 'Maintenance Lead'}) &bull; ID: {user?.employeeId}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalIncident(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{resolving ? 'Submitting Certification...' : 'Certify & Close Incident'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
