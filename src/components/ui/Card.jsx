import clsx from 'clsx'

const Card = ({ className, ...props }) => {
  return (
    <div
      data-reveal
      className={clsx(
        'rounded-3xl border border-illusion-black/5 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

export default Card
