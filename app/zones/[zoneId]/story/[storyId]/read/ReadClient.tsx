'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/ui/BottomNav'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import { addTrack, saveArticle, unsaveArticle } from '@/lib/actions'
import type { ArticleDisplay } from '@/types'

const EXTERNAL_LINK_ICON = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left' ? 'M8 1L1.5 7.5L8 14' : 'M1 1L7.5 7.5L1 14'
  return (
    <svg width="8" height="14" viewBox="0 0 9 15" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ReadClient({
  source,
  isSaved: initialSaved,
  canEmbed,
  position,
  total,
  prevSourceId,
  nextSourceId,
  mainStoryId,
  zoneId,
}: {
  source: ArticleDisplay
  isSaved: boolean
  canEmbed: boolean
  position: number
  total: number
  prevSourceId: string | null
  nextSourceId: string | null
  mainStoryId: string
  zoneId: string
}) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [trackModalOpen, setTrackModalOpen] = useState(false)

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const handleSave = async () => {
    if (saved) {
      setSaved(false)
      await unsaveArticle(source.id).catch(() => setSaved(true))
      showToast('Removed from Read Later')
    } else {
      setSaved(true)
      await saveArticle(source.id).catch(() => setSaved(false))
      showToast('Saved to Read Later')
    }
  }

  const handleTrack = async (topic: string, _zone: string | null) => {
    const result = await addTrack(topic).catch(() => null)
    if (result) showToast(`Tracking "${topic}"`)
    else showToast(`Couldn't save tracking topic`)
  }

  const goToSource = (sourceId: string) => {
    router.push(`/zones/${zoneId}/story/${mainStoryId}/read?sourceId=${sourceId}`)
  }

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Fixed header — back (left), Save + Track (right); a second row below it
          steps through Full Coverage when there's more than one source. */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px', zIndex: 100,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '54px 16px 14px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-2)', fontSize: '15px', fontWeight: 500,
              fontFamily: 'inherit', padding: '6px 0',
            }}
          >
            <ChevronIcon direction="left" />
            Back
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              aria-label={saved ? 'Remove from Read Later' : 'Save to Read Later'}
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: saved ? 'var(--primary)' : 'var(--text-2)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
            <button
              onClick={() => setTrackModalOpen(true)}
              aria-label="Track this topic"
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {total > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px 12px',
          }}>
            <button
              onClick={() => prevSourceId && goToSource(prevSourceId)}
              disabled={!prevSourceId}
              aria-label="Previous source"
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: prevSourceId ? 'pointer' : 'default',
                color: prevSourceId ? 'var(--text-2)' : 'var(--text-3)',
                opacity: prevSourceId ? 1 : 0.4,
              }}
            >
              <ChevronIcon direction="left" />
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)' }}>
              {position} of {total} in Full Coverage
            </span>
            <button
              onClick={() => nextSourceId && goToSource(nextSourceId)}
              disabled={!nextSourceId}
              aria-label="Next source"
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: nextSourceId ? 'pointer' : 'default',
                color: nextSourceId ? 'var(--text-2)' : 'var(--text-3)',
                opacity: nextSourceId ? 1 : 0.4,
              }}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        )}
      </div>

      {canEmbed ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: total > 1 ? '146px' : '108px' }}>
          <div style={{ padding: '0 20px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {source.sourceName}
            </span>
            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
            >
              Open in Browser
              {EXTERNAL_LINK_ICON}
            </a>
          </div>
          <iframe
            src={source.sourceUrl}
            title={source.sourceName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={{ flex: 1, minHeight: 0, width: '100%', border: 'none', background: '#fff' }}
          />
          <div style={{ height: '100px', flexShrink: 0 }} />
        </div>
      ) : (
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          paddingTop: total > 1 ? '146px' : '108px', paddingBottom: '120px',
        }}>
          {source.imageUrl && (
            <div style={{
              margin: '0 20px 18px', borderRadius: '14px', overflow: 'hidden',
              aspectRatio: '16 / 9', background: 'var(--surface-2)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px' }}>
              {source.sourceName}
            </div>
            <h1 style={{ fontSize: '21px', fontWeight: 800, lineHeight: 1.3, color: 'var(--text)', margin: '0 0 20px' }}>
              {source.headline}
            </h1>

            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border-mid)',
              borderRadius: '14px', padding: '18px', marginBottom: '24px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '10px' }}>
                AI Story Preview
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
                {source.summary || 'No preview available for this story yet.'}
              </p>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5, margin: '0 0 20px' }}>
              {source.sourceName} doesn&rsquo;t allow their pages to be viewed inside other apps — open it in your browser to read the full story.
            </p>

            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', height: '48px',
                background: 'var(--primary)', color: 'var(--primary-text)',
                borderRadius: '24px', fontSize: '14.5px', fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Open in Browser
              {EXTERNAL_LINK_ICON}
            </a>
          </div>
        </div>
      )}

      <BottomNav activeTab="today" />

      <TrackModal
        open={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        onConfirm={handleTrack}
        initialTopic={source.tags[0] ?? source.headline.split(' ').slice(0, 4).join(' ')}
        initialZone={source.zoneType}
        aiMode
      />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
