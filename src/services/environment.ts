import { Capacitor } from '@capacitor/core';

export interface EnvironmentConfig {
  isNative: boolean;
  platform: 'web' | 'android' | 'ios';
  apiBaseUrl: string;
  wsBaseUrl: string;
  isBackendConfigured: boolean;
  configurationError: string | null;
}

/**
 * Returns the raw configured backend URL from build-time env or local storage override.
 */
export function getConfiguredBackendUrl(): string | null {
  // 1. Build-time Vite env var
  const envUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Optional runtime override (useful for dev/debugging on physical Android devices)
  try {
    const localOverride = localStorage.getItem('tradeveda_custom_backend_url');
    if (localOverride && localOverride.trim()) {
      return localOverride.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore local storage errors
  }

  return null;
}

/**
 * Sets or clears the custom backend URL override.
 */
export function setCustomBackendUrl(url: string | null): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem('tradeveda_custom_backend_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('tradeveda_custom_backend_url');
    }
  } catch {
    // ignore
  }
}

/**
 * Returns the current platform ('web', 'android', or 'ios').
 */
export function getAppPlatform(): 'web' | 'android' | 'ios' {
  const p = Capacitor.getPlatform();
  if (p === 'android') return 'android';
  if (p === 'ios') return 'ios';
  return 'web';
}

/**
 * Returns true if running natively inside an Android or iOS Capacitor container.
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Resolves the full REST API URL for a given endpoint.
 *
 * Examples:
 * - In web: resolveApiUrl('/market/status') => '/api/market/status'
 * - In native with VITE_BACKEND_URL='https://backend.example.com':
 *   resolveApiUrl('/market/status') => 'https://backend.example.com/api/market/status'
 */
export function resolveApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetPath = cleanEndpoint.startsWith('/api/')
    ? cleanEndpoint
    : cleanEndpoint === '/api'
    ? '/api'
    : `/api${cleanEndpoint}`;

  if (!isNativeApp()) {
    // In web development & browser preview: use same-origin relative path
    return targetPath;
  }

  const backendUrl = getConfiguredBackendUrl();
  if (!backendUrl) {
    throw new Error(
      'TradeVeda Android configuration error: No verified backend URL configured. ' +
      'Please specify VITE_BACKEND_URL (e.g. https://your-server.run.app) before building for Android.'
    );
  }

  // Enforce HTTPS in native Android
  const secureBackendUrl = backendUrl.replace(/^http:\/\//i, 'https://');
  return `${secureBackendUrl}${targetPath}`;
}

/**
 * Resolves the full WebSocket URL for real-time multiplayer duel sync.
 *
 * Examples:
 * - In web: resolveWebSocketUrl('/ws') => 'wss://example.com/ws' (or 'ws://localhost:3000/ws')
 * - In native: resolveWebSocketUrl('/ws') => 'wss://backend.example.com/ws'
 */
export function resolveWebSocketUrl(path = '/ws'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (!isNativeApp()) {
    if (typeof window === 'undefined') return `ws://localhost:3000${cleanPath}`;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${cleanPath}`;
  }

  const backendUrl = getConfiguredBackendUrl();
  if (!backendUrl) {
    throw new Error(
      'TradeVeda Android configuration error: No verified backend URL configured for WebSockets. ' +
      'Please specify VITE_BACKEND_URL.'
    );
  }

  // Convert http/https to ws/wss
  const wsProtocol = backendUrl.toLowerCase().startsWith('http://') ? 'ws://' : 'wss://';
  const hostAndPort = backendUrl.replace(/^https?:\/\//i, '');

  return `${wsProtocol}${hostAndPort}${cleanPath}`;
}

/**
 * Returns comprehensive environment information.
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const isNative = isNativeApp();
  const platform = getAppPlatform();
  const configuredBackend = getConfiguredBackendUrl();

  let apiBaseUrl = '/api';
  let wsBaseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    : 'ws://localhost:3000/ws';

  let isBackendConfigured = true;
  let configurationError: string | null = null;

  if (isNative) {
    if (configuredBackend) {
      apiBaseUrl = `${configuredBackend}/api`;
      const wsProtocol = configuredBackend.toLowerCase().startsWith('http://') ? 'ws://' : 'wss://';
      const hostAndPort = configuredBackend.replace(/^https?:\/\//i, '');
      wsBaseUrl = `${wsProtocol}${hostAndPort}/ws`;
    } else {
      isBackendConfigured = false;
      configurationError =
        'Native Android requires a verified backend URL (VITE_BACKEND_URL). ' +
        'Set your deployed backend URL in the environment before generating the release APK/AAB.';
    }
  }

  return {
    isNative,
    platform,
    apiBaseUrl,
    wsBaseUrl,
    isBackendConfigured,
    configurationError,
  };
}

/**
 * Performs a lightweight health check to test REST API connectivity.
 */
export async function checkBackendHealth(timeoutMs = 4000): Promise<{ ok: boolean; status?: string; error?: string }> {
  try {
    const url = resolveApiUrl('/health');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, status: data.status || 'ok' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Connection failed' };
  }
}
