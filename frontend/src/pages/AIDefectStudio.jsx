import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  Layers,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Printer,
  Compass,
  TrendingUp,
  Shield,
  Activity,
  Maximize2,
} from 'lucide-react';
import { aiApi } from '../services/api';

export default function AIDefectStudio({ initialIncident }) {
  const [activeTab, setActiveTab] = useState('CV_INSPECTOR'); // CV_INSPECTOR | RISK_PREDICTOR | AUTO_REPORT
  const [selectedImage, setSelectedImage] = useState(
    initialIncident?.mediaUrl ||
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80'
  );
  const [categoryHint, setCategoryHint] = useState(
    initialIncident?.category || 'Track damage or cracks'
  );
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState(initialIncident?.aiAnalysis || null);

  // Risk Zones State
  const [riskZones, setRiskZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);

  // Auto Report State
  const [maintenanceReport, setMaintenanceReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const canvasRef = useRef(null);

  // Pre-set gallery for testing
  const GALLERY = [
    {
      name: 'Rail Transverse Fracture (Kalyan)',
      category: 'Track damage or cracks',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Monsoon Ballast Inundation (Kurla)',
      category: 'Waterlogging or flooding',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Gauge Obstruction Tree (Igatpuri)',
      category: 'Fallen trees or obstacles',
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Track Alignment Slew (Dombivli)',
      category: 'Track misalignment',
      url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // Run AI Defect Scan
  const handleScan = async (imgUrl = selectedImage, cat = categoryHint) => {
    setScanning(true);
    try {
      const res = await aiApi.scanDefect({ imageUrl: imgUrl, categoryHint: cat });
      if (res.success) {
        setAiResult(res.data);
      }
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  // Draw Bounding Boxes on Canvas Overlay
  useEffect(() => {
    if (!canvasRef.current || !aiResult || !aiResult.boundingBox) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImage;

    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 500;

      // Draw original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw bounding box
      const box = aiResult.boundingBox;
      const x = box.xmin * canvas.width;
      const y = box.ymin * canvas.height;
      const w = (box.xmax - box.xmin) * canvas.width;
      const h = (box.ymax - box.ymin) * canvas.height;

      // Box styling
      ctx.lineWidth = 4;
      ctx.strokeStyle = aiResult.severityCalculated === 'Critical' ? '#ef4444' : '#f59e0b';
      ctx.strokeRect(x, y, w, h);

      // Semi-transparent highlight fill
      ctx.fillStyle = aiResult.severityCalculated === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)';
      ctx.fillRect(x, y, w, h);

      // Label background
      ctx.fillStyle = aiResult.severityCalculated === 'Critical' ? '#ef4444' : '#f59e0b';
      const label = `${aiResult.defectType} (${(aiResult.defectConfidence * 100).toFixed(0)}%)`;
      ctx.font = 'bold 16px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, Math.max(0, y - 26), textWidth + 16, 26);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 8, Math.max(18, y - 8));
    };
  }, [aiResult, selectedImage]);

  // Load Risk Zones
  const loadRiskZones = async () => {
    setLoadingZones(true);
    try {
      const res = await aiApi.getRiskZones();
      if (res.success) setRiskZones(res.data);
    } catch (err) {
      console.error('Error fetching risk zones:', err);
    } finally {
      setLoadingZones(false);
    }
  };

  // Load Maintenance Report
  const loadMaintenanceReport = async () => {
    setLoadingReport(true);
    try {
      const res = await aiApi.generateReport();
      if (res.success) setMaintenanceReport(res.data);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'RISK_PREDICTOR' && riskZones.length === 0) {
      loadRiskZones();
    } else if (activeTab === 'AUTO_REPORT' && !maintenanceReport) {
      loadMaintenanceReport();
    }
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                AI Railway Defect Vision & Risk Intelligence Studio
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Computer vision flaw segmentation, predictive track hazard modeling, and automated engineering reports
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('CV_INSPECTOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CV_INSPECTOR'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>CV Defect Vision</span>
          </button>
          <button
            onClick={() => setActiveTab('RISK_PREDICTOR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'RISK_PREDICTOR'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Risk Zone Predictor</span>
          </button>
          <button
            onClick={() => setActiveTab('AUTO_REPORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'AUTO_REPORT'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Automated Reports</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CV DEFECT INSPECTOR */}
      {activeTab === 'CV_INSPECTOR' && (
        <div className="space-y-6">
          {/* Preset Inspector Gallery */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Sample Track Defect Imagery
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {GALLERY.map((g) => (
                <button
                  key={g.name}
                  onClick={() => {
                    setSelectedImage(g.url);
                    setCategoryHint(g.category);
                    setAiResult(null);
                    handleScan(g.url, g.category);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all group overflow-hidden ${
                    selectedImage === g.url
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-950'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img src={g.url} alt={g.name} className="w-full h-20 object-cover rounded-lg mb-1.5" />
                  <div className="text-[11px] font-bold text-slate-200 truncate group-hover:text-indigo-300">
                    {g.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Inspection Canvas & Bounding Box Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Canvas Viewport */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Optical Flaw Segmentation Viewport</span>
                  {aiResult && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                      YOLOv8-RailDefectNet
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleScan()}
                  disabled={scanning}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-950 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{scanning ? 'Running Neural Vision...' : 'Scan / Re-Analyze'}</span>
                </button>
              </div>

              {/* Canvas Container */}
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[340px]">
                {aiResult?.boundingBox ? (
                  <canvas ref={canvasRef} className="w-full h-auto max-h-[460px] object-contain rounded-xl" />
                ) : (
                  <div className="relative w-full h-full">
                    <img src={selectedImage} alt="Track" className="w-full h-auto max-h-[460px] object-cover" />
                    {scanning && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-indigo-400">
                        <Sparkles className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-mono font-bold tracking-wider">
                          SEGMENTING TRACK CONTOURS & FLAWS...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Resolution: High-Res Sensor Stream</span>
                <span>Specification: IRS-T-12 Safety Code</span>
              </div>
            </div>

            {/* Right Col: AI Diagnostics & SOP Actions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Neural Diagnostics</span>
                </div>

                {aiResult ? (
                  <div className="space-y-4">
                    {/* Flaw Classification */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-[11px] text-slate-400 font-medium">Classified Flaw:</div>
                      <div className="text-base font-extrabold text-white mt-0.5">{aiResult.defectType}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {(aiResult.defectConfidence * 100).toFixed(1)}% Confidence
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded uppercase ${
                            aiResult.severityCalculated === 'Critical'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
                              : 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                          }`}
                        >
                          {aiResult.severityCalculated}
                        </span>
                      </div>
                    </div>

                    {/* Metric Details */}
                    {aiResult.metric && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                        <div className="text-slate-400">{aiResult.metric.name}:</div>
                        <div className="text-lg font-mono font-bold text-amber-300">
                          {aiResult.metric.value}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          IRS Critical Threshold: {aiResult.metric.threshold}
                        </div>
                      </div>
                    )}

                    {/* Automated SOP Protocols */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Recommended Priority SOP Actions
                      </div>
                      <div className="space-y-2">
                        {aiResult.recommendedSOP?.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-200 flex items-start gap-2"
                          >
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-snug">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Click "Scan / Re-Analyze" to run the computer vision defect model on the selected photo.
                  </div>
                )}
              </div>

              {aiResult?.aiModelMetadata && (
                <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
                  Inference Latency: {aiResult.aiModelMetadata.inferenceLatencyMs}ms &bull; Model:{' '}
                  {aiResult.aiModelMetadata.modelArchitecture.split(' ')[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREDICTIVE RISK ZONE MODELING */}
      {activeTab === 'RISK_PREDICTOR' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Track Vulnerability Index (TVI) - High-Risk Sections
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Machine learning risk prediction computed from historical defect density, track gradient, weather monsoon data, and traffic load
                </p>
              </div>
              <button
                onClick={loadRiskZones}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
              >
                Recompute TVI Scores
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskZones.map((zone) => {
                const isSevere = zone.vulnerabilityIndex > 85;
                const isHigh = zone.vulnerabilityIndex > 70 && !isSevere;

                return (
                  <div
                    key={zone.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSevere
                        ? 'bg-red-950/30 border-red-800/80 shadow-lg shadow-red-950/20'
                        : isHigh
                        ? 'bg-amber-950/20 border-amber-800/60'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-white">{zone.sectionName}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-extrabold uppercase ${
                              isSevere ? 'bg-red-600 text-white' : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {zone.riskLevel}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">
                          {zone.division} &bull; {zone.fromKm} to {zone.toKm}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-red-400">
                          {zone.vulnerabilityIndex}
                          <span className="text-xs text-slate-500">/100</span>
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">TVI Score</div>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="text-[11px] text-slate-400 font-semibold">Contributing Factors:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {zone.factors?.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[10px] text-slate-300"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Speed Restriction SOP:</span>
                      <span className="font-bold text-amber-300">
                        Max {zone.recommendedSpeedLimitKmh} km/h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMATED MAINTENANCE REPORT */}
      {activeTab === 'AUTO_REPORT' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3 mb-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Safety Report</span>
            </button>
          </div>

          {maintenanceReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-200">
              {/* Report Header */}
              <div className="border-b-2 border-blue-600 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-widest text-blue-400">
                    Indian Railways Safety Directorate
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    Permanent-Way Track Safety & Emergency Digest
                  </h2>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Report ID: {maintenanceReport.reportId} &bull; Generated:{' '}
                    {new Date(maintenanceReport.generatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-700 rounded-xl text-xs text-emerald-300 font-mono font-semibold">
                  STATUS: {maintenanceReport.complianceSignOff?.certificationStatus}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6 text-xs leading-relaxed text-slate-300">
                <strong className="text-white">Executive Summary: </strong>
                {maintenanceReport.executiveSummary}
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-blue-400">
                    {maintenanceReport.metrics?.totalReported}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                    Total Incidents Logged
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-red-400">
                    {maintenanceReport.metrics?.criticalEscalations}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                    Critical Escalations
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-2xl font-black text-emerald-400">
                    {maintenanceReport.metrics?.meanTimeToResolveMinutes}m
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                    Mean Time to Resolve (MTTR)
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    {maintenanceReport.metrics?.teamReadinessRatio}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mt-2">
                    Emergency Gang Readiness
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Critical Open Track Interventions
                </h3>
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  {maintenanceReport.criticalActionItems?.map((item, i) => (
                    <div key={i} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="text-blue-400 font-mono">{item.trackingNumber}</span>
                          <span>{item.category}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{item.location}</div>
                        <div className="text-amber-300 text-[11px] mt-1">SOP: {item.sopGuideline}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-300">
                          {item.assignedTeam}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign Off */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono">
                <div>Audited by: {maintenanceReport.complianceSignOff?.auditor}</div>
                <div className="truncate max-w-sm">
                  SHA-256 Block Proof: {maintenanceReport.complianceSignOff?.cryptographicHash?.substring(0, 32)}...
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">Generating report...</div>
          )}
        </div>
      )}
    </div>
  );
}
