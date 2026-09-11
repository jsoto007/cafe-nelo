import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import { apiGet, apiPost } from '../lib/api.js';

const RESY_URL = 'https://resy.com/cities/bronxville-ny-ny/venues/cafe-nelo';

function visitKey(code) {
  const day = new Date().toISOString().slice(0, 10);
  return `promo_visit:${code}:${day}`;
}

/** Record one visit per code per day per browser so refreshes do not inflate counts. */
function recordVisit(code) {
  const key = visitKey(code);
  try {
    if (window.localStorage.getItem(key)) {
      return;
    }
    window.localStorage.setItem(key, '1');
  } catch {
    // Storage unavailable (private mode); still count the visit.
  }
  const params = new URLSearchParams(window.location.search);
  const source = params.get('src') === 'qr' ? 'qr' : 'link';
  apiPost(`/api/promo-codes/${encodeURIComponent(code)}/visits`, { source }).catch(() => {});
}

export default function PromoLanding() {
  const { code: rawCode } = useParams();
  const code = (rawCode || '').trim().toUpperCase();
  const [promo, setPromo] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    if (!code) {
      setState('missing');
      return;
    }
    let ignore = false;
    apiGet(`/api/promo-codes/${encodeURIComponent(code)}`)
      .then((data) => {
        if (ignore) return;
        setPromo(data);
        setState('ready');
        recordVisit(data.code);
      })
      .catch((err) => {
        if (ignore) return;
        setState(err?.status === 404 ? 'missing' : 'error');
      });
    return () => {
      ignore = true;
    };
  }, [code]);

  const handle = promo?.influencer_handle ? `@${promo.influencer_handle}` : promo?.influencer_name;
  const valid = promo?.valid;

  return (
    <>
      <div className="bg-ts-charcoal py-20 text-center">
        <FadeIn immediate className="mx-auto max-w-2xl space-y-4 px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-ts-gold">
            Café Nelo · Bronxville, NY
          </p>
          <h1 className="font-heading text-5xl font-medium text-white sm:text-6xl">
            {state === 'ready' ? `Welcome, friends of ${handle}` : 'Welcome'}
          </h1>
          {state === 'ready' ? (
            <p className="text-lg leading-relaxed text-ts-light-text/70">
              {valid ? 'Your offer is waiting for you at the table.' : 'This offer is no longer available.'}
            </p>
          ) : null}
        </FadeIn>
      </div>

      <main className="bg-ts-cream">
        <div className="mx-auto max-w-2xl px-6 py-16 sm:px-8">
          {state === 'loading' ? (
            <p className="py-12 text-center text-sm text-ts-muted">Checking your code…</p>
          ) : null}

          {state === 'missing' ? (
            <div className="rounded-3xl border border-ts-stone bg-white p-8 text-center shadow-card">
              <p className="font-heading text-3xl text-ts-charcoal">We couldn&apos;t find that code</p>
              <p className="mt-3 text-sm text-ts-muted">
                Double-check the link you were given, or explore the menu below.
              </p>
            </div>
          ) : null}

          {state === 'error' ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
              Something went wrong loading this offer. Please try again in a moment.
            </div>
          ) : null}

          {state === 'ready' ? (
            <div className="rounded-3xl border border-ts-stone bg-white p-8 text-center shadow-card sm:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-ts-crimson">
                {valid ? 'Your offer' : promo.status === 'expired' ? 'Offer expired' : 'Offer unavailable'}
              </p>
              <p className="mt-4 font-heading text-4xl text-ts-charcoal sm:text-5xl">{promo.discount_label}</p>
              <div className="mx-auto mt-8 inline-flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ts-gold bg-ts-linen px-8 py-5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-ts-muted">
                  Show this code to your server
                </span>
                <span className="font-mono text-3xl font-semibold tracking-[0.2em] text-ts-charcoal">
                  {promo.code}
                </span>
              </div>
              {promo.expires_on && valid ? (
                <p className="mt-4 text-xs text-ts-muted">Valid through {promo.expires_on}</p>
              ) : null}
              <p className="mt-6 text-sm leading-relaxed text-ts-muted">
                Mention {handle} when you visit. One code per table, not combinable with other offers.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/specials"
              className="inline-flex items-center justify-center rounded-full bg-ts-charcoal px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-ts-charcoal-light"
            >
              Today&apos;s Specials
            </Link>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center rounded-full border border-ts-charcoal px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-ts-charcoal transition hover:bg-ts-linen"
            >
              View Menu
            </Link>
            <a
              href={RESY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-ts-crimson px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-ts-crimson transition hover:bg-ts-crimson hover:text-white"
            >
              Reserve on Resy
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
