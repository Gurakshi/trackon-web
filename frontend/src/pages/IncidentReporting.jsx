import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MapPin,
  Camera,
  Upload,
  AlertTriangle,
  Zap,
  CheckCircle,
  Radio,
  Clock,
  Send,
  Loader2,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { incidentApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function IncidentReporting({ onIncidentSubmitted }) {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Form State
  const [category, setCategory] = useState('Track damage or cracks');
  const [severity, setSeverity] = useState('Critical');
  const [latitude, setLatitude] = useState(19.2312);
  const [longitude, setLongitude] = useState(73.1205);
  const [trackKilometer, setTrackKilometer] = useState('KM 51/14 - 51/18 (Up Fast Line)');
  const [division, setDivision] = useState('Central Division');
  const [nearestStation, setNearestStation] = useState('Kalyan Junction (KYN)');
  const [description, setDescription] = useState(
    'Transverse fatigue crack detected on outer rail head during foot patrol. Visible gap and loose fishplate bolt.'
  );
  const [mediaUrl, setMediaUrl] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80'
  );

  // GPS State
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsAccurate, setGpsAccurate] = useState(true);

  // AI Pre-scan State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sample Track Defect Photos for quick demonstration
  const SAMPLE_DEFECT_IMAGES = [
    {
      label: 'Rail Crack',
      category: 'Track damage or cracks',
      severity: 'Critical',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
      desc: 'Transverse fatigue crack on rail head. Gap width ~8mm.',
    },
    {
      label: 'Waterlogging',
      category: 'Waterlogging or flooding',
      severity: 'High',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
      desc: 'Heavy water stagnation submerging sleepers by 115mm.',
    },
    {
      label: 'Fallen Tree',
      category: 'Fallen trees or obstacles',
      severity: 'High',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
      desc: 'Heavy tree branches fouling 25kV OHE catenary clearance gauge.',
    },
    {
      label: 'Signal Defect',
      category: 'Signal failures',
      severity: 'Medium',
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
      desc: 'Color light signal aspect locked on Danger (Red).',
    },
  ];

  const INCIDENT_CATEGORIES = [
    { id: 'Track damage or cracks', label: 'Track Damage / Rail Crack', icon: '⚡' },
    { id: 'Waterlogging or flooding', label: 'Waterlogging / Flooding', icon: '🌊' },
    { id: 'Fallen trees or obstacles', label: 'Fallen Tree / Obstacle', icon: '🌲' },
    { id: 'Signal failures', label: 'Signal Failure / Interlocking', icon: '🚥' },
    { id: 'Track misalignment', label: 'Track Misalignment / Buckling', icon: '📐' },
    { id: 'Landslides', label: 'Landslide / Rock Fall', icon: '⛰️' },
    { id: 'Unauthorized track access', label: 'Unauthorized Track Access / Trespass', icon: '🚷' },
    { id: 'Electrical faults', label: 'Overhead 25kV OHE Electrical Fault', icon: '🔌' },
  ];

  const SEVERITY_LEVELS = [
    {
      id: 'Critical',
      label: 'Critical',
      desc: 'Immediate Train Halt Required',
      color: 'border-red-500 bg-red-950/40 text-red-300',
      badge: 'bg-red-500 text-white',
    },
    {
      id: 'High',
      label: 'High',
      desc: 'Speed Restriction / Urgent Dispatch',
      color: 'border-orange-500 bg-orange-950/40 text-orange-300',
      badge: 'bg-orange-500 text-white',
    },
    {
      id: 'Medium',
      label: 'Medium',
      desc: 'Priority Maintenance Gang Needed',
      color: 'border-yellow-500 bg-yellow-950/40 text-yellow-300',
      badge: 'bg-yellow-500 text-white',
    },
    {
      id: 'Low',
      label: 'Low',
      desc: 'Routine Inspection Attention',
      color: 'border-blue-500 bg-blue-950/40 text-blue-300',
      badge: 'bg-blue-500 text-white',
    },
  ];

  // Auto Geolocation Fetch
  const handleDetectGPS = () => {
    setGpsDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
          setGpsDetecting(false);
          setGpsAccurate(true);
        },
        (err) => {
          console.warn('Browser GPS permission unavailable, retaining track simulation coordinates:', err);
          // High-precision coordinates near Kalyan junction
          setLatitude(19.2437);
          setLongitude(73.1355);
          setGpsDetecting(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setGpsDetecting(false);
    }
  };

  // Run AI Defect Scan
  const handleRunAiScan = async () => {
    setAiAnalyzing(true);
    try {
      const res = await aiApi.scanDefect({
        imageUrl: mediaUrl,
        categoryHint: category,
      });
      if (res.success) {
        setAiAnalysis(res.data);
        if (res.data.severityCalculated) {
          setSeverity(res.data.severityCalculated);
        }
      }
    } catch (err) {
      console.error('AI scan error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle Photo Selection
  const handleSelectSampleImage = (sample) => {
    setMediaUrl(sample.url);
    setCategory(sample.category);
    setSeverity(sample.severity);
    setDescription(sample.desc);
    setAiAnalysis(null);
  };

  // Handle File Upload from Camera / File System
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result);
      setAiAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Incident Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        category,
        severity,
        latitude,
        longitude,
        trackKilometer,
        division,
        nearestStation,
        description,
        mediaUrl,
        aiAnalysis,
      };

      const res = await incidentApi.create(payload);
      if (res.success) {
        setSuccessMessage(`Hazard Report ${res.data.trackingNumber} successfully logged and broadcasted!`);
        if (onIncidentSubmitted) {
          setTimeout(() => onIncidentSubmitted(res.data), 1200);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit incident report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-950/60 border border-red-800 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Field Hazard & Defect Reporting
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged as verified employee: <strong>{user?.name}</strong> ({user?.role}) &bull; ID: {user?.employeeId}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{new Date().toLocaleDateString()} &bull; {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl flex items-center gap-3 text-emerald-200 text-sm shadow-xl animate-in zoom-in-95">
          <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-base">Emergency Broadcast Transmitted</div>
            <div>{successMessage}</div>
            <div className="text-xs text-emerald-300/80 mt-0.5">
              Nearby Station Masters, Loco-Pilots, and P-Way Gangs have received alert dispatches.
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Hazard Category */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            1. Select Track Hazard Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {INCIDENT_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-2.5 ${
                  category === cat.id
                    ? 'bg-blue-950 border-blue-500 text-white font-bold shadow-lg shadow-blue-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: Severity Triage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            2. Emergency Severity Level
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEVERITY_LEVELS.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSeverity(s.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  severity === s.id
                    ? `${s.color} border-2 shadow-lg shadow-black/40 scale-[1.02]`
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-extrabold text-sm">{s.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.badge}`}>
                    {s.id === 'Critical' ? 'HALT' : s.id === 'High' ? 'RESTRICT' : 'CAUTION'}
                  </span>
                </div>
                <div className="text-[11px] opacity-80 leading-tight">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: GPS Geolocation & Track Location */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Automatic Track Geolocation & Chainage
            </label>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={gpsDetecting}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold bg-blue-950/70 border border-blue-800/80 px-2.5 py-1 rounded-lg transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{gpsDetecting ? 'Detecting GPS...' : 'Refresh GPS Coordinates'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Railway Chainage / KM Mark</label>
              <input
                type="text"
                value={trackKilometer}
                onChange={(e) => setTrackKilometer(e.target.value)}
                placeholder="KM 51/14 - 51/18"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Nearest Station / Section</label>
              <input
                type="text"
                value={nearestStation}
                onChange={(e) => setNearestStation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Photographic Evidence & AI Vision Scanner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Photo / Video Evidence & AI Defect Analysis
            </label>
            <span className="text-[11px] text-indigo-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Vision Assistant Ready</span>
            </span>
          </div>

          {/* Sample quick-select chips */}
          <div className="mb-4">
            <div className="text-[11px] text-slate-400 mb-2">Quick Test Pre-Sets:</div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_DEFECT_IMAGES.map((sample) => (
                <button
                  type="button"
                  key={sample.label}
                  onClick={() => handleSelectSampleImage(sample)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image Preview / Upload Box */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-slate-700 bg-slate-950 p-2 flex flex-col items-center justify-center min-h-[200px]">
              {mediaUrl ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                  <img src={mediaUrl} alt="Hazard Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Retake</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-2">Take live photo with camera or upload file</p>
                  <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* AI Computer Vision Inspection Panel */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Neural Network Track Defect Scanner</span>
                  </span>
                  {aiAnalysis && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {(aiAnalysis.defectConfidence * 100).toFixed(1)}% Confidence
                    </span>
                  )}
                </div>

                {aiAnalysis ? (
                  <div className="space-y-2 mt-2">
                    <div className="p-2.5 bg-indigo-950/40 border border-indigo-800/60 rounded-xl">
                      <div className="text-[11px] text-indigo-300 font-semibold">Classified Defect:</div>
                      <div className="text-sm font-bold text-white">{aiAnalysis.defectType}</div>
                      {aiAnalysis.metric && (
                        <div className="text-xs text-slate-300 mt-1">
                          {aiAnalysis.metric.name}: <strong className="text-amber-300">{aiAnalysis.metric.value}</strong> (Threshold: {aiAnalysis.metric.threshold})
                        </div>
                      )}
                    </div>

                    {aiAnalysis.recommendedSOP?.[0] && (
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
                        <strong className="text-amber-400">Recommended SOP:</strong> {aiAnalysis.recommendedSOP[0]}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    Our embedded Computer Vision model scans rail cracks, ballast subsidence, waterlogging depths, and clearance violations in real time to suggest automatic severity triage.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleRunAiScan}
                disabled={aiAnalyzing || !mediaUrl}
                className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-950 flex items-center justify-center gap-2 transition-all"
              >
                {aiAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Track Flaws via Neural Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run AI Defect Scan On Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 5: Detailed Description */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            5. Field Observation Notes & Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the defect, sound, weather conditions, or immediate risk..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 leading-relaxed"
            required
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
          <div className="text-xs text-slate-400">
            Alert will trigger immediate real-time notifications to nearby maintenance teams and Station Masters.
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-2xl transition-all ${
              severity === 'Critical'
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-950/80 border border-red-400/40'
                : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-blue-950/80 border border-blue-400/30'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting Alert...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Submit & Broadcast {severity} Alert</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
