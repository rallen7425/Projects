'use client'

interface ToastProps {
  message: string
  visible: boolean
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '110px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(30,30,40,0.96)',
        border: '1px solid rgba(255,255,255,0.14)',
        color: 'var(--text)',
        fontSize: '13.5px',
        fontWeight: 500,
        padding: '9px 18px',
        borderRadius: '20px',
        zIndex: 200,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s',
      }}
    >
      {message}
    </div>
  )
}
