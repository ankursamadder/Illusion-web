import { forwardRef } from 'react'
import clsx from 'clsx'

const baseStyles =
  'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-illusion-pink/50 disabled:pointer-events-none disabled:opacity-50'

const variants = {
  primary:
    'bg-illusion-black text-illusion-white shadow-soft hover:-translate-y-0.5 hover:shadow-card',
  secondary:
    'border border-illusion-black/10 bg-illusion-white text-illusion-black shadow-soft hover:-translate-y-0.5',
  ghost: 'text-illusion-black hover:bg-illusion-blush/40',
}

const sizes = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Button = forwardRef(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export default Button
