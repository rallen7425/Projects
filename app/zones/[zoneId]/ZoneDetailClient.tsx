'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import QuickLookStrip from '@/components/ui/QuickLookStrip'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import CustomizeSheet from '@/components/zones/CustomizeSheet'
import { createClient } from '@/lib/supabase/client'
import { addTrack } from '@/lib/actions'
import type { ArticleDisplay, ZoneType } from '@/types'
import { ZONE_META } from '@/types'
import type { TeamScoreCard } from '@/lib/scores/espn'
import type { WeatherCard as WeatherCardData } from '@/lib/weather/nws'

type QuicklookRow = { label: string; value: string; sub?: string | null }
type ZoneRow = { id: string; type: string; position: number; enabled: boolean; config?: unknown }
type TrackingTopicData = { id: string; topic: string; createdAt: string; article: ArticleDisplay | null; articleCount: number }

function formatGameTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const daysAway = Math.floor((d.getTime() - Date.now()) / 86400000)
  if (daysAway > 6) {
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`
  }
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${time}`
}

// Personalized scores card — one row per in-season team of interest (config'd
// on the sports zone), showing the last/live score and the next scheduled game.
function ScoresCard({ scores }: { scores: TeamScoreCard[] }) {
  if (scores.length === 0) return null

  return (
    <div style={{
      margin: '14px 16px 6px',
      background: 'var(--sports-dark)',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ffffff' }}>
        Scores
      </div>
      {scores.map((s, i) => (
        <div
          key={`${s.team.league}-${s.team.teamId}`}
          style={{ padding: '10px 16px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.25)' : 'none' }}
        >
          {s.lastOrLiveGame ? (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 26px auto', gridTemplateRows: 'auto auto',
              columnGap: '10px', rowGap: '2px', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: '14.5px', fontWeight: s.lastOrLiveGame.isWin === false ? 400 : 700, color: 'var(--text)' }}>{s.team.shortName}</span>
              <span style={{ fontSize: '15px', fontWeight: s.lastOrLiveGame.isWin === false ? 400 : 700, color: 'var(--text)' }}>{s.lastOrLiveGame.teamScore}</span>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                color: s.lastOrLiveGame.status === 'live' ? '#EF4444' : 'var(--text)',
              }}>
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

// Weather card — one row per configured community area with a zip. Same
// solid-fill live-data-card pattern as ScoresCard.
function WeatherCard({ weather }: { weather: WeatherCardData[] }) {
  if (weather.length === 0) return null

  return (
    <div style={{
      margin: '14px 16px 6px',
      background: 'var(--local-dark)',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#ffffff' }}>
        Weather
      </div>
      {weather.map((w, i) => (
        <div
          key={w.area.id}
          style={{ padding: '10px 16px 14px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.25)' : 'none' }}
        >
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

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ padding: '18px 16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

// 300px horizontal-scroll card — same pattern as Breaking/Top Stories on the Home page (In-Depth View)
function TrackCard({
  article,
  isSaved,
  onOpen,
  onZoneOpen,
  onSave,
  onTrack,
}: {
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

// Tracking section — same 172px card format as Your Zones on Home, keyed to a tracked topic
function TrackingTopicCard({ data, onClick }: { data: TrackingTopicData; onClick: () => void }) {
  const meta = data.article ? ZONE_META[data.article.zoneType] : null
  const hasMatch = !!data.article

  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '172px', background: 'var(--surface)',
      borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer',
    }}>
      <div style={{ width: '100%', height: '96px', position: 'relative', overflow: 'hidden', background: data.article ? ZONE_GRADIENTS[data.article.zoneType] : 'var(--surface-2)' }}>
        {data.article?.imageUrl && (
          <img src={data.article.imageUrl} alt={data.topic}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.05) 0%, rgba(9,9,14,0.40) 50%, rgba(17,17,23,0.95) 100%)' }} />
        {meta && (
          <div style={{ position: 'absolute', bottom: '8px', left: '12px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: meta.color }}>
            {meta.shortLabel} Zone
          </div>
        )}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: '10px',
          color: hasMatch ? meta!.color : 'var(--text-3)',
          background: hasMatch ? meta!.bg : 'rgba(255,255,255,0.05)',
          border: `1px solid ${hasMatch ? meta!.border : 'rgba(255,255,255,0.09)'}`,
        }}>
          {hasMatch ? `${data.articleCount} NEW` : 'QUIET'}
        </div>
      </div>
      <div style={{ padding: '11px 12px 13px' }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: '10px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '54px',
        }}>
          #{data.topic}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{data.articleCount} {data.articleCount === 1 ? 'story' : 'stories'}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: hasMatch ? meta!.color : 'var(--text-3)' }}>Open →</span>
        </div>
      </div>
    </div>
  )
}

function AddTrackingCard({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '172px', background: 'var(--surface)',
      borderRadius: '14px', border: '1px dashed var(--border-mid)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
      cursor: 'pointer',
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2.3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>Add Topic</span>
    </div>
  )
}

function ViewMoreTrackingCard({ onClick }: { onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '172px', background: 'var(--surface)',
      borderRadius: '14px', border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
      cursor: 'pointer',
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>View More</span>
    </div>
  )
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

// A "Story Card" — the same expanded, Detailed-view-style tile used on the In-Depth View
function StoryCard({
  article,
  isSaved,
  onOpen,
  onZoneOpen,
  onSave,
  onTrack,
}: {
  article: ArticleDisplay
  isSaved: boolean
  onOpen: () => void
  onZoneOpen: () => void
  onSave: () => void
  onTrack: () => void
}) {
  const meta = ZONE_META[article.zoneType] ?? ZONE_META.tech
  const hasImage = !!article.imageUrl

  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: '16px',
      border: '1px solid var(--border-mid)',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      {hasImage ? (
        /* Hero image — click to open full Detailed view */
        <div
          onClick={onOpen}
          style={{
            position: 'relative', width: '100%', height: '200px', overflow: 'hidden',
            background: ZONE_GRADIENTS[article.zoneType], cursor: 'pointer',
          }}
        >
          <img
            src={article.imageUrl}
            alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.15) 0%, rgba(9,9,14,0) 35%, rgba(9,9,14,0.55) 70%, rgba(9,9,14,0.92) 100%)' }} />

          {/* Top row — zone pill (left) + Save/Track (right) */}
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

          {/* Time — bottom-right */}
          <div style={{ position: 'absolute', bottom: '10px', right: '16px', fontSize: '12px', color: 'var(--text-3)' }}>
            {relativeTime(article.publishedAt)}
          </div>
        </div>
      ) : (
        /* No image — compact header row instead of an empty hero block */
        <div
          onClick={onOpen}
          style={{ padding: '14px 18px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              onClick={(e) => { e.stopPropagation(); onZoneOpen() }}
              style={{
                background: meta.bg, borderRadius: '20px', padding: '4px 12px',
                border: `1px solid ${meta.border}`, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: meta.color }}>
                {meta.label}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{relativeTime(article.publishedAt)}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
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

      {/* Content — headline + AI summary, click to open full Detailed view */}
      <div onClick={onOpen} style={{ padding: '9px 18px 14px', cursor: 'pointer' }}>
        <h2 style={{
          fontSize: '19px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.2px',
          color: 'var(--text)', margin: '0 0 12px',
        }}>
          {article.headline}
        </h2>

        {article.summary && (
          <div style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-mid)',
            borderTop: `2px solid ${meta.color}`,
            borderRadius: '12px',
            padding: '12px 16px 14px',
            marginBottom: '6px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.color, marginBottom: '7px' }}>
              Distilled AI
            </div>
            <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
              {article.summary}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: meta.color }}>
            Full Coverage →
          </span>
        </div>
      </div>
    </div>
  )
}


export default function ZoneDetailClient({
  zone,
  articles,
  quicklook,
  scores,
  weather,
  updates,
  breaking,
  topStories,
  today,
  more,
  trackingTopics,
  initialSavedIds,
  userId,
}: {
  zone: ZoneRow
  articles: ArticleDisplay[]
  quicklook: QuicklookRow[]
  scores: TeamScoreCard[]
  weather: WeatherCardData[]
  updates: ArticleDisplay[]
  breaking: ArticleDisplay[]
  topStories: ArticleDisplay[]
  today: ArticleDisplay[]
  more: ArticleDisplay[]
  trackingTopics: TrackingTopicData[]
  initialSavedIds: string[]
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const zoneType = zone.type as ZoneType
  const meta = ZONE_META[zoneType]

  const [savedIds, setSavedIds] = useState(new Set(initialSavedIds))
  const [trackModal, setTrackModal] = useState<{ open: boolean; article?: ArticleDisplay }>({ open: false })
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [trackMenuOpen, setTrackMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const trackMenuBtnRef = useRef<HTMLButtonElement>(null)
  const [todayVisibleCount, setTodayVisibleCount] = useState(5)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const canCustomize = zoneType === 'sports' || zoneType === 'local' || zoneType === 'work'

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const handleSave = async (article: ArticleDisplay) => {
    if (savedIds.has(article.id)) {
      setSavedIds((s) => { const n = new Set(s); n.delete(article.id); return n })
      await supabase.from('user_saves').delete().eq('user_id', userId).eq('article_id', article.id)
      showToast('Removed from Read Later')
    } else {
      setSavedIds((s) => new Set(s).add(article.id))
      await supabase.from('user_saves').insert({ user_id: userId, article_id: article.id })
      showToast('Saved to Read Later')
    }
  }

  const handleTrack = async (topic: string, zone: ZoneType | null, _deadline: boolean) => {
    // Was a raw client-side insert writing the ZoneType string (e.g. "sports")
    // straight into the zone_id UUID column — addTrack resolves it to this
    // user's actual zone row id server-side.
    await addTrack(topic, zone).catch(() => null)
    showToast(`Tracking "${topic}"`)
  }

  const openTrackMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    const btn = trackMenuBtnRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setTrackMenuOpen((v) => !v)
  }

  const menuItems = [
    {
      label: 'Track a new topic',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
      onClick: () => { setTrackModal({ open: true }); setTrackMenuOpen(false) },
    },
    {
      label: 'Edit a tracked topic',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
      onClick: () => { showToast('Coming soon'); setTrackMenuOpen(false) },
    },
    {
      label: 'View all tracking',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/></svg>,
      onClick: () => { router.push('/tracking'); setTrackMenuOpen(false) },
    },
  ]

  // Tracking row: all topics if 9 or fewer, else first 8 + a View More card, always ending with the Add card
  const trackingOverflow = trackingTopics.length > 9
  const visibleTrackingTopics = trackingOverflow ? trackingTopics.slice(0, 8) : trackingTopics

  const openTrackingTopic = (data: TrackingTopicData) => {
    if (data.article) router.push(`/zones/${data.article.zoneType}/story/${data.article.id}`)
    else router.push('/tracking')
  }

  const qlItems = quicklook.map((q) => ({ label: q.label, value: q.value, sub: q.sub ?? undefined }))

  // Tracking header + row — identical between Sports and Local, extracted once
  // so both branches below stay in sync automatically.
  const trackingSection = (
    <>
      <div style={{ padding: '18px 16px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
          Tracking
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <button
          ref={trackMenuBtnRef}
          onClick={openTrackMenu}
          aria-label="Tracking options"
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'none', border: 'none', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
      </div>
      <div style={{ display: 'flex', gap: '10px', padding: '0 16px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {visibleTrackingTopics.map((t) => (
          <TrackingTopicCard key={t.id} data={t} onClick={() => openTrackingTopic(t)} />
        ))}
        {trackingOverflow && <ViewMoreTrackingCard onClick={() => router.push('/tracking')} />}
        <AddTrackingCard onClick={() => setTrackModal({ open: true })} />
      </div>
    </>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader
        title={meta?.label ?? zone.type}
        leftSlot={
          <button onClick={() => router.push('/zones')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px 8px 4px 0', fontFamily: 'inherit', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Zones
          </button>
        }
        rightSlot={
          <>
            {canCustomize && (
              <button
                onClick={() => setCustomizeOpen(true)}
                style={{ fontSize: '11px', fontWeight: 700, color: meta?.color ?? 'var(--text)', background: meta?.bg ?? 'var(--surface-2)', border: `1px solid ${meta?.border ?? 'var(--border)'}`, padding: '3px 11px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Customize
              </button>
            )}
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '20px' }}>
              {articles.length} stories
            </span>
          </>
        }
      />

      {customizeOpen && (
        <CustomizeSheet
          zoneId={zone.id}
          zoneType={zoneType}
          config={zone.config}
          onClose={() => setCustomizeOpen(false)}
        />
      )}

      {zoneType === 'sports' && <ScoresCard scores={scores} />}
      {zoneType === 'local' && <WeatherCard weather={weather} />}

      {/* Local Zone has its own Weather Card now — the generic QuickLookStrip would be redundant */}
      {zoneType !== 'local' && qlItems.length > 0 && (
        <QuickLookStrip items={qlItems} zoneType={zoneType} />
      )}

      {zoneType === 'sports' && updates.length > 0 && (
        <>
          <SectionHead label="Updates" />
          <div style={{ display: 'flex', gap: '12px', padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {updates.map((article) => (
              <TrackCard
                key={article.id}
                article={article}
                isSaved={savedIds.has(article.id)}
                onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                onSave={() => handleSave(article)}
                onTrack={() => setTrackModal({ open: true, article })}
              />
            ))}
          </div>
        </>
      )}

      {zoneType !== 'sports' && breaking.length > 0 && (
        <>
          <SectionHead label="Breaking" />
          <div style={{ display: 'flex', gap: '12px', padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {breaking.map((article) => (
              <TrackCard
                key={article.id}
                article={article}
                isSaved={savedIds.has(article.id)}
                onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                onSave={() => handleSave(article)}
                onTrack={() => setTrackModal({ open: true, article })}
              />
            ))}
          </div>
        </>
      )}

      {zoneType === 'sports' ? (
        <>
          {/* Top Stories — prioritized to news about the user's Teams of Interest */}
          {topStories.length > 0 && (
            <>
              <SectionHead label="Top Stories" />
              <div style={{ padding: '0 16px' }}>
              {topStories.map((article) => (
                <StoryCard
                  key={article.id}
                  article={article}
                  isSaved={savedIds.has(article.id)}
                  onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                  onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                  onSave={() => handleSave(article)}
                  onTrack={() => setTrackModal({ open: true, article })}
                />
              ))}
              </div>
            </>
          )}

          {/* Tracking — same rules/format as Home, filtered to sports-related topics only */}
          {trackingSection}

          {/* More — general sports news beyond the Teams of Interest */}
          {more.length > 0 && (
            <>
              <SectionHead label="More" />
              <div style={{ padding: '0 16px' }}>
              {more.map((article) => (
                <StoryCard
                  key={article.id}
                  article={article}
                  isSaved={savedIds.has(article.id)}
                  onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                  onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                  onSave={() => handleSave(article)}
                  onTrack={() => setTrackModal({ open: true, article })}
                />
              ))}
              </div>
            </>
          )}
        </>
      ) : zoneType === 'local' ? (
        <>
          {/* Top Stories — general local importance, same TrackCard row format as Home's Breaking/Top Stories */}
          {topStories.length > 0 && (
            <>
              <SectionHead label="Top Stories" />
              <div style={{ display: 'flex', gap: '12px', padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {topStories.map((article) => (
                  <TrackCard
                    key={article.id}
                    article={article}
                    isSaved={savedIds.has(article.id)}
                    onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                    onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                    onSave={() => handleSave(article)}
                    onTrack={() => setTrackModal({ open: true, article })}
                  />
                ))}
              </div>
            </>
          )}

          {/* Today — expanded Story Cards, paginated 5 at a time, same as Home */}
          {today.length > 0 && (
            <>
              <SectionHead label="Today" />
              <div style={{ padding: '0 16px' }}>
                {today.slice(0, todayVisibleCount).map((article) => (
                  <StoryCard
                    key={article.id}
                    article={article}
                    isSaved={savedIds.has(article.id)}
                    onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                    onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                    onSave={() => handleSave(article)}
                    onTrack={() => setTrackModal({ open: true, article })}
                  />
                ))}
                {today.length > todayVisibleCount && (
                  <button
                    onClick={() => setTodayVisibleCount((v) => v + 5)}
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border-mid)',
                      borderRadius: '14px', padding: '14px', marginBottom: '20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>View More</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Tracking — same rules/format as Home, filtered to local-related topics only */}
          {trackingSection}
        </>
      ) : (
        <>
          {/* Top Stories — general zone importance, same TrackCard row format as Home's Breaking/Top Stories */}
          {topStories.length > 0 && (
            <>
              <SectionHead label="Top Stories" />
              <div style={{ display: 'flex', gap: '12px', padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {topStories.map((article) => (
                  <TrackCard
                    key={article.id}
                    article={article}
                    isSaved={savedIds.has(article.id)}
                    onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                    onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                    onSave={() => handleSave(article)}
                    onTrack={() => setTrackModal({ open: true, article })}
                  />
                ))}
              </div>
            </>
          )}

          {/* Today — expanded Story Cards, paginated 5 at a time up to a cap; anything beyond the cap lands in More below */}
          {today.length > 0 && (
            <>
              <SectionHead label="Today" />
              <div style={{ padding: '0 16px' }}>
                {today.slice(0, todayVisibleCount).map((article) => (
                  <StoryCard
                    key={article.id}
                    article={article}
                    isSaved={savedIds.has(article.id)}
                    onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                    onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                    onSave={() => handleSave(article)}
                    onTrack={() => setTrackModal({ open: true, article })}
                  />
                ))}
                {today.length > todayVisibleCount && (
                  <button
                    onClick={() => setTodayVisibleCount((v) => v + 5)}
                    style={{
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--border-mid)',
                      borderRadius: '14px', padding: '14px', marginBottom: '20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>View More</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Tracking — same rules/format as Home, filtered to this zone's own zoneType */}
          {trackingSection}

          {/* More — whatever's left in the zone's pool beyond Today's cap */}
          {more.length > 0 && (
            <>
              <SectionHead label="More" />
              <div style={{ padding: '0 16px' }}>
              {more.map((article) => (
                <StoryCard
                  key={article.id}
                  article={article}
                  isSaved={savedIds.has(article.id)}
                  onOpen={() => router.push(`/zones/${zone.id}/story/${article.id}`)}
                  onZoneOpen={() => router.push(`/zones/${zone.id}`)}
                  onSave={() => handleSave(article)}
                  onTrack={() => setTrackModal({ open: true, article })}
                />
              ))}
              </div>
            </>
          )}
        </>
      )}

      <BottomNav activeTab="zones" />

      <TrackModal
        open={trackModal.open}
        onClose={() => setTrackModal({ open: false })}
        onConfirm={handleTrack}
        initialTopic={trackModal.article?.tags[0] ?? trackModal.article?.headline.split(' ').slice(0, 4).join(' ')}
        initialZone={zoneType}
        aiMode={!!trackModal.article}
      />

      <Toast message={toast.message} visible={toast.visible} />

      {trackMenuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setTrackMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 200,
            background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
            borderRadius: '14px', minWidth: '210px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden',
            animation: 'popIn 0.14s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {menuItems.map((item, i) => (
              <div
                key={i}
                onClick={item.onClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '13px 16px', cursor: 'pointer', color: 'var(--text)',
                  borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : undefined,
                }}
              >
                <span style={{ color: 'var(--text-3)', flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
