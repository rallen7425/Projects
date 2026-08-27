'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ZONE_META, type LocalArea, type ZoneType } from '@/types'
import type { TeamOfInterest } from '@/lib/scores/espn'
import { TEAM_CATALOG, LEAGUE_LABELS } from '@/lib/scores/teams'
import { updateZoneCustomization } from '@/lib/actions'
import type { Json } from '@/types/supabase'

type Props = {
  zoneId: string
  zoneType: ZoneType
  config: unknown
  onClose: () => void
}

export default function CustomizeSheet({ zoneId, zoneType, config, onClose }: Props) {
  const meta = ZONE_META[zoneType]

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
          <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
            Customize {meta?.label ?? zoneType}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', fontFamily: 'inherit' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 20px' }}>
          {zoneType === 'sports' && (
            <TeamsEditor zoneId={zoneId} initialTeams={(config as { teams?: TeamOfInterest[] } | null)?.teams ?? []} />
          )}
          {zoneType === 'local' && (
            <AreasEditor initialAreas={(config as { areas?: LocalArea[] } | null)?.areas ?? []} onClose={onClose} />
          )}
          {zoneType === 'work' && (
            <IndustryEditor zoneId={zoneId} initialIndustry={(config as { industry?: string } | null)?.industry ?? ''} onDone={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}

function TeamsEditor({ zoneId, initialTeams }: { zoneId: string; initialTeams: TeamOfInterest[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<TeamOfInterest[]>(initialTeams)
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const isSelected = (t: TeamOfInterest) => selected.some((s) => s.league === t.league && s.teamId === t.teamId)

  const toggle = (t: TeamOfInterest) => {
    setSaved(false)
    setSelected((prev) =>
      isSelected(t) ? prev.filter((s) => !(s.league === t.league && s.teamId === t.teamId)) : [...prev, t]
    )
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TEAM_CATALOG
    return TEAM_CATALOG.filter((t) => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q))
  }, [query])

  const grouped = useMemo(() => {
    const byLeague: Record<string, TeamOfInterest[]> = {}
    for (const t of filtered) {
      byLeague[t.league] = byLeague[t.league] ?? []
      byLeague[t.league].push(t)
    }
    return byLeague
  }, [filtered])

  const handleSave = () => {
    startTransition(async () => {
      await updateZoneCustomization(zoneId, { teams: selected } as unknown as Json)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '14px', lineHeight: 1.5 }}>
        Pick the teams you follow — powers the Scores Card and team-specific coverage on this zone.
      </div>

      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
          {selected.map((t) => (
            <button
              key={`${t.league}-${t.teamId}`}
              onClick={() => toggle(t)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px 5px 12px',
                borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: 'var(--sports)', color: '#0a0a0f', border: 'none', fontFamily: 'inherit',
              }}
            >
              {t.shortName}
              <span style={{ fontSize: '14px', lineHeight: 1 }}>×</span>
            </button>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search teams…"
        style={{
          width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
          borderRadius: '12px', padding: '11px 14px', fontSize: '14px', color: 'var(--text)',
          fontFamily: 'inherit', outline: 'none', marginBottom: '14px',
        }}
      />

      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {Object.entries(grouped).map(([league, teams]) => (
          <div key={league} style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px' }}>
              {LEAGUE_LABELS[league as TeamOfInterest['league']]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {teams.map((t) => {
                const active = isSelected(t)
                return (
                  <button
                    key={`${t.league}-${t.teamId}`}
                    onClick={() => toggle(t)}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      background: active ? 'var(--sports)' : 'var(--surface-2)',
                      color: active ? '#0a0a0f' : 'var(--text-2)',
                      border: `1px solid ${active ? 'var(--sports)' : 'var(--border)'}`,
                    }}
                  >
                    {t.shortName}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        style={{
          width: '100%', height: '46px', borderRadius: '23px', marginTop: '8px',
          background: 'var(--primary)', color: 'var(--primary-text)', border: 'none',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save Teams'}
      </button>
    </div>
  )
}

// Local Zone's areas are now derived entirely from the user's Profile
// (home location + up to 5 secondary locations) — this is a read-only
// summary pointing there, rather than its own editor, since editing here
// would just be a second, out-of-sync copy of the same data.
function AreasEditor({ initialAreas, onClose }: { initialAreas: LocalArea[]; onClose: () => void }) {
  const defaults = initialAreas.filter((a) => !a.id.includes('secondary'))
  const extras = initialAreas.filter((a) => a.id.includes('secondary'))

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.5 }}>
        Local areas are set from your Profile&apos;s home location and secondary locations, not here.
      </div>

      {defaults.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px' }}>
            Home areas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {defaults.map((a) => (
              <div key={a.id} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '10px', fontSize: '13.5px', color: 'var(--text-2)' }}>
                {a.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px' }}>
            Secondary locations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {extras.map((a) => (
              <div key={a.id} style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '10px', fontSize: '13.5px', color: 'var(--text-2)' }}>
                {a.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/profile"
        onClick={onClose}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '46px', borderRadius: '23px',
          background: 'var(--primary)', color: 'var(--primary-text)', textDecoration: 'none',
          fontSize: '15px', fontWeight: 700,
        }}
      >
        Manage in Profile
      </Link>
    </div>
  )
}

function IndustryEditor({ zoneId, initialIndustry, onDone }: { zoneId: string; initialIndustry: string; onDone: () => void }) {
  const router = useRouter()
  const [industry, setIndustry] = useState(initialIndustry)
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    if (!industry.trim()) return
    startTransition(async () => {
      await updateZoneCustomization(zoneId, { industry: industry.trim() } as unknown as Json)
      router.refresh()
      onDone()
    })
  }

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.5 }}>
        Your industry shapes the careers and business coverage in this zone.
      </div>
      <input
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        placeholder="e.g. Software"
        style={{
          width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
          borderRadius: '12px', padding: '13px 14px', fontSize: '15px', color: 'var(--text)',
          fontFamily: 'inherit', outline: 'none', marginBottom: '16px',
        }}
      />
      <button
        onClick={handleSave}
        disabled={isPending || !industry.trim()}
        style={{
          width: '100%', height: '46px', borderRadius: '23px',
          background: 'var(--primary)', color: 'var(--primary-text)', border: 'none',
          fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          opacity: isPending || !industry.trim() ? 0.6 : 1,
        }}
      >
        {isPending ? 'Saving…' : 'Save Industry'}
      </button>
    </div>
  )
}
