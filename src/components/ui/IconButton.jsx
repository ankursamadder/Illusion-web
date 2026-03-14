import clsx from 'clsx'

const IconButton = ({
  icon: Icon,
  label,
  size = 'md',
  active = false,
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: 'h-9 w-9',
    md: 'h-11 w-11',
    lg: 'h-12 w-12',
  }

  return (
    <button
      aria-label={label}
      className={clsx(
        'inline-flex items-center justify-center rounded-full border border-illusion-black/10 bg-illusion-white text-illusion-black/70 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-illusion-pink/50',
        active && 'border-illusion-pink/40 text-illusion-pink',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {Icon ? (
        <Icon
          className={clsx('h-4 w-4', active && 'fill-illusion-pink')}
        />
      ) : null}
    </button>
  )
}

export default IconButton
