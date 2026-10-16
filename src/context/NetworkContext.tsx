import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';

interface NetworkContextType {
  isOnline: boolean;
  connectionType: string;
  isReconnecting: boolean;
  registerReadOnlyRefresh: (fn: () => void | Promise<void>) => () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  // Set of read-only refresh functions (Dashboard, Markets, Portfolio quotes)
  const refreshCallbacksRef = useRef<Set<() => void | Promise<void>>>(new Set());
  const prevOnlineRef = useRef<boolean>(true);

  // Safe read-only subscriber
  const registerReadOnlyRefresh = useCallback((fn: () => void | Promise<void>) => {
    refreshCallbacksRef.current.add(fn);
    return () => {
      refreshCallbacksRef.current.delete(fn);
    };
  }, []);

  const triggerSafeRefresh = useCallback(() => {
    setIsReconnecting(true);
    // Dispatch custom DOM event for any standalone listeners
    window.dispatchEvent(new CustomEvent('tradeveda:network_reconnected'));

    // Execute registered safe read-only fetches (never mutates or replays orders)
    refreshCallbacksRef.current.forEach(callback => {
      try {
        const result = callback();
        if (result && typeof (result as any).catch === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      } catch {
        // ignore individual read errors
      }
    });

    const timer = setTimeout(() => {
      setIsReconnecting(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Initial check using Capacitor Network
    Network.getStatus().then((status: ConnectionStatus) => {
      if (!mounted) return;
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);
      prevOnlineRef.current = status.connected;
    }).catch(() => {
      if (!mounted) return;
      // Fallback to browser navigator
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
      prevOnlineRef.current = online;
    });

    // 2. Capacitor native listener
    const networkListenerPromise = Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      if (!mounted) return;
      const justCameOnline = !prevOnlineRef.current && status.connected;
      prevOnlineRef.current = status.connected;
      setIsOnline(status.connected);
      setConnectionType(status.connectionType);

      if (justCameOnline) {
        triggerSafeRefresh();
      }
    });

    // 3. Standard browser window listeners (fallback for web)
    const handleBrowserOnline = () => {
      if (!mounted) return;
      if (!prevOnlineRef.current) {
        prevOnlineRef.current = true;
        setIsOnline(true);
        triggerSafeRefresh();
      }
    };

    const handleBrowserOffline = () => {
      if (!mounted) return;
      prevOnlineRef.current = false;
      setIsOnline(false);
    };

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
      networkListenerPromise.then(handle => handle.remove()).catch(() => {});
    };
  }, [triggerSafeRefresh]);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        connectionType,
        isReconnecting,
        registerReadOnlyRefresh,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetworkStatus(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }
  return context;
}
