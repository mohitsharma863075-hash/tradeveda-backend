import { SimulatedChargesConfig } from '../../types';
import { db } from '../../db/database';

export interface ChargesBreakdown {
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  gst: number;
  stampDuty: number;
  total: number;
}

export class ChargesCalculator {
  public static calculate(
    type: 'BUY' | 'SELL',
    totalValue: number,
    customConfig?: SimulatedChargesConfig
  ): ChargesBreakdown {
    const config = customConfig || db.getChargesConfig();

    // 1. Brokerage (e.g. 0.03% or ₹20, whichever is lower)
    const rawBrokerage = totalValue * config.brokerageRate;
    const brokerage = Number(Math.min(rawBrokerage, config.brokerageMaxPerOrder).toFixed(2));

    // 2. STT (0.1% on turnover)
    const stt = Number((totalValue * config.sttDeliveryRate).toFixed(2));

    // 3. Exchange transaction charges (0.00345%)
    const exchangeCharges = Number((totalValue * config.exchangeTurnoverRate).toFixed(2));

    // 4. GST (18% on brokerage + exchange charges)
    const gst = Number(((brokerage + exchangeCharges) * config.gstRate).toFixed(2));

    // 5. Stamp Duty (0.015% on BUY only)
    const stampDuty = type === 'BUY'
      ? Number((totalValue * config.stampDutyRate).toFixed(2))
      : 0;

    const total = Number((brokerage + stt + exchangeCharges + gst + stampDuty).toFixed(2));

    return {
      brokerage,
      stt,
      exchangeCharges,
      gst,
      stampDuty,
      total,
    };
  }
}
