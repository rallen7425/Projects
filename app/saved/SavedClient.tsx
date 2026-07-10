'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import StoryItem from '@/components/ui/StoryItem'
import Toast from '@/components/ui/Toast'
import TrackModal from '@/components/ui/TrackModal'
import { addTrack, unsaveArticle } from '@/lib/actions'
import type { ArticleDisplay, ZoneType } from '@/types'
import { ZONE_META } from '@/types'

const ALL_ZONES: Array<ZoneType | 'all'> = ['all', 'sports', 'local', 'tech', 'finance', 'entertainment', 'maine', 'work']

export default function SavedClient({ articles: initial, userId }: { articles: ArticleDisplay[]; userId: string }) {
  const router = useRouter()

  const [articles, setArticles] = useState(initial)
  const [activeZone, setActiveZone] = useState<ZoneType | 'all'>('all')
  const [trackModal, setTrackModal] = useState<{ open: boolean; article?: ArticleDisplay }>({ open: false })
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const handleUnsave = async (article: ArticleDisplay) => {
    setArticles((prev) => prev.filter((a) => a.id !== article.id))
    await unsaveArticle(article.id).catch(() => null)
    showToast('Removed from Read Later')
  }

  const handleTrack = async (topic: string) => {
    const result = await addTrack(topic).catch(() => null)
    if (result) showToast(`Tracking "${topic}"`)
    else showToast(`Couldn't save tracking topic`)
  }

  const filtered = activeZone === 'all' ? articles : articles.filter((a) => a.zoneType === activeZone)
  const zonesPresent = Array.from(new Set(articles.map((a) => a.zoneType)))

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader
        title="Read Later"
        rightSlot={
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '20px' }}>
            {articles.length}
          </span>
        }
      />

      {/* Zone filter pills */}
      {articles.length > 0 && (
        <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', padding: '12px 16px', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveZone('all')}
            style={{ flexShrink: 0, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', background: activeZone === 'all' ? 'var(--primary)' : 'var(--surface-2)', color: activeZone === 'all' ? 'var(--primary-text)' : 'var(--text-3)', borderColor: activeZone === 'all' ? 'var(--primary)' : 'var(--border-mid)' }}
          >
            All
          </button>
          {(zonesPresent as ZoneType[]).map((z) => {
            const meta = ZONE_META[z]
            const isActive = activeZone === z
            return (
              <button
                key={z}
                onClick={() => setActiveZone(z)}
                style={{ flexShrink: 0, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', background: isActive ? meta.bg : 'var(--surface-2)', color: isActive ? meta.color : 'var(--text-3)', borderColor: isActive ? meta.border : 'var(--border-mid)' }}
              >
                {meta.shortLabel}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Nothing saved yet</div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
              Tap the bookmark icon on any article to save it here.
            </div>
          </div>
        ) : (
          filtered.map((article) => (
            <div key={article.id} onClick={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}>
              <StoryItem
                article={article}
                isSaved={true}
                onSave={() => handleUnsave(article)}
                onTrack={() => setTrackModal({ open: true, article })}
              />
            </div>
          ))
        )}
      </div>

      <BottomNav activeTab="saved" />

      <TrackModal
        open={trackModal.open}
        onClose={() => setTrackModal({ open: false })}
        onConfirm={handleTrack}
        initialTopic={trackModal.article?.tags[0]}
        initialZone={trackModal.article?.zoneType}
        aiMode={!!trackModal.article}
      />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
