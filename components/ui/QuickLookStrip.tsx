import { ZoneType, ZONE_META } from '@/types'

interface QuickLookItem {
  label: string
  value: string
  sub?: string
}

interface QuickLookStripProps {
  items: QuickLookItem[]
  zoneType: ZoneType
}

export default function QuickLookStrip({ items, zoneType }: QuickLookStripProps) {
  const zoneColor = ZONE_META[zoneType].color

  return (
    <div style={{
      padding: '16px 0 14px 20px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        marginBottom: '10px',
      }}>
        Quick Look
      </div>
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingRight: '20px',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0,
            minWidth: '90px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-mid)',
            borderLeft: `2px solid ${zoneColor}`,
            borderRadius: '10px',
            padding: '10px 12px',
          }}>
            <div style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '4px',
              color: 'var(--text-3)',
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--text)',
            }}>
              {item.value}
            </div>
            {item.sub && (
              <div style={{
                fontSize: '10px',
                marginTop: '2px',
                color: 'var(--text-3)',
                lineHeight: 1.3,
              }}>
                {item.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
