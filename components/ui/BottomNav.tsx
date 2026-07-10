'use client'

import Link from 'next/link'

type Tab = 'today' | 'zones' | 'tracking' | 'saved'

interface BottomNavProps {
  activeTab: Tab
}

const TABS: Array<{ id: Tab; label: string; href: string; icon: React.ReactNode }> = [
  {
    id: 'today',
    label: 'Today',
    href: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'zones',
    label: 'Zones',
    href: '/zones',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'tracking',
    label: 'Tracking',
    href: '/tracking',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ),
  },
  {
    id: 'saved',
    label: 'Read Later',
    href: '/saved',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

export default function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: '24px',
      zIndex: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '382px',
      background: 'rgba(20,20,28,0.96)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      border: '1px solid rgba(255,255,255,0.11)',
      borderRadius: '30px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '8px 6px 12px',
    }}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '7px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              opacity: isActive ? 1 : 0.62,
              transition: 'all 0.18s',
              textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.08)' : 'none',
              color: 'var(--text)',
              position: 'relative',
            }}
          >
            <span style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--primary)' : 'var(--text)' }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isActive ? 'var(--primary)' : 'var(--text)',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
