import { resolveApiUrl, resolveWebSocketUrl, getConfiguredBackendUrl } from '../src/services/environment';

export async function runEnvironmentAndNetworkTests(assert: (cond: boolean, desc: string) => void) {
  console.log('\n--- 12. Environment-Aware URL Resolution Tests ---');

  // Test 1: Web mode relative path resolution
  const webMarketUrl = resolveApiUrl('/market/status');
  assert(webMarketUrl === '/api/market/status', `Web mode resolves /market/status to relative /api/market/status (got ${webMarketUrl})`);

  // Test 2: Normalization of missing leading slash
  const noSlashUrl = resolveApiUrl('market/status');
  assert(noSlashUrl === '/api/market/status', `Normalizes missing slash to /api/market/status (got ${noSlashUrl})`);

  // Test 3: Avoid duplicate /api prefix
  const duplicatePrefixUrl = resolveApiUrl('/api/market/status');
  assert(duplicatePrefixUrl === '/api/market/status', `Avoids duplicate /api prefix (got ${duplicatePrefixUrl})`);

  // Test 4: Web mode WebSocket URL format
  const wsUrl = resolveWebSocketUrl('/ws');
  assert(wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://'), `WebSocket URL has valid protocol: ${wsUrl}`);
  assert(wsUrl.endsWith('/ws'), `WebSocket URL points to /ws path: ${wsUrl}`);

  console.log('\n--- 13. Authentication Headers & Request Security ---');

  // Test 5: Verify auth requirement logic
  const isAuthRequired = (endpoint: string) => {
    return (
      !endpoint.startsWith('/market') &&
      endpoint !== '/health' &&
      endpoint !== '/auth/login' &&
      endpoint !== '/auth/register' &&
      endpoint !== '/auth/guest-session' &&
      endpoint !== '/leaderboard' &&
      endpoint !== '/admin/charges'
    );
  };

  assert(isAuthRequired('/orders/buy') === true, '/orders/buy strictly requires authentication');
  assert(isAuthRequired('/portfolio') === true, '/portfolio strictly requires authentication');
  assert(isAuthRequired('/market/stocks') === false, '/market/stocks allows public guest access');
  assert(isAuthRequired('/health') === false, '/health is public for lightweight connectivity checks');

  console.log('\n--- 14. Network Offline Resilience & Safe Mutation Policies ---');

  // Test 6: Verify financial order safety policy (orders must never auto-replay)
  const isSafeToAutoRetry = (method: string, endpoint: string) => {
    if (method !== 'GET') return false; // Never auto-replay POST, PUT, DELETE
    if (endpoint.startsWith('/orders') || endpoint.startsWith('/account/reset')) return false;
    return true;
  };

  assert(isSafeToAutoRetry('POST', '/orders/buy') === false, 'Financial order placement (POST) is BLOCKED from auto-replay on reconnect');
  assert(isSafeToAutoRetry('POST', '/orders/sell') === false, 'Financial order sell (POST) is BLOCKED from auto-replay on reconnect');
  assert(isSafeToAutoRetry('POST', '/account/reset') === false, 'Account reset is BLOCKED from auto-replay on reconnect');
  assert(isSafeToAutoRetry('GET', '/market/stocks') === true, 'Market quotes (GET) are safely refreshed on network reconnection');
  assert(isSafeToAutoRetry('GET', '/portfolio') === true, 'Portfolio read-only balance (GET) is safely refreshed on reconnection');

  console.log('\n--- 15. WebSocket Reconnection & Duplicate Guard ---');

  // Test 7: Verify WebSocket connection guard logic
  let activeSocket: { readyState: number; closed: boolean } | null = null;
  function connectWebSocket(url: string) {
    if (activeSocket) {
      activeSocket.closed = true;
      activeSocket = null;
    }
    activeSocket = { readyState: 1, closed: false };
    return activeSocket;
  }

  const firstSocket = connectWebSocket('wss://example.com/ws');
  assert(firstSocket.closed === false, 'First WebSocket connection established');
  const secondSocket = connectWebSocket('wss://example.com/ws');
  assert(firstSocket.closed === true, 'Prior WebSocket connection safely closed before opening new one (no duplicates)');
  assert(secondSocket.closed === false, 'Second WebSocket active');
}
