import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api.js';
import SectionTitle from '../../components/SectionTitle.jsx';
import {
  QR_DESIGNS,
  downloadCanvasPng,
  renderQrDesign,
  slugify,
  thumbnailFromCanvas,
} from '../../lib/qrDesigns.js';

const PLATFORMS = [
  { value: '', label: 'Platform' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X / Twitter' },
  { value: 'other', label: 'Other' },
];

const BLANK_PROMO = {
  influencer_name: '',
  influencer_handle: '',
  platform: '',
  discount_label: '',
  code: '',
  expires_on: '',
  max_redemptions: '',
  notes: '',
};

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-amber-50 text-amber-700 border-amber-200',
  exhausted: 'bg-rose-50 text-rose-700 border-rose-200',
  scheduled: 'bg-sky-50 text-sky-700 border-sky-200',
};

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200';
const labelClass = 'block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500';
const primaryButton =
  'inline-flex items-center justify-center rounded-full bg-ts-charcoal px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-ts-charcoal-light disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${
        STATUS_STYLES[status] || STATUS_STYLES.inactive
      }`}
    >
      {status}
    </span>
  );
}

/**
 * Renders a QR code off-screen and hands the drawn canvas back to the parent.
 * qrcode.react paints inside its own effect, which runs before ours, so the
 * canvas is complete by the time onReady fires.
 */
function HiddenQr({ value, onReady }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && value) {
      onReady(ref.current, value);
    }
  }, [value, onReady]);
  if (!value) return null;
  return (
    <div className="pointer-events-none fixed -left-[4000px] top-0" aria-hidden="true">
      <QRCodeCanvas ref={ref} value={value} size={1024} level="H" marginSize={0} bgColor="#FFFFFF" fgColor="#000000" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Specials QR studio
// ---------------------------------------------------------------------------
function QrStudio({ notify }) {
  const defaultUrl = useMemo(() => `${window.location.origin}/specials`, []);
  const [url, setUrl] = useState(defaultUrl);
  const [qrCanvas, setQrCanvas] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const [busy, setBusy] = useState(null);

  const handleReady = useCallback((canvas) => {
    setQrCanvas(canvas);
  }, []);

  const displayUrl = url.replace(/^https?:\/\//, '');

  useEffect(() => {
    if (!qrCanvas) return;
    let cancelled = false;
    (async () => {
      const next = {};
      for (const design of QR_DESIGNS) {
        // eslint-disable-next-line no-await-in-loop
        const canvas = await renderQrDesign(design.id, qrCanvas, { url: displayUrl });
        next[design.id] = thumbnailFromCanvas(canvas, 360);
      }
      if (!cancelled) setThumbnails(next);
    })().catch(() => {
      if (!cancelled) notify('Unable to render QR previews.', 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [qrCanvas, displayUrl, notify]);

  const download = async (design) => {
    if (!qrCanvas) return;
    setBusy(design.id);
    try {
      const canvas = await renderQrDesign(design.id, qrCanvas, { url: displayUrl });
      await downloadCanvasPng(canvas, `cafe-nelo-specials-qr-${design.id}.png`);
    } catch (err) {
      notify(err.message || 'Download failed.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <HiddenQr value={url.trim()} onReady={handleReady} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ts-crimson">Specials QR code</p>
          <h3 className="font-heading text-2xl text-ts-charcoal">Print-ready designs</h3>
          <p className="text-sm text-slate-500">
            Each design downloads as a 300 dpi PNG sized for menus, table tents or stickers. The code points to the
            specials page; change the link below only if the site moves to a new domain.
          </p>
        </div>
        <div className="w-full max-w-md space-y-2">
          <label className={labelClass} htmlFor="qr-url">
            QR destination
          </label>
          <input
            id="qr-url"
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…/specials"
            spellCheck={false}
          />
          {url !== defaultUrl ? (
            <button type="button" className="text-xs text-slate-500 underline" onClick={() => setUrl(defaultUrl)}>
              Reset to {defaultUrl}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {QR_DESIGNS.map((design) => (
          <figure key={design.id} className="flex flex-col gap-3">
            <div className="flex aspect-[5/7] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {thumbnails[design.id] ? (
                <img src={thumbnails[design.id]} alt={`${design.name} preview`} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Rendering…</span>
              )}
            </div>
            <figcaption className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">{design.name}</p>
                <p className="text-xs text-slate-500">{design.size}</p>
              </div>
              <button
                type="button"
                className={secondaryButton}
                disabled={!thumbnails[design.id] || busy === design.id}
                onClick={() => download(design)}
              >
                {busy === design.id ? 'Saving…' : 'PNG'}
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Promo code form
// ---------------------------------------------------------------------------
function PromoForm({ onCreated, notify }) {
  const [form, setForm] = useState(BLANK_PROMO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const created = await apiPost('/api/admin/promo-codes', {
        ...form,
        code: form.code.trim() || undefined,
        max_redemptions: form.max_redemptions === '' ? null : Number(form.max_redemptions),
      });
      onCreated(created);
      setForm(BLANK_PROMO);
      notify(`Created code ${created.code} for ${created.influencer_name}.`, 'success');
    } catch (err) {
      setError(err.message || 'Unable to create promo code.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-influencer_name">
          Influencer name *
        </label>
        <input id="promo-influencer_name" className={inputClass} value={form.influencer_name} onChange={update('influencer_name')} required placeholder="Sofia Rivera" />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-influencer_handle">
          Handle
        </label>
        <input id="promo-influencer_handle" className={inputClass} value={form.influencer_handle} onChange={update('influencer_handle')} placeholder="@sofiaeats" />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-platform">
          Platform
        </label>
        <select id="promo-platform" className={inputClass} value={form.platform} onChange={update('platform')}>
          {PLATFORMS.map((p) => (
            <option key={p.value || 'none'} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-discount_label">
          Offer *
        </label>
        <input id="promo-discount_label" className={inputClass} value={form.discount_label} onChange={update('discount_label')} required placeholder="10% off your check" />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-code">
          Code (blank = auto)
        </label>
        <input id="promo-code" className={`${inputClass} font-mono uppercase`} value={form.code} onChange={update('code')} placeholder="SOFIA-2K7Q" />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-expires_on">
          Expires on
        </label>
        <input id="promo-expires_on" type="date" className={inputClass} value={form.expires_on} onChange={update('expires_on')} />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-max_redemptions">
          Max redemptions
        </label>
        <input id="promo-max_redemptions" type="number" min="1" className={inputClass} value={form.max_redemptions} onChange={update('max_redemptions')} placeholder="Unlimited" />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="promo-notes">
          Notes
        </label>
        <input id="promo-notes" className={inputClass} value={form.notes} onChange={update('notes')} placeholder="Collab terms, posting date…" />
      </div>
      <div className="flex items-end gap-3 md:col-span-2 xl:col-span-4">
        <button type="submit" className={primaryButton} disabled={saving}>
          {saving ? 'Creating…' : 'Create promo code'}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Promo code row
// ---------------------------------------------------------------------------
function PromoRow({ promo, onChange, onDelete, onDownloadQr, notify }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      setDetail(await apiGet(`/api/admin/promo-codes/${promo.id}?event_limit=50`));
    } catch (err) {
      notify(err.message || 'Unable to load activity.', 'error');
    }
  }, [promo.id, notify]);

  useEffect(() => {
    if (open) loadDetail();
  }, [open, loadDetail, promo.visit_count, promo.redemption_count]);

  const run = async (key, fn, successMessage) => {
    setBusy(key);
    try {
      const updated = await fn();
      if (updated) onChange(updated);
      if (successMessage) notify(successMessage, 'success');
    } catch (err) {
      notify(err.message || 'Action failed.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${what} copied.`, 'success');
    } catch {
      notify(`Could not copy. ${text}`, 'error');
    }
  };

  const logRedemption = () => {
    const note = window.prompt(`Log a redemption for ${promo.code}. Optional note (table, party size…):`, '');
    if (note === null) return;
    run('redeem', () => apiPost(`/api/admin/promo-codes/${promo.id}/redemptions`, { note }), `Redemption logged for ${promo.code}.`);
  };

  const toggleActive = () =>
    run('toggle', () => apiPatch(`/api/admin/promo-codes/${promo.id}`, { is_active: !promo.is_active }), promo.is_active ? `${promo.code} paused.` : `${promo.code} reactivated.`);

  const remove = () => {
    if (!window.confirm(`Delete ${promo.code}? Its visit and redemption history will be removed too.`)) return;
    run('delete', async () => {
      await apiDelete(`/api/admin/promo-codes/${promo.id}`);
      onDelete(promo.id);
      return null;
    }, `${promo.code} deleted.`);
  };

  return (
    <>
      <tr className="border-t border-slate-100 align-top">
        <td className="px-3 py-3">
          <button type="button" onClick={() => setOpen((o) => !o)} className="font-mono text-sm font-semibold text-ts-charcoal hover:underline">
            {promo.code}
          </button>
          <p className="text-xs text-slate-500">{promo.discount_label}</p>
        </td>
        <td className="px-3 py-3 text-sm">
          <p className="font-medium text-slate-800">{promo.influencer_name}</p>
          <p className="text-xs text-slate-500">
            {promo.influencer_handle ? `@${promo.influencer_handle}` : ''}
            {promo.influencer_handle && promo.platform ? ' · ' : ''}
            {promo.platform || ''}
          </p>
        </td>
        <td className="px-3 py-3 text-center text-sm tabular-nums text-slate-800">{promo.visit_count}</td>
        <td className="px-3 py-3 text-center text-sm tabular-nums text-slate-800">
          {promo.redemption_count}
          {promo.max_redemptions ? <span className="text-xs text-slate-400"> / {promo.max_redemptions}</span> : null}
        </td>
        <td className="px-3 py-3 text-sm">
          <StatusBadge status={promo.status} />
          {promo.expires_on ? <p className="mt-1 text-xs text-slate-500">until {promo.expires_on}</p> : null}
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={secondaryButton} onClick={logRedemption} disabled={busy === 'redeem'}>
              + Redeem
            </button>
            <button type="button" className={secondaryButton} onClick={() => copy(promo.share_url, 'Link')}>
              Link
            </button>
            <button type="button" className={secondaryButton} onClick={() => onDownloadQr(promo)}>
              QR
            </button>
            <button type="button" className={secondaryButton} onClick={toggleActive} disabled={busy === 'toggle'}>
              {promo.is_active ? 'Pause' : 'Resume'}
            </button>
            <button type="button" className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50" onClick={remove} disabled={busy === 'delete'}>
              Delete
            </button>
          </div>
        </td>
      </tr>
      {open ? (
        <tr className="bg-slate-50/70">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2 text-sm text-slate-600 md:col-span-1">
                <p>
                  <span className={labelClass}>Share link</span>
                  <a href={promo.share_url} target="_blank" rel="noopener noreferrer" className="break-all text-ts-charcoal underline">
                    {promo.share_url}
                  </a>
                </p>
                <p>
                  <span className={labelClass}>Last visit</span>
                  {formatDateTime(promo.last_visit_at)}
                </p>
                <p>
                  <span className={labelClass}>Last redemption</span>
                  {formatDateTime(promo.last_redemption_at)}
                </p>
                {promo.notes ? (
                  <p>
                    <span className={labelClass}>Notes</span>
                    {promo.notes}
                  </p>
                ) : null}
                <p className="text-xs text-slate-400">
                  Created {formatDateTime(promo.created_at)}
                  {promo.created_by ? ` by ${promo.created_by}` : ''}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className={labelClass}>Recent activity</p>
                {!detail ? (
                  <p className="mt-2 text-xs text-slate-400">Loading…</p>
                ) : detail.events?.length ? (
                  <ul className="mt-2 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                    {detail.events.map((ev) => (
                      <li key={ev.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className={ev.event_type === 'redemption' ? 'font-semibold text-emerald-700' : 'text-slate-600'}>
                          {ev.event_type === 'redemption' ? 'Redeemed' : 'Visited'}
                          {ev.source ? ` · ${ev.source}` : ''}
                          {ev.note ? ` — ${ev.note}` : ''}
                          {ev.created_by ? ` (${ev.created_by})` : ''}
                        </span>
                        <span className="whitespace-nowrap text-slate-400">{formatDateTime(ev.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No visits or redemptions yet.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminQrPromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState('');
  const [promoQr, setPromoQr] = useState(null); // { promo, value }

  const notify = useCallback((message, tone = 'info') => {
    setNotice({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    apiGet('/api/admin/promo-codes')
      .then(setPromos)
      .catch((err) => notify(err.message || 'Unable to load promo codes.', 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const upsert = useCallback((updated) => {
    setPromos((list) => {
      const exists = list.some((p) => p.id === updated.id);
      return exists ? list.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...list];
    });
  }, []);

  const removeFromList = useCallback((id) => setPromos((list) => list.filter((p) => p.id !== id)), []);

  const handlePromoQrReady = useCallback(
    async (canvas) => {
      if (!promoQr) return;
      const { promo } = promoQr;
      try {
        const rendered = await renderQrDesign('minimal-white', canvas, {
          kicker: 'C A F É   N E L O',
          heading: promo.code,
          caption: promo.discount_label.toUpperCase(),
          url: promo.share_url.replace(/^https?:\/\//, ''),
        });
        await downloadCanvasPng(rendered, `cafe-nelo-promo-${slugify(promo.code)}.png`);
      } catch (err) {
        notify(err.message || 'Unable to build the promo QR.', 'error');
      } finally {
        setPromoQr(null);
      }
    },
    [promoQr, notify]
  );

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return promos;
    return promos.filter((p) =>
      [p.code, p.influencer_name, p.influencer_handle, p.discount_label, p.platform].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [promos, filter]);

  const totals = useMemo(
    () =>
      promos.reduce(
        (acc, p) => ({
          active: acc.active + (p.status === 'active' ? 1 : 0),
          visits: acc.visits + (p.visit_count || 0),
          redemptions: acc.redemptions + (p.redemption_count || 0),
        }),
        { active: 0, visits: 0, redemptions: 0 }
      ),
    [promos]
  );

  return (
    <div className="space-y-10">
      <SectionTitle
        eyebrow="Marketing"
        title="QR & Promo Codes"
        description="Download print-ready QR codes for the specials menu, and create trackable promo codes for influencer collaborations."
      />

      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : notice.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-white text-slate-700'
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <QrStudio notify={notify} />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        {promoQr ? <HiddenQr value={promoQr.value} onReady={handlePromoQrReady} /> : null}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ts-crimson">Influencer promo codes</p>
            <h3 className="font-heading text-2xl text-ts-charcoal">Generate and track codes</h3>
            <p className="text-sm text-slate-500">
              Every code gets a share link and QR. Visits are counted automatically when someone opens the link; tap
              <span className="font-semibold"> + Redeem</span> when a guest shows the code at the table.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center">
            {[
              ['Active', totals.active],
              ['Visits', totals.visits],
              ['Redeemed', totals.redemptions],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-ts-charcoal">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <PromoForm onCreated={upsert} notify={notify} />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {loading ? 'Loading…' : `${promos.length} code${promos.length === 1 ? '' : 's'}`}
          </p>
          <input
            className={`${inputClass} max-w-xs`}
            placeholder="Search codes or influencers"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <tr>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Influencer</th>
                <th className="px-3 py-3 text-center">Visits</th>
                <th className="px-3 py-3 text-center">Redeemed</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-400">
                    {promos.length ? 'No codes match your search.' : 'No promo codes yet. Create the first one above.'}
                  </td>
                </tr>
              ) : null}
              {visible.map((promo) => (
                <PromoRow
                  key={promo.id}
                  promo={promo}
                  onChange={upsert}
                  onDelete={removeFromList}
                  onDownloadQr={(p) => setPromoQr({ promo: p, value: `${p.share_url}?src=qr` })}
                  notify={notify}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
