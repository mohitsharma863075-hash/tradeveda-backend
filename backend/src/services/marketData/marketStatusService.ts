import { MarketStatusInfo } from '../../types';

export class MarketStatusService {
  /**
   * Calculates current Indian Stock Market status based on IST (UTC+5:30)
   */
  public static getMarketStatus(): MarketStatusInfo {
    // Current UTC time
    const now = new Date();
    // Convert to IST (UTC + 5 hours 30 mins)
    const utcMillis = now.getTime() + now.getTimezoneOffset() * 60000;
    const istOffsetMillis = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utcMillis + istOffsetMillis);

    const dayOfWeek = istDate.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    const timeStringIST = istDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // NSE & BSE Timings:
    // Pre-market: 09:00 - 09:15 (540 - 555)
    // Regular Market Open: 09:15 - 15:30 (555 - 930)
    // Post-market: 15:30 - 16:00 (930 - 960)
    // Closed: Remaining times and weekends

    if (isWeekend) {
      return {
        status: 'MARKET CLOSED',
        exchange: 'NSE',
        currentTimeIST: `${timeStringIST} IST`,
        isOpen: false,
        message: 'Markets are closed on weekends. Opens Monday at 09:15 AM IST.',
        nextEvent: 'Pre-market opens Monday 09:00 AM IST',
        tradingHours: '09:15 AM - 03:30 PM IST (Mon-Fri)',
      };
    }

    if (totalMinutes >= 540 && totalMinutes < 555) {
      return {
        status: 'PRE-MARKET',
        exchange: 'NSE',
        currentTimeIST: `${timeStringIST} IST`,
        isOpen: false,
        message: 'Pre-market session active. Regular trading starts at 09:15 AM IST.',
        nextEvent: 'Normal trading begins in ' + (555 - totalMinutes) + ' min',
        tradingHours: '09:15 AM - 03:30 PM IST (Mon-Fri)',
      };
    }

    if (totalMinutes >= 555 && totalMinutes < 930) {
      return {
        status: 'MARKET OPEN',
        exchange: 'NSE',
        currentTimeIST: `${timeStringIST} IST`,
        isOpen: true,
        message: 'Regular market trading session is live.',
        nextEvent: 'Market closes at 03:30 PM IST',
        tradingHours: '09:15 AM - 03:30 PM IST (Mon-Fri)',
      };
    }

    if (totalMinutes >= 930 && totalMinutes < 960) {
      return {
        status: 'POST-MARKET',
        exchange: 'NSE',
        currentTimeIST: `${timeStringIST} IST`,
        isOpen: false,
        message: 'Post-market closing session (closing price determination).',
        nextEvent: 'Markets close completely at 04:00 PM IST',
        tradingHours: '09:15 AM - 03:30 PM IST (Mon-Fri)',
      };
    }

    return {
      status: 'MARKET CLOSED',
      exchange: 'NSE',
      currentTimeIST: `${timeStringIST} IST`,
      isOpen: false,
      message: 'Indian markets are currently closed. Showing latest closing prices.',
      nextEvent: 'Pre-market opens next trading day at 09:00 AM IST',
      tradingHours: '09:15 AM - 03:30 PM IST (Mon-Fri)',
    };
  }
}
