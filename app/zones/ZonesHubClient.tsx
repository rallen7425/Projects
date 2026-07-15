'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import { addTrack, saveArticle, unsaveArticle } from '@/lib/actions'
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

const ZONE_GRADIENTS: Record<ZoneType, string> = {
  sports: 'linear-gradient(135deg,#1b4332,#0d2419)',
  local: 'linear-gradient(135deg,#0c2d5e,#071a38)',
  news: 'linear-gradient(135deg,#3d2005,#251203)',
  tech: 'linear-gradient(135deg,#1e104a,#110929)',
  finance: 'linear-gradient(135deg,#0d2418,#070f0c)',
  work: 'linear-gradient(135deg,#1a1a2e,#0f0f1a)',
  entertainment: 'linear-gradient(135deg,#2d0d2e,#1a0a1a)',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
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

// First card in Sports' horizontal scroll — same black-rectangle/border/top-stripe format as
// the story cards (TrackCard) rather than a solid zone-color fill: zone-name pill top-left,
// score rows below, "View {Zone} →" bottom-right.
function ScoresCard({ scores, zoneType, label, onClick }: { scores: TeamScoreCard[]; zoneType: ZoneType; label: string; onClick: () => void }) {
  if (scores.length === 0) return null
  const meta = ZONE_META[zoneType]
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '300px', background: 'var(--surface)',
      borderRadius: '16px', border: '1px solid var(--border-mid)', overflow: 'hidden', cursor: 'pointer',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: '3px', width: '100%', background: meta.color, flexShrink: 0 }} />
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span style={{
          display: 'inline-block', alignSelf: 'flex-start', marginTop: '12px',
          background: meta.bg, border: `1px solid ${meta.border}`,
          borderRadius: '20px', padding: '4px 12px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: meta.color,
        }}>
          {label}
        </span>
        <div style={{ marginTop: '8px' }}>
          {scores.map((s, i) => (
            <div key={`${s.team.league}-${s.team.teamId}`} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              {s.lastOrLiveGame ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 26px auto', gridTemplateRows: 'auto auto', columnGap: '10px', rowGap: '2px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: s.lastOrLiveGame.isWin === false ? 400 : 700, color: 'var(--text)' }}>{s.team.shortName}</span>
                  <span style={{ fontSize: '15px', fontWeight: s.lastOrLiveGame.isWin === false ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.teamScore}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: s.lastOrLiveGame.status === 'live' ? '#EF4444' : 'var(--text-2)' }}>
                    {s.lastOrLiveGame.status === 'live' ? `Live · ${s.lastOrLiveGame.detail}` : s.lastOrLiveGame.detail}
                  </span>
                  <span style={{ fontSize: '14.5px', fontWeight: s.lastOrLiveGame.isWin === true ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.opponent}</span>
                  <span style={{ fontSize: '15px', fontWeight: s.lastOrLiveGame.isWin === true ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.opponentScore}</span>
                  <span />
                </div>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{s.team.shortName}</div>
              )}
              {s.nextGame && (
                <div style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '7px' }}>
                  Next: {formatGameTime(s.nextGame.date)} {s.nextGame.isHome ? 'vs' : '@'} {s.nextGame.opponentAbbrev}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color }}>
            View {label} →
          </span>
        </div>
      </div>
    </div>
  )
}

// First card in Local's horizontal scroll — same treatment as ScoresCard above
function WeatherCard({ weather, zoneType, label, onClick }: { weather: WeatherCardData[]; zoneType: ZoneType; label: string; onClick: () => void }) {
  if (weather.length === 0) return null
  const meta = ZONE_META[zoneType]
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '300px', background: 'var(--surface)',
      borderRadius: '16px', border: '1px solid var(--border-mid)', overflow: 'hidden', cursor: 'pointer',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: '3px', width: '100%', background: meta.color, flexShrink: 0 }} />
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <span style={{
          display: 'inline-block', alignSelf: 'flex-start', marginTop: '12px',
          background: meta.bg, border: `1px solid ${meta.border}`,
          borderRadius: '20px', padding: '4px 12px',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: meta.color,
        }}>
          {label}
        </span>
        <div style={{ marginTop: '8px' }}>
          {weather.map((w, i) => (
            <div key={w.area.id} style={{ padding: '10px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>{w.city}, {w.state}</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{w.temp}°{w.unit}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
                {w.shortForecast} · Wind {w.windSpeed}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color }}>
            View {label} →
          </span>
        </div>
      </div>
    </div>
  )
}

// Final card in each zone's scroll — links through to that zone's own detail page
function ViewZoneCard({ zoneType, label, onClick }: { zoneType: ZoneType; label: string; onClick: () => void }) {
  const meta = ZONE_META[zoneType]
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '300px', minHeight: '220px',
      background: 'var(--surface)', borderRadius: '16px',
      border: `1px solid ${meta.border}`, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: meta.bg, border: `1px solid ${meta.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      <span style={{ fontSize: '14px', fontWeight: 700, color: meta.color }}>
        View {label} →
      </span>
    </div>
  )
}

// Same 300px card used for Breaking/Top Stories on the Home page
function TrackCard({ article, isSaved, onOpen, onZoneOpen, onSave, onTrack }: {
  article: ArticleDisplay
  isSaved: boolean
  onOpen: () => void
  onZoneOpen: () => void
  onSave: () => void
  onTrack: () => void
}) {
  const meta = ZONE_META[article.zoneType]
  const hasImage = !!article.imageUrl

  return (
    <div onClick={onOpen} style={{
      flexShrink: 0, width: '300px',
      background: 'var(--surface)', borderRadius: '16px',
      border: '1px solid var(--border-mid)', overflow: 'hidden',
      cursor: 'pointer', transition: 'opacity 0.15s',
    }}>
      <div style={{ height: '3px', width: '100%', background: meta.color }} />

      {hasImage ? (
        <div style={{
          width: '100%', height: '116px', position: 'relative', overflow: 'hidden',
          background: ZONE_GRADIENTS[article.zoneType],
        }}>
          <img src={article.imageUrl} alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.10) 0%, rgba(9,9,14,0.50) 50%, rgba(17,17,23,1) 100%)' }} />

          <div style={{ position: 'absolute', top: '12px', left: '14px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              onClick={(e) => { e.stopPropagation(); onZoneOpen() }}
              style={{
                background: 'rgba(9,9,14,0.70)', backdropFilter: 'blur(8px)',
                borderRadius: '20px', padding: '4px 12px',
                border: `1px solid ${meta.border}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); onSave() }}
                aria-label={isSaved ? 'Remove from Read Later' : 'Save to Read Later'}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(17,17,23,0.85)', border: '1px solid var(--border-mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: isSaved ? 'var(--primary)' : 'var(--text-2)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onTrack() }}
                aria-label="Track this topic"
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(17,17,23,0.85)', border: '1px solid var(--border-mid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--text-2)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            onClick={(e) => { e.stopPropagation(); onZoneOpen() }}
            style={{
              background: meta.bg, borderRadius: '20px', padding: '4px 12px',
              border: `1px solid ${meta.border}`, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: meta.color }}>
              {meta.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onSave() }}
              aria-label={isSaved ? 'Remove from Read Later' : 'Save to Read Later'}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: isSaved ? 'var(--primary)' : 'var(--text-2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTrack() }}
              aria-label="Track this topic"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-2)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '0 14px 14px' }}>
        <div style={{ height: hasImage ? '12px' : '10px' }} />
        <div style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text)', lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: '6px' }}>
          {article.headline}
        </div>
        {article.summary && (
          <div style={{
            fontSize: '12px', lineHeight: 1.55, color: 'var(--text-2)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', marginRight: '3px', verticalAlign: '1px' }}>✦</span>
            {article.summary}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color }}>
            Full Coverage →
          </span>
        </div>
      </div>
    </div>
  )
}

// Zone-name header — larger and zone-colored, replacing the generic "Breaking"/"Top Stories" style heading
function ZoneSectionHead({ zoneType, label }: { zoneType: ZoneType; label: string }) {
  const meta = ZONE_META[zoneType]
  return (
    <div style={{ padding: '28px 20px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.01em', color: meta.color, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

export default function ZonesHubClient({ zoneData, initialSavedIds }: { zoneData: ZoneData[]; initialSavedIds: string[] }) {
  const router = useRouter()
  const [manageOpen, setManageOpen] = useState(false)
  const [savedIds, setSavedIds] = useState(new Set(initialSavedIds))
  const [trackModal, setTrackModal] = useState<{ open: boolean; article?: ArticleDisplay }>({ open: false })
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const handleSave = async (article: ArticleDisplay) => {
    if (savedIds.has(article.id)) {
      setSavedIds((s) => { const n = new Set(s); n.delete(article.id); return n })
      const ok = await unsaveArticle(article.id).then(() => true).catch(() => false)
      if (!ok) setSavedIds((s) => new Set(s).add(article.id))
      else showToast('Removed from Read Later')
    } else {
      setSavedIds((s) => new Set(s).add(article.id))
      const ok = await saveArticle(article.id).catch(() => false)
      if (!ok) setSavedIds((s) => { const n = new Set(s); n.delete(article.id); return n })
      else showToast('Saved to Read Later')
    }
  }

  const handleTrack = async (topic: string, _zone: string | null) => {
    const result = await addTrack(topic).catch(() => null)
    if (result) showToast(`Tracking "${topic}"`)
    else showToast(`Couldn't save tracking topic`)
  }

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

      {zoneData.map(({ zone, articles, scores, weather }) => {
        const zoneType = zone.type as ZoneType
        const meta = ZONE_META[zoneType]
        const label = meta?.label ?? zone.type
        const topStories = articles.slice(0, 9)
        const hasScores = zoneType === 'sports' && scores.length > 0
        const hasWeather = zoneType === 'local' && weather.length > 0

        return (
          <div key={zone.id}>
            <ZoneSectionHead zoneType={zoneType} label={label} />
            <div style={{ display: 'flex', gap: '12px', padding: '0 20px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {hasScores && <ScoresCard scores={scores} zoneType={zoneType} label={label} onClick={() => router.push(`/zones/${zone.id}`)} />}
              {hasWeather && <WeatherCard weather={weather} zoneType={zoneType} label={label} onClick={() => router.push(`/zones/${zone.id}`)} />}
              {topStories.map((article) => (
                <TrackCard
                  key={article.id}
                  article={article}
                  isSaved={savedIds.has(article.id)}
                  onOpen={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}
                  onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                  onSave={() => handleSave(article)}
                  onTrack={() => setTrackModal({ open: true, article })}
                />
              ))}
              <ViewZoneCard zoneType={zoneType} label={label} onClick={() => router.push(`/zones/${zone.id}`)} />
            </div>
          </div>
        )
      })}

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

      <TrackModal
        open={trackModal.open}
        onClose={() => setTrackModal({ open: false })}
        onConfirm={handleTrack}
        initialTopic={trackModal.article?.tags[0] ?? trackModal.article?.headline.split(' ').slice(0, 4).join(' ')}
        initialZone={trackModal.article?.zoneType}
        aiMode={!!trackModal.article}
      />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
