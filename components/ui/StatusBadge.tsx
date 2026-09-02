'use client'

interface StatusBadgeProps {
    status: 'current' | 'stale' | 'expired' | 'verified' | 'pending' | 'error'
    className?: string
}

const statusStyles = {
    current: 'bg-green-50 text-green-700 border-green-200',
    stale: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
    verified: 'bg-blue-50 text-blue-700 border-blue-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200',
    error: 'bg-red-50 text-red-700 border-red-200',
}

const statusLabels = {
    current: '✓ Current',
    stale: '⚠ Stale',
    expired: '✕ Expired',
    verified: '✓ Verified',
    pending: '⋯ Pending',
    error: '✕ Error',
}

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[status]} ${className}`}>
            {statusLabels[status]}
        </span>
    )
}