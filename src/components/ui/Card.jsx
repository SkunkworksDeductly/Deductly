import React from 'react'

export const Card = ({
  children,
  className = '',
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-border-light bg-white text-text-primary shadow-md ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h2 className={`text-2xl font-semibold ${className}`}>
      {children}
    </h2>
  )
}

export const CardDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-text-secondary ${className}`}>
      {children}
    </p>
  )
}

export const CardContent = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`mt-6 ${className}`}>
      {children}
    </div>
  )
}

export const StatCard = ({ label, value, variant = 'default', className = '' }) => {
  const variantColors = {
    default: 'bg-accent-lavender/20',
    success: 'bg-accent-mint/20',
    primary: 'bg-primary/20',
    warning: 'bg-accent-warning-bg'
  }

  return (
    <div className={`${variantColors[variant]} border border-border-light rounded-xl p-4 text-center ${className}`}>
      <p className="text-sm text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  )
}
