const statusStyles = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  shipped: 'bg-blue-100 text-blue-700',
}

const StatusBadge = ({ status }) => {
  const normalized = String(status || '').toLowerCase()
  const colorClass = statusStyles[normalized] || 'bg-gray-100 text-gray-700'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colorClass}`}>
      {status || 'Unknown'}
    </span>
  )
}

export default StatusBadge
