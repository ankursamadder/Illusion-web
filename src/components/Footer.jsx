import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import Container from './Container'
import { footerLinkGroups } from '../config/footerPages'

const Footer = () => {
  return (
    <footer className="border-t border-illusion-black/5 bg-illusion-white">
      <Container className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
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
        <div className="space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-illusion-black">
            Help & Support
          </h4>
          <p className="text-sm text-illusion-black/60">
            For any complaint or query, reach us directly on WhatsApp.
          </p>
          <a
            href="https://wa.me/8588066508"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-between gap-3 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(37,211,102,0.95)] transition hover:-translate-y-0.5 hover:bg-[#1fbf5c] hover:shadow-[0_16px_30px_-14px_rgba(37,211,102,1)]"
          >
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </span>
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
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
