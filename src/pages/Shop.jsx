import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import PageShell from './PageShell'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import ProductCard from '../components/ui/ProductCard'
import { getProducts } from '../services/productService'

const Shop = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
    const query = search.trim().toLowerCase()
    let result = products.filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(query)
      const matchesCategory =
        category === 'all' ? true : product.category === category
      return matchesSearch && matchesCategory
    })

    if (sort === 'price-low') {
      result = [...result].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    }

    if (sort === 'price-high') {
      result = [...result].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    }

    return result
  }, [products, search, category, sort])

  return (
    <PageShell title="Shop" subtitle="Browse products and filter by category.">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="space-y-5">
          <h3 className="text-lg font-semibold text-illusion-black">Filters</h3>
          <Input
            label="Search"
            placeholder="Search jewellery"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="text-sm">
            <span className="mb-2 block font-medium text-illusion-black">
              Category
            </span>
            <select
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-2 block font-medium text-illusion-black">
              Sort by
            </span>
            <select
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </label>
        </Card>

        <div className="space-y-6">
          {loading ? (
            <div className="rounded-3xl border border-illusion-black/10 bg-white p-6 text-sm text-illusion-black/60">
              Loading products...
            </div>
          ) : filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-illusion-black/10 bg-white p-6 text-sm text-illusion-black/60">
              No products found. Try adjusting your filters.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}

export default Shop
