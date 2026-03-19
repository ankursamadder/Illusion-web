import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Filter, Tag } from 'lucide-react'
import PageShell from './PageShell'
import Card from '../components/ui/Card'
import ProductCard from '../components/ui/ProductCard'
import { getProducts } from '../services/productService'

const Shop = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      try {
        const data = await getProducts()
        if (mounted) setProducts(data)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load products')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [])

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter(Boolean)
    return ['all', ...new Set(values)]
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesCategory =
        category === 'all' ? true : product.category === category
      return matchesCategory
    })

    if (sort === 'price-low') {
      result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    }

    if (sort === 'price-high') {
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    }

    return result
  }, [products, category, sort])

  const shopActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <label className="inline-flex items-center gap-2 rounded-2xl border border-illusion-black/10 bg-white px-3 py-2 text-sm text-illusion-black shadow-soft">
        <Tag className="h-4 w-4 text-illusion-black/60" />
        <select
          className="min-w-[110px] border-0 bg-transparent text-sm text-illusion-black outline-none"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Category"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="inline-flex items-center gap-2 rounded-2xl border border-illusion-black/10 bg-white px-3 py-2 text-sm text-illusion-black shadow-soft">
        <Filter className="h-4 w-4 text-illusion-black/60" />
        <select
          className="min-w-[120px] border-0 bg-transparent text-sm text-illusion-black outline-none"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low</option>
          <option value="price-high">Price: High</option>
        </select>
      </label>
    </div>
  )

  return (
    <PageShell
      title="Shop"
      subtitle="Browse products by category and sort preference."
      actions={shopActions}
    >
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading products...</Card>
      ) : filteredProducts.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">
          No products found. Try a different category or sort.
        </Card>
      )}
    </PageShell>
  )
}

export default Shop
