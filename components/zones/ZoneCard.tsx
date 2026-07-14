'use client'

import type { ReactNode } from 'react'
import { ZoneConfig, ZoneType, ZONE_META, ArticleDisplay } from '@/types'

interface ZoneCardProps {
  zone: ZoneConfig
  specialCard?: ReactNode // e.g. a Scores Card / Weather Card, rendered below the header
  stories: ArticleDisplay[]
  onClick: () => void
}

export default function ZoneCard({ zone, specialCard, stories, onClick }: ZoneCardProps) {
  const meta = ZONE_META[zone.type]
  const firstInitial = zone.label.charAt(0).toUpperCase()

  const headerGradients: Record<ZoneType, string> = {
    sports:        'linear-gradient(140deg, rgba(82,201,122,0.21) 0%, rgba(82,201,122,0.06) 100%)',
    local:         'linear-gradient(140deg, rgba(91,156,246,0.21) 0%, rgba(91,156,246,0.06) 100%)',
    news:          'linear-gradient(140deg, rgba(239,159,39,0.21) 0%, rgba(239,159,39,0.06) 100%)',
    tech:          'linear-gradient(140deg, rgba(167,139,250,0.21) 0%, rgba(167,139,250,0.06) 100%)',
    finance:       'linear-gradient(140deg, rgba(52,211,153,0.21) 0%, rgba(52,211,153,0.06) 100%)',
    work:          'linear-gradient(140deg, rgba(148,163,184,0.21) 0%, rgba(148,163,184,0.06) 100%)',
    entertainment: 'linear-gradient(140deg, rgba(244,114,182,0.21) 0%, rgba(244,114,182,0.06) 100%)',
  }

  const headerBorders: Record<ZoneType, string> = {
    sports:        'rgba(82,201,122,0.14)',
    local:         'rgba(91,156,246,0.14)',
    news:          'rgba(239,159,39,0.14)',
    tech:          'rgba(167,139,250,0.14)',
    finance:       'rgba(52,211,153,0.14)',
    work:          'rgba(148,163,184,0.14)',
    entertainment: 'rgba(244,114,182,0.14)',
  }

  const previewStories = stories.slice(0, 3)

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-mid)',
        background: 'var(--surface)',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'block',
        transition: 'transform 0.14s',
      }}
    >
      {/* Colored gradient header */}
      <div style={{
        padding: '14px 16px 13px',
        position: 'relative',
        overflow: 'hidden',
        background: headerGradients[zone.type],
        borderBottom: `1px solid ${headerBorders[zone.type]}`,
      }}>
        {/* Watermark initial */}
        <div style={{
          position: 'absolute',
          right: '-4px',
          bottom: '-20px',
          fontSize: '100px',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.045)',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {firstInitial}
        </div>

        {/* Zone label + story dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 9px',
            borderRadius: '5px',
            color: meta.color,
            background: `rgba(${meta.color === '#52C97A' ? '82,201,122' : meta.color === '#5B9CF6' ? '91,156,246' : meta.color === '#EF9F27' ? '239,159,39' : meta.color === '#A78BFA' ? '167,139,250' : meta.color === '#34D399' ? '52,211,153' : '255,255,255'},0.16)`,
          }}>
            {zone.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {stories.slice(0, 3).map((s, i) => (
              <div key={i} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: s.isNew ? '#E24B4A' : s.isUrgent ? '#EF9F27' : 'rgba(255,255,255,0.18)',
              }} />
            ))}
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', marginLeft: '3px' }}>
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>
        </div>
      </div>

      {/* Special card (e.g. Scores Card / Weather Card), if this zone has one */}
      {specialCard}

      {/* Story rows */}
      <div>
        {previewStories.map((story, i) => (
          <div key={story.id} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '11px 16px',
            borderBottom: i < previewStories.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ width: '3px', borderRadius: '2px', flexShrink: 0, alignSelf: 'stretch', minHeight: '14px', marginTop: '3px', background: meta.color }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                lineHeight: 1.4,
                color: 'var(--text)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: '3px',
              }}>
                {story.headline}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {story.tags[0] && (
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.03em', color: 'var(--text-3)' }}>
                    {story.tags[0]}
                  </span>
                )}
                {story.isNew && (
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E24B4A', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                  {story.publishedAt}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 16px 11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: meta.color }}>
          View {zone.label} →
        </span>
      </div>
    </div>
  )
}
