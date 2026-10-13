import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import clsx from 'clsx'

const Modal = ({ open, title, children, onClose, actions, className }) => {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-3 sm:px-4">
      <div
        className="absolute inset-0 bg-illusion-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={clsx(
          'relative z-10 max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-card sm:max-h-[calc(100vh-2rem)] sm:p-6',
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
