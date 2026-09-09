'use client'

export function Stamp({ value }: { value: string }) {
  const allow = value === 'ALLOW' || value === 'SUCCESS' || value === 'CLEAR'
  const blocked = value === 'BLOCK' || value === 'DENY' || value === 'REVERTED' || value === 'ENCUMBERED'
  const cls = allow
    ? 'border-allow text-allow'
    : blocked
      ? 'border-block text-block'
      : 'border-ash/40 text-ash'
  return <span className={`verdict-stamp font-mono ${cls}`}>{value}</span>
}
