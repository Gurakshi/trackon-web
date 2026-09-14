import React, { useState, useEffect } from 'react';
import {
  Radio,
  Bell,
  Volume2,
  ShieldAlert,
  Smartphone,
  CheckCircle,
  Clock,
  Send,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { auditApi, incidentApi } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function RealTimeAlertsFeed({ onSelectIncident }) {
  const { emergencyAlert, playWarningSiren, clearEmergencyAlert } = useSocket();
  const [incidents, setIncidents] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL_ALERTS'); // ALL_ALERTS | SMS_PUSH_GATEWAY

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, smsRes] = await Promise.all([
        incidentApi.getAll(),
        auditApi.getAlertLogs(),
      ]);
      if (incRes.success) setIncidents(incRes.data);
      if (smsRes.success) setSmsLogs(smsRes.data);
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Real-Time Alert Dispatch & Notification Center
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant emergency broadcast stream, SMS gateway dispatch logs, and control center escalations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => playWarningSiren(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/60 border border-red-800 hover:bg-red-900/60 text-red-300 text-xs font-bold transition-colors"
          >
            <Volume2 className="w-4 h-4 text-red-400" />
            <span>Test Audio Siren</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Persistent Emergency Banner if Active */}
      {emergencyAlert && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/60 to-slate-900 border-2 border-red-600 shadow-2xl flex items-start justify-between gap-4 animate-in slide-in-from-top-3">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-red-600 rounded-xl text-white mt-0.5 animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded">
                  PRIORITY EMERGENCY BROADCAST
                </span>
                <span className="text-xs font-mono text-red-300">{emergencyAlert.timestamp}</span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">{emergencyAlert.title}</h3>
              <p className="text-xs text-red-200 mt-1">{emergencyAlert.message}</p>
            </div>
          </div>
          <button
            onClick={clearEmergencyAlert}
            className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded-lg text-xs font-bold shrink-0"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-6 pb-2">
        <button
          onClick={() => setActiveTab('ALL_ALERTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL_ALERTS'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Active Hazard Alerts ({incidents.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('SMS_PUSH_GATEWAY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'SMS_PUSH_GATEWAY'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>SMS & Push Delivery Gateway Logs ({smsLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: All Incident Alerts */}
      {activeTab === 'ALL_ALERTS' && (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const isCritical = incident.severity === 'Critical';
            const isHigh = incident.severity === 'High';
            const isResolved = incident.status === 'Resolved';

            return (
              <div
                key={incident.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCritical && !isResolved
                    ? 'bg-red-950/30 border-red-800/80 hover:border-red-600'
                    : isHigh && !isResolved
                    ? 'bg-orange-950/20 border-orange-800/60 hover:border-orange-600'
                    : isResolved
                    ? 'bg-emerald-950/20 border-emerald-800/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      isResolved
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : isCritical
                        ? 'bg-red-600 text-white shadow-lg shadow-red-950 animate-pulse'
                        : isHigh
                        ? 'bg-orange-600 text-white'
                        : 'bg-yellow-600 text-slate-950'
                    }`}
                  >
                    {isResolved ? '✓' : isCritical ? '⚡' : '!'}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-blue-400">
                        {incident.trackingNumber}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isResolved
                            ? 'bg-emerald-900/80 text-emerald-300'
                            : isCritical
                            ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                            : isHigh
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                        }`}
                      >
                        {incident.severity}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {incident.category}</span>
                      {incident.escalatedToControlCenter && (
                        <span className="text-[10px] font-bold bg-purple-950 border border-purple-800 text-purple-300 px-1.5 py-0.2 rounded">
                          Escalated to Regional Control
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 mt-1 font-medium">{incident.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2 font-mono">
                      <span>Chainage: {incident.trackKilometer}</span>
                      <span>Station: {incident.nearestStation}</span>
                      <span>Status: <strong className="text-slate-200">{incident.status}</strong></span>
                      <span>Time: {new Date(incident.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {onSelectIncident && (
                    <button
                      onClick={() => onSelectIncident(incident)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                    >
                      <span>View Map</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Outbound SMS & Push Logs */}
      {activeTab === 'SMS_PUSH_GATEWAY' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
            <span>Live Telephony & Radio Alert Dispatch Gateway</span>
            <span className="text-[10px] font-mono text-emerald-400">STATUS: ACTIVE & DELIVERING</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {smsLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-blue-400 shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-slate-300">{log.channel}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                        {log.status} ({log.networkLatencyMs}ms)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/80 mt-1">
                      {log.message}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Recipients: {Array.isArray(log.recipients) ? log.recipients.join(', ') : log.recipients}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
