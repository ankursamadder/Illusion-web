import Container from '../components/Container'

const PageShell = ({ title, subtitle, actions, children }) => {
  return (
    <section data-reveal className="py-12">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-illusion-black">{title}</h1>
            {subtitle ? (
              <p className="text-illusion-black/60">{subtitle}</p>
            ) : null}
          </div>
          {actions ? <div className="md:pt-1">{actions}</div> : null}
        </div>
        <div className="mt-6">{children}</div>
      </Container>
    </section>
  )
}

export default PageShell
