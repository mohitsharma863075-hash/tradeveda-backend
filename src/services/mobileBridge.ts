import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

export type BackActionType =
  | 'BLOCKED_SUBMITTING'
  | 'CLOSE_CONFIRM_MODAL'
  | 'CLOSE_ORDER_MODAL'
  | 'EXIT_DUEL_ROOM'
  | 'NAVIGATE_BACK_STOCK'
  | 'NAVIGATE_TO_DASHBOARD'
  | 'PROMPT_DOUBLE_BACK'
  | 'EXIT_APP';

export interface BackButtonState {
  isSubmittingTrade: boolean;
  isConfirmModalOpen: boolean;
  isOrderModalOpen: boolean;
  activeTab: string;
  isInsideDuelRoom: boolean;
  lastBackPressTime: number;
}

/**
 * Pure decision function for Android hardware and gesture back navigation.
 */
export function determineBackAction(state: BackButtonState, now: number = Date.now()): {
  action: BackActionType;
  updatedPressTime: number;
} {
  // 1. Block back navigation while an order submission is in flight to prevent corrupted states
  if (state.isSubmittingTrade) {
    return { action: 'BLOCKED_SUBMITTING', updatedPressTime: state.lastBackPressTime };
  }

  // 2. Close inner trade confirmation modal first
  if (state.isConfirmModalOpen) {
    return { action: 'CLOSE_CONFIRM_MODAL', updatedPressTime: state.lastBackPressTime };
  }

  // 3. Close order modal
  if (state.isOrderModalOpen) {
    return { action: 'CLOSE_ORDER_MODAL', updatedPressTime: state.lastBackPressTime };
  }

  // 4. If viewing single stock detail, navigate back to markets
  if (state.activeTab === 'stock') {
    return { action: 'NAVIGATE_BACK_STOCK', updatedPressTime: state.lastBackPressTime };
  }

  // 5. If inside an active 1v1 duel room, return to duel room list and clean up WebSocket
  if (state.activeTab === 'duel' && state.isInsideDuelRoom) {
    return { action: 'EXIT_DUEL_ROOM', updatedPressTime: state.lastBackPressTime };
  }

  // 6. If on any other tab besides dashboard, navigate back to root dashboard
  if (state.activeTab !== 'dashboard') {
    return { action: 'NAVIGATE_TO_DASHBOARD', updatedPressTime: state.lastBackPressTime };
  }

  // 7. On root dashboard: Safe double-back within 2000ms to exit
  if (now - state.lastBackPressTime <= 2000) {
    return { action: 'EXIT_APP', updatedPressTime: now };
  }

  return { action: 'PROMPT_DOUBLE_BACK', updatedPressTime: now };
}

/**
 * Initializes mobile platform settings (Status Bar, Splash Screen, Keyboard).
 */
export async function initMobileNativeUI(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Configure Status Bar for dark theme
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0b0f19' });
  } catch (err) {
    console.warn('StatusBar configuration not available:', err);
  }

  try {
    // 2. Configure Keyboard mode for financial forms
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
    await Keyboard.setStyle({ style: KeyboardStyle.Dark });
  } catch (err) {
    console.warn('Keyboard configuration not available:', err);
  }

  try {
    // 3. Dismiss Splash Screen safely
    await SplashScreen.hide();
  } catch (err) {
    console.warn('SplashScreen hide not available:', err);
  }
}

/**
 * Exits the native Android application.
 */
export async function exitNativeApp(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CapApp.exitApp();
    } catch {
      // ignore
    }
  }
}
