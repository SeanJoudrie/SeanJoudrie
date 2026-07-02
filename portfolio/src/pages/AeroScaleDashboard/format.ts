/* Shared formatters — one Intl instance each, reused everywhere. */
const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
const int = new Intl.NumberFormat('en-US')

export const fmtMoney = (n: number) => usd0.format(n)
export const fmtCompact = (n: number) => usdCompact.format(n)
export const fmtInt = (n: number) => int.format(Math.round(n))
export const fmtSignedPct = (x: number) => `${x < 0 ? '−' : '+'}${Math.abs(x * 100).toFixed(1)}%`
export const fmtPct = (x: number) => `${(x * 100).toFixed(1)}%`
/** 'Jun 26' → 'Jun ’26' */
export const fmtMonth = (label: string) => label.replace(' ', ' ’')
