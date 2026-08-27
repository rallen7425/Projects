'use client'

import { useState, useTransition } from 'react'
import { lookupZipForProfile } from '@/lib/actions'
import type { MetroOption } from '@/types'

export type LocationResult = {
  zip: string
  city: string
  stateAbbr: string
  lat: number
  lng: number
  metroArea: string
}

// Shared zip-lookup + metro-disambiguation bottom sheet, used both to set/edit
// the Profile's Home Location and to add a Secondary Location. The metro
// choice is never auto-picked — nearestMetros always returns up to 3
// candidates and the user must tap one, even when there's an obvious nearest.
export default function LocationEditor({
  title,
  submitLabel,
  initialZip,
  onSave,
  onClose,
}: {
  title: string
  submitLabel: string
  initialZip?: string
  onSave: (location: LocationResult) => Promise<void>
  onClose: () => void
}) {
  const [zip, setZip] = useState(initialZip ?? '')
  const [lookup, setLookup] = useState<{ city: string; stateAbbr: string; lat: number; lng: number; metroOptions: MetroOption[] } | null>(null)
  const [selectedMetro, setSelectedMetro] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleLookup = () => {
    if (!zip.trim()) return
    setError('')
    startTransition(async () => {
      try {
        const result = await lookupZipForProfile(zip.trim())
        setLookup(result)
        setSelectedMetro(null)
      } catch (err) {
        setLookup(null)
        setError(err instanceof Error ? err.message : 'Could not find that zip code')
      }
    })
  }

  const handleSave = () => {
    if (!lookup || !selectedMetro) return
    startTransition(async () => {
      try {
        await onSave({ zip: zip.trim(), city: lookup.city, stateAbbr: lookup.stateAbbr, lat: lookup.lat, lng: lookup.lng, metroArea: selectedMetro })
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not save that location')
      }
    })
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}
    >
      <div style={{
        width: '100%', maxWidth: '430px', margin: '0 auto', background: 'var(--surface)',
        border: '1px solid var(--border-mid)', borderBottom: 'none', borderRadius: '22px 22px 0 0',
        padding: '0 0 40px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-mid)', margin: '12px auto 16px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', fontFamily: 'inherit' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 20px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
            Zip code
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="e.g. 01845"
              inputMode="numeric"
              autoFocus
              style={{
                flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                borderRadius: '12px', padding: '11px 14px', fontSize: '14px', color: 'var(--text)',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button
              onClick={handleLookup}
              disabled={isPending || !zip.trim()}
              style={{
                padding: '0 18px', borderRadius: '12px', background: 'var(--local)', color: '#0a0a0f',
                border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                opacity: isPending || !zip.trim() ? 0.5 : 1,
              }}
            >
              {isPending && !lookup ? 'Looking up…' : 'Look up'}
            </button>
          </div>
          {error && <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '8px' }}>{error}</div>}

          {lookup && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '13.5px', color: 'var(--text)', marginBottom: '14px' }}>
                {lookup.city}, {lookup.stateAbbr}
              </div>
              <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
                Which city do you consider home?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                {lookup.metroOptions.map((m) => {
                  const active = selectedMetro === m.label
                  return (
                    <button
                      key={m.label}
                      onClick={() => setSelectedMetro(m.label)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '11px 14px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                        background: active ? 'var(--local)' : 'var(--surface-2)',
                        border: `1px solid ${active ? 'var(--local)' : 'var(--border-mid)'}`,
                        color: active ? '#0a0a0f' : 'var(--text)',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>{m.distanceMi} mi</span>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={handleSave}
                disabled={isPending || !selectedMetro}
                style={{
                  width: '100%', height: '46px', borderRadius: '23px',
                  background: 'var(--primary)', color: 'var(--primary-text)', border: 'none',
                  fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: isPending || !selectedMetro ? 0.5 : 1,
                }}
              >
                {isPending && selectedMetro ? 'Saving…' : submitLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
