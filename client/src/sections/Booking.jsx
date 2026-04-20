// ReservationsBand — dark CTA band encouraging table reservations via Resy
import { useEffect, useMemo, useState } from 'react';
import FadeIn from '../components/FadeIn.jsx';
import { apiGet } from '../lib/api.js';

const WEEKDAY_ORDER = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

const WEEKDAY_INDEX = WEEKDAY_ORDER.reduce((acc, entry, index) => {
  acc[entry.key] = index;
  return acc;
}, {});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit'
});

function formatTimeValue(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const dateValue = new Date();
  dateValue.setHours(hours, minutes, 0, 0);
  return TIME_FORMATTER.format(dateValue).replace(' AM', 'am').replace(' PM', 'pm');
}

function formatTimeRange(openTime, closeTime) {
  const start = formatTimeValue(openTime);
  const end = formatTimeValue(closeTime);
  if (start && end) return `${start}–${end}`;
  if (start) return start;
  if (end) return end;
  return 'Closed';
}

function splitIntoRanges(indexes) {
  const ranges = [];
  if (!indexes.length) return ranges;
  let rangeStart = indexes[0];
  let prev = indexes[0];
  for (let i = 1; i < indexes.length; i += 1) {
    const current = indexes[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push({ start: rangeStart, end: prev });
    rangeStart = current;
    prev = current;
  }
  ranges.push({ start: rangeStart, end: prev });
  return ranges;
}

function buildSummary(hours) {
  const entries = (hours || [])
    .map((entry) => ({
      originalDay: entry.day,
      is_open: entry.is_open,
      open_time: entry.is_open ? entry.open_time : null,
      close_time: entry.is_open ? entry.close_time : null,
      index: WEEKDAY_INDEX[String(entry.day || '').toLowerCase()]
    }))
    .filter((entry) => Number.isFinite(entry.index));

  if (!entries.length) return [];

  const byTime = new Map();
  entries.forEach((entry) => {
    const key = entry.is_open ? `${entry.open_time || ''}|${entry.close_time || ''}` : 'closed';
    const bucket = byTime.get(key) || {
      is_open: entry.is_open,
      open_time: entry.open_time,
      close_time: entry.close_time,
      indexes: []
    };
    bucket.indexes.push(entry.index);
    byTime.set(key, bucket);
  });

  const summary = [];
  byTime.forEach(({ is_open, open_time, close_time, indexes }) => {
    const uniqueIndexes = Array.from(new Set(indexes)).sort((a, b) => a - b);
    const ranges = splitIntoRanges(uniqueIndexes);
    ranges.forEach((range) => {
      const startLabel = WEEKDAY_ORDER[range.start]?.label?.substring(0, 3) ?? '';
      const endLabel = WEEKDAY_ORDER[range.end]?.label?.substring(0, 3) ?? '';
      const dayLabel = range.start === range.end ? startLabel : `${startLabel} – ${endLabel}`;
      summary.push({
        dayLabel,
        timeLabel: is_open ? formatTimeRange(open_time, close_time) : 'Closed',
        startIndex: range.start
      });
    });
  });
  return summary.sort((a, b) => a.startIndex - b.startIndex);
}

export default function ReservationsBand() {
  const [hours, setHours] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadHours() {
      try {
        const data = await apiGet('/api/availability/config', { signal: controller.signal });
        if (isMounted && Array.isArray(data?.operating_hours)) {
          setHours(data.operating_hours);
        }
      } catch {
        // Fallback gracefully
      }
    }

    loadHours();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const summaryRows = useMemo(() => buildSummary(hours), [hours]);
  const hoursText = summaryRows.length > 0 
    ? summaryRows.filter(r => r.timeLabel !== 'Closed').map(r => `${r.dayLabel} ${r.timeLabel}`).join('  ·  ')
    : 'LOADING HOURS...';

  return (
    <section
      id="reservations"
      className="relative overflow-hidden bg-ts-charcoal py-20 text-center"
    >
      {/* Subtle crimson glow */}
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(155,35,53,0.20) 0%, transparent 60%)',
        }}
      />

      <FadeIn className="relative z-10 mx-auto max-w-2xl space-y-8 px-6" delayStep={0.15}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.5em] text-ts-gold">
          Reservations
        </p>

        <h2 className="font-heading text-4xl font-medium text-white sm:text-5xl">
          Reserve your table
        </h2>

        <p className="text-base leading-relaxed text-ts-light-text/70">
          We recommend reserving in advance, especially on weekends. Walk-ins are welcome subject to availability.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://resy.com/cities/bronxville-ny-ny/venues/cafe-nelo"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full bg-ts-scarlet px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white shadow-crimson transition hover:bg-ts-crimson focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
          >
            Reserve on Resy
          </a>
          <a
            href="tel:+19147797777"
            className="w-full rounded-full border border-white/30 px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition hover:border-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
          >
            Call Us
          </a>
        </div>

        <p className="text-[11px] uppercase tracking-[0.35em] text-ts-muted">
          {hoursText}
        </p>
      </FadeIn>
    </section>
  );
}
