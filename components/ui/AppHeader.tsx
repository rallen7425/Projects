import React from 'react'

export interface AppHeaderProps {
  title: string
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
}

export default function AppHeader({ title, leftSlot, rightSlot }: AppHeaderProps) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(9,9,14,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      padding: '52px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {leftSlot ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{leftSlot}</div>
      ) : (
        <span style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)' }}>
          {title}
        </span>
      )}
      {rightSlot && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {rightSlot}
        </div>
      )}
    </header>
  )
}
