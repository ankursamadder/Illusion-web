import Button from '../components/ui/Button'
import ProductCard from '../components/ui/ProductCard'
import Container from '../components/Container'

const products = [
  {
    id: '1',
    name: 'Luna Pearl Necklace',
    price: 128,
    tag: 'New',
  },
  {
    id: '2',
    name: 'Blush Halo Ring',
    price: 96,
    tag: 'Bestseller',
  },
  {
    id: '3',
    name: 'Aurora Drop Earrings',
    price: 84,
    tag: 'Limited',
  },
]

const Home = () => {
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
              <Button>Shop New Arrivals</Button>
              <Button variant="secondary">Book a Visit</Button>
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

      <section className="py-14">
        <Container>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-illusion-black">
                Featured pieces
              </h2>
              <p className="text-sm text-illusion-black/60">
                The latest drop from our signature collection.
              </p>
            </div>
            <Button variant="ghost">View all</Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}

export default Home
