'use client';

/**
 * DocuMind brand mark: a stylized open book with a pulsing "insight" core.
 * Pure SVG + CSS animation - no external assets, scales crisply at any size.
 */
export default function Logo({ className = 'h-5 w-5', animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${animated ? 'documind-logo-breathe' : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dm-logo-grad" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <path
        d="M16 8.5c-2.6-1.7-6-2.5-9-2.2-1.1.1-2 1-2 2.1v14.4c0 1.3 1.1 2.3 2.4 2.1 2.7-.4 5.9.4 8 1.9.4.3.9.3 1.3 0 2.1-1.5 5.3-2.3 8-1.9 1.3.2 2.4-.8 2.4-2.1V8.4c0-1.1-.9-2-2-2.1-3-.3-6.4.5-9 2.2Z"
        fill="url(#dm-logo-grad)"
        fillOpacity="0.16"
        stroke="url(#dm-logo-grad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 8.5v15.6" stroke="url(#dm-logo-grad)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="14.5" r="2.1" fill="var(--accent-2)" className={animated ? 'documind-logo-pulse' : ''} />
    </svg>
  );
}
