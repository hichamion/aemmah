import React from 'react';

/**
 * Header of the imams / mosques list pages. Deliberately different from the profile cards below it
 * (milky glass instead of a coloured gradient, large Kufic title, medallion, gold count),
 * so the page header never looks like one more card.
 */
export type BannerTone = 'imams' | 'mosques' | 'account';

const TONES: Record<BannerTone, { text: string; medal: string; stripe: string; tabOn: string; tabOff: string }> = {
  imams: {
    text: 'text-[#0b3a4f]',
    medal: 'from-[#2fb0c5] via-[#137a8f] to-[#0b3a4f]',
    stripe: 'from-[#2fb0c5] to-[#0b3a4f]',
    tabOn: 'bg-[#0b3a4f] text-white shadow-md',
    tabOff: 'bg-white/80 text-[#0b3a4f] ring-1 ring-[#0b3a4f]/15 hover:bg-white',
  },
  account: {
    text: 'text-ink',
    medal: 'from-brass-300 via-brass-500 to-brass-700',
    stripe: 'from-brass-300 to-brass-700',
    tabOn: 'bg-ink text-brass-200 shadow-md',
    tabOff: 'bg-white/80 text-ink ring-1 ring-ink/15 hover:bg-white',
  },
  mosques: {
    text: 'text-cedar-800',
    medal: 'from-cedar-500 via-cedar-700 to-cedar-900',
    stripe: 'from-cedar-500 to-cedar-900',
    tabOn: 'bg-cedar-800 text-white shadow-md',
    tabOff: 'bg-white/80 text-cedar-800 ring-1 ring-cedar-800/15 hover:bg-white',
  },
};

/** Tab / action button style that matches the banner. */
export const bannerTab = (tone: BannerTone, active: boolean) =>
  `text-[11px] sm:text-sm font-black px-3 sm:px-3.5 py-1.5 sm:py-2.5 rounded-full transition cursor-pointer whitespace-nowrap ${active ? TONES[tone].tabOn : TONES[tone].tabOff}`;

export const PageBanner: React.FC<{
  tone: BannerTone;
  title: string;
  count?: number;
  subtitle: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}> = ({ tone, title, count, subtitle, icon, children }) => {
  const t = TONES[tone];
  return (
    <header className="liquid-glass-light relative overflow-hidden rounded-2xl sm:rounded-[2rem] px-4 sm:px-8 py-3 sm:py-7">
      {/* accent stripe on the starting (right) edge and a faint lattice */}
      <span className={`absolute inset-y-0 right-0 w-1.5 bg-gradient-to-b ${t.stripe}`} aria-hidden />
      <span className="absolute inset-0 khatam-pattern-light opacity-70 pointer-events-none" aria-hidden />

      <div className="relative flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
          <span className={`w-10 h-10 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-br ${t.medal} text-brass-100 flex items-center justify-center shadow-lg ring-2 sm:ring-4 ring-white/70 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-8 sm:[&>svg]:h-8`}>
            {icon}
          </span>
          <div className="min-w-0">
            <h1 className={`font-kufi ${t.text} text-[1.3rem] sm:text-[2.6rem] leading-tight flex items-center gap-2 sm:gap-2.5 flex-wrap`}>
              {title}
              {count !== undefined && count > 0 && (
                <span className="font-sans text-xs sm:text-base font-black tabular-nums bg-gradient-to-l from-brass-200 to-brass-400 text-ink px-2.5 sm:px-3 py-0.5 rounded-full shadow-sm">
                  {count}
                </span>
              )}
            </h1>
            <p className="text-[11px] sm:text-base text-slate-600 mt-0.5 sm:mt-1 leading-snug line-clamp-1 sm:line-clamp-none">{subtitle}</p>
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">{children}</div>}
      </div>
    </header>
  );
};
