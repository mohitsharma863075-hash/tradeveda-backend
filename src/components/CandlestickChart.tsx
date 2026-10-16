import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts';
import { Candle, EnrichedHolding, Order } from '../types';
import { formatINR, formatVolume, formatPercent } from '../utils/formatters';
import { AlertCircle, ShieldAlert, Target, TrendingUp, Info } from 'lucide-react';

interface CandlestickChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  isLoading?: boolean;
  error?: string | null;
  userHolding?: EnrichedHolding;
  orders?: Order[];
  currentPrice?: number;
  dataFreshness?: {
    isDelayed?: boolean;
    isDemo?: boolean;
    provider?: string;
  };
}

function parseToUnixSeconds(val: string | number): number {
  if (typeof val === 'number') {
    return val > 1e11 ? Math.floor(val / 1000) : Math.floor(val);
  }
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000);
}

function formatCandleDateTime(unixSeconds: number, tf: string): string {
  try {
    const d = new Date(unixSeconds * 1000);
    if (tf === '1D' || tf === '1W') {
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(unixSeconds);
  }
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  candles,
  symbol,
  timeframe,
  onTimeframeChange,
  isLoading = false,
  error = null,
  userHolding,
  orders = [],
  currentPrice,
  dataFreshness,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  // Hover state for interactive HUD
  const [hoveredCandle, setHoveredCandle] = useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'];

  // Clean, sort, and deduplicate candles ensuring strictly ascending timestamps
  const processedData = useMemo(() => {
    if (!candles || candles.length === 0) return { candles: [], volumes: [] };

    const parsed = candles
      .map(c => ({
        time: parseToUnixSeconds(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume) || 0,
      }))
      .filter(
        c =>
          !isNaN(c.time) &&
          !isNaN(c.open) &&
          !isNaN(c.high) &&
          !isNaN(c.low) &&
          !isNaN(c.close) &&
          c.high >= c.low
      )
      .sort((a, b) => a.time - b.time);

    const uniqueCandles: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[] = [];
    const uniqueVolumes: { time: number; value: number; color: string }[] = [];
    let lastTime = -Infinity;

    for (const item of parsed) {
      if (item.time > lastTime) {
        uniqueCandles.push({
          time: item.time,
          open: Number(item.open.toFixed(2)),
          high: Number(item.high.toFixed(2)),
          low: Number(item.low.toFixed(2)),
          close: Number(item.close.toFixed(2)),
          volume: item.volume,
        });
        uniqueVolumes.push({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? 'rgba(8, 153, 129, 0.45)' : 'rgba(242, 54, 69, 0.45)',
        });
        lastTime = item.time;
      }
    }

    return { candles: uniqueCandles, volumes: uniqueVolumes };
  }, [candles]);

  const latestCandle =
    processedData.candles.length > 0
      ? processedData.candles[processedData.candles.length - 1]
      : null;

  const displayCandle = hoveredCandle || latestCandle;
  const candleChange = displayCandle ? displayCandle.close - displayCandle.open : 0;
  const candleChangePct =
    displayCandle && displayCandle.open > 0 ? (candleChange / displayCandle.open) * 100 : 0;
  const isBullish = candleChange >= 0;

  // Initialize and update Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Destroy existing chart instance on re-render
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;

    // Create chart with authentic trading terminal dark theme
    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: 480,
      layout: {
        background: { type: ColorType.Solid, color: '#0b101d' }, // Dark navy/blue trading terminal background
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      },
      grid: {
        vertLines: {
          color: 'rgba(30, 41, 59, 0.65)', // Subtle dark blue square grid lines
          style: LineStyle.Solid,
        },
        horzLines: {
          color: 'rgba(30, 41, 59, 0.65)', // Subtle dark blue square grid lines
          style: LineStyle.Solid,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
        horzLine: {
          color: '#38bdf8',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#0284c7',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.08,
          bottom: 0.22, // Space reserved for volume histogram at bottom
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series: Green bullish, Red bearish, thin wicks
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',         // Green bullish candle body
      downColor: '#f23645',       // Red bearish candle body
      borderUpColor: '#089981',   // Green border
      borderDownColor: '#f23645', // Red border
      wickUpColor: '#089981',     // Thin upper/lower green wick
      wickDownColor: '#f23645',   // Thin upper/lower red wick
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.05,
      },
    });
    candleSeriesRef.current = candleSeries;

    // 2. Volume Histogram Series: bottom 20%
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay mode
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Populate data
    if (processedData.candles.length > 0) {
      candleSeries.setData(processedData.candles as any);
      volumeSeries.setData(processedData.volumes as any);

      // Fit chart view nicely
      chart.timeScale().fitContent();

      // 3. Trading Markers: BUY / SELL execution points (Requirement #21)
      if (orders && orders.length > 0) {
        const stockOrders = orders.filter(
          o => o.symbol.toUpperCase() === symbol.toUpperCase() && o.status === 'COMPLETED'
        );

        if (stockOrders.length > 0) {
          const markers: any[] = [];
          for (const ord of stockOrders) {
            const ordSec = parseToUnixSeconds(ord.createdAt);
            // Snap to nearest candle timestamp
            let closestCandleTime = processedData.candles[processedData.candles.length - 1].time;
            let minDiff = Infinity;
            for (const cand of processedData.candles) {
              const diff = Math.abs(cand.time - ordSec);
              if (diff < minDiff) {
                minDiff = diff;
                closestCandleTime = cand.time;
              }
            }

            markers.push({
              time: closestCandleTime,
              position: ord.type === 'BUY' ? 'belowBar' : 'aboveBar',
              color: ord.type === 'BUY' ? '#10b981' : '#f23645',
              shape: ord.type === 'BUY' ? 'arrowUp' : 'arrowDown',
              text: `${ord.type} ${ord.quantity}x @ ₹${ord.price}`,
            });
          }

          if (markers.length > 0) {
            markers.sort((a, b) => a.time - b.time);
            try {
              createSeriesMarkers(candleSeries, markers);
            } catch (err) {
              console.warn('Failed to attach order markers:', err);
            }
          }
        }
      }

      // 4. Horizontal Position Price Lines (ENTRY, STOP LOSS, TARGET) (Requirement #21)
      priceLinesRef.current = [];
      if (userHolding && userHolding.quantity > 0) {
        const entryPrice = userHolding.averageBuyPrice;
        const targetPrice = Number((entryPrice * 1.05).toFixed(2)); // +5% target
        const stopLossPrice = Number((entryPrice * 0.95).toFixed(2)); // -5% stop loss

        // TARGET Line (Green dashed)
        const targetLine = candleSeries.createPriceLine({
          price: targetPrice,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TARGET (+5%): ₹${targetPrice}`,
        });
        priceLinesRef.current.push(targetLine);

        // ENTRY Line (Cyan solid)
        const entryLine = candleSeries.createPriceLine({
          price: entryPrice,
          color: '#38bdf8',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `ENTRY: ₹${entryPrice}`,
        });
        priceLinesRef.current.push(entryLine);

        // STOP LOSS Line (Red dashed)
        const stopLossLine = candleSeries.createPriceLine({
          price: stopLossPrice,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `STOP LOSS (-5%): ₹${stopLossPrice}`,
        });
        priceLinesRef.current.push(stopLossLine);
      }
    }

    // Subscribe to crosshair hover for real-time OHLC HUD tooltip
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredCandle(null);
        return;
      }

      const candleData = param.seriesData.get(candleSeries) as any;
      if (candleData && candleData.open !== undefined) {
        const volData = param.seriesData.get(volumeSeries) as any;
        setHoveredCandle({
          time: Number(param.time),
          open: candleData.open,
          high: candleData.high,
          low: candleData.low,
          close: candleData.close,
          volume: volData?.value || 0,
        });
      } else {
        setHoveredCandle(null);
      }
    });

    // Auto-resize observer
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && chartRef.current) {
        const { width } = entries[0].contentRect;
        if (width > 0) {
          chartRef.current.applyOptions({ width });
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [processedData, symbol, timeframe, userHolding, orders]);

  return (
    <div className="relative w-full bg-[#0b101d] border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl font-mono-num">
      {/* Top Header Bar: Stock Badge, Interactive OHLC HUD & Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-800 bg-[#0e1526]">
        {/* Left: Interactive OHLC Values */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm tracking-tight">{symbol}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
              NSE
            </span>
          </div>

          {displayCandle ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-400">
              <div className="text-slate-300">
                <span className="text-slate-500 mr-1">Time:</span>
                <span className="font-medium text-slate-200">
                  {formatCandleDateTime(displayCandle.time, timeframe)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 mr-1">O:</span>
                <span className="font-medium text-slate-200">{formatINR(displayCandle.open)}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1">H:</span>
                <span className="font-medium text-slate-200">{formatINR(displayCandle.high)}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1">L:</span>
                <span className="font-medium text-slate-200">{formatINR(displayCandle.low)}</span>
              </div>
              <div>
                <span className="text-slate-500 mr-1">C:</span>
                <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatINR(displayCandle.close)}
                </span>
              </div>
              <div className="hidden sm:inline">
                <span className="text-slate-500 mr-1">Vol:</span>
                <span className="text-slate-300 font-medium">{formatVolume(displayCandle.volume)}</span>
              </div>
              <div className={`font-semibold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isBullish ? '+' : ''}{formatINR(candleChange)} ({formatPercent(candleChangePct)})
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Crosshair over candles to view exact OHLC</span>
          )}
        </div>

        {/* Right: Timeframe Buttons [1D] [1W] [1M] [3M] [6M] [1Y] [5Y] */}
        <div className="flex items-center gap-1 bg-[#131b2e] p-1 rounded-xl border border-slate-800">
          {TIMEFRAMES.map(tf => {
            const isSelected = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="relative w-full h-[480px]">
        {/* Loading State (Requirement #17) */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0b101d]/85 backdrop-blur-xs">
            <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="mt-2.5 text-xs text-slate-300 font-bold">Loading chart...</span>
          </div>
        )}

        {/* Error State (Requirement #19) */}
        {!isLoading && error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#0b101d]/90">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
            <h3 className="font-bold text-slate-200 text-sm">Unable to load market data</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
          </div>
        )}

        {/* Empty State (Requirement #18) */}
        {!isLoading && !error && processedData.candles.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#0b101d]/90">
            <Info className="w-10 h-10 text-slate-500 mb-2" />
            <h3 className="font-bold text-slate-300 text-sm">No historical market data available</h3>
            <p className="text-xs text-slate-500 mt-1">Please try selecting another timeframe.</p>
          </div>
        )}

        {/* Lightweight Charts Canvas Target */}
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Freshness Badge (Requirement #14) */}
        <div className="absolute top-3 right-3 pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-[10px] font-bold text-amber-300 shadow-md backdrop-blur-xs">
            {dataFreshness?.isDemo
              ? 'DEMO DATA'
              : dataFreshness?.isDelayed !== false
              ? 'DELAYED MARKET DATA (NSE ~15m)'
              : 'LIVE MARKET DATA'}
          </span>
        </div>

        {/* Active Position Overlay Legend (Requirement #21) */}
        {userHolding && userHolding.quantity > 0 && (
          <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] backdrop-blur-xs shadow-md">
            <div className="flex items-center gap-1 text-sky-400">
              <span className="w-2.5 h-1 bg-sky-400 rounded-full"></span>
              <span>ENTRY: {formatINR(userHolding.averageBuyPrice)}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-1 bg-emerald-400 rounded-full"></span>
              <span>TARGET (+5%): {formatINR(userHolding.averageBuyPrice * 1.05)}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-1 bg-rose-400 rounded-full"></span>
              <span>STOP LOSS (-5%): {formatINR(userHolding.averageBuyPrice * 0.95)}</span>
            </div>
          </div>
        )}

        {/* Volume Label at Bottom Left */}
        <div className="absolute bottom-5 left-3 pointer-events-none text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Volume Histogram
        </div>
      </div>
    </div>
  );
};
