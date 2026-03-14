import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { getUserOrders } from '../services/orderService'
import { formatCurrency } from '../utils/formatCurrency'

const Orders = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadOrders = async () => {
      if (!user?.uid) return
      setLoading(true)
      try {
        const data = await getUserOrders(user.uid)
        if (mounted) setOrders(data)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load orders')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadOrders()

    return () => {
      mounted = false
    }
  }, [user])

  return (
    <PageShell title="Orders" subtitle="Track past and active orders.">
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading orders...</Card>
      ) : orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
                    Order
                  </p>
                  <h3 className="text-lg font-semibold text-illusion-black">
                    #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-illusion-black/60">
                    {order.createdAt?.toDate
                      ? order.createdAt.toDate().toLocaleString()
                      : '—'}
                  </p>
                </div>
                <Badge variant={order.status === 'Cancelled' ? 'outline' : 'soft'}>
                  {order.status ?? 'Pending'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-illusion-black/70">
                <span>{order.items?.length ?? 0} items</span>
                <span>{formatCurrency(order.total ?? 0)}</span>
              </div>

              {order.items?.length ? (
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={`${order.id}_${item.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-illusion-black/10 bg-white p-3"
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-illusion-blush/40">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-illusion-black">
                          {item.name}
                        </p>
                        <p className="text-xs text-illusion-black/50">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-xs text-illusion-black/60">
                        {formatCurrency(
                          (typeof item.offerPrice === 'number' &&
                          item.offerPrice < item.price
                            ? item.offerPrice
                            : item.price) * item.quantity
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {order.shipment?.trackingNumber ? (
                <div className="text-xs text-illusion-black/60">
                  Tracking: {order.shipment.trackingNumber}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">No orders yet.</Card>
      )}
    </PageShell>
  )
}

export default Orders
