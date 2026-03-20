import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { getProducts, updateProduct, deleteProduct } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'

const getProductImage = (product) => {
  if (typeof product?.image === 'string' && product.image) {
    return product.image
  }

  if (product?.image?.url) {
    return product.image.url
  }

  if (Array.isArray(product?.images) && product.images.length) {
    const firstImage = product.images[0]
    if (typeof firstImage === 'string') return firstImage
    if (firstImage?.url) return firstImage.url
  }

  return null
}

const AdminProducts = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleToggle = async (product) => {
    try {
      await updateProduct(product.id, { active: !product.active })
      toast.success('Status updated')
      await loadProducts()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update product')
    }
  }

  const handleFlagToggle = async (product, key) => {
    try {
      await updateProduct(product.id, { [key]: !product[key] })
      toast.success(
        `${key === 'featured' ? 'Featured' : 'Most Favourite'} updated`
      )
      await loadProducts()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update product')
    }
  }

  const handleDelete = async (product) => {
    const confirm = window.confirm('Delete this product?')
    if (!confirm) return
    try {
      await deleteProduct(product.id)
      toast.success('Product deleted')
      await loadProducts()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete product')
    }
  }

  return (
    <AdminLayout
      title="Products"
      subtitle="Create, edit, and manage product visibility."
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-illusion-black/60">
          {products.length} products
        </p>
        <Button onClick={() => navigate('/admin/products/new')}>
          Add Product
        </Button>
      </div>

      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading products...</Card>
      ) : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => {
            const productImage = getProductImage(product)
            const safePrice = Number(product.price ?? 0)
            const safeStrikePrice = Number(product.strikePrice ?? 0)
            const hasStrikePrice = safeStrikePrice > safePrice

            return (
              <Card key={product.id} className="flex h-full flex-col !p-4">
                <div className="flex h-full flex-col gap-4">
                  <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-illusion-black/10 bg-illusion-blush/30">
                    {productImage ? (
                      <img loading="lazy" decoding="async"
                        src={productImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-illusion-black/40">
                        No image
                      </div>
                    )}
                    <div className="absolute right-3 top-3">
                      <Badge
                        variant={product.active === false ? 'outline' : 'soft'}
                        className="bg-white/90 backdrop-blur-sm"
                      >
                        {product.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div>
                      <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-illusion-black">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-illusion-black/55">
                        {product.category || 'Uncategorized'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-illusion-black/60">
                      <span className="rounded-full bg-illusion-blush/25 px-2.5 py-1 font-medium text-illusion-black">
                        {formatCurrency(safePrice)}
                      </span>
                      {hasStrikePrice ? (
                        <span className="text-illusion-black/45 line-through">
                          {formatCurrency(safeStrikePrice)}
                        </span>
                      ) : null}
                      <span>Stock: {product.stock ?? 0}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {product.mostFavourite ? (
                        <Badge variant="soft">Most Loved</Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="inline-flex items-center gap-2 rounded-xl border border-illusion-black/10 bg-white px-3 py-2 text-xs text-illusion-black/70">
                        <input
                          type="checkbox"
                          checked={product.featured === true}
                          onChange={() => handleFlagToggle(product, 'featured')}
                          className="h-3.5 w-3.5 rounded border-illusion-black/20"
                        />
                        Featured
                      </label>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-illusion-black/10 bg-white px-3 py-2 text-xs text-illusion-black/70">
                        <input
                          type="checkbox"
                          checked={product.mostFavourite === true}
                          onChange={() => handleFlagToggle(product, 'mostFavourite')}
                          className="h-3.5 w-3.5 rounded border-illusion-black/20"
                        />
                        Most Favourite
                      </label>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 border border-illusion-black/10"
                        onClick={() => handleToggle(product)}
                      >
                        {product.active === false ? (
                          <Power className="h-5 w-5" strokeWidth={2.25} />
                        ) : (
                          <PowerOff className="h-5 w-5" strokeWidth={2.25} />
                        )}
                        {product.active === false ? 'Activate' : 'Deactivate'}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full gap-2 border border-red-200 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Product
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          No products found. Start by adding a product.
        </Card>
      )}
    </AdminLayout>
  )
}

export default AdminProducts
