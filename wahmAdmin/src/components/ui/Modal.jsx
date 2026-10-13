import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  '3xl': 'max-w-6xl',
  full: 'max-w-[95vw]',
}

const Modal = ({
  open,
  title,
  children,
  onClose,
  actions,
  size = 'md',
  className,
}) => {
  if (!open) return null

  const hasCustomMaxWidth = className && /\bmax-w-/.test(className)
  const resolvedSizeClass = hasCustomMaxWidth
    ? ''
    : sizeClasses[size] || 'max-w-lg'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="absolute inset-0 bg-illusion-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative z-10 max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-3xl bg-white p-5 shadow-card sm:max-h-[calc(100vh-3rem)] sm:p-7',
          resolvedSizeClass,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-xl font-semibold text-illusion-black">{title}</h2>
            ) : null}
          </div>
          <button
            className="rounded-full p-2 text-illusion-black/60 transition hover:bg-illusion-blush/50"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 text-sm text-illusion-black/70">{children}</div>
        {actions ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

export default Modal
