import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import InteractiveMapDashboard from './pages/InteractiveMapDashboard';
import IncidentReporting from './pages/IncidentReporting';
import RealTimeAlertsFeed from './pages/RealTimeAlertsFeed';
import AIDefectStudio from './pages/AIDefectStudio';
import MaintenanceWorkflow from './pages/MaintenanceWorkflow';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AuditLogViewer from './pages/AuditLogViewer';
import { X, ShieldAlert } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { emergencyAlert, clearEmergencyAlert } = useSocket();

  const [activeTab, setActiveTab] = useState('map');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedIncidentForAI, setSelectedIncidentForAI] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-mono">Initializing TRACKON Network...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleIncidentSubmitted = (newIncident) => {
    setReportModalOpen(false);
    setActiveTab('map');
  };

  const handleInspectInAI = (incident) => {
    setSelectedIncidentForAI(incident);
    setActiveTab('ai-studio');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Official Railway Operations Header */}
      <Navbar onOpenReportModal={() => setReportModalOpen(true)} />

      {/* Emergency Global Alert Toast */}
      {emergencyAlert && (
        <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold shadow-lg animate-in slide-in-from-top duration-200 z-50">
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              <strong>EMERGENCY ALERT:</strong> {emergencyAlert.title} &bull; {emergencyAlert.message}
            </span>
          </div>
          <button
            onClick={clearEmergencyAlert}
            className="p-1 hover:bg-red-700 rounded transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main Workspace Tab */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {activeTab === 'map' && (
            <InteractiveMapDashboard onSelectIncidentForAI={handleInspectInAI} />
          )}
          {activeTab === 'report' && (
            <IncidentReporting onIncidentSubmitted={handleIncidentSubmitted} />
          )}
          {activeTab === 'alerts' && (
            <RealTimeAlertsFeed
              onSelectIncident={(inc) => {
                setActiveTab('map');
              }}
            />
          )}
          {activeTab === 'ai-studio' && (
            <AIDefectStudio initialIncident={selectedIncidentForAI} />
          )}
          {activeTab === 'maintenance' && <MaintenanceWorkflow />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'audit' && <AuditLogViewer />}
        </main>
      </div>

      {/* Quick Hazard Reporting Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Quick Hazard Report</span>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <IncidentReporting onIncidentSubmitted={handleIncidentSubmitted} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
