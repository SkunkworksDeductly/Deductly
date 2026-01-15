import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const footerLinks = [
    { name: 'Support', path: '#' },
    { name: 'Terms of Service', path: '#' },
    { name: 'Privacy Policy', path: '#' }
  ]

  return (
    <footer className="mt-24 py-12 border-t border-sand-dark/20 dark:border-white/5 bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="flex flex-col items-center gap-8">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="size-6 text-terracotta bg-terracotta-soft dark:bg-white/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">spa</span>
              </div>
              <h2 className="text-sm font-black tracking-[0.2em] uppercase text-text-main dark:text-white opacity-80 decoration-0">
                Deductly
              </h2>
            </div>
            <p className="text-sm text-center max-w-md text-text-main/50 dark:text-sand/50">
              Intelligence without intimidation. Master the LSAT with confidence.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-bold uppercase tracking-widest text-text-main/40 hover:text-terracotta transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-full h-px max-w-md bg-sand-dark/20 dark:bg-white/5" />

          {/* Copyright */}
          <p className="text-xs text-text-main/30 dark:text-sand/30">
            © 2025 Deductly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
