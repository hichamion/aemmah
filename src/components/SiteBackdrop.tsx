import React from 'react';

/**
 * Fixed background of the whole site: deep night blue with a golden dawn glow in the top corner
 * and a green glow on the other side (the second glow takes the colour of the section, see index.css).
 */
export const SiteBackdrop: React.FC = () => (
  <div className="site-backdrop" aria-hidden>
    {/* dawn glow in the corner */}
    <div className="site-backdrop__dawn" />
    {/* green glow on the other side */}
    <div className="site-backdrop__glow" />
  </div>
);
