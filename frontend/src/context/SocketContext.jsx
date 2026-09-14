import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const audioCtxRef = useRef(null);

  // Play synthetic railway warning siren using Web Audio API
  const playWarningSiren = (isCritical = true) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCritical ? 'sawtooth' : 'sine';

      // Modulate frequency for realistic two-tone warning
      const now = ctx.currentTime;
      if (isCritical) {
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.linearRampToValueAtTime(440, now + 0.25);
        osc.frequency.linearRampToValueAtTime(880, now + 0.5);
        osc.frequency.linearRampToValueAtTime(440, now + 0.75);
      } else {
        osc.frequency.setValueAtTime(587, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      }

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isCritical ? 1.0 : 0.4));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isCritical ? 1.0 : 0.45));
    } catch (err) {
      console.warn('Audio alert playback error:', err);
    }
  };

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => {
      console.log('Connected to TRACKON WebSocket Network');
      setConnected(true);
      if (user) {
        newSocket.emit('join', { role: user.role, division: user.division });
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Handle new incident
    newSocket.on('incident:created', ({ incident, alertLog, isEmergency }) => {
      console.log('Real-time Incident Received:', incident);
      if (isEmergency || incident.severity === 'Critical') {
        setEmergencyAlert({
          type: 'CRITICAL_HAZARD',
          title: `CRITICAL ALERT: ${incident.category}`,
          message: `${incident.trackKilometer} near ${incident.nearestStation}. SOP: Immediate train halt advised.`,
          incident,
          timestamp: new Date().toLocaleTimeString(),
        });
        playWarningSiren(true);
      } else {
        playWarningSiren(false);
      }
      setRecentBroadcasts((prev) => [incident, ...prev.slice(0, 19)]);
    });

    // Handle Emergency Siren Broadcast
    newSocket.on('emergency:siren', (data) => {
      console.log('Emergency Siren Broadcast received:', data);
      setEmergencyAlert({
        type: 'STATION_MASTER_EMERGENCY_HALT',
        title: `ALL TRAINS STOP: ${data.section || 'Track Section'}`,
        message: data.reason || 'Emergency block imposed by Divisional Controller.',
        timestamp: new Date().toLocaleTimeString(),
      });
      playWarningSiren(true);
    });

    // Handle maintenance assignment
    newSocket.on('maintenance:assigned', ({ incident, team }) => {
      console.log('Maintenance assigned:', team.name);
      playWarningSiren(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const clearEmergencyAlert = () => setEmergencyAlert(null);

  const broadcastEmergencyHalt = (section, reason) => {
    if (socket) {
      socket.emit('emergency:broadcast', {
        section,
        reason,
        issuer: user ? `${user.name} (${user.role})` : 'Station Master',
      });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        emergencyAlert,
        clearEmergencyAlert,
        soundEnabled,
        setSoundEnabled,
        playWarningSiren,
        broadcastEmergencyHalt,
        recentBroadcasts,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
