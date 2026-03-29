import FadeIn from '../components/FadeIn.jsx';

// ─── Award badges ─────────────────────────────────────────────────────────────

function MichelinBadge({ year }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#E4002B] shadow-[0_8px_30px_rgba(228,0,43,0.35)]">
        {/* Michelin Bib silhouette — simplified */}
        <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
          {/* Head */}
          <circle cx="24" cy="10" r="7" fill="white" />
          {/* Body — stacked tire rings */}
          <ellipse cx="24" cy="22" rx="9" ry="5" fill="white" />
          <ellipse cx="24" cy="29" rx="10" ry="5" fill="white" />
          <ellipse cx="24" cy="36" rx="8" ry="4" fill="white" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#E4002B]">Michelin</p>
        <p className="text-[11px] font-semibold text-ts-charcoal">{year}</p>
      </div>
    </div>
  );
}

function OpenTableBadge({ year }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#DA3743] shadow-[0_8px_30px_rgba(218,55,67,0.35)]">
        {/* OpenTable fork icon */}
        <svg viewBox="0 0 32 32" className="h-8 w-8" fill="white" aria-hidden="true">
          <rect x="9" y="3" width="2.5" height="10" rx="1.25" />
          <rect x="14.75" y="3" width="2.5" height="10" rx="1.25" />
          <rect x="20.5" y="3" width="2.5" height="10" rx="1.25" />
          <path d="M10.25 12 C10.25 12 9 14 9 16 C9 18 10.5 19.5 15.25 20 L15.25 29 L16.75 29 L16.75 20 C21.5 19.5 23 18 23 16 C23 14 21.75 12 21.75 12 Z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#DA3743]">Diners&apos; Choice</p>
        <p className="text-[11px] font-semibold text-ts-charcoal">{year}</p>
      </div>
    </div>
  );
}

function WestchesterBadge({ year }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer ring */}
        <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <circle cx="48" cy="48" r="46" fill="#BFA882" />
          <circle cx="48" cy="48" r="38" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="48" cy="48" r="42" fill="none" stroke="white" strokeWidth="0.75" />
        </svg>
        <div className="relative z-10 flex flex-col items-center leading-tight text-white">
          <span className="text-[7px] font-bold uppercase tracking-[0.3em]">Best of</span>
          <span className="text-[8px] font-black uppercase tracking-[0.25em]">Westchester</span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.3em]">Winner</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-ts-gold">Westchester Mag</p>
        <p className="text-[11px] font-semibold text-ts-charcoal">{year}</p>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function Accolades() {
  return (
    <section className="bg-ts-linen py-16">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="flex flex-col gap-10" delayStep={0.1}>

          {/* Heading */}
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-ts-crimson">
              Recognition
            </p>
            <h2 className="mt-2 font-heading text-3xl font-medium text-ts-charcoal sm:text-4xl">
              Award-winning, every year
            </h2>
          </div>

          {/* Badge grid — scrollable on mobile */}
          <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-8 sm:gap-x-14">

            {/* Michelin */}
            <MichelinBadge year="2024" />
            <MichelinBadge year="2023" />

            {/* Divider — desktop only */}
            <div className="hidden h-24 w-px bg-ts-stone sm:block" aria-hidden="true" />

            {/* OpenTable Diners' Choice */}
            <OpenTableBadge year="2025" />
            <OpenTableBadge year="2024" />
            <OpenTableBadge year="2023" />

            {/* Divider — desktop only */}
            <div className="hidden h-24 w-px bg-ts-stone sm:block" aria-hidden="true" />

            {/* Best of Westchester */}
            <WestchesterBadge year="2020" />
            <WestchesterBadge year="2017" />
            <WestchesterBadge year="2016" />

          </div>

          {/* Fine print */}
          <p className="text-center text-[11px] text-ts-muted">
            Michelin Guide NYC · OpenTable Diners&apos; Choice · Westchester Magazine Best Of
          </p>

        </FadeIn>
      </div>
    </section>
  );
}
