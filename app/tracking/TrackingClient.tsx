'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import TrackModal from '@/components/ui/TrackModal'
import Toast from '@/components/ui/Toast'
import ZonePill from '@/components/ui/ZonePill'
import { addTrack, removeTrack, updateTrack } from '@/lib/actions'
import { resolveTrackedTopicZone, type ZoneRef } from '@/lib/trackedTopicZone'
import type { ArticleDisplay, ZoneType } from '@/types'

type TopicRow = { id: string; topic: string; zone_id?: string | null; deadline_at?: string | null; created_at: string }
type TopicData = { topic: TopicRow; articles: ArticleDisplay[] }

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TrackingClient({ topicsWithArticles: initial, userId, zones }: { topicsWithArticles: TopicData[]; userId: string; zones: ZoneRef[] }) {
  const router = useRouter()
  const [topics, setTopics] = useState(initial)
  const [addModal, setAddModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<TopicRow | null>(null)
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const handleAddTopic = async (topic: string, zone: ZoneType | null) => {
    const data = await addTrack(topic, zone).catch(() => null)
    if (data) {
      setTopics((prev) => [{ topic: data, articles: [] }, ...prev])
      showToast(`Tracking "${topic}"`)
    } else {
      showToast(`Couldn't save tracking topic`)
    }
  }

  const handleEditTopic = async (topic: string, zone: ZoneType | null) => {
    if (!editingTopic) return
    const id = editingTopic.id
    const data = await updateTrack(id, topic, zone).catch(() => null)
    setEditingTopic(null)
    if (data) {
      setTopics((prev) => prev.map((t) => (t.topic.id === id ? { ...t, topic: data } : t)))
      showToast('Topic updated')
      router.refresh()
    } else {
      showToast(`Couldn't update tracking topic`)
    }
  }

  const handleDelete = async (id: string) => {
    const removed = topics.find((t) => t.topic.id === id)
    setTopics((prev) => prev.filter((t) => t.topic.id !== id))
    const ok = await removeTrack(id).then(() => true).catch(() => false)
    if (ok) {
      showToast('Topic removed')
      router.refresh()
    } else {
      if (removed) setTopics((prev) => [...prev, removed])
      showToast('Failed to remove topic')
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader
        title="Tracking"
        rightSlot={
          <button
            onClick={() => setAddModal(true)}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        }
      />

      {topics.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>
              <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Nothing tracked yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            Track a topic to get alerts when something significant happens.
          </div>
          <button
            onClick={() => setAddModal(true)}
            style={{ marginTop: '20px', padding: '10px 24px', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', borderRadius: '20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Track something
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {topics.map(({ topic, articles }) => (
            <div key={topic.id} style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              {/* Topic header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>#{topic.topic}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                    {articles.length} {articles.length === 1 ? 'story' : 'stories'} · tracked {relativeTime(topic.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setEditingTopic(topic)}
                    aria-label={`Edit "${topic.topic}"`}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(topic.id)}
                    aria-label={`Remove "${topic.topic}"`}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Article cards — horizontal scroll */}
              {articles.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => router.push(`/zones/${article.zoneType}/story/${article.id}`)}
                      style={{ flexShrink: 0, width: '200px', background: 'var(--surface)', border: '1px solid var(--border-mid)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}
                    >
                      {article.imageUrl && (
                        <div style={{ width: '100%', height: '90px', overflow: 'hidden', background: 'var(--surface-2)' }}>
                          <img src={article.imageUrl} alt={article.headline} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ padding: '10px' }}>
                        <ZonePill zone={article.zoneType} size="sm" />
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginTop: '6px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.headline}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '5px' }}>{relativeTime(article.publishedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-3)', padding: '8px 0' }}>No stories yet — we&apos;ll alert you when something happens.</div>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav activeTab="tracking" />

      <TrackModal
        open={addModal}
        onClose={() => setAddModal(false)}
        onConfirm={handleAddTopic}
      />

      <TrackModal
        open={!!editingTopic}
        mode="edit"
        onClose={() => setEditingTopic(null)}
        onConfirm={handleEditTopic}
        initialTopic={editingTopic?.topic}
        initialZone={editingTopic ? resolveTrackedTopicZone(editingTopic.zone_id, zones) ?? undefined : undefined}
      />

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
