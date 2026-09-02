// Format number with Slovak locale
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('sk-SK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Format area with unit
export function formatArea(value: number): string {
  return `${formatNumber(value)} m²`;
}

// Format energy with unit
export function formatEnergy(value: number): string {
  if (value >= 1000000) return `${formatNumber(value / 1000000, 1)} GWh`;
  if (value >= 1000) return `${formatNumber(value / 1000, 1)} MWh`;
  return `${formatNumber(value)} kWh`;
}

// Format percentage
export function formatPercent(value: number): string {
  return `${formatNumber(value)} %`;
}

// Odstráni diakritiku (š → s, ľ → l, …). Štandardné fonty jsPDF slovenskú diakritiku nevykreslia.
export function bezDiakritiky(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Format currency
export function formatCurrency(value: number): string {
  return value.toLocaleString('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
