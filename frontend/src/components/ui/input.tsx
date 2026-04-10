import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  errorMessage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <input
          id={id}
          type={type}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error && errorMessage ? `${id}-error` : undefined}
          className={cn(
            'w-full h-12 px-4 rounded-md text-base',
            'bg-background border border-border',
            'text-text-primary placeholder:text-text-muted',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            error && 'border-destructive focus:ring-destructive/20 focus:border-destructive',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted',
            className
          )}
          {...props}
        />
        {error && errorMessage && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-xs text-destructive mt-1"
          >
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
