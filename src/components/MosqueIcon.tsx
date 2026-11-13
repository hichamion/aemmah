import React from 'react';

/** Mosque icon (onion dome with crescent, arched door, minaret), drawn in the same style as the lucide icons. */
export const MosqueIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({ className = 'w-6 h-6', strokeWidth = 2 }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {/* crescent on the dome */}
    <path d="M12.9 1.6a1.3 1.3 0 1 0 .3 2.2 1.1 1.1 0 1 1-.3-2.2z" fill="currentColor" stroke="none" />
    <path d="M12 4.3v1.4" />
    {/* onion dome */}
    <path d="M6.5 11c0-2.9 2.6-4.3 5.5-5.6 2.9 1.3 5.5 2.7 5.5 5.6" />
    {/* prayer hall and arched door */}
    <path d="M5 21v-10h14v10" />
    <path d="M10 21v-3.2a2 2 0 0 1 4 0V21" />
    {/* minaret */}
    <path d="M19.8 21V10.5h2.2V21" />
    <path d="M19.8 10.5l1.1-3 1.1 3" />
    {/* ground */}
    <path d="M2 21h20.5" />
  </svg>
);
