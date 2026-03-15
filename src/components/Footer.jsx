import { Link } from 'react-router-dom'
import Container from './Container'
import { footerLinkGroups } from '../config/footerPages'

const Footer = () => {
  return (
    <footer className="border-t border-illusion-black/5 bg-illusion-white">
      <Container className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        {footerLinkGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-illusion-black">
              {group.title}
            </h4>
            <ul className="space-y-2 text-sm text-illusion-black/60">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition hover:text-illusion-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-illusion-black/5">
        <Container className="flex flex-col items-start justify-between gap-4 py-6 text-xs text-illusion-black/50 md:flex-row md:items-center">
          <span>(c) 2026 Illusion. All rights reserved.</span>
          <span>Designed for modern heirlooms.</span>
        </Container>
      </div>
    </footer>
  )
}

export default Footer
