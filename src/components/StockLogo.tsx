import React, { useState } from 'react';

const DOMAIN_MAP: Record<string, { domain: string; color: string }> = {
  RELIANCE: { domain: 'ril.com', color: 'from-blue-600 to-indigo-700' },
  TCS: { domain: 'tcs.com', color: 'from-sky-600 to-blue-800' },
  HDFCBANK: { domain: 'hdfcbank.com', color: 'from-blue-700 to-red-600' },
  INFY: { domain: 'infosys.com', color: 'from-blue-500 to-indigo-600' },
  ICICIBANK: { domain: 'icicibank.com', color: 'from-orange-600 to-red-700' },
  SBIN: { domain: 'sbi.co.in', color: 'from-cyan-600 to-blue-700' },
  BHARTIARTL: { domain: 'airtel.in', color: 'from-red-600 to-rose-700' },
  ITC: { domain: 'itcportal.com', color: 'from-amber-600 to-yellow-700' },
  LT: { domain: 'larsentoubro.com', color: 'from-yellow-600 to-amber-700' },
  AXISBANK: { domain: 'axisbank.com', color: 'from-rose-700 to-pink-800' },
  KOTAKBANK: { domain: 'kotak.com', color: 'from-red-600 to-red-800' },
  TATAMOTORS: { domain: 'tatamotors.com', color: 'from-blue-700 to-slate-800' },
  TMPV: { domain: 'tatamotors.com', color: 'from-blue-700 to-slate-800' },
  TMCV: { domain: 'tatamotors.com', color: 'from-blue-700 to-slate-800' },
  MARUTI: { domain: 'marutisuzuki.com', color: 'from-blue-600 to-red-600' },
  BAJFINANCE: { domain: 'bajajfinserv.in', color: 'from-blue-600 to-indigo-700' },
  ASIANPAINT: { domain: 'asianpaints.com', color: 'from-red-500 to-yellow-500' },
  HCLTECH: { domain: 'hcltech.com', color: 'from-blue-600 to-cyan-700' },
  SUNPHARMA: { domain: 'sunpharma.com', color: 'from-amber-500 to-orange-600' },
  TITAN: { domain: 'titancompany.in', color: 'from-stone-600 to-amber-700' },
  WIPRO: { domain: 'wipro.com', color: 'from-emerald-600 to-teal-700' },
  NTPC: { domain: 'ntpc.co.in', color: 'from-blue-600 to-emerald-600' },
  TATASTEEL: { domain: 'tatasteel.com', color: 'from-blue-700 to-cyan-800' },
  POWERGRID: { domain: 'powergrid.in', color: 'from-emerald-700 to-teal-800' },
  ADANIENT: { domain: 'adanienterprises.com', color: 'from-indigo-600 to-blue-700' },
  BAJAJFINSV: { domain: 'bajajfinserv.in', color: 'from-blue-600 to-indigo-700' },
  NESTLEIND: { domain: 'nestle.in', color: 'from-sky-700 to-blue-800' },
  ULTRACEMCO: { domain: 'ultratechcement.com', color: 'from-yellow-600 to-amber-700' },
  ONGC: { domain: 'ongcindia.com', color: 'from-red-600 to-rose-700' },
  'M&M': { domain: 'mahindra.com', color: 'from-red-600 to-red-800' },
  MM: { domain: 'mahindra.com', color: 'from-red-600 to-red-800' },
  HINDUNILVR: { domain: 'hul.co.in', color: 'from-blue-600 to-cyan-600' },
  ZOMATO: { domain: 'zomato.com', color: 'from-red-500 to-rose-600' },
  JIOFIN: { domain: 'jio.com', color: 'from-blue-600 to-red-500' },
};

interface StockLogoProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StockLogo: React.FC<StockLogoProps> = ({
  symbol,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const cleanSymbol = symbol.toUpperCase().replace(/\.(NS|BO)$/, '');
  const meta = DOMAIN_MAP[cleanSymbol];
  const domain = meta?.domain || `${cleanSymbol.toLowerCase()}.com`;
  const gradient = meta?.color || 'from-blue-600 to-slate-700';

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px] rounded-lg',
    md: 'w-10 h-10 text-xs rounded-xl',
    lg: 'w-12 h-12 text-sm rounded-2xl',
    xl: 'w-14 h-14 text-base rounded-2xl',
  }[size];

  const logoUrl = `https://unavatar.io/${domain}`;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center overflow-hidden border border-slate-700/80 bg-[#0d1322] shadow-sm ${sizeClasses} ${className}`}
    >
      {!hasError ? (
        <img
          src={logoUrl}
          alt={`${cleanSymbol} logo`}
          className="w-full h-full object-contain p-1.5 bg-white/95 transition-opacity duration-200"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white tracking-wider`}
        >
          {cleanSymbol.slice(0, 2)}
        </div>
      )}
    </div>
  );
};
