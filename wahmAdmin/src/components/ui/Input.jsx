import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(
  (
    {
      label,
      helperText,
      error,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <label className="flex w-full flex-col gap-2 text-sm">
        {label ? <span className="font-medium text-illusion-black">{label}</span> : null}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 placeholder:text-illusion-black/40 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
            className
          )}
          {...props}
        />
        {helperText && !error ? (
          <span className="text-xs text-illusion-black/50">{helperText}</span>
        ) : null}
        {error ? <span className="text-xs text-red-500">{error}</span> : null}
      </label>
    )
  }
)

Input.displayName = 'Input'

export default Input
