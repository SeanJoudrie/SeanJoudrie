/**
 * One icon family: 24px grid, 2px stroke, round caps, currentColor. Every
 * icon in the app comes from here, never from emoji or text glyphs.
 */
import type { ReactNode } from 'react'

function Icon({ children, size = 20, className = '' }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  )
}

type P = { size?: number; className?: string }

export const ExternalIcon = (p: P) => (
  <Icon size={16} {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
)

export const CloseIcon = (p: P) => (
  <Icon size={16} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const PlayIcon = (p: P) => (
  <Icon size={16} {...p}>
    <path d="M7 5l12 7-12 7z" fill="currentColor" />
  </Icon>
)

export const LockIcon = ({ closed, ...p }: P & { closed: boolean }) => (
  <Icon size={16} {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d={closed ? 'M8 11V8a4 4 0 0 1 8 0v3' : 'M8 11V8a4 4 0 0 1 7.5-2'} />
  </Icon>
)

export const PlatformIcon = ({ id, ...p }: P & { id: 'youtube' | 'instagram' | 'tiktok' | 'x' }) => (
  <Icon size={24} {...p}>
    {id === 'youtube' && (
      <>
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="M10 9l5 3-5 3z" fill="currentColor" />
      </>
    )}
    {id === 'instagram' && (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </>
    )}
    {id === 'tiktok' && <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.5 4.5 5 5" />}
    {id === 'x' && <path d="M4 4l16 16M20 4L4 20" />}
  </Icon>
)
