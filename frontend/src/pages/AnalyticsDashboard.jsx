import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileDown,
  Layers,
  Activity,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { analyticsApi } from '../services/api';

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getOverview();
      if (res.success) setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-xs">
        Loading safety analytics metrics...
      </div>
    );
  }

  const { summary, categoryBreakdown, severityBreakdown, weeklyTrends, divisions, highRiskSections } = data;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Safety Analytics & Operational Performance
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive safety KPIs, Mean Time to Resolve (MTTR), regional risk indices, and category distributions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-4 h-4 text-blue-400" />
            <span>Export Report</span>
          </button>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidents */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Total Track Incidents</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{summary.totalIncidents}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged across all railway divisions</div>
        </div>

        {/* Active Hazards */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Active Hazards</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{summary.activeHazards}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.criticalCount} Critical &bull; {summary.highCount} High
          </div>
        </div>

        {/* Mean Time To Resolve */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Mean Time To Resolve</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {summary.meanTimeToResolveMinutes}
            <span className="text-sm text-slate-400 font-normal"> min</span>
          </div>
          <div className="text-[11px] text-emerald-500/80 mt-1 font-semibold">
            ↓ 14% improvement over last month
          </div>
        </div>

        {/* Maintenance Gang Readiness */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Maintenance Readiness</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-300">
            {summary.availableTeams} / {summary.totalTeams}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Rapid response gangs ready</div>
        </div>
      </div>

      {/* Middle Grid: Category Breakdown & Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Incident Frequency by Hazard Category
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-200 truncate pr-2">{item.category}</span>
                  <span className="text-slate-400 font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(8, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Volume Simulation */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              7-Day Incident Inflow vs Resolution Trend
            </h3>
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {weeklyTrends.map((w) => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    {/* Reported Bar */}
                    <div
                      className="w-3 bg-red-500/80 rounded-t transition-all"
                      style={{ height: `${w.reported * 12}px` }}
                      title={`Reported: ${w.reported}`}
                    />
                    {/* Resolved Bar */}
                    <div
                      className="w-3 bg-emerald-500/80 rounded-t transition-all"
                      style={{ height: `${w.resolved * 12}px` }}
                      title={`Resolved: ${w.resolved}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{w.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-sm inline-block"></span>
              <span>Reported Hazards</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block"></span>
              <span>Resolved Work Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Regional Performance & Top High Risk Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Performance */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Zonal Railway Divisions Safety Compliance
          </h3>
          <div className="divide-y divide-slate-800">
            {divisions.map((div) => (
              <div key={div.name} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200">{div.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {div.total} total events &bull; {div.active} active
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    {div.compliance}
                  </span>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    IRS Compliance
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top High-Risk Sections */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Highest Risk Track Corridors (TVI Index)
          </h3>
          <div className="space-y-2.5">
            {highRiskSections.slice(0, 3).map((sec) => (
              <div
                key={sec.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200">{sec.sectionName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {sec.fromKm} - {sec.toKm} ({sec.division})
                  </div>
                  <div className="text-[10px] text-amber-300 mt-1">
                    Speed Limit: {sec.recommendedSpeedLimitKmh} km/h
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black font-mono text-red-400">
                    {sec.vulnerabilityIndex}
                    <span className="text-[10px] text-slate-500">/100</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                    {sec.riskLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
