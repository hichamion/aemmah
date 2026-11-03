import React from 'react';

/** The Mihrab app icon (public/icon-192.png), used everywhere the brand appears. */
export const LogoMark: React.FC<{ className?: string; title?: string }> = ({ className = 'w-10 h-10', title }) => (
  <img
    src={`${import.meta.env.BASE_URL}icon-192.png`}
    alt={title ?? ''}
    aria-hidden={title ? undefined : true}
    className={`${className} shrink-0 object-contain`}
    draggable={false}
  />
);
