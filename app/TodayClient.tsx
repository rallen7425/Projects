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

const ZONE_GRADIENTS: Record<ZoneType, string> = {
  sports: 'linear-gradient(135deg,#1b4332,#0d2419)',
  local: 'linear-gradient(135deg,#0c2d5e,#071a38)',
  maine: 'linear-gradient(135deg,#3d2005,#251203)',
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
      <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  )
}

function TrackCard({ article, onOpen, onZoneOpen }: {
  article: ArticleDisplay
  onOpen: () => void
  onZoneOpen: () => void
}) {
  const meta = ZONE_META[article.zoneType]

  return (
    <div onClick={onOpen} style={{
      flexShrink: 0, width: '300px',
      background: 'var(--surface)', borderRadius: '16px',
      border: '1px solid var(--border-mid)', overflow: 'hidden',
      cursor: 'pointer', transition: 'opacity 0.15s',
    }}>
      {/* Zone-color top stripe */}
      <div style={{ height: '3px', width: '100%', background: meta.color }} />

      {/* Image area */}
      <div style={{
        width: '100%', height: '116px', position: 'relative', overflow: 'hidden',
        background: ZONE_GRADIENTS[article.zoneType],
      }}>
        {article.imageUrl && (
          <img src={article.imageUrl} alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.10) 0%, rgba(9,9,14,0.50) 50%, rgba(17,17,23,1) 100%)' }} />
        {/* Badge — zone label, clickable → zone page */}
        <div
          onClick={(e) => { e.stopPropagation(); onZoneOpen() }}
          style={{
            position: 'absolute', top: '12px', left: '14px',
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
      </div>

      {/* Card body */}
      <div style={{ padding: '0 14px 14px' }}>
        <div style={{ height: '12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 650, color: 'var(--text)', lineHeight: 1.35, letterSpacing: '-0.01em', marginBottom: '6px' }}>
          {article.headline}
        </div>
        {article.summary && (
          <div style={{
            fontSize: '12px', lineHeight: 1.55, color: 'var(--text-2)', marginBottom: '10px',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', marginRight: '3px', verticalAlign: '1px' }}>✦</span>
            {article.summary}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{article.sourceName}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', fontSize: '11px', fontWeight: 600,
            color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
            padding: '5px 12px', borderRadius: '20px',
          }}>
            Open in {meta.shortLabel} →
          </span>
        </div>
      </div>
    </div>
  )
}

function ZoneCard({ zone, onClick }: { zone: ZoneCardData; onClick: () => void }) {
  const meta = ZONE_META[zone.type]
  const hasArticles = zone.articleCount > 0

  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: '172px', background: 'var(--surface)',
      borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer',
    }}>
      <div style={{ width: '100%', height: '96px', position: 'relative', overflow: 'hidden', background: ZONE_GRADIENTS[zone.type] }}>
        {zone.topArticle?.imageUrl && (
          <img src={zone.topArticle.imageUrl} alt={meta.label}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.05) 0%, rgba(9,9,14,0.40) 50%, rgba(17,17,23,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: '8px', left: '12px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', color: meta.color }}>
          {meta.shortLabel} Zone
        </div>
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: '10px',
          color: hasArticles ? meta.color : 'var(--text-3)',
          background: hasArticles ? meta.bg : 'rgba(255,255,255,0.05)',
          border: `1px solid ${hasArticles ? meta.border : 'rgba(255,255,255,0.09)'}`,
        }}>
          {hasArticles ? `${zone.articleCount} NEW` : 'QUIET'}
        </div>
      </div>
      <div style={{ padding: '11px 12px 13px' }}>
        <div style={{
          fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: '10px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '54px',
        }}>
          {zone.topArticle?.headline ?? 'No stories yet'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{zone.articleCount} {zone.articleCount === 1 ? 'story' : 'stories'} today</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: hasArticles ? meta.color : 'var(--text-3)' }}>Open →</span>
        </div>
      </div>
    </div>
  )
}

export default function TodayClient({
  articles,
  initialSavedIds,
  userId,
  today,
  greeting,
  zoneData,
  trackingCards,
  userCity,
}: {
  articles: ArticleDisplay[]
  initialSavedIds: string[]
  userId: string
  today: string
  greeting: string
  zoneData: ZoneCardData[]
  trackingCards: ArticleDisplay[]
  userCity?: string
}) {
  const router = useRouter()

  const [savedIds, setSavedIds] = useState(new Set(initialSavedIds))
  const [trackModal, setTrackModal] = useState<{ open: boolean; article?: ArticleDisplay }>({ open: false })
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [trackMenuOpen, setTrackMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const trackMenuBtnRef = useRef<HTMLButtonElement>(null)

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

  const todayArticles = articles.filter((a) => a.urgencyScore >= 2)
  const worthYourTimeArticles = articles.filter((a) => a.urgencyScore < 2)
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' })

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

      {/* Tracking section */}
      {trackingCards.length > 0 && (
        <>
          <div style={{ padding: '28px 20px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div style={{ display: 'flex', gap: '12px', padding: '0 20px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {(() => {
              const zoneIdByType = Object.fromEntries(zoneData.map(z => [z.type, z.id]))
              return trackingCards.map((article) => (
                <TrackCard
                  key={article.id}
                  article={article}
                  onOpen={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}
                  onZoneOpen={() => {
                    const zoneId = zoneIdByType[article.zoneType]
                    router.push(zoneId ? `/zones/${zoneId}` : '/zones')
                  }}
                />
              ))
            })()}
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

      {/* Today articles */}
      {todayArticles.length > 0 && (
        <>
          <SectionHead label="Today" />
          <div style={{ padding: '0 20px' }}>
            {renderArticles(todayArticles)}
          </div>
        </>
      )}

      {/* Worth Your Time */}
      {worthYourTimeArticles.length > 0 && (
        <>
          <SectionHead label="Worth Your Time" />
          <div style={{ padding: '0 20px' }}>
            {renderArticles(worthYourTimeArticles)}
          </div>
        </>
      )}

      {/* Caught up footer */}
      {articles.length > 0 && (
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
