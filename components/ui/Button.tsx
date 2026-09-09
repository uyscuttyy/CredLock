'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', isLoading = false, className = '', ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-sans font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-bullion focus-visible:ring-offset-2 focus-visible:ring-offset-carbon-950 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-bullion text-carbon-950 hover:bg-bullion-pale active:bg-bullion-deep',
      secondary:
        'bg-carbon-800 text-bone border border-white/15 hover:border-bullion/60 hover:text-bullion-pale',
      outline:
        'border border-bullion/70 text-bullion hover:bg-bullion hover:text-carbon-950',
      ghost: 'text-ash hover:text-bone hover:bg-white/5',
      danger:
        'border border-block/70 text-block hover:bg-block hover:text-carbon-950',
    }

    const sizes = {
      sm: 'px-4 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base',
    }

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

    const content = isLoading ? (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      </>
    ) : children

    return (
      <button ref={ref} className={classes} disabled={isLoading || props.disabled} {...props}>
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'
