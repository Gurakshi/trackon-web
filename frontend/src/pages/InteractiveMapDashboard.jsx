import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Radio,
  Filter,
  Layers,
  Wrench,
  Navigation,
  Clock,
  Shield,
  Eye,
  CheckCircle,
  X,
  Send,
  Zap,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { incidentApi, maintenanceApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function InteractiveMapDashboard({ onSelectIncidentForAI }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const tracksLayerGroupRef = useRef(null);
  const teamsLayerGroupRef = useRef(null);

  const { socket, emergencyAlert } = useSocket();
  const { user, role } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Selected Incident for Flyout
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [dispatchInstructions, setDispatchInstructions] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, trackRes, teamRes] = await Promise.all([
        incidentApi.getAll({
          severity: severityFilter,
          status: statusFilter,
          division: divisionFilter,
          category: categoryFilter,
        }),
        incidentApi.getRailwayTracks(),
        maintenanceApi.getTeams(),
      ]);

      if (incRes.success) setIncidents(incRes.data);
      if (trackRes.success) setTracks(trackRes.data);
      if (teamRes.success) setTeams(teamRes.data);
    } catch (err) {
      console.error('Error fetching map dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [severityFilter, statusFilter, divisionFilter, categoryFilter]);

  // Listen for socket events to update map in real-time
  useEffect(() => {
    if (!socket) return;

    const handleCreated = ({ incident }) => {
      setIncidents((prev) => [incident, ...prev]);
    };

    const handleUpdated = ({ incident }) => {
      setIncidents((prev) => prev.map((item) => (item.id === incident.id ? incident : item)));
      if (selectedIncident?.id === incident.id) {
        setSelectedIncident(incident);
      }
    };

    socket.on('incident:created', handleCreated);
    socket.on('incident:updated', handleUpdated);

    return () => {
      socket.off('incident:created', handleCreated);
      socket.off('incident:updated', handleUpdated);
    };
  }, [socket, selectedIncident]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered around Mumbai - Thane - Kalyan Railway Corridor
    const map = L.map(mapContainerRef.current, {
      center: [19.186, 73.0489],
      zoom: 11,
      zoomControl: false,
    });

    // Dark Railway Carto Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Layer groups
    tracksLayerGroupRef.current = L.layerGroup().addTo(map);
    teamsLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Tracks
  useEffect(() => {
    if (!mapInstanceRef.current || !tracksLayerGroupRef.current) return;
    tracksLayerGroupRef.current.clearLayers();

    tracks.forEach((route) => {
      // Draw railway track polyline
      const polyline = L.polyline(route.coordinates, {
        color: route.lineColor || '#3b82f6',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(tracksLayerGroupRef.current);

      polyline.bindTooltip(`<strong>${route.name}</strong><br/>${route.gauge} &bull; ${route.electrification}`, {
        sticky: true,
        className: 'bg-slate-900 text-slate-200 border-slate-700 px-2 py-1 rounded text-xs',
      });

      // Place small station nodes along the line
      route.coordinates.forEach((coord, idx) => {
        if (idx === 0 || idx === route.coordinates.length - 1 || idx % 3 === 0) {
          const stationIcon = L.divIcon({
            className: 'station-node-icon',
            html: `<div style="width: 8px; height: 8px; background: #94a3b8; border: 2px solid #0f172a; border-radius: 50%;"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          L.marker(coord, { icon: stationIcon }).addTo(tracksLayerGroupRef.current);
        }
      });
    });
  }, [tracks]);

  // Render Maintenance Teams
  useEffect(() => {
    if (!mapInstanceRef.current || !teamsLayerGroupRef.current) return;
    teamsLayerGroupRef.current.clearLayers();

    teams.forEach((team) => {
      const isAvailable = team.status === 'Available';
      const teamIcon = L.divIcon({
        className: 'custom-team-icon',
        html: `
          <div style="
            background: ${isAvailable ? '#10b981' : '#f59e0b'};
            width: 28px;
            height: 28px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
            border: 2px solid #0f172a;
            color: #ffffff;
            font-size: 12px;
            font-weight: bold;
          ">
            🔧
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([team.currentLat, team.currentLng], { icon: teamIcon }).addTo(
        teamsLayerGroupRef.current
      );

      marker.bindTooltip(
        `<strong>${team.name}</strong><br/>Status: ${team.status}<br/>Lead: ${team.leadEngineer} (${team.crewSize} crew)`,
        { sticky: true }
      );
    });
  }, [teams]);

  // Render Incident Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;
    markersLayerGroupRef.current.clearLayers();

    incidents.forEach((incident) => {
      const isCritical = incident.severity === 'Critical';
      const isHigh = incident.severity === 'High';
      const isMedium = incident.severity === 'Medium';
      const isResolved = incident.status === 'Resolved';

      let bg = '#3b82f6'; // Low (Blue)
      let symbol = '!';

      if (isResolved) {
        bg = '#10b981'; // Resolved (Green)
        symbol = '✓';
      } else if (isCritical) {
        bg = '#ef4444'; // Critical (Red)
        symbol = '⚡';
      } else if (isHigh) {
        bg = '#f97316'; // High (Orange)
        symbol = '⚠';
      } else if (isMedium) {
        bg = '#eab308'; // Medium (Yellow)
        symbol = '●';
      }

      const pulseClass = isCritical && !isResolved ? 'radar-pulse-critical' : '';

      const incidentIcon = L.divIcon({
        className: 'custom-incident-pin',
        html: `
          <div class="${pulseClass}" style="
            background: ${bg};
            width: ${isCritical ? '36px' : '28px'};
            height: ${isCritical ? '36px' : '28px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            color: #ffffff;
            font-size: ${isCritical ? '16px' : '12px'};
            font-weight: 800;
            cursor: pointer;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.6);
          ">
            ${symbol}
          </div>
        `,
        iconSize: isCritical ? [36, 36] : [28, 28],
        iconAnchor: isCritical ? [18, 18] : [14, 14],
      });

      const marker = L.marker([incident.latitude, incident.longitude], { icon: incidentIcon }).addTo(
        markersLayerGroupRef.current
      );

      // If Critical, draw a red alert boundary radius circle
      if (isCritical && !isResolved) {
        L.circle([incident.latitude, incident.longitude], {
          radius: 1200, // 1.2 km alert boundary
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 1,
          dashArray: '4, 4',
        }).addTo(markersLayerGroupRef.current);
      }

      marker.on('click', () => {
        setSelectedIncident(incident);
        if (incident.assignedTeamId) {
          setSelectedTeamId(incident.assignedTeamId);
        }
      });
    });
  }, [incidents]);

  // Handle Team Dispatch
  const handleDispatchTeam = async () => {
    if (!selectedIncident || !selectedTeamId) return;
    setDispatching(true);
    setActionSuccess('');
    try {
      const res = await maintenanceApi.assignTeam(
        selectedIncident.id,
        selectedTeamId,
        dispatchInstructions || 'Proceed to track section immediately with emergency tools.'
      );
      if (res.success) {
        setActionSuccess('Dispatch transmitted! Team notified via SMS & Socket.');
        setIncidents((prev) =>
          prev.map((i) =>
            i.id === selectedIncident.id
              ? { ...i, status: 'Assigned', assignedTeamId: selectedTeamId }
              : i
          )
        );
        setSelectedIncident((prev) => ({
          ...prev,
          status: 'Assigned',
          assignedTeamId: selectedTeamId,
        }));
      }
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setDispatching(false);
    }
  };

  // Center on Incident
  const centerMapOn = (lat, lng) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full flex flex-col md:flex-row overflow-hidden">
      {/* Top Floating Filter Bar */}
      <div className="absolute top-3 left-3 right-3 md:left-6 md:right-auto z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mr-1">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Filters:</span>
        </div>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Severities</option>
          <option value="Critical">🔴 Critical Only</option>
          <option value="High">🟠 High Priority</option>
          <option value="Medium">🟡 Medium</option>
          <option value="Low">🔵 Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="Reported">Reported (New)</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        {/* Division Filter */}
        <select
          value={divisionFilter}
          onChange={(e) => setDivisionFilter(e.target.value)}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-blue-500 hidden sm:block"
        >
          <option value="ALL">All Railway Divisions</option>
          <option value="Central Division">Central Division</option>
          <option value="Western Division">Western Division</option>
        </select>

        {/* Total Active Count Pill */}
        <div className="ml-auto px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px] text-slate-300 font-mono">
          <strong>{incidents.length}</strong> Incidents on Map
        </div>
      </div>

      {/* Map Element Container */}
      <div className="flex-1 h-full w-full relative z-0">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Map Legend Overlay (Bottom-Left) */}
        <div className="absolute bottom-6 left-6 z-20 hidden lg:block bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-xs shadow-xl space-y-1.5">
          <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block -ml-5"></span>
            <span className="text-slate-300">Critical Emergency (Immediate Halt)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-300">High / Medium Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-300">Resolved Track Issue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-600 inline-block text-[10px] text-center text-white">🔧</span>
            <span className="text-slate-300">Available Maintenance Gang</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 border-t-2 border-dashed border-blue-500 inline-block"></span>
            <span className="text-slate-300">Broad Gauge Corridors (25kV OHE)</span>
          </div>
        </div>
      </div>

      {/* Selected Incident Drawer / Side Panel */}
      {selectedIncident && (
        <div className="w-full md:w-96 bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800 p-5 overflow-y-auto z-30 shadow-2xl shrink-0 flex flex-col justify-between max-h-[50vh] md:max-h-full">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {selectedIncident.trackingNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      selectedIncident.severity === 'Critical'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                        : selectedIncident.severity === 'High'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  {selectedIncident.category}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media Image Preview */}
            {selectedIncident.mediaUrl && (
              <div className="mt-4 relative rounded-xl overflow-hidden border border-slate-800 group">
                <img
                  src={selectedIncident.mediaUrl}
                  alt={selectedIncident.category}
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                    GPS: {selectedIncident.latitude.toFixed(4)}, {selectedIncident.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {/* Location & Status Badges */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Track Chainage:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {selectedIncident.trackKilometer}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Nearest Station:</span>
                <span className="font-semibold text-slate-200">
                  {selectedIncident.nearestStation} ({selectedIncident.distanceFromStationKm || '1.2'} km)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-blue-400">{selectedIncident.status}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Field Observation Details
              </span>
              <p className="mt-1 text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                {selectedIncident.description}
              </p>
              <div className="mt-1 text-[10px] text-slate-500">
                Reported by {selectedIncident.reporterName} &bull;{' '}
                {new Date(selectedIncident.createdAt).toLocaleTimeString()}
              </div>
            </div>

            {/* AI Computer Vision Scan Findings */}
            {selectedIncident.aiAnalysis && (
              <div className="mt-4 p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Vision Scan Result</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {(selectedIncident.aiAnalysis.defectConfidence * 100).toFixed(0)}% Match
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {selectedIncident.aiAnalysis.defectType}
                </div>
                {selectedIncident.aiAnalysis.crackWidthMm && (
                  <div className="text-[11px] text-slate-400 mt-1">
                    Crack Aperture: <strong>{selectedIncident.aiAnalysis.crackWidthMm} mm</strong>
                  </div>
                )}
                {selectedIncident.aiAnalysis.recommendedSOP?.[0] && (
                  <div className="mt-2 text-[11px] bg-slate-950/70 p-2 rounded text-amber-200 border border-indigo-900/50">
                    <strong>SOP:</strong> {selectedIncident.aiAnalysis.recommendedSOP[0]}
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Team Assignment Action */}
            <div className="mt-5 border-t border-slate-800 pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                <span>Dispatch Maintenance Gang</span>
              </span>

              {actionSuccess && (
                <div className="mb-3 p-2 bg-emerald-950/70 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="space-y-2">
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Nearest Maintenance Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.status}) &bull; Base: {t.baseStation}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Custom emergency instructions..."
                  value={dispatchInstructions}
                  onChange={(e) => setDispatchInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />

                <button
                  onClick={handleDispatchTeam}
                  disabled={!selectedTeamId || dispatching}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{dispatching ? 'Transmitting Dispatch...' : 'Dispatch Gang to Incident'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Flyout Button */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
            <button
              onClick={() => centerMapOn(selectedIncident.latitude, selectedIncident.longitude)}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Center Marker</span>
            </button>
            <button
              onClick={() => {
                if (onSelectIncidentForAI) onSelectIncidentForAI(selectedIncident);
              }}
              className="flex-1 py-1.5 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-700/50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Analyze in AI</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
