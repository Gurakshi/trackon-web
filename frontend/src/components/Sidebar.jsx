import React from 'react';
import {
  Map,
  AlertTriangle,
  Radio,
  Cpu,
  Wrench,
  BarChart3,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, unreadAlertsCount = 0 }) {
  const { role } = useAuth();

  const NAV_ITEMS = [
    {
      id: 'map',
      label: 'Live Track Map',
      mobileLabel: 'Map',
      icon: Map,
      badge: null,
    },
    {
      id: 'report',
      label: 'Report Hazard',
      mobileLabel: 'Report',
      icon: PlusCircle,
      badge: null,
      highlight: true,
    },
    {
      id: 'alerts',
      label: 'Real-Time Alerts',
      mobileLabel: 'Alerts',
      icon: Radio,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
      badgeColor: 'bg-red-600',
    },
    {
      id: 'ai-studio',
      label: 'AI Defect Studio',
      mobileLabel: 'AI Vision',
      icon: Cpu,
      badge: 'AI',
      badgeColor: 'bg-indigo-600',
    },
    {
      id: 'maintenance',
      label: 'Maintenance Pipeline',
      mobileLabel: 'Repair',
      icon: Wrench,
      badge: null,
    },
    {
      id: 'analytics',
      label: 'Safety Analytics',
      mobileLabel: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Security & Audit',
      mobileLabel: 'Audit',
      icon: ShieldCheck,
      badge: 'SHA-256',
      badgeColor: 'bg-emerald-600',
    },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/90 border-r border-slate-800 p-4 shrink-0">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Operations Command
        </div>
        <nav className="space-y-1.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : item.highlight
                    ? 'bg-blue-950/40 border border-blue-800/50 text-blue-300 hover:bg-blue-900/40'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${
                      item.badgeColor || 'bg-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Operational Context Footer */}
        <div className="mt-auto p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-300">IRS Safety Standard</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Encrypted telemetry stream. Geofenced within Western & Central Railway Corridors.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] transition-all relative ${
                isActive
                  ? 'text-blue-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.mobileLabel}</span>
              {item.badge && typeof item.badge === 'number' && (
                <span className="absolute top-0 right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
