'use client'

import { useState, useTransition } from 'react'

export type SchoolInfoValues = {
  schoolDistrict: string
  privateSchools: string
  colleges: string
}

// Self-entered reference text — not looked up from any data provider — for
// the school district, private schools, and colleges near a location (home
// or secondary). Saved independently of the location's zip/metro so editing
// this text never re-triggers a geocode.
export default function SchoolInfoFields({
  initial,
  onSave,
}: {
  initial: SchoolInfoValues
  onSave: (values: SchoolInfoValues) => Promise<void>
}) {
  const [values, setValues] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const dirty = values.schoolDistrict !== initial.schoolDistrict || values.privateSchools !== initial.privateSchools || values.colleges !== initial.colleges

  const handleSave = () => {
    startTransition(async () => {
      await onSave(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
    borderRadius: '10px', padding: '9px 12px', fontSize: '13.5px', color: 'var(--text)',
    fontFamily: 'inherit', outline: 'none', marginTop: '4px',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={labelStyle}>School district</label>
        <input
          value={values.schoolDistrict}
          onChange={(e) => setValues((v) => ({ ...v, schoolDistrict: e.target.value }))}
          placeholder="e.g. North Andover Public Schools"
          style={fieldStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Private schools</label>
        <input
          value={values.privateSchools}
          onChange={(e) => setValues((v) => ({ ...v, privateSchools: e.target.value }))}
          placeholder="e.g. Brooks School, St. John's Prep"
          style={fieldStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Colleges</label>
        <input
          value={values.colleges}
          onChange={(e) => setValues((v) => ({ ...v, colleges: e.target.value }))}
          placeholder="e.g. Merrimack College"
          style={fieldStyle}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={isPending || !dirty}
        style={{
          alignSelf: 'flex-start', padding: '8px 16px', borderRadius: '18px',
          background: dirty ? 'var(--primary)' : 'var(--surface-2)', color: dirty ? 'var(--primary-text)' : 'var(--text-3)',
          border: '1px solid var(--border-mid)', fontSize: '13px', fontWeight: 700, cursor: dirty ? 'pointer' : 'default',
          fontFamily: 'inherit', opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
      </button>
    </div>
  )
}
