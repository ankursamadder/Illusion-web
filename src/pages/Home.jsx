import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import ProductCard from '../components/ui/ProductCard'
import Card from '../components/ui/Card'
import Container from '../components/Container'
import {
  getFeaturedProducts,
  getMostFavouriteProducts,
  getNewArrivalProducts,
} from '../services/productService'

const ProductSection = ({
  title,
  subtitle,
  products,
  loading,
  onViewAll,
}) => {
  return (
    <section className="py-12">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-illusion-black">{title}</h2>
            <p className="text-sm text-illusion-black/60">{subtitle}</p>
          </div>
          <Button variant="ghost" onClick={onViewAll}>
            View all
          </Button>
        </div>

        {loading ? (
          <Card className="text-sm text-illusion-black/60">Loading products...</Card>
        ) : products.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="text-sm text-illusion-black/60">
            No products available in this section.
          </Card>
        )}
      </Container>
    </section>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [mostLovedProducts, setMostLovedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      setLoading(true)
      try {
        const [featured, loved, arrivals] = await Promise.all([
          getFeaturedProducts(8),
          getMostFavouriteProducts(8),
          getNewArrivalProducts(8),
        ])

        if (!mounted) return
        setFeaturedProducts(featured)
        setMostLovedProducts(loved)
        setNewArrivals(arrivals)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load homepage products')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <section className="bg-illusion-blush/50 py-16">
        <Container className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-illusion-black/60">
              Illusion Jewellery
            </p>
            <h1 className="text-4xl font-semibold text-illusion-black md:text-5xl">
              Fine jewellery crafted for modern heirlooms.
            </h1>
            <p className="text-base text-illusion-black/70">
              Explore curated collections that blend soft shimmer, minimal forms,
              and timeless elegance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/shop')}>Shop New Arrivals</Button>
              <Button variant="secondary" onClick={() => navigate('/shop')}>
                Book a Visit
              </Button>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-10 shadow-card">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
                Atelier Notes
              </p>
              <h2 className="text-2xl font-semibold text-illusion-black">
                Ethically sourced, impeccably set.
              </h2>
              <p className="text-sm text-illusion-black/60">
                Each piece is designed with a focus on longevity, soft silhouettes,
                and luminous finishes.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <ProductSection
        title="Featured Collection"
        subtitle="Handpicked spotlight pieces from this season."
        products={featuredProducts}
        loading={loading}
        onViewAll={() => navigate('/shop')}
      />

      <ProductSection
        title="Most Loved Jewellery"
        subtitle="Customer favourites that shine every day."
        products={mostLovedProducts}
        loading={loading}
        onViewAll={() => navigate('/shop')}
      />

      <ProductSection
        title="New Arrivals"
        subtitle="Latest additions to the Illusion collection."
        products={newArrivals}
        loading={loading}
        onViewAll={() => navigate('/shop')}
      />
    </div>
  )
}

export default Home
