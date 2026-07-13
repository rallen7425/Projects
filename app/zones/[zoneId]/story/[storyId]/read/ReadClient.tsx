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

export default function ReadClient({
  article,
  isSaved: initialSaved,
  url,
  sourceName,
  canEmbed,
}: {
  article: ArticleDisplay
  isSaved: boolean
  url: string
  sourceName: string
  canEmbed: boolean
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

  return (
    <div style={{ background: 'var(--bg)', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Fixed header — back (left), Save + Track (right). Same pattern as Story Detail. */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '430px', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '54px 16px 14px',
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
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
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1.5 7.5L8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

      {canEmbed ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: '108px' }}>
          <div style={{ padding: '0 20px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sourceName}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
            >
              Open in Browser
              {EXTERNAL_LINK_ICON}
            </a>
          </div>
          <iframe
            src={url}
            title={sourceName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={{ flex: 1, minHeight: 0, width: '100%', border: 'none', background: '#fff' }}
          />
          <div style={{ height: '100px', flexShrink: 0 }} />
        </div>
      ) : (
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: '108px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          gap: '18px', padding: '128px 28px 140px',
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
            {sourceName} can&rsquo;t be shown here
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0, maxWidth: '280px' }}>
            This publisher doesn&rsquo;t allow their pages to be viewed inside other apps. You can open it in your browser instead.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'var(--primary)', color: 'var(--primary-text)',
              borderRadius: '24px', padding: '12px 24px', fontSize: '14.5px', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Open in Browser
          </a>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '8px' }}
          >
            Back to Story
          </button>
        </div>
      )}

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
