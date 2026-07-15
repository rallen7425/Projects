'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import StoryItem from '@/components/ui/StoryItem'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import { addTrack, saveArticle, unsaveArticle } from '@/lib/actions'
import { ZONE_META } from '@/types'
import type { ArticleDisplay, ZoneType } from '@/types'

type ZoneCardData = {
  id: string
  type: ZoneType
  topArticle: ArticleDisplay | null
  articleCount: number
}

type TrackingTopicData = {
  id: string
  topic: string
  createdAt: string
  article: ArticleDisplay | null
  articleCount: number
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

function Dot() {
  return (
    <span style={{
      display: 'inline-block',
      width: '3px',
      height: '3px',
      borderRadius: '50%',
      background: 'var(--text-3)',
      margin: '0 5px',
      verticalAlign: 'middle',
    }} />
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ padding: '28px 20px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

function ZoneFilterPills({ zoneTypes, selected, onToggle }: {
  zoneTypes: ZoneType[]
  selected: Set<ZoneType>
  onToggle: (zone: ZoneType) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px', padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {zoneTypes.map((type) => {
        const meta = ZONE_META[type]
        const isSelected = selected.has(type)
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            style={{
              display: 'inline-flex', alignItems: 'center', flexShrink: 0,
              padding: '6px 14px', borderRadius: '20px',
              border: `1px solid ${isSelected ? meta.border : 'var(--border-mid)'}`,
              background: isSelected ? meta.bg : 'transparent',
              color: isSelected ? meta.color : 'var(--text-3)',
              fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {meta.shortLabel}
          </button>
        )
      })}
    </div>
  )
}

// Used for Breaking and Top Stories — 300px cards
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
      {/* Zone-color top stripe */}
      <div style={{ height: '3px', width: '100%', background: meta.color }} />

      {hasImage ? (
        /* Image area */
        <div style={{
          width: '100%', height: '116px', position: 'relative', overflow: 'hidden',
          background: ZONE_GRADIENTS[article.zoneType],
        }}>
          <img src={article.imageUrl} alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.10) 0%, rgba(9,9,14,0.50) 50%, rgba(17,17,23,1) 100%)' }} />

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
        </div>
      ) : (
        /* No image — compact header row instead of an empty 116px hero block */
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

      {/* Card body */}
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

// Used for Your Zones — 172px cards, black-rectangle format matching the other
// horizontal-scroll cards (TrackCard / the Zones page's cards) rather than an image hero
function ZoneCard({ zone, onClick }: { zone: ZoneCardData; onClick: () => void }) {
  const meta = ZONE_META[zone.type]
  const hasArticles = zone.articleCount > 0

  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '172px', background: 'var(--surface)',
      borderRadius: '16px', border: '1px solid var(--border-mid)', overflow: 'hidden', cursor: 'pointer',
    }}>
      <div style={{ height: '3px', width: '100%', background: meta.color }} />
      <div style={{ padding: '12px 14px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
            borderRadius: '20px', padding: '4px 10px',
          }}>
            {meta.shortLabel}
          </span>
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: '10px',
            color: hasArticles ? meta.color : 'var(--text-3)',
            background: hasArticles ? meta.bg : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hasArticles ? meta.border : 'rgba(255,255,255,0.09)'}`,
          }}>
            {hasArticles ? `${zone.articleCount} NEW` : 'QUIET'}
          </span>
        </div>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: '10px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '54px',
        }}>
          {zone.topArticle?.headline ?? 'No stories yet'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{zone.articleCount} {zone.articleCount === 1 ? 'story' : 'stories'} today</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: hasArticles ? meta.color : 'var(--text-3)' }}>View {meta.label} →</span>
        </div>
      </div>
    </div>
  )
}

// Tracking section — same 172px card format as Your Zones, but keyed to a tracked topic
function TrackingTopicCard({ data, onClick }: { data: TrackingTopicData; onClick: () => void }) {
  const meta = data.article ? ZONE_META[data.article.zoneType] : null
  const hasMatch = !!data.article

  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '172px', background: 'var(--surface)',
      borderRadius: '16px', border: '1px solid var(--border-mid)', overflow: 'hidden', cursor: 'pointer',
    }}>
      <div style={{ height: '3px', width: '100%', background: meta ? meta.color : 'var(--border-mid)' }} />
      <div style={{ padding: '12px 14px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          {meta ? (
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
              color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
              borderRadius: '20px', padding: '4px 10px',
            }}>
              {meta.shortLabel}
            </span>
          ) : <span />}
          <span style={{
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: '10px',
            color: hasMatch ? meta!.color : 'var(--text-3)',
            background: hasMatch ? meta!.bg : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hasMatch ? meta!.border : 'rgba(255,255,255,0.09)'}`,
          }}>
            {hasMatch ? `${data.articleCount} NEW` : 'QUIET'}
          </span>
        </div>
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
      borderRadius: '16px', border: '1px dashed var(--border-mid)',
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
      borderRadius: '16px', border: '1px solid var(--border-mid)',
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

export default function SummaryClient({
  breakingArticles,
  topStoryArticles,
  remainingArticles,
  initialSavedIds,
  userId,
  today,
  greeting,
  zoneData,
  trackingTopics,
  userCity,
}: {
  breakingArticles: ArticleDisplay[]
  topStoryArticles: ArticleDisplay[]
  remainingArticles: ArticleDisplay[]
  initialSavedIds: string[]
  userId: string
  today: string
  greeting: string
  zoneData: ZoneCardData[]
  trackingTopics: TrackingTopicData[]
  userCity?: string
}) {
  const router = useRouter()

  const [savedIds, setSavedIds] = useState(new Set(initialSavedIds))
  const [trackModal, setTrackModal] = useState<{ open: boolean; article?: ArticleDisplay }>({ open: false })
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [trackMenuOpen, setTrackMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const trackMenuBtnRef = useRef<HTMLButtonElement>(null)
  const [selectedZones, setSelectedZones] = useState<Set<ZoneType>>(new Set())

  const toggleZoneFilter = (zone: ZoneType) => {
    setSelectedZones((prev) => {
      const next = new Set(prev)
      if (next.has(zone)) next.delete(zone)
      else next.add(zone)
      return next
    })
  }

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

  const openTrackMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    const btn = trackMenuBtnRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setTrackMenuOpen((v) => !v)
  }

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const zoneIdByType = Object.fromEntries(zoneData.map(z => [z.type, z.id]))
  const openZonePage = (zoneType: ZoneType) => {
    const zoneId = zoneIdByType[zoneType]
    router.push(zoneId ? `/zones/${zoneId}` : '/zones')
  }

  // Today/More share one filtered pool, carved from whatever's left after Breaking + Top Stories
  const filterableZoneTypes = zoneData.map(z => z.type)
  const filteredRemaining = selectedZones.size === 0
    ? remainingArticles
    : remainingArticles.filter(a => selectedZones.has(a.zoneType))

  const todayArticles = filteredRemaining.filter(a => a.urgencyScore >= 2).slice(0, 5)
  const todayIds = new Set(todayArticles.map(a => a.id))
  // A story already shown in Your Zones may also appear in Today, but not in More
  const zoneTopArticleIds = new Set(zoneData.map(z => z.topArticle?.id).filter((id): id is string => !!id))
  const moreArticles = filteredRemaining.filter(a => !todayIds.has(a.id) && !zoneTopArticleIds.has(a.id))

  const hasAnyArticles = breakingArticles.length > 0 || topStoryArticles.length > 0 || remainingArticles.length > 0

  const renderArticles = (list: ArticleDisplay[]) => list.map((article) => (
    <div key={article.id} onClick={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}>
      <StoryItem
        article={article}
        isSaved={savedIds.has(article.id)}
        onSave={() => handleSave(article)}
        onTrack={() => setTrackModal({ open: true, article })}
      />
    </div>
  ))

  // Tracking row: all topics if 9 or fewer, else first 8 + a View More card, always ending with the Add card
  const trackingOverflow = trackingTopics.length > 9
  const visibleTrackingTopics = trackingOverflow ? trackingTopics.slice(0, 8) : trackingTopics

  const openTrackingTopic = (data: TrackingTopicData) => {
    if (data.article) router.push(`/zones/${data.article.zoneType}/story/${data.article.id}`)
    else router.push('/tracking')
  }

  const profileAvatar = (
    <a href="/profile" style={{ textDecoration: 'none' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer',
      }}>
        RA
      </div>
    </a>
  )

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

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '120px' }}>
      <AppHeader title="Distilled" rightSlot={profileAvatar} />

      {/* Greeting */}
      <section style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.022em', color: 'var(--text)', marginBottom: '4px' }}>
          {greeting}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
          {dayOfWeek}
          {userCity && <><Dot />{userCity}</>}
        </div>
      </section>

      {/* Breaking — urgent, recent stories only. Absent entirely when nothing qualifies. */}
      {breakingArticles.length > 0 && (
        <>
          <SectionHead label="Breaking" />
          <div style={{ display: 'flex', gap: '12px', padding: '0 20px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {breakingArticles.map((article) => (
              <TrackCard
                key={article.id}
                article={article}
                isSaved={savedIds.has(article.id)}
                onOpen={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}
                onZoneOpen={() => openZonePage(article.zoneType)}
                onSave={() => handleSave(article)}
                onTrack={() => setTrackModal({ open: true, article })}
              />
            ))}
          </div>
        </>
      )}

      {/* Top Stories — most important across all zones */}
      {topStoryArticles.length > 0 && (
        <>
          <SectionHead label="Top Stories" />
          <div style={{ display: 'flex', gap: '12px', padding: '0 20px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {topStoryArticles.map((article) => (
              <TrackCard
                key={article.id}
                article={article}
                isSaved={savedIds.has(article.id)}
                onOpen={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}
                onZoneOpen={() => openZonePage(article.zoneType)}
                onSave={() => handleSave(article)}
                onTrack={() => setTrackModal({ open: true, article })}
              />
            ))}
          </div>
        </>
      )}

      {/* Your Zones section */}
      {zoneData.length > 0 && (
        <>
          <SectionHead label="Your Zones" />
          <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {zoneData.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} onClick={() => router.push(`/zones/${zone.id}`)} />
            ))}
          </div>
        </>
      )}

      {/* Today + More — the remaining pool after Breaking/Top Stories, split at 5 */}
      {remainingArticles.length > 0 && (
        <>
          <SectionHead label="Today" />
          {filterableZoneTypes.length > 1 && (
            <ZoneFilterPills zoneTypes={filterableZoneTypes} selected={selectedZones} onToggle={toggleZoneFilter} />
          )}
          <div style={{ padding: '0 20px' }}>
            {todayArticles.length > 0 ? renderArticles(todayArticles) : (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-3)' }}>
                No stories match the selected zones.
              </div>
            )}
          </div>
        </>
      )}

      {/* Tracking — repositioned, keyed to the user's tracked topics */}
      <div style={{ padding: '28px 20px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '21px', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
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
      <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {visibleTrackingTopics.map((t) => (
          <TrackingTopicCard key={t.id} data={t} onClick={() => openTrackingTopic(t)} />
        ))}
        {trackingOverflow && <ViewMoreTrackingCard onClick={() => router.push('/tracking')} />}
        <AddTrackingCard onClick={() => setTrackModal({ open: true })} />
      </div>

      {/* More — everything left over after Today, minus anything already shown in Your Zones */}
      {remainingArticles.length > 0 && (
        <>
          <SectionHead label="More" />
          {filterableZoneTypes.length > 1 && (
            <ZoneFilterPills zoneTypes={filterableZoneTypes} selected={selectedZones} onToggle={toggleZoneFilter} />
          )}
          <div style={{ padding: '0 20px' }}>
            {moreArticles.length > 0 ? renderArticles(moreArticles) : (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-3)' }}>
                No stories match the selected zones.
              </div>
            )}
          </div>
        </>
      )}

      {/* Caught up footer */}
      {hasAnyArticles && (
        <div style={{
          margin: '36px 20px 0', padding: '28px 20px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(82,201,122,0.10)', border: '1px solid rgba(82,201,122,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52C97A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            You're up to speed.
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
            {today} · Updated regularly
          </div>
        </div>
      )}

      <BottomNav activeTab="today" />

      {/* Track topic menu popover */}
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
