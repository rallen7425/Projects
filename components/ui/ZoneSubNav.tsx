'use client'

import { ZoneType, ZONE_META, ZoneConfig } from '@/types'

type ActiveZone = ZoneType | 'all'

interface ZoneSubNavProps {
  activeZone: ActiveZone
  onSelect: (zone: ActiveZone) => void
  zones?: ZoneConfig[]
}

const DEFAULT_ZONES: Array<{ type: ZoneType }> = [
  { type: 'sports' },
  { type: 'local' },
  { type: 'news' },
  { type: 'tech' },
  { type: 'finance' },
]

export default function ZoneSubNav({ activeZone, onSelect, zones }: ZoneSubNavProps) {
  const zoneList = zones ?? DEFAULT_ZONES

  const getActiveStyle = (zoneId: ActiveZone) => {
    if (activeZone !== zoneId) return {}
    const color = zoneId === 'all' ? 'var(--primary)' : ZONE_META[zoneId as ZoneType].color
    return {
      borderBottomColor: color,
      color,
    }
  }

  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* All tab */}
      <button
        onClick={() => onSelect('all')}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '7px 2px 9px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          borderBottom: `2px solid ${activeZone === 'all' ? 'var(--primary)' : 'transparent'}`,
          position: 'relative',
          top: '1px',
          transition: 'all 0.16s',
          color: activeZone === 'all' ? 'var(--primary)' : 'var(--text-3)',
        }}
      >
        <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.2 }}>All</span>
        <span style={{ display: 'block', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2, marginTop: '1px' }}>Zones</span>
      </button>

      {zoneList.map((z) => {
        const isActive = activeZone === z.type
        const color = ZONE_META[z.type].color
        return (
          <button
            key={z.type}
            onClick={() => onSelect(z.type)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 2px 9px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${isActive ? color : 'transparent'}`,
              position: 'relative',
              top: '1px',
              transition: 'all 0.16s',
              color: isActive ? color : 'var(--text-3)',
            }}
          >
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {ZONE_META[z.type].shortLabel}
            </span>
            <span style={{ display: 'block', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2, marginTop: '1px' }}>
              Zone
            </span>
          </button>
        )
      })}
    </div>
  )
}
