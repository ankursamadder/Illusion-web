import PageShell from './PageShell'

const NotFound = () => {
  return (
    <PageShell title="Page not found" subtitle="We couldn't find that route.">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Try visiting the shop or returning to the homepage.
      </div>
    </PageShell>
  )
}

export default NotFound
