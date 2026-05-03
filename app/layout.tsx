'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Caisse', icon: '🛒' },
    { href: '/cuisine', label: 'Cuisine', icon: '👨‍🍳' },
    { href: '/historique', label: 'Historique', icon: '📊' },
  ]

  return (
    <html lang="fr">
      <head>
        <title>Frenchy Pizza — Logiciel de caisse</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
          {/* Top bar */}
          <header style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🍕</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>Frenchy Pizza</span>
            </div>
            <nav style={{ display: 'flex', gap: 4 }}>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 16px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    background: pathname === link.href ? 'var(--accent)' : 'transparent',
                    color: pathname === link.href ? '#fff' : 'var(--muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflow: 'hidden' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
