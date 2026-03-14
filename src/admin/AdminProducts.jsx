import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
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
      title="Manage Products"
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
        <div className="space-y-3">
          {products.map((product) => {
            const productImage = getProductImage(product)

            return (
              <Card key={product.id} className="p-4">
                <div className="grid gap-4 md:grid-cols-[104px_minmax(0,1fr)_auto] md:items-center">
                  <div className="h-24 w-full overflow-hidden rounded-2xl border border-illusion-black/10 bg-illusion-blush/30 md:w-[104px]">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-illusion-black/40">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-illusion-black">
                      {product.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-illusion-black/60">
                      <span>{formatCurrency(product.price ?? 0)}</span>
                      <span>Stock: {product.stock ?? 0}</span>
                      <Badge variant={product.active === false ? 'outline' : 'soft'}>
                        {product.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                      {product.featured ? <Badge variant="soft">Featured</Badge> : null}
                      {product.mostFavourite ? (
                        <Badge variant="soft">Most Loved</Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[290px]">
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

                    <div className="flex flex-wrap justify-end gap-2">
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
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        {product.active === false ? 'Activate' : 'Deactivate'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 border border-red-200 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
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
