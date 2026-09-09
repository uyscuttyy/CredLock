/**
 * CredLock mark: a padlock whose keyhole is a chain link, struck in bullion.
 * The lock is the financing gate; the link is the cross-chain record it guards.
 */
export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="CredLock logo" role="img">
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#E3A82B" />
      <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#cl-sheen)" />
      <path
        d="M11 15v-3.5a5 5 0 0 1 10 0V15"
        stroke="#0B0D0E"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect x="8.5" y="14" width="15" height="11.5" rx="2.5" fill="#0B0D0E" />
      <circle cx="16" cy="18.2" r="2.1" stroke="#E3A82B" strokeWidth="1.8" />
      <path d="M16 20.3v2.4" stroke="#E3A82B" strokeWidth="1.8" strokeLinecap="round" />
      <defs>
        <linearGradient id="cl-sheen" x1="2" y1="2" x2="30" y2="30">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[22px] leading-none text-bone">CredLock</span>
      {!compact && (
        <span className="hidden text-sm text-ash lg:inline">the double-pledge gate</span>
      )}
    </span>
  )
}
