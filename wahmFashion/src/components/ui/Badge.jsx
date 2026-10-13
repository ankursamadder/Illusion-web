import clsx from 'clsx'

const Badge = ({ className, variant = 'soft', ...props }) => {
  const variants = {
    soft: 'bg-illusion-blush/60 text-illusion-black',
    outline: 'border border-illusion-black/15 text-illusion-black',
    dark: 'bg-illusion-black text-illusion-white',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export default Badge
