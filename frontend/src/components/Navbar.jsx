import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  Users,
  LogOut,
  Bell,
  AlertOctagon,
  ChevronDown,
  Train,
  CheckCircle2,
} from 'lucide-react';

export default function Navbar({ onOpenReportModal }) {
  const { user, role, quickLoginAs, logout } = useAuth();
  const { connected, soundEnabled, setSoundEnabled, broadcastEmergencyHalt } = useSocket();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [haltSection, setHaltSection] = useState('KM 51 - KM 55 (Kalyan - Kasara Up Fast)');
  const [haltReason, setHaltReason] = useState('Obstruction on track clearance gauge detected');

  const DEMO_ACCOUNTS = [
    {
      id: 'IR-TI-1042',
      name: 'Ramesh Kumar',
      role: 'Track Inspector',
      desc: 'Field inspection & GPS defect tagging',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'IR-SM-2091',
      name: 'Priya Sharma',
      role: 'Station Master',
      desc: 'Section operations & emergency halt dispatch',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      id: 'IR-MT-3084',
      name: 'David Miller',
      role: 'Maintenance Team',
      desc: 'Repair gang dispatch & evidence sign-off',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'IR-AD-4001',
      name: 'Dr. Rajesh Verma',
      role: 'Railway Administrator',
      desc: 'Executive safety analytics & audit blockchain',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    },
  ];

  const handleEmergencySubmit = (e) => {
    e.preventDefault();
    broadcastEmergencyHalt(haltSection, haltReason);
    setEmergencyModalOpen(false);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Network Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-900/40 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Train className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-slate-100 bg-clip-text text-transparent">
                  TRACKON
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-950 border border-blue-800 text-blue-300 rounded">
                  Official IR Network
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Authorized Railway Safety & Real-Time Incident Reporting System
              </p>
            </div>
          </div>

          {/* Center / Operational Status Indicators */}
          <div className="hidden md:flex items-center gap-4">
            {/* Live Socket Connection Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="relative flex h-2 w-2">
                {connected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    connected ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                ></span>
              </span>
              <span className="text-slate-300 font-medium">
                {connected ? 'LIVE DISPATCH CONNECTED' : 'RECONNECTING...'}
              </span>
            </div>

            {/* Audio Siren Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Emergency Siren Sound ON' : 'Emergency Siren Sound MUTED'}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
                soundEnabled
                  ? 'bg-blue-950/60 border-blue-700 text-blue-300 hover:bg-blue-900/50'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Siren Audio ON' : 'Muted'}</span>
            </button>

            {/* Emergency Broadcast Trigger for Station Master / Admin */}
            {(role === 'Station Master' || role === 'Railway Administrator') && (
              <button
                onClick={() => setEmergencyModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-900/40 border border-red-500 transition-transform active:scale-95"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Emergency Train Halt</span>
              </button>
            )}
          </div>

          {/* Right: Employee Profile & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Report Button (Always accessible) */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950 border border-blue-400/30 transition-all active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Report Hazard</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user?.name || 'Employee'}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-blue-400/50"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user?.name || 'Railway Staff'}
                  </div>
                  <div className="text-[10px] text-blue-400 font-mono leading-tight">
                    {user?.role || 'Verified Staff'} &bull; {user?.employeeId}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="text-xs font-bold text-slate-300">Quick Role Switcher</div>
                    <p className="text-[11px] text-slate-500">
                      Switch verified employee personas to test specific operational flows
                    </p>
                  </div>

                  <div className="space-y-1">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isActive = user?.employeeId === acc.id;
                      return (
                        <button
                          key={acc.id}
                          onClick={async () => {
                            await quickLoginAs(acc.id);
                            setRoleMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-3 ${
                            isActive
                              ? 'bg-blue-950/80 border border-blue-600/50 text-blue-100'
                              : 'hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isActive ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Users className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>{acc.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${acc.badgeColor}`}>
                                {acc.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{acc.desc}</div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {acc.id}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center px-1">
                    <span className="text-[10px] text-slate-500">OTP Auth Verified</span>
                    <button
                      onClick={() => {
                        logout();
                        setRoleMenuOpen(false);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 py-1 px-2 rounded hover:bg-rose-950/40"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Train Halt Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border-2 border-red-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-red-400 uppercase tracking-wide">
                  Station Master Emergency Halt
                </h3>
                <p className="text-xs text-slate-400">
                  Broadcasts instant emergency halt sirens to all Loco-Pilots and Control Centers
                </p>
              </div>
            </div>

            <form onSubmit={handleEmergencySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Affected Track Section / Division
                </label>
                <input
                  type="text"
                  value={haltSection}
                  onChange={(e) => setHaltSection(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Emergency Block
                </label>
                <textarea
                  value={haltReason}
                  onChange={(e) => setHaltReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-3 text-xs text-red-300">
                <strong>Safety Caution:</strong> This will trip absolute block signals, notify the Central
                Control Room, and blast audible sirens across all active mobile field tablets.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-950 flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Transmit Emergency Halt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
