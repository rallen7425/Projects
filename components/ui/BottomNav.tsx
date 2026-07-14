'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

type ZoneMenuItem = { id: string; label: string; color: string }

type Tab = 'today' | 'zones' | 'tracking' | 'saved'

interface BottomNavProps {
  activeTab: Tab
}

const MENU_ITEMS: Array<{ id: string; label: string; href: string; icon: React.ReactNode }> = [
  {
    id: 'profile',
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'my-zones',
    label: 'My Zones',
    href: '/zones',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'tracking-saved',
    label: 'Tracking & Saved',
    href: '/tracking',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="2"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    ),
  },
  {
    id: 'summary',
    label: 'Summary View',
    href: '/summary',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <line x1="8" y1="8" x2="16" y2="8"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="16" x2="12" y2="16"/>
      </svg>
    ),
  },
]

const MENU_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="7" x2="20" y2="7"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="17" x2="20" y2="17"/>
  </svg>
)

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [zones, setZones] = useState<ZoneMenuItem[] | null>(null)

  useEffect(() => {
    if (!isMenuOpen || zones !== null) return
    fetch('/api/zones/menu')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ZoneMenuItem[]) => setZones(data))
      .catch(() => setZones([]))
  }, [isMenuOpen, zones])

  return (
    <>
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 150,
          }}
        />
      )}

      <div
        role="menu"
        aria-hidden={!isMenuOpen}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: isMenuOpen ? '104px' : '84px',
          transform: 'translateX(-50%)',
          zIndex: 151,
          width: 'calc(100% - 32px)',
          maxWidth: '430px',
          background: 'rgba(24,24,32,0.98)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.11)',
          borderRadius: '22px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, bottom 0.2s ease',
        }}
      >
        {MENU_ITEMS.map((item) => (
          <div key={item.id}>
            <Link
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '14px',
                textDecoration: 'none',
                color: 'var(--text)',
              }}
            >
              <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500 }}>{item.label}</span>
            </Link>

            {item.id === 'my-zones' && zones && zones.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', padding: '0 14px 6px 46px' }}>
                {zones.map((zone) => (
                  <Link
                    key={zone.id}
                    href={`/zones/${zone.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '8px 10px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      color: 'var(--text-2)',
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: zone.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{zone.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <nav style={{
        position: 'fixed',
        bottom: '24px',
        zIndex: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '430px',
        background: 'rgba(20,20,28,0.96)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: '30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 4px 12px',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '7px 4px',
                borderRadius: '18px',
                cursor: 'pointer',
                opacity: isActive ? 1 : 0.62,
                transition: 'all 0.18s',
                textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'none',
                color: 'var(--text)',
                position: 'relative',
                minWidth: 0,
              }}
            >
              <span style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'var(--primary)' : 'var(--text)' }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: '8.5px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                whiteSpace: 'normal',
                textAlign: 'center',
                lineHeight: 1.15,
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-expanded={isMenuOpen}
          aria-label="Menu"
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            padding: '7px 4px',
            borderRadius: '18px',
            cursor: 'pointer',
            opacity: isMenuOpen ? 1 : 0.62,
            transition: 'all 0.18s',
            background: isMenuOpen ? 'rgba(255,255,255,0.08)' : 'none',
            border: 'none',
            color: 'var(--text)',
            minWidth: 0,
            font: 'inherit',
          }}
        >
          <span style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isMenuOpen ? 'var(--primary)' : 'var(--text)' }}>
            {MENU_ICON}
          </span>
          <span style={{
            fontSize: '8.5px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: isMenuOpen ? 'var(--primary)' : 'var(--text)',
            whiteSpace: 'normal',
            textAlign: 'center',
            lineHeight: 1.15,
          }}>
            Menu
          </span>
        </button>
      </nav>
    </>
  )
}
