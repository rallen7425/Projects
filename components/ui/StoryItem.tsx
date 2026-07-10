'use client'

import { ArticleDisplay } from '@/types'
import ZonePill from './ZonePill'

interface StoryItemProps {
  article: ArticleDisplay
  onSave: () => void
  onTrack: () => void
  isSaved: boolean
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function StoryItem({ article, onSave, onTrack, isSaved }: StoryItemProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      padding: '14px 0',
      borderBottom: '1px solid var(--border)',
      cursor: 'pointer',
      transition: 'opacity 0.15s',
      position: 'relative',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: '72px',
        height: '72px',
        borderRadius: '11px',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        background: 'var(--surface-2)',
      }}>
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.headline}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}>
            📰
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Meta row — order -1 puts it above headline via flex column */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          order: -1,
          marginBottom: '6px',
          flexWrap: 'nowrap',
        }}>
          <ZonePill zone={article.zoneType} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', flexShrink: 0 }}>
            {relativeTime(article.publishedAt)}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {/* Save button */}
            <button
              onClick={(e) => { e.stopPropagation(); onSave() }}
              aria-label={isSaved ? 'Remove from Read Later' : 'Save to Read Later'}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSaved ? 'var(--primary)' : 'var(--text-3)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
              </svg>
            </button>
            {/* Track button */}
            <button
              onClick={(e) => { e.stopPropagation(); onTrack() }}
              aria-label="Track this topic"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-3)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text)',
          lineHeight: 1.4,
          marginBottom: '6px',
        }}>
          {article.headline}
        </div>

        {/* AI summary */}
        {article.summary && (
          <div style={{
            fontSize: '12px',
            lineHeight: 1.58,
            color: 'var(--text-2)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-3)', marginRight: '3px', verticalAlign: '1px' }}>✦</span>
            {article.summary}
          </div>
        )}
      </div>
    </div>
  )
}
