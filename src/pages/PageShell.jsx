import Container from '../components/Container'

const PageShell = ({ title, subtitle, children }) => {
  return (
    <section data-reveal className="py-12">
      <Container>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-illusion-black">{title}</h1>
          {subtitle ? (
            <p className="text-illusion-black/60">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
      </Container>
    </section>
  )
}

export default PageShell
