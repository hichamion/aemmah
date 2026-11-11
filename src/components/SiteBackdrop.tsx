import React from 'react';

/**
 * Fixed background of the whole site: warm grey, a faint Andalusian rosette at the top,
 * an embossed zellige lattice rising from the bottom, and a soft skyline of domes and minarets.
 * Pure SVG / CSS (no image download). Colours and the lattice tile live in index.css (.site-backdrop…).
 */
export const SiteBackdrop: React.FC = () => (
  <div className="site-backdrop" aria-hidden>
    <svg className="site-backdrop__rosette" viewBox="-100 -100 200 200">
      <g fill="none" strokeLinejoin="round">
        {[0, 1].map((layer) => (
          <g key={layer} className={layer ? 'site-backdrop__hi' : 'site-backdrop__lo'} transform={layer ? '' : 'translate(0.6 0.8)'}>
            {Array.from({ length: 16 }, (_, i) => (
              <g key={i} transform={`rotate(${i * 22.5})`}>
                {/* petal, inner petal and a small diamond: a 16-fold rosette */}
                <path d="M0-14 C8-30 9-52 0-72 C-9-52 -8-30 0-14Z" />
                <path d="M0-30 C4-40 4-50 0-60 C-4-50 -4-40 0-30Z" />
                <path d="M0-78 l4 6 -4 6 -4-6z" />
                <path d="M0-14 L27-65" />
              </g>
            ))}
            <circle r="14" />
            <circle r="74" />
            <circle r="92" strokeDasharray="2 4" />
            <path d="M0-9 L6.4-6.4 9 0 6.4 6.4 0 9 -6.4 6.4 -9 0 -6.4-6.4Z" />
          </g>
        ))}
      </g>
    </svg>

    <div className="site-backdrop__lattice" />

    <svg className="site-backdrop__skyline" viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice">
      <path
        fill="currentColor"
        d="M0 160V122h70v-6q14-24 28 0v6h40V70l7-14 7 14v52h60v-12q30-50 60 0v12h36V96q22-34 44 0v26h70v-18q50-78 100 0v18h40V60l8-18 8 18v62h50v-14q34-56 68 0v14h50V90q24-40 48 0v32h60v-20q54-84 108 0v20h44V64l8-18 8 18v58h56v-12q28-46 56 0v12h46V98q20-30 40 0v24h52v-8q16-28 32 0v8h52v38z"
      />
    </svg>
  </div>
);
