import Card from '../components/ui/Card'
import PageShell from './PageShell'

const InfoPage = ({ title, subtitle, sections = [] }) => {
  return (
    <PageShell title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card key={`${title}_${index}`} className="space-y-2">
            {section.heading ? (
              <h2 className="text-lg font-semibold text-illusion-black">{section.heading}</h2>
            ) : null}
            <p className="text-sm leading-relaxed text-illusion-black/70">{section.body}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  )
}

export default InfoPage
