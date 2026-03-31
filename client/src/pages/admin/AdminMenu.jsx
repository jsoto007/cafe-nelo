import { useCallback, useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api.js';
import SectionTitle from '../../components/SectionTitle.jsx';

const BLANK_ITEM = {
  name: '',
  description: '',
  price: '',
  tags: [],
  is_visible: true,
};

const BLANK_CATEGORY = { name: '', description: '', is_visible: true };

// ---------------------------------------------------------------------------
// Drag handle icon
// ---------------------------------------------------------------------------
function DragHandle({ listeners, attributes }) {
  return (
    <button
      type="button"
      className="cursor-grab touch-none p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
      aria-label="Drag to reorder"
      {...listeners}
      {...attributes}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="11" cy="4" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="11" cy="12" r="1.5" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tag badge config
// ---------------------------------------------------------------------------
const TAG_BADGES = {
  v:         { label: 'Vegetarian' },
  gf:        { label: 'Gluten-Free' },
  signature: { label: 'Signature' },
};

// ---------------------------------------------------------------------------
// Sortable menu item row
// ---------------------------------------------------------------------------
function SortableItemRow({ item, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
          {!item.is_visible && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Hidden
            </span>
          )}
          {(item.tags || []).map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {TAG_BADGES[t]?.label ?? t}
            </span>
          ))}
        </div>
        {item.description && (
          <p className="mt-0.5 truncate text-xs text-slate-400">{item.description}</p>
        )}
      </div>
      {item.price != null && (
        <span className="shrink-0 font-semibold text-slate-700 text-sm">
          ${Number(item.price).toFixed(2)}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(item)}
          title="Edit item"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 2a2.83 2.83 0 0 1 4 4L5 16H1v-4L11 2z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          title="Delete item"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 4 14 4"/><path d="M6 4V2h4v2"/><path d="M3 4l1 10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-10"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable category block
// ---------------------------------------------------------------------------
function SortableCategoryBlock({ category, onEditCategory, onDeleteCategory, onSaveItem, onDeleteItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `cat-${category.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [items, setItems] = useState(category.items || []);
  const [editingItem, setEditingItem] = useState(null);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState(BLANK_ITEM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setItems(category.items || []);
  }, [category.items]);

  async function handleItemDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    const payload = reordered.map((it, idx) => ({ id: it.id, display_order: idx }));
    try {
      await apiPatch('/api/admin/menu/items/reorder', { items: payload });
    } catch {
      setItems(items);
    }
  }

  function openEditItem(item) {
    setEditingItem({
      ...item,
      price: item.price != null ? String(item.price) : '',
    });
    setShowNewItemForm(false);
  }

  function cancelEdit() {
    setEditingItem(null);
    setError(null);
  }

  async function saveEditItem() {
    if (!editingItem.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    const price_cents = editingItem.price.trim() === ''
      ? null
      : Math.round(parseFloat(editingItem.price) * 100);
    try {
      const updated = await apiPatch(`/api/admin/menu/items/${editingItem.id}`, {
        name: editingItem.name.trim(),
        description: editingItem.description.trim() || null,
        price_cents,
        tags: editingItem.tags,
        is_visible: editingItem.is_visible,
      });
      onSaveItem(category.id, updated);
      setEditingItem(null);
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function saveNewItem() {
    if (!newItem.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    const price_cents = newItem.price.trim() === ''
      ? null
      : Math.round(parseFloat(newItem.price) * 100);
    try {
      const created = await apiPost('/api/admin/menu/items', {
        category_id: category.id,
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        price_cents,
        tags: newItem.tags,
        is_visible: newItem.is_visible,
      });
      onSaveItem(category.id, created);
      setNewItem(BLANK_ITEM);
      setShowNewItemForm(false);
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tag, draft, setDraft) {
    const current = draft.tags || [];
    setDraft({
      ...draft,
      tags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    });
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      {/* Category header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5">
        <DragHandle listeners={listeners} attributes={attributes} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-800">{category.name}</h3>
            {!category.is_visible && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Hidden
              </span>
            )}
            <span className="text-[11px] text-slate-400">{category.items?.length ?? 0} items</span>
          </div>
          {category.description && (
            <p className="mt-0.5 text-xs text-slate-400">{category.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEditCategory(category)}
          title="Edit category"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 2a2.83 2.83 0 0 1 4 4L5 16H1v-4L11 2z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDeleteCategory(category)}
          title="Delete category"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 4 14 4"/><path d="M6 4V2h4v2"/><path d="M3 4l1 10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-10"/>
          </svg>
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2 p-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) =>
              editingItem?.id === item.id ? (
                <ItemForm
                  key={item.id}
                  draft={editingItem}
                  setDraft={setEditingItem}
                  onSave={saveEditItem}
                  onCancel={cancelEdit}
                  saving={saving}
                  toggleTag={(tag) => toggleTag(tag, editingItem, setEditingItem)}
                />
              ) : (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  onEdit={openEditItem}
                  onDelete={(i) => onDeleteItem(category.id, i)}
                />
              )
            )}
          </SortableContext>
        </DndContext>

        {showNewItemForm ? (
          <ItemForm
            draft={newItem}
            setDraft={setNewItem}
            onSave={saveNewItem}
            onCancel={() => { setShowNewItemForm(false); setNewItem(BLANK_ITEM); setError(null); }}
            saving={saving}
            toggleTag={(tag) => toggleTag(tag, newItem, setNewItem)}
            isNew
          />
        ) : (
          <button
            type="button"
            onClick={() => { setShowNewItemForm(true); setEditingItem(null); }}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-medium text-slate-400 transition hover:border-slate-400 hover:bg-white hover:text-slate-600"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 2v12M2 8h12"/>
            </svg>
            Add item
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reusable item form (new + edit)
// ---------------------------------------------------------------------------
function ItemForm({ draft, setDraft, onSave, onCancel, saving, toggleTag, isNew = false }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 2a2.83 2.83 0 0 1 4 4L5 16H1v-4L11 2z"/>
          </svg>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600">
          {isNew ? 'New item' : 'Edit item'}
        </span>
      </div>

      <div className="space-y-5 p-5">
        {/* Name + Price row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. Burrata con Prosciutto"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Price <span className="font-normal normal-case tracking-normal text-slate-400">(leave blank to hide)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-8 pr-4 text-sm text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Description
          </label>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Describe ingredients, preparation, and flavors…"
          />
          <p className="text-right text-[10px] text-slate-400">{(draft.description || '').length} chars</p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">Tags</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TAG_BADGES).map(([value, { label }]) => {
              const active = (draft.tags || []).includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleTag(value)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    active
                      ? 'border-slate-700 bg-slate-800 text-white'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
                  ].join(' ')}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
            </svg>
            <span className="text-sm font-medium text-slate-700">Visible to guests</span>
          </div>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, is_visible: !draft.is_visible })}
            className={[
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
              draft.is_visible ? 'bg-slate-800' : 'bg-slate-300',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
              draft.is_visible ? 'translate-x-4.5' : 'translate-x-0.5',
            ].join(' ')} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            {saving ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 8 6 12 14 4"/>
                </svg>
                Save item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category form (new + edit)
// ---------------------------------------------------------------------------
function CategoryForm({ draft, setDraft, onSave, onCancel, saving, isNew = false }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1h7M8 5h7M8 9h7M8 13h7M3 1v14M1 3l2-2 2 2"/>
          </svg>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600">
          {isNew ? 'New category' : 'Edit category'}
        </span>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="e.g. Antipasti"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Subtitle <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Brief note shown under the heading"
            />
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
            </svg>
            <span className="text-sm font-medium text-slate-700">Visible to guests</span>
          </div>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, is_visible: !draft.is_visible })}
            className={[
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
              draft.is_visible ? 'bg-slate-800' : 'bg-slate-300',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
              draft.is_visible ? 'translate-x-4.5' : 'translate-x-0.5',
            ].join(' ')} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            {saving ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 8 6 12 14 4"/>
                </svg>
                Save category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminMenu component
// ---------------------------------------------------------------------------
export default function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  const [editingCategory, setEditingCategory] = useState(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState(BLANK_CATEGORY);
  const [categorySaving, setCategorySaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'category'|'item', data }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiGet('/api/admin/menu/categories');
      setCategories(data);
    } catch (e) {
      setError(e.message || 'Failed to load menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Category drag-and-drop
  async function handleCategoryDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => `cat-${c.id}` === active.id);
    const newIndex = categories.findIndex((c) => `cat-${c.id}` === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    const payload = reordered.map((c, idx) => ({ id: c.id, display_order: idx }));
    try {
      await apiPatch('/api/admin/menu/categories/reorder', { items: payload });
    } catch {
      fetchCategories();
    }
  }

  // Create category
  async function saveNewCategory() {
    if (!newCategory.name.trim()) { setGlobalError('Category name is required.'); return; }
    setCategorySaving(true);
    setGlobalError(null);
    try {
      const created = await apiPost('/api/admin/menu/categories', {
        name: newCategory.name.trim(),
        description: newCategory.description.trim() || null,
        is_visible: newCategory.is_visible,
      });
      setCategories((prev) => [...prev, { ...created, items: [] }]);
      setNewCategory(BLANK_CATEGORY);
      setShowNewCategoryForm(false);
    } catch (e) {
      setGlobalError(e.message || 'Failed to create category.');
    } finally {
      setCategorySaving(false);
    }
  }

  // Edit category
  async function saveEditCategory() {
    if (!editingCategory.name.trim()) { setGlobalError('Category name is required.'); return; }
    setCategorySaving(true);
    setGlobalError(null);
    try {
      const updated = await apiPatch(`/api/admin/menu/categories/${editingCategory.id}`, {
        name: editingCategory.name.trim(),
        description: editingCategory.description.trim() || null,
        is_visible: editingCategory.is_visible,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...updated, items: c.items } : c))
      );
      setEditingCategory(null);
    } catch (e) {
      setGlobalError(e.message || 'Failed to update category.');
    } finally {
      setCategorySaving(false);
    }
  }

  // Item save callback from child
  function handleSaveItem(categoryId, item) {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c;
        const exists = c.items.some((i) => i.id === item.id);
        return {
          ...c,
          items: exists
            ? c.items.map((i) => (i.id === item.id ? item : i))
            : [...c.items, item],
        };
      })
    );
  }

  // Confirm delete
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await apiDelete(`/api/admin/menu/categories/${deleteTarget.data.id}`);
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.data.id));
      } else {
        await apiDelete(`/api/admin/menu/items/${deleteTarget.data.id}`);
        setCategories((prev) =>
          prev.map((c) => ({
            ...c,
            items: c.items.filter((i) => i.id !== deleteTarget.data.id),
          }))
        );
      }
    } catch (e) {
      setGlobalError(e.message || 'Delete failed.');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-gray-500">Loading menu…</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Admin"
        title="Menu"
        description="Drag categories and items to reorder. Toggle visibility to show or hide from guests."
      />

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* Category list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
        <SortableContext
          items={categories.map((c) => `cat-${c.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {categories.map((cat) =>
              editingCategory?.id === cat.id ? (
                <CategoryForm
                  key={cat.id}
                  draft={editingCategory}
                  setDraft={setEditingCategory}
                  onSave={saveEditCategory}
                  onCancel={() => { setEditingCategory(null); setGlobalError(null); }}
                  saving={categorySaving}
                />
              ) : (
                <SortableCategoryBlock
                  key={cat.id}
                  category={cat}
                  onEditCategory={(c) => {
                    setEditingCategory({ ...c, description: c.description || '' });
                    setShowNewCategoryForm(false);
                  }}
                  onDeleteCategory={(c) => setDeleteTarget({ type: 'category', data: c })}
                  onSaveItem={handleSaveItem}
                  onDeleteItem={(catId, item) => setDeleteTarget({ type: 'item', data: item })}
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* New category form */}
      {showNewCategoryForm ? (
        <CategoryForm
          draft={newCategory}
          setDraft={setNewCategory}
          onSave={saveNewCategory}
          onCancel={() => { setShowNewCategoryForm(false); setNewCategory(BLANK_CATEGORY); setGlobalError(null); }}
          saving={categorySaving}
          isNew
        />
      ) : (
        <button
          type="button"
          onClick={() => { setShowNewCategoryForm(true); setEditingCategory(null); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
        >
          + Add category
        </button>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-semibold text-gray-800">
              Delete {deleteTarget.type === 'category' ? 'category' : 'item'}?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{deleteTarget.data.name}</strong> will be permanently removed.
              {deleteTarget.type === 'category' && ' All items in this category will also be deleted.'}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
