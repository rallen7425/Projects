'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/ui/BottomNav'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import { addTrack, saveArticle, unsaveArticle } from '@/lib/actions'
import type { ArticleDisplay } from '@/types'
import { ZONE_META } from '@/types'

const ZONE_GRADIENTS: Record<string, string> = {
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

function sourceInitials(name: string): string {
  const words = name.split(' ').filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

export default function StoryDetailClient({
  article,
  coverage,
  related,
  isSaved: initialSaved,
  userId,
  zonePageHref,
}: {
  article: ArticleDisplay
  coverage: ArticleDisplay[]
  related: ArticleDisplay[]
  isSaved: boolean
  userId: string
  zonePageHref: string
}) {
  const router = useRouter()
  const meta = ZONE_META[article.zoneType] ?? ZONE_META.tech
  const [saved, setSaved] = useState(initialSaved)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [trackModalOpen, setTrackModalOpen] = useState(false)
  const [visibleCoverageCount, setVisibleCoverageCount] = useState(5)

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const handleSave = async () => {
    if (saved) {
      setSaved(false)
      await unsaveArticle(article.id).catch(() => setSaved(true))
      showToast('Removed from Read Later')
    } else {
      setSaved(true)
      await saveArticle(article.id).catch(() => setSaved(false))
      showToast('Saved to Read Later')
    }
  }

  const handleTrack = async (topic: string, _zone: string | null) => {
    const result = await addTrack(topic).catch(() => null)
    if (result) showToast(`Tracking "${topic}"`)
    else showToast(`Couldn't save tracking topic`)
  }

  // All source links: main article + coverage
  const allSources = [
    ...(article.sourceUrl ? [article] : []),
    ...coverage.filter((c) => c.sourceUrl),
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '120px' }}>

      {/* Fixed header — back navigation only, stays fixed while hero scrolls underneath */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px', zIndex: 100,
        display: 'flex', alignItems: 'center',
        padding: '54px 20px 14px',
        background: 'linear-gradient(to bottom, rgba(9,9,14,0.95) 60%, rgba(9,9,14,0))',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-2)', fontSize: '15px', fontWeight: 500,
            fontFamily: 'inherit', padding: '6px 0', pointerEvents: 'auto',
          }}
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1.5 7.5L8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
      </div>

      {/* Hero — full bleed, 260px. Zone pill + Save/Track overlay the image and scroll with it. */}
      <div style={{ position: 'relative', width: '100%', height: '260px', overflow: 'hidden', background: ZONE_GRADIENTS[article.zoneType] ?? 'var(--surface)' }}>
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(9,9,14,0.15) 0%, rgba(9,9,14,0) 35%, rgba(9,9,14,0.6) 70%, rgba(9,9,14,1) 100%)' }} />

        {/* Top row — zone pill (left) + Save/Track (right). Offset below the fixed header's back button. */}
        <div style={{ position: 'absolute', top: '96px', left: '18px', right: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            onClick={() => router.push(zonePageHref)}
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
              onClick={handleSave}
              aria-label={saved ? 'Remove from Read Later' : 'Save to Read Later'}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(17,17,23,0.85)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: saved ? 'var(--primary)' : 'var(--text-2)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
            <button
              onClick={() => setTrackModalOpen(true)}
              aria-label="Track this topic"
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(17,17,23,0.85)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-2)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Time — bottom-right */}
        <div style={{ position: 'absolute', bottom: '14px', right: '20px', fontSize: '12px', color: 'var(--text-3)' }}>
          {relativeTime(article.publishedAt)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px 48px' }}>

        {/* Headline */}
        <h1 style={{
          fontSize: '24px', fontWeight: 700, lineHeight: 1.28, letterSpacing: '-0.3px',
          color: 'var(--text)', marginTop: '10px', marginBottom: '18px',
        }}>
          {article.headline}
        </h1>

        {/* AI Snapshot */}
        {article.summary && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-mid)',
            borderTop: `2px solid ${meta.color}`,
            borderRadius: '14px',
            padding: '16px 18px 18px',
            marginBottom: '8px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.color, marginBottom: '8px' }}>
              Distilled AI
            </div>
            <p style={{ fontSize: '15.5px', lineHeight: 1.65, color: 'var(--text)', margin: 0 }}>
              {article.summary}
            </p>
            {allSources.length > 1 && (
              <p style={{ marginTop: '14px', fontSize: '11.5px', color: 'var(--text-3)', marginBottom: 0 }}>
                Synthesized from {allSources.length} sources · {relativeTime(article.publishedAt)}
              </p>
            )}
          </div>
        )}

        {/* Full Coverage */}
        {allSources.length > 0 && (
          <>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: 'var(--text-3)',
              margin: '24px 0 10px',
            }}>
              Full Coverage
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {allSources.slice(0, visibleCoverageCount).map((src) => (
                <div
                  key={src.id}
                  onClick={() => router.push(
                    `/zones/${article.zoneType}/story/${article.id}/read?sourceId=${src.id}`
                  )}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '13px 14px',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Publisher initial badge */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
                    background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, color: 'var(--text-2)', letterSpacing: '-0.3px',
                  }}>
                    {sourceInitials(src.sourceName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '3px' }}>
                      {src.sourceName}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {src.headline}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </div>
              ))}
            </div>
            {visibleCoverageCount < allSources.length && (
              <button
                onClick={() => setVisibleCoverageCount((c) => c + 5)}
                style={{
                  width: '100%', marginTop: '8px', padding: '12px', borderRadius: '10px',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', fontSize: '13.5px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                View more ({allSources.length - visibleCoverageCount} more)
              </button>
            )}
          </>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '28px 0' }} />

        {/* Related Stories */}
        {related.length > 0 && (
          <>
            <div style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: 'var(--text-3)',
              marginBottom: '14px',
            }}>
              More from {meta.label}
            </div>
            {related.map((r, i) => (
              <div
                key={r.id}
                onClick={() => router.push(`/zones/${article.zoneType}/story/${r.id}`)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  paddingBottom: i < related.length - 1 ? '14px' : 0,
                  marginBottom: i < related.length - 1 ? '14px' : 0,
                  borderBottom: i < related.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: ZONE_GRADIENTS[r.zoneType] ?? 'var(--surface-2)' }}>
                  {r.imageUrl && (
                    <img src={r.imageUrl} alt={r.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: meta.color, marginBottom: '4px' }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.headline}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

      </div>

      <BottomNav activeTab="today" />

      <TrackModal
        open={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        onConfirm={handleTrack}
        initialTopic={article.tags[0] ?? article.headline.split(' ').slice(0, 4).join(' ')}
        initialZone={article.zoneType}
        aiMode
      />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
