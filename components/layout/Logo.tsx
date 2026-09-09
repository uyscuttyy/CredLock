/**
 * CredLock wordmark. No logo mark yet, branding comes later.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-baseline gap-2.5">
      <span className="font-display text-[22px] font-bold leading-none text-bone">CredLock</span>
      {!compact && (
        <span className="hidden text-sm text-ash lg:inline">the double-pledge gate</span>
      )}
    </span>
  )
}
