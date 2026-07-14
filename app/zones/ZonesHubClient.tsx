'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import ZoneCard from '@/components/zones/ZoneCard'
import type { ArticleDisplay, ZoneType } from '@/types'
import { ZONE_META } from '@/types'
import type { TeamScoreCard } from '@/lib/scores/espn'
import type { WeatherCard as WeatherCardData } from '@/lib/weather/nws'

type ZoneRow = { id: string; type: string; label?: string | null; position: number; enabled: boolean }
type ZoneData = {
  zone: ZoneRow
  articles: ArticleDisplay[]
  scores: TeamScoreCard[]
  weather: WeatherCardData[]
}

function formatGameTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const daysAway = Math.floor((d.getTime() - Date.now()) / 86400000)
  if (daysAway > 6) {
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`
  }
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${time}`
}

function ScoresCard({ scores }: { scores: TeamScoreCard[] }) {
  if (scores.length === 0) return null
  return (
    <div style={{ margin: '0', background: 'var(--sports-dark)', borderRadius: '0' }}>
      <div style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ffffff' }}>
        Scores
      </div>
      {scores.map((s, i) => (
        <div key={`${s.team.league}-${s.team.teamId}`} style={{ padding: '10px 16px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.25)' : 'none' }}>
          {s.lastOrLiveGame ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 26px auto', gridTemplateRows: 'auto auto', columnGap: '10px', rowGap: '2px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '14.5px', fontWeight: s.lastOrLiveGame.isWin === false ? 400 : 700, color: 'var(--text)' }}>{s.team.shortName}</span>
              <span style={{ fontSize: '15px', fontWeight: s.lastOrLiveGame.isWin === false ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.teamScore}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: s.lastOrLiveGame.status === 'live' ? '#EF4444' : 'var(--text)' }}>
                {s.lastOrLiveGame.status === 'live' ? `Live · ${s.lastOrLiveGame.detail}` : s.lastOrLiveGame.detail}
              </span>
              <span style={{ fontSize: '13px', fontWeight: s.lastOrLiveGame.isWin === true ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.opponent}</span>
              <span style={{ fontSize: '14px', fontWeight: s.lastOrLiveGame.isWin === true ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.opponentScore}</span>
              <span />
            </div>
          ) : (
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{s.team.shortName}</div>
          )}
          {s.nextGame && (
            <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '7px' }}>
              Next: {formatGameTime(s.nextGame.date)} {s.nextGame.isHome ? 'vs' : '@'} {s.nextGame.opponentAbbrev}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function WeatherCard({ weather }: { weather: WeatherCardData[] }) {
  if (weather.length === 0) return null
  return (
    <div style={{ margin: '0', background: 'var(--local-dark)', borderRadius: '0' }}>
      <div style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ffffff' }}>
        Weather
      </div>
      {weather.map((w, i) => (
        <div key={w.area.id} style={{ padding: '10px 16px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.25)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>{w.city}, {w.state}</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{w.temp}°{w.unit}</span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text)', marginTop: '4px' }}>
            {w.shortForecast} · Wind {w.windSpeed}
          </div>
        </div>
      ))}
    </div>
  )
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
        {zoneData.map(({ zone, articles, scores, weather }) => {
          const zoneType = zone.type as ZoneType
          const meta = ZONE_META[zoneType]
          const specialCard =
            zoneType === 'sports' ? <ScoresCard scores={scores} /> :
            zoneType === 'local' ? <WeatherCard weather={weather} /> :
            undefined

          return (
            <ZoneCard
              key={zone.id}
              zone={{ id: zone.id, type: zoneType, label: meta?.label ?? zone.type, enabled: zone.enabled, position: zone.position }}
              specialCard={specialCard}
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
