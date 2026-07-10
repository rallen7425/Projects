'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import QuickLookStrip from '@/components/ui/QuickLookStrip'
import StoryItem from '@/components/ui/StoryItem'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import type { ArticleDisplay, ZoneType } from '@/types'
import { ZONE_META } from '@/types'

type QuicklookRow = { label: string; value: string; sub?: string | null }
type ZoneRow = { id: string; type: string; position: number; enabled: boolean }


export default function ZoneDetailClient({
  zone,
  articles,
  quicklook,
  initialSavedIds,
  userId,
}: {
  zone: ZoneRow
  articles: ArticleDisplay[]
  quicklook: QuicklookRow[]
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

  const handleTrack = async (topic: string, zoneId: string | null, _deadline: boolean) => {
    await supabase.from('user_tracks').insert({ user_id: userId, topic, zone_id: zoneId ?? null })
    showToast(`Tracking "${topic}"`)
  }

  const qlItems = quicklook.map((q) => ({ label: q.label, value: q.value, sub: q.sub ?? undefined }))

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
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: '20px' }}>
            {articles.length} stories
          </span>
        }
      />

      {qlItems.length > 0 && (
        <QuickLookStrip items={qlItems} zoneType={zoneType} />
      )}

      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '18px 0 4px' }}>
          Top Stories
        </div>
        {[...articles]
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .map((article) => (
            <div key={article.id} onClick={() => router.push(`/zones/${zone.id}/story/${article.id}`)}>
              <StoryItem
                article={article}
                isSaved={savedIds.has(article.id)}
                onSave={() => handleSave(article)}
                onTrack={() => setTrackModal({ open: true, article })}
              />
            </div>
          ))}
      </div>

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
    </div>
  )
}
