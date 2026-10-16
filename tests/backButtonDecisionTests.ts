import { determineBackAction, BackButtonState } from '../src/services/mobileBridge';

export function runBackButtonDecisionTests(assert: (cond: boolean, desc: string) => void) {
  console.log('\n--- 16. Android Hardware & Gesture Back Button Decision Engine ---');

  const baseState: BackButtonState = {
    isSubmittingTrade: false,
    isConfirmModalOpen: false,
    isOrderModalOpen: false,
    activeTab: 'dashboard',
    isInsideDuelRoom: false,
    lastBackPressTime: 0,
  };

  // Test 1: In-flight trade protection (must block back button)
  const busyResult = determineBackAction({ ...baseState, isSubmittingTrade: true });
  assert(busyResult.action === 'BLOCKED_SUBMITTING', 'Blocks back button when order submission is in flight (prevents state corruption)');

  // Test 2: Confirmation modal has highest close priority
  const confirmResult = determineBackAction({ ...baseState, isOrderModalOpen: true, isConfirmModalOpen: true });
  assert(confirmResult.action === 'CLOSE_CONFIRM_MODAL', 'Closes nested trade confirmation dialog first before closing parent order modal');

  // Test 3: Order modal close priority
  const orderResult = determineBackAction({ ...baseState, isOrderModalOpen: true, isConfirmModalOpen: false });
  assert(orderResult.action === 'CLOSE_ORDER_MODAL', 'Closes order modal when open');

  // Test 4: Stock detail page back navigation
  const stockResult = determineBackAction({ ...baseState, activeTab: 'stock' });
  assert(stockResult.action === 'NAVIGATE_BACK_STOCK', 'Navigates back from StockDetailPage to markets');

  // Test 5: Duel room back navigation (must exit room back to room list)
  const duelRoomResult = determineBackAction({ ...baseState, activeTab: 'duel', isInsideDuelRoom: true });
  assert(duelRoomResult.action === 'EXIT_DUEL_ROOM', 'Exits 1v1 duel room to duel list and triggers clean WebSocket disconnect');

  // Test 6: Non-dashboard tabs navigate back to root dashboard
  const portfolioResult = determineBackAction({ ...baseState, activeTab: 'portfolio' });
  assert(portfolioResult.action === 'NAVIGATE_TO_DASHBOARD', 'Navigates from portfolio tab back to dashboard root');

  const marketsResult = determineBackAction({ ...baseState, activeTab: 'markets' });
  assert(marketsResult.action === 'NAVIGATE_TO_DASHBOARD', 'Navigates from markets tab back to dashboard root');

  // Test 7: Double-back-to-exit on root dashboard
  const firstPressTime = 10000;
  const firstPress = determineBackAction({ ...baseState, activeTab: 'dashboard', lastBackPressTime: 0 }, firstPressTime);
  assert(firstPress.action === 'PROMPT_DOUBLE_BACK', 'First back press on root dashboard prompts user with floating toast');
  assert(firstPress.updatedPressTime === firstPressTime, 'Records timestamp of first back press');

  // Second press within 1200ms -> should exit app
  const secondPressWithinWindow = determineBackAction(
    { ...baseState, activeTab: 'dashboard', lastBackPressTime: firstPressTime },
    firstPressTime + 1200
  );
  assert(secondPressWithinWindow.action === 'EXIT_APP', 'Second back press within 2000ms safely confirms exitNativeApp()');

  // Second press after 2500ms -> expired window, should prompt again
  const secondPressExpired = determineBackAction(
    { ...baseState, activeTab: 'dashboard', lastBackPressTime: firstPressTime },
    firstPressTime + 2500
  );
  assert(secondPressExpired.action === 'PROMPT_DOUBLE_BACK', 'Back press after 2000ms window expires re-prompts rather than exiting prematurely');
}
