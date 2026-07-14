'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import ZoneCard from '@/components/zones/ZoneCard'
import type { ArticleDisplay, ZoneType, ScheduleHero, StatHero, HeadlineHero } from '@/types'
import { ZONE_META } from '@/types'

type QuicklookRow = { label: string; value: string; sub?: string | null }
type WeatherRow = { city: string; state: string; temp: number; unit: string; shortForecast: string } | null
type ZoneRow = { id: string; type: string; label?: string | null; position: number; enabled: boolean }
type ZoneData = { zone: ZoneRow; articles: ArticleDisplay[]; quicklook: QuicklookRow[]; weather: WeatherRow }

function buildHeroData(zoneType: ZoneType, articles: ArticleDisplay[], quicklook: QuicklookRow[], weather: WeatherRow): {
  variant: 'schedule' | 'stat' | 'headline'
  data: ScheduleHero | StatHero | HeadlineHero
} {
  if (zoneType === 'local' && weather) {
    return {
      variant: 'stat',
      data: { value: `${weather.temp}°${weather.unit}`, label: weather.city, sub: weather.shortForecast } satisfies StatHero,
    }
  }

  if (zoneType === 'finance') {
    const first = quicklook[0]
    if (first) {
      return {
        variant: 'stat',
        data: { value: first.value, label: first.label, sub: first.sub ?? '' } satisfies StatHero,
      }
    }
  }

  // Default: featured headline from first article
  const top = articles[0]
  if (top) {
    return {
      variant: 'headline',
      data: {
        text: top.headline,
        tag: (top.tags[0] ?? ZONE_META[zoneType]?.shortLabel ?? zoneType).toUpperCase(),
        time: relativeTime(top.publishedAt),
      } satisfies HeadlineHero,
    }
  }

  return {
    variant: 'headline',
    data: { text: 'No stories yet', tag: '', time: '' } satisfies HeadlineHero,
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ZonesHubClient({ zoneData }: { zoneData: ZoneData[] }) {
  const router = useRouter()
  const [manageOpen, setManageOpen] = useState(false)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader
        title="Zones"
        rightSlot={
          <button
            onClick={() => setManageOpen(true)}
            style={{
              fontSize: '12px', fontWeight: 600, color: 'var(--text-3)',
              background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
              padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Manage zones
          </button>
        }
      />

      {/* Zone cards */}
      <div style={{ padding: '14px 16px 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {zoneData.map(({ zone, articles, quicklook, weather }) => {
          const zoneType = zone.type as ZoneType
          const meta = ZONE_META[zoneType]
          const { variant, data } = buildHeroData(zoneType, articles, quicklook, weather)

          return (
            <ZoneCard
              key={zone.id}
              zone={{ id: zone.id, type: zoneType, label: meta?.label ?? zone.type, enabled: zone.enabled, position: zone.position }}
              heroVariant={variant}
              heroData={data}
              stories={articles}
              onClick={() => router.push(`/zones/${zone.id}`)}
            />
          )
        })}
      </div>

      <BottomNav activeTab="zones" />

      {/* Manage Zones Sheet */}
      {manageOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setManageOpen(false) }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '430px', background: 'var(--surface)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border-mid)', padding: '20px 0 48px', animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)' }}
          >
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', padding: '0 20px', marginBottom: '3px' }}>Manage Zones</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', padding: '0 20px', marginBottom: '18px' }}>Reorder or turn off zones you don&apos;t need.</div>

            <div style={{ borderTop: '1px solid var(--border)' }}>
              {zoneData.map(({ zone }) => {
                const zoneType = zone.type as ZoneType
                const meta = ZONE_META[zoneType]
                return (
                  <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', color: meta?.color, background: meta?.bg }}>
                      {meta?.shortLabel}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{meta?.label}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '14px 20px 18px', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Add zones during onboarding or from your profile.
            </div>
            <button
              onClick={() => setManageOpen(false)}
              style={{ width: 'calc(100% - 40px)', margin: '0 20px', padding: '14px', background: 'var(--primary)', color: 'var(--primary-text)', fontSize: '15px', fontWeight: 700, borderRadius: '14px', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
