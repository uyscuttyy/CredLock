'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, hover = true, className = '', ...props }, ref) => {
    const baseClasses = `carbon-panel ${hover ? 'hover:border-bullion/40' : ''} transition-all duration-300 ${className}`
    
    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'