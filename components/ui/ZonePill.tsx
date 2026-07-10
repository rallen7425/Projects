import { ZoneType, ZONE_META } from '@/types'

interface ZonePillProps {
  zone: ZoneType
  size?: 'sm' | 'md'
}

export default function ZonePill({ zone, size = 'sm' }: ZonePillProps) {
  const meta = ZONE_META[zone]
  return (
    <span style={{
      fontSize: size === 'md' ? '11px' : '10px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding: '2px 8px',
      borderRadius: '20px',
      color: meta.color,
      background: meta.bg,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {meta.label}
    </span>
  )
}
