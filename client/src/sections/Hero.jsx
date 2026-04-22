import FadeIn from '../components/FadeIn.jsx';

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden text-center"
      style={{ background: '#0e1d15' }}
    >
      {/* Layered background */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 60% 70% at 70% 30%, rgba(74,124,95,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 20% 80%, rgba(212,98,42,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 100% 100% at 50% 50%, #1a3028 0%, #0e1d15 100%)
          `,
          zIndex: 0,
        }}
      />

      {/* Botanical SVG line art */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ opacity: 0.06, zIndex: 1 }}
      >
        <path d="M-60 650 Q200 400 180 100" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M180 100 Q100 300 -80 520" stroke="white" strokeWidth="0.8" fill="none" />
        <path d="M180 100 Q260 280 80 470" stroke="white" strokeWidth="0.8" fill="none" />
        <path d="M180 100 Q310 250 160 420" stroke="white" strokeWidth="0.8" fill="none" />
        <path d="M1380 800 Q1300 500 1360 200" stroke="white" strokeWidth="1.5" fill="none" />
        <path d="M1360 200 Q1240 350 1310 560" stroke="white" strokeWidth="0.8" fill="none" />
        <path d="M1360 200 Q1190 320 1270 500" stroke="white" strokeWidth="0.8" fill="none" />
        <path d="M320 820 Q360 750 340 680" stroke="white" strokeWidth="1" fill="none" />
        <path d="M340 680 Q300 710 310 760" stroke="white" strokeWidth="0.6" fill="none" />
        <path d="M340 680 Q370 700 355 750" stroke="white" strokeWidth="0.6" fill="none" />
        <path d="M1100 80 Q1080 160 1100 240" stroke="white" strokeWidth="1" fill="none" />
        <path d="M1100 240 Q1060 210 1070 170" stroke="white" strokeWidth="0.6" fill="none" />
        <path d="M1100 240 Q1130 215 1120 175" stroke="white" strokeWidth="0.6" fill="none" />
      </svg>

      {/* Grain texture */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
          zIndex: 2,
        }}
      />

      {/* Horizontal accent lines */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ zIndex: 2 }}>
        <div style={{ position: 'absolute', top: '30%', left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,98,42,0.15), transparent)' }} />
        <div style={{ position: 'absolute', bottom: '28%', left: 0, width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,98,42,0.15), transparent)' }} />
      </div>

      {/* Corner bracket — top left */}
      <div
        className="pointer-events-none absolute hidden lg:block"
        aria-hidden="true"
        style={{ top: 24, left: '2.5rem', width: 60, height: 60, borderTop: '1px solid #D4622A', borderLeft: '1px solid #D4622A', opacity: 0.3, zIndex: 3 }}
      />

      {/* Corner bracket — bottom right */}
      <div
        className="pointer-events-none absolute hidden lg:block"
        aria-hidden="true"
        style={{ bottom: '2.5rem', right: '2.5rem', width: 60, height: 60, borderBottom: '1px solid #D4622A', borderRight: '1px solid #D4622A', opacity: 0.3, zIndex: 3 }}
      />

      {/* Side text — left */}
      <span
        className="pointer-events-none absolute hidden lg:block"
        aria-hidden="true"
        style={{
          left: '2.5rem', top: '50%',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg) translateY(50%)',
          fontWeight: 200, fontSize: '10px',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'rgba(212,98,42,0.38)',
          zIndex: 3,
        }}
      >
        Est. Bronxville · Global Fusion
      </span>

      {/* Side text — right */}
      <span
        className="pointer-events-none absolute hidden lg:block"
        aria-hidden="true"
        style={{
          right: '2.5rem', top: '50%',
          writingMode: 'vertical-rl',
          transform: 'translateY(-50%)',
          fontWeight: 200, fontSize: '10px',
          letterSpacing: '0.3em', textTransform: 'uppercase',
          color: 'rgba(212,98,42,0.38)',
          zIndex: 3,
        }}
      >
        Open Daily · Reservations Welcomed
      </span>

      {/* Main content */}
      <FadeIn
        immediate
        className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24"
        style={{ zIndex: 5 }}
      >
        {/* Eyebrow */}
        <div
          className="mb-7 flex items-center gap-3.5"
          style={{ fontWeight: 300, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4622A' }}
        >
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D4622A', opacity: 0.6, flexShrink: 0 }} />
          Global Fusion
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D4622A', opacity: 0.6, flexShrink: 0 }} />
          Bronxville, New York
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D4622A', opacity: 0.6, flexShrink: 0 }} />
        </div>

        {/* Headline */}
        <h1 className="mb-9 flex flex-col items-center">
          <img
            src="/cafe-nelo-white.svg"
            alt="Café Nelo"
            width="600"
            height="218"
            style={{ width: 'clamp(260px, 46vw, 560px)', height: 'auto' }}
            draggable={false}
            fetchpriority="high"
          />
          <span
            className="font-heading block italic"
            style={{ fontSize: 'clamp(13px, 1.6vw, 18px)', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#D4622A', marginTop: '1rem', fontWeight: 300 }}
          >
            Bronxville
          </span>
        </h1>

        {/* Divider */}
        <div
          aria-hidden="true"
          style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, #D4622A, transparent)', margin: '0 auto 28px' }}
        />

        {/* Tagline */}
        <p
          className="font-heading mx-auto mb-14"
          style={{ fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(16px, 2.2vw, 20px)', color: 'rgba(245,239,230,0.65)', maxWidth: 480, lineHeight: 1.65 }}
        >
          Where global flavors meet refined craft — a dining experience that carries you beyond borders.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://resy.com/cities/bronxville-ny-ny/venues/cafe-nelo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full transition hover:-translate-y-px sm:w-auto"
            style={{
              display: 'inline-block',
              fontWeight: 400, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#112219', background: '#D4622A',
              padding: '15px 36px', borderRadius: 50,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(212,98,42,0.3)',
            }}
          >
            Reserve on Resy
          </a>
          <a
            href="/menu"
            className="w-full transition hover:-translate-y-px hover:border-white/60 hover:text-white sm:w-auto"
            style={{
              display: 'inline-block',
              fontWeight: 300, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(245,239,230,0.8)', background: 'transparent',
              border: '1px solid rgba(245,239,230,0.25)',
              padding: '14px 36px', borderRadius: 50,
              textDecoration: 'none',
            }}
          >
            View Menu
          </a>
        </div>
      </FadeIn>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        aria-hidden="true"
        style={{ zIndex: 5 }}
      >
        <div
          style={{
            width: 1, height: 40,
            background: 'linear-gradient(to bottom, rgba(212,98,42,0.55), transparent)',
            animation: 'heroPulse 2.2s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(212,98,42,0.5)', fontWeight: 300 }}>
          Scroll
        </span>
      </div>

      <style>{`
        @keyframes heroPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.12); }
        }
      `}</style>
    </section>
  );
}
