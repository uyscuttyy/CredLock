/**
 * CredLock mark: a padlock whose keyhole is a chain link.
 * The lock is the financing gate; the link is the cross-chain record it guards.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="CredLock logo" role="img">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#0C6B4A" />
      <path
        d="M11 15v-3.5a5 5 0 0 1 10 0V15"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect x="8.5" y="14" width="15" height="11.5" rx="2.5" fill="#fff" />
      <circle cx="16" cy="18.2" r="2.1" stroke="#0C6B4A" strokeWidth="1.8" />
      <path d="M16 20.3v2.4" stroke="#0C6B4A" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-xl font-bold">CredLock</span>
      {!compact && (
        <span className="hidden text-sm text-brand-muted lg:inline">the double-pledge gate</span>
      )}
    </span>
  )
}
