'use client'

import { useState, useEffect, useRef } from 'react'
import { ZoneType, ZONE_META } from '@/types'

interface TrackModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (topic: string, zone: ZoneType | null, deadline: boolean) => void
  initialTopic?: string
  initialZone?: ZoneType
  aiMode?: boolean
}

const ZONE_CHIPS: Array<{ id: ZoneType | 'none'; label: string }> = [
  { id: 'none', label: 'No zone' },
  { id: 'sports', label: 'Sports Zone' },
  { id: 'local', label: 'Local Zone' },
  { id: 'maine', label: 'Maine Zone' },
  { id: 'tech', label: 'Tech & AI Zone' },
  { id: 'finance', label: 'Finance Zone' },
]

export default function TrackModal({ open, onClose, onConfirm, initialTopic, initialZone, aiMode }: TrackModalProps) {
  const [topic, setTopic] = useState('')
  const [selectedZone, setSelectedZone] = useState<ZoneType | 'none'>('none')
  const [deadlineOn, setDeadlineOn] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [aiTagVisible, setAiTagVisible] = useState(false)
  const [confirmDisabled, setConfirmDisabled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return

    if (aiMode) {
      setTopic('')
      setThinking(true)
      setAiTagVisible(false)
      setConfirmDisabled(true)
      setSelectedZone('none')
      setDeadlineOn(false)

      thinkTimerRef.current = setTimeout(() => {
        setTopic(initialTopic ?? '')
        setThinking(false)
        setAiTagVisible(true)
        setConfirmDisabled(false)
        if (initialZone) setSelectedZone(initialZone)
        setTimeout(() => inputRef.current?.focus(), 50)
      }, 750)
    } else {
      setTopic(initialTopic ?? '')
      if (initialZone) setSelectedZone(initialZone)
      setThinking(false)
      setAiTagVisible(false)
      setConfirmDisabled(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }

    return () => {
      if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current)
    }
  }, [open, aiMode, initialTopic, initialZone])

  const handleClose = () => {
    if (thinkTimerRef.current) clearTimeout(thinkTimerRef.current)
    setTopic('')
    setSelectedZone('none')
    setDeadlineOn(false)
    setThinking(false)
    setAiTagVisible(false)
    setConfirmDisabled(false)
    onClose()
  }

  const handleConfirm = () => {
    if (!topic.trim() || confirmDisabled) return
    onConfirm(topic.trim(), selectedZone === 'none' ? null : selectedZone, deadlineOn)
    handleClose()
  }

  const getZoneChipStyle = (id: ZoneType | 'none') => {
    const isSelected = selectedZone === id
    if (!isSelected) return {
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      color: 'var(--text-3)',
    }
    if (id === 'none') return {
      color: 'var(--text-2)',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--border-mid)',
    }
    const meta = ZONE_META[id]
    return {
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.border}`,
    }
  }

  if (!open) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          background: 'var(--surface)',
          border: '1px solid var(--border-mid)',
          borderBottom: 'none',
          borderRadius: '22px 22px 0 0',
          padding: '0 0 40px',
          animation: 'slideUp 0.22s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-mid)', margin: '12px auto 20px' }} />

        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', padding: '0 20px 4px', letterSpacing: '-0.01em' }}>
          Track a topic
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-3)', padding: '0 20px 18px', lineHeight: 1.5 }}>
          Type anything — a team, story, event, or deadline. Distilled will alert you when something significant happens.
        </div>

        {/* Input */}
        <div style={{
          margin: '0 20px',
          background: 'var(--surface-2)',
          border: `1px solid ${thinking ? 'rgba(167,139,250,0.35)' : 'var(--border-mid)'}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0 14px',
          transition: 'border-color 0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder={thinking ? '✦ Analyzing article…' : 'e.g. Celtics trade deadline'}
            readOnly={thinking}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text)',
              padding: '13px 0',
              fontFamily: 'inherit',
            }}
          />
          {aiTagVisible && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--tech)',
              whiteSpace: 'nowrap',
            }}>
              ✦ AI
            </span>
          )}
        </div>

        {/* Zone selector */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            marginBottom: '10px',
          }}>
            Zone (optional)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
            {ZONE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedZone(chip.id)}
                style={{
                  padding: '5px 13px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                  ...getZoneChipStyle(chip.id),
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline toggle */}
        <div
          onClick={() => setDeadlineOn((v) => !v)}
          style={{
            margin: '16px 20px 0',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--text-3)' }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: '13.5px', color: 'var(--text-2)' }}>Set a deadline or expiry</span>
          </div>
          {/* Toggle switch */}
          <div style={{
            width: '38px',
            height: '22px',
            borderRadius: '11px',
            background: deadlineOn ? 'var(--primary)' : 'var(--surface-3)',
            border: `1px solid ${deadlineOn ? 'var(--primary)' : 'var(--border-mid)'}`,
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: deadlineOn ? 'var(--primary-text)' : 'var(--bg)',
              top: '2px',
              left: '2px',
              transform: deadlineOn ? 'translateX(16px)' : 'none',
              transition: 'transform 0.2s, background 0.2s',
            }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', padding: '20px 20px 0' }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              height: '46px',
              borderRadius: '23px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-mid)',
              color: 'var(--text-2)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmDisabled || !topic.trim()}
            style={{
              flex: 2,
              height: '46px',
              borderRadius: '23px',
              background: 'var(--primary)',
              border: 'none',
              color: 'var(--primary-text)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: confirmDisabled ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '-0.01em',
              opacity: (confirmDisabled || !topic.trim()) ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            Start Tracking
          </button>
        </div>
      </div>
    </div>
  )
}
