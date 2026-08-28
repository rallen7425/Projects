'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/ui/AppHeader'
import BottomNav from '@/components/ui/BottomNav'
import SignOutButton from './SignOutButton'
import LocationEditor, { type LocationResult } from '@/components/profile/LocationEditor'
import SchoolInfoFields, { type SchoolInfoValues } from '@/components/profile/SchoolInfoFields'
import { saveHomeLocation, updateHomeSchoolInfo, addSecondaryLocation, removeSecondaryLocation, updateSecondaryLocationSchoolInfo } from '@/lib/actions'
import type { HomeLocation, UserLocation } from '@/types'

type PersonalizedZone = { zoneId: string; color: string; label: string; summary: string }

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: '10px',
}
const CARD_STYLE: React.CSSProperties = {
  background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-mid)', padding: '16px',
}

function toSchoolValues(source: { schoolDistrict?: string; privateSchools?: string; colleges?: string } | null): SchoolInfoValues {
  return {
    schoolDistrict: source?.schoolDistrict ?? '',
    privateSchools: source?.privateSchools ?? '',
    colleges: source?.colleges ?? '',
  }
}

export default function ProfileClient({
  email,
  home,
  secondaries,
  personalizedZones,
}: {
  email: string
  home: HomeLocation | null
  secondaries: UserLocation[]
  personalizedZones: PersonalizedZone[]
}) {
  const router = useRouter()
  const [editingHome, setEditingHome] = useState(false)
  const [addingSecondary, setAddingSecondary] = useState(false)
  const [openSecondaryId, setOpenSecondaryId] = useState<string | null>(null)

  const handleSaveHome = async (location: LocationResult) => {
    // Preserve whatever school-reference text already exists — LocationEditor
    // only ever collects the zip/metro fields, never the school ones.
    await saveHomeLocation({ ...location, schoolDistrict: home?.schoolDistrict, privateSchools: home?.privateSchools, colleges: home?.colleges })
    router.refresh()
  }

  const handleSaveHomeSchoolInfo = async (values: SchoolInfoValues) => {
    await updateHomeSchoolInfo(values)
    router.refresh()
  }

  const handleAddSecondary = async (location: LocationResult) => {
    await addSecondaryLocation(location)
    router.refresh()
  }

  const handleRemoveSecondary = async (id: string) => {
    await removeSecondaryLocation(id)
    router.refresh()
  }

  const handleSaveSecondarySchoolInfo = (id: string) => async (values: SchoolInfoValues) => {
    await updateSecondaryLocationSchoolInfo(id, values)
    router.refresh()
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', paddingBottom: '100px' }}>
      <AppHeader title="Profile" />

      <div style={{ padding: '20px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '28px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>{email}</div>
        </div>

        {/* Account details */}
        <div style={{ marginBottom: '28px' }}>
          <div style={SECTION_LABEL_STYLE}>Account</div>
          <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-2)' }}>Email</span>
              <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500 }}>{email}</span>
            </div>
          </div>
        </div>

        {/* Home Location — the shared source of truth Local Zone (and Sports'
            default team seeding) read from. */}
        <div style={{ marginBottom: '28px' }}>
          <div style={SECTION_LABEL_STYLE}>Home Location</div>
          <div style={CARD_STYLE}>
            {home ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{home.city}, {home.stateAbbr}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '2px' }}>Zip {home.zip} · Metro: {home.metroArea}</div>
                  </div>
                  <button
                    onClick={() => setEditingHome(true)}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-mid)', borderRadius: '18px', padding: '6px 14px', color: 'var(--text-2)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                  >
                    Edit
                  </button>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <SchoolInfoFields initial={toSchoolValues(home)} onSave={handleSaveHomeSchoolInfo} />
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '14px', lineHeight: 1.5 }}>
                  Set your home zip code so Zones like Local can personalize around your community, metro, and region.
                </div>
                <button
                  onClick={() => setEditingHome(true)}
                  style={{ width: '100%', height: '44px', borderRadius: '22px', background: 'var(--primary)', color: 'var(--primary-text)', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Set up home location
                </button>
              </>
            )}
          </div>
        </div>

        {/* Secondary Locations — up to 5, places followed beyond the immediate area */}
        <div style={{ marginBottom: '28px' }}>
          <div style={SECTION_LABEL_STYLE}>Secondary Locations ({secondaries.length}/5)</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginBottom: '12px', lineHeight: 1.5 }}>
            Places you follow beyond your immediate area — a second home, family elsewhere, or anywhere not close by.
          </div>

          {secondaries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {secondaries.map((loc) => {
                const open = openSecondaryId === loc.id
                return (
                  <div key={loc.id} style={CARD_STYLE}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <button
                        onClick={() => setOpenSecondaryId(open ? null : loc.id)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', flex: 1 }}
                      >
                        <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text)' }}>{loc.label}</div>
                      </button>
                      <button
                        onClick={() => handleRemoveSecondary(loc.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, fontFamily: 'inherit', marginLeft: '10px' }}
                      >
                        Remove
                      </button>
                    </div>
                    {open && (
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: '14px', paddingTop: '14px' }}>
                        <SchoolInfoFields initial={toSchoolValues(loc)} onSave={handleSaveSecondarySchoolInfo(loc.id)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {secondaries.length < 5 && (
            <button
              onClick={() => setAddingSecondary(true)}
              style={{ width: '100%', height: '40px', borderRadius: '20px', background: 'var(--surface-2)', border: '1px dashed var(--border-mid)', color: 'var(--text-2)', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + Add secondary location
            </button>
          )}
        </div>

        {/* Personalization — reference only, links out to each zone's own Customize sheet */}
        {personalizedZones.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={SECTION_LABEL_STYLE}>Personalization</div>
            <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
              {personalizedZones.map((z, i) => (
                <a
                  key={z.zoneId}
                  href={`/zones/${z.zoneId}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                    borderBottom: i < personalizedZones.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{z.label}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 500, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {z.summary}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Zones link */}
        <div style={{ marginBottom: '28px' }}>
          <div style={SECTION_LABEL_STYLE}>Content</div>
          <a href="/zones/manage" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', borderRadius: '14px', border: '1px solid var(--border-mid)', textDecoration: 'none' }}>
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Manage Zones</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>
        </div>

        {/* Sign out / switch accounts */}
        <SignOutButton />
        <div style={{ fontSize: '11.5px', color: 'var(--text-3)', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
          Signing out returns you to the sign-in screen, where you can sign back in with a different account.
        </div>
      </div>

      {editingHome && (
        <LocationEditor
          title={home ? 'Edit Home Location' : 'Set Up Home Location'}
          submitLabel="Save Home Location"
          initialZip={home?.zip}
          onSave={handleSaveHome}
          onClose={() => setEditingHome(false)}
        />
      )}

      {addingSecondary && (
        <LocationEditor
          title="Add Secondary Location"
          submitLabel="Add Location"
          requireMetro={false}
          onSave={handleAddSecondary}
          onClose={() => setAddingSecondary(false)}
        />
      )}

      <BottomNav activeTab="today" />
    </div>
  )
}
