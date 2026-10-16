import React from 'react';
import { useNetworkStatus } from '../context/NetworkContext';
import { getEnvironmentConfig } from '../services/environment';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export const NetworkStatusBar: React.FC = () => {
  const { isOnline, isReconnecting } = useNetworkStatus();
  const envConfig = getEnvironmentConfig();

  // 1. Android Backend Configuration Warning
  if (envConfig.isNative && !envConfig.isBackendConfigured) {
    return (
      <div className="bg-amber-950/90 border-b border-amber-600/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-medium font-sans">
            <strong>Android Configuration Notice:</strong> Backend URL not set. Native APK requests require a live HTTPS endpoint.
          </span>
        </div>
      </div>
    );
  }

  // 2. Reconnecting state (brief green confirmation)
  if (isReconnecting) {
    return (
      <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-4 py-1.5 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md animate-in fade-in duration-200">
        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
        <span className="font-medium font-sans">Back online — Live market quotes updated</span>
      </div>
    );
  }

  // 3. Offline state
  if (!isOnline) {
    return (
      <div className="bg-rose-950/95 border-b border-rose-500/40 text-rose-200 px-4 py-1.5 text-xs flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md animate-in slide-in-from-top duration-200">
        <WifiOff className="w-3.5 h-3.5 text-rose-400" />
        <span className="font-medium font-sans">
          You are offline — Live quotes paused. Orders disabled until connection is restored.
        </span>
      </div>
    );
  }

  return null;
};
