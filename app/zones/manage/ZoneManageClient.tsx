'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import Toast from '@/components/ui/Toast'
import { ZONE_META, type ZoneType } from '@/types'
import type { ZoneTemplate } from '@/lib/zone-templates'
import { addZone, toggleZoneEnabled, reorderZonesAction } from '@/lib/actions'

type ZoneRow = {
  id: string
  type: string
  position: number
  enabled: boolean
  template_id: string | null
}

type TemplateWithKey = ZoneTemplate & { key: string }
type Row = { key: string; template: TemplateWithKey; zone: ZoneRow | null }

function buildExistingOrder(zones: ZoneRow[], templates: TemplateWithKey[]): Row[] {
  const templateByType = new Map(templates.map((t) => [t.type, t]))
  return zones
    .filter((z) => templateByType.has(z.type as ZoneType))
    .sort((a, b) => a.position - b.position)
    .map((z) => ({ key: templateByType.get(z.type as ZoneType)!.key, template: templateByType.get(z.type as ZoneType)!, zone: z }))
}

const ROW_GAP = 8

export default function ZoneManageClient({
  zones,
  templates,
}: {
  zones: ZoneRow[]
  templates: TemplateWithKey[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState({ visible: false, message: '' })
  const [setupTemplate, setSetupTemplate] = useState<TemplateWithKey | null>(null)

  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500)
  }

  const existingTypes = new Set(zones.map((z) => z.type))
  const phantomRows: Row[] = templates
    .filter((t) => !existingTypes.has(t.type))
    .map((t) => ({ key: t.key, template: t, zone: null }))

  // Existing (created) zones are the only ones with a real position — kept as
  // local state so drag reordering can move them live; resynced whenever the
  // server data actually changes (toggle on/off, or a persisted reorder).
  const [order, setOrder] = useState<Row[]>(() => buildExistingOrder(zones, templates))
  useEffect(() => {
    setOrder(buildExistingOrder(zones, templates))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones])

  // Mirrors `order` so pointerup can always read the truly latest array —
  // the pointerup handler's own closure can be one render behind the last
  // pointermove's setOrder call.
  const orderRef = useRef(order)
  useEffect(() => { orderRef.current = order }, [order])

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dragState = useRef<{ id: string; startY: number } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const handleDragPointerDown = (e: React.PointerEvent, id: string) => {
    dragState.current = { id, startY: e.clientY }
    setDraggingId(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  // Always derives the dragged row's current index from the live array
  // inside the state updater itself — never from a separately-tracked index
  // ref, which can desync from the actual array across rapid pointermove
  // events and swap in an out-of-bounds (undefined) entry.
  const handleDragPointerMove = (e: React.PointerEvent) => {
    const drag = dragState.current
    if (!drag) return
    const deltaY = e.clientY - drag.startY

    const rowEl = rowRefs.current[drag.id]
    if (!rowEl) return
    const step = rowEl.offsetHeight + ROW_GAP

    if (Math.abs(deltaY) < step / 2) {
      setDragOffset(deltaY)
      return
    }

    const direction = deltaY > 0 ? 1 : -1
    let moved = false
    setOrder((prev) => {
      const idx = prev.findIndex((r) => r.zone!.id === drag.id)
      const targetIdx = idx + direction
      if (idx === -1 || targetIdx < 0 || targetIdx >= prev.length) return prev
      moved = true
      const next = [...prev]
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next
    })
    if (moved) {
      drag.startY = e.clientY
      setDragOffset(0)
    } else {
      setDragOffset(deltaY)
    }
  }

  const handleDragPointerUp = () => {
    if (!dragState.current) return
    dragState.current = null
    setDraggingId(null)
    setDragOffset(0)
    const finalOrder = orderRef.current
    startTransition(async () => {
      await reorderZonesAction(finalOrder.map((r) => r.zone!.id))
      router.refresh()
    })
  }

  const handleToggleExisting = (zone: ZoneRow) => {
    startTransition(async () => {
      await toggleZoneEnabled(zone.id, !zone.enabled)
      router.refresh()
    })
  }

  const handleTogglePhantomOn = (template: TemplateWithKey) => {
    if (template.requiresZip || template.requiresIndustry) {
      setSetupTemplate(template)
      return
    }
    startTransition(async () => {
      try {
        await addZone(template.key)
        showToast(`${template.label} on`)
        router.refresh()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not turn that on')
      }
    })
  }

  const handleSetupSubmit = (value: string) => {
    if (!setupTemplate) return
    const template = setupTemplate
    startTransition(async () => {
      try {
        await addZone(template.key, template.requiresZip ? { zip: value } : { industry: value })
        setSetupTemplate(null)
        showToast(`${template.label} on`)
        router.refresh()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Could not turn that on')
      }
    })
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader
        title="Manage Zones"
        leftSlot={
          <button
            onClick={() => router.push('/zones')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px 8px 4px 0', fontFamily: 'inherit', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Zones
          </button>
        }
      />

      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.5 }}>
          Turn zones on or off. Drag to reorder the ones you&apos;ve turned on. Tap a zone&apos;s name to open and customize it.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: `${ROW_GAP}px` }}>
          {order.map((row) => (
            <ExistingRow
              key={row.zone!.id}
              row={row}
              isDragging={draggingId === row.zone!.id}
              dragOffset={draggingId === row.zone!.id ? dragOffset : 0}
              setRef={(el) => { rowRefs.current[row.zone!.id] = el }}
              onDragPointerDown={(e) => handleDragPointerDown(e, row.zone!.id)}
              onDragPointerMove={handleDragPointerMove}
              onDragPointerUp={handleDragPointerUp}
              onToggle={() => handleToggleExisting(row.zone!)}
              disabled={isPending}
            />
          ))}
          {phantomRows.map((row) => (
            <PhantomRow key={row.key} row={row} onToggle={() => handleTogglePhantomOn(row.template)} disabled={isPending} />
          ))}
        </div>
      </div>

      {setupTemplate && (
        <SetupPrompt
          template={setupTemplate}
          onClose={() => setSetupTemplate(null)}
          onSubmit={handleSetupSubmit}
          pending={isPending}
        />
      )}

      <Toast visible={toast.visible} message={toast.message} />
      <BottomNav activeTab="zones" />
    </div>
  )
}

function rowShellStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: 'var(--surface)',
    border: '1px solid var(--border-mid)',
    borderRadius: '12px',
  }
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="8" cy="6" r="1.6" /><circle cx="16" cy="6" r="1.6" />
      <circle cx="8" cy="12" r="1.6" /><circle cx="16" cy="12" r="1.6" />
      <circle cx="8" cy="18" r="1.6" /><circle cx="16" cy="18" r="1.6" />
    </svg>
  )
}

function ToggleSwitch({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled: boolean }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      role="switch"
      aria-checked={on}
      style={{
        width: '38px', height: '22px', borderRadius: '11px',
        background: on ? 'var(--primary)' : 'var(--surface-3)',
        border: `1px solid ${on ? 'var(--primary)' : 'var(--border-mid)'}`,
        position: 'relative', cursor: disabled ? 'default' : 'pointer', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', width: '16px', height: '16px', borderRadius: '50%',
        background: on ? 'var(--primary-text)' : 'var(--text-3)',
        top: '2px', left: '2px', transform: on ? 'translateX(16px)' : 'none',
        transition: 'transform 0.2s',
      }} />
    </div>
  )
}

function ExistingRow({
  row,
  isDragging,
  dragOffset,
  setRef,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerUp,
  onToggle,
  disabled,
}: {
  row: Row
  isDragging: boolean
  dragOffset: number
  setRef: (el: HTMLDivElement | null) => void
  onDragPointerDown: (e: React.PointerEvent) => void
  onDragPointerMove: (e: React.PointerEvent) => void
  onDragPointerUp: (e: React.PointerEvent) => void
  onToggle: () => void
  disabled: boolean
}) {
  const zone = row.zone!
  const meta = ZONE_META[zone.type as ZoneType]

  return (
    <div
      ref={setRef}
      style={{
        ...rowShellStyle(),
        transform: isDragging ? `translateY(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.15s',
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 10 : undefined,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.45)' : undefined,
      }}
    >
      <button
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        aria-label="Drag to reorder"
        style={{
          background: 'none', border: 'none', padding: '4px', margin: '-4px',
          color: 'var(--text-3)', cursor: 'grab', touchAction: 'none', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <GripIcon />
      </button>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta?.color ?? 'var(--text-3)', flexShrink: 0, opacity: zone.enabled ? 1 : 0.5 }} />
      <Link href={`/zones/${zone.id}`} style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: zone.enabled ? 'var(--text)' : 'var(--text-2)', textDecoration: 'none' }}>
        {meta?.label ?? zone.type}
      </Link>
      <ToggleSwitch on={zone.enabled} onClick={onToggle} disabled={disabled} />
    </div>
  )
}

function PhantomRow({ row, onToggle, disabled }: { row: Row; onToggle: () => void; disabled: boolean }) {
  const meta = ZONE_META[row.template.type]
  return (
    <div style={rowShellStyle()}>
      <span style={{ width: '14px', flexShrink: 0 }} />
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta?.color ?? 'var(--text-3)', flexShrink: 0, opacity: 0.5 }} />
      <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: 'var(--text-2)' }}>{row.template.label}</span>
      <ToggleSwitch on={false} onClick={onToggle} disabled={disabled} />
    </div>
  )
}

function SetupPrompt({
  template,
  onClose,
  onSubmit,
  pending,
}: {
  template: TemplateWithKey
  onClose: () => void
  onSubmit: (value: string) => void
  pending: boolean
}) {
  const [value, setValue] = useState('')
  const fieldLabel = template.requiresZip ? 'Zip code' : 'Industry'

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end' }}
    >
      <div style={{
        width: '100%', maxWidth: '430px', margin: '0 auto', background: 'var(--surface)',
        border: '1px solid var(--border-mid)', borderBottom: 'none', borderRadius: '22px 22px 0 0',
        padding: '0 0 40px',
      }}>
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-mid)', margin: '12px auto 20px' }} />
        <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', padding: '0 20px 4px' }}>
          Turn on {template.label}
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-3)', padding: '0 20px 18px', lineHeight: 1.5 }}>
          {template.description}
        </div>

        <div style={{ padding: '0 20px' }}>
          <label style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '8px' }}>
            {fieldLabel}
          </label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={template.requiresZip ? 'e.g. 01845' : 'e.g. Software'}
            inputMode={template.requiresZip ? 'numeric' : 'text'}
            autoFocus
            style={{
              width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
              borderRadius: '12px', padding: '13px 14px', fontSize: '15px', color: 'var(--text)',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', padding: '20px 20px 0' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: '46px', borderRadius: '23px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--text-2)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(value.trim())}
            disabled={pending || !value.trim()}
            style={{
              flex: 2, height: '46px', borderRadius: '23px', background: 'var(--primary)',
              border: 'none', color: 'var(--primary-text)', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', opacity: pending || !value.trim() ? 0.5 : 1,
            }}
          >
            {pending ? 'Turning on…' : 'Turn On'}
          </button>
        </div>
      </div>
    </div>
  )
}
