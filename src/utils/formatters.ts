/**
 * Format a number as Indian Rupees (INR)
 * Example: 1000000 -> ₹10,00,000.00
 */
export function formatINR(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
}

/**
 * Format volume in Indian units (Lakhs, Crores, K)
 */
export function formatVolume(volume: number | undefined | null): string {
  if (!volume || isNaN(volume)) return '0';
  if (volume >= 10000000) {
    return `${(volume / 10000000).toFixed(2)} Cr`;
  }
  if (volume >= 100000) {
    return `${(volume / 100000).toFixed(2)} L`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)} K`;
  }
  return volume.toLocaleString('en-IN');
}

/**
 * Format percentage with + / - sign
 */
export function formatPercent(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '0.00%';
  }
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}

/**
 * Format timestamp into readable Indian Standard Time
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
