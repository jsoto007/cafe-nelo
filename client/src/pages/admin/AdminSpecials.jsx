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

const BLANK_ITEM = { name: '', description: '', price: '' };
const BLANK_SECTION = { course: '', is_visible: true };

// ---------------------------------------------------------------------------
// Drag handle
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
// Sortable special item row
// ---------------------------------------------------------------------------
function SortableSpecialItemRow({ item, onEdit, onDelete }) {
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
      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
    >
      <div className="mt-0.5">
        <DragHandle listeners={listeners} attributes={attributes} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-800 text-sm">{item.name}</span>
          {item.price != null && (
            <span className="text-xs text-gray-500">${Number(item.price).toFixed(2)}</span>
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.description}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Special item form
// ---------------------------------------------------------------------------
function SpecialItemForm({ draft, setDraft, onSave, onCancel, saving, isNew = false }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
      {/* Header bar */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 2a2.83 2.83 0 0 1 4 4L5 16H1v-4L11 2z"/>
          </svg>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600">
          {isNew ? 'New dish' : 'Edit dish'}
        </span>
      </div>

      <div className="space-y-5 p-5">
        {/* Dish name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Dish name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="e.g. Braised Short Rib"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
            Description
          </label>
          <textarea
            rows={4}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-slate-800 placeholder-slate-400 transition focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Describe the ingredients, preparation, and presentation…"
          />
          <p className="text-right text-[10px] text-slate-400">{(draft.description || '').length} chars</p>
        </div>

        {/* Price */}
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
                Save dish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sortable section block (e.g. Appetizers, Entrees)
// ---------------------------------------------------------------------------
function SortableSectionBlock({ section, onEditSection, onDeleteSection, onSaveItem, onDeleteItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `sec-${section.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [items, setItems] = useState(section.items || []);
  const [editingItem, setEditingItem] = useState(null);
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState(BLANK_ITEM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { setItems(section.items || []); }, [section.items]);

  async function handleItemDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    const payload = reordered.map((it, idx) => ({ id: it.id, display_order: idx }));
    try {
      await apiPatch(`/api/admin/specials/${section.id}/items/reorder`, { items: payload });
    } catch {
      setItems(items);
    }
  }

  function openEditItem(item) {
    setEditingItem({ ...item, price: item.price != null ? String(item.price) : '' });
    setShowNewItemForm(false);
    setError(null);
  }

  async function saveEditItem() {
    if (!editingItem.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError(null);
    const price_cents = editingItem.price.trim() === ''
      ? null
      : Math.round(parseFloat(editingItem.price) * 100);
    try {
      const updated = await apiPatch(
        `/api/admin/specials/${section.id}/items/${editingItem.id}`,
        { name: editingItem.name.trim(), description: editingItem.description.trim() || null, price_cents }
      );
      onSaveItem(section.id, updated);
      setEditingItem(null);
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function saveNewItem() {
    if (!newItem.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError(null);
    const price_cents = newItem.price.trim() === ''
      ? null
      : Math.round(parseFloat(newItem.price) * 100);
    try {
      const created = await apiPost(`/api/admin/specials/${section.id}/items`, {
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        price_cents,
      });
      onSaveItem(section.id, created);
      setNewItem(BLANK_ITEM);
      setShowNewItemForm(false);
    } catch (e) {
      setError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <DragHandle listeners={listeners} attributes={attributes} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-800">{section.course}</h3>
            {!section.is_visible && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Hidden
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEditSection(section)}
          className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDeleteSection(section)}
          className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {/* Items */}
      <div className="space-y-2 p-4">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) =>
              editingItem?.id === item.id ? (
                <SpecialItemForm
                  key={item.id}
                  draft={editingItem}
                  setDraft={setEditingItem}
                  onSave={saveEditItem}
                  onCancel={() => { setEditingItem(null); setError(null); }}
                  saving={saving}
                />
              ) : (
                <SortableSpecialItemRow
                  key={item.id}
                  item={item}
                  onEdit={openEditItem}
                  onDelete={(i) => onDeleteItem(section.id, i)}
                />
              )
            )}
          </SortableContext>
        </DndContext>

        {showNewItemForm ? (
          <SpecialItemForm
            draft={newItem}
            setDraft={setNewItem}
            onSave={saveNewItem}
            onCancel={() => { setShowNewItemForm(false); setNewItem(BLANK_ITEM); setError(null); }}
            saving={saving}
            isNew
          />
        ) : (
          <button
            type="button"
            onClick={() => { setShowNewItemForm(true); setEditingItem(null); }}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
          >
            + Add dish
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section form (new + edit)
// ---------------------------------------------------------------------------
function SectionForm({ draft, setDraft, onSave, onCancel, saving, isNew = false }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {isNew ? 'New section' : 'Edit section'}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Course name *</label>
          <input
            type="text"
            value={draft.course}
            onChange={(e) => setDraft({ ...draft, course: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Appetizers"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draft.is_visible}
          onChange={(e) => setDraft({ ...draft, is_visible: e.target.checked })}
          className="rounded"
        />
        Visible to guests
      </label>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main AdminSpecials component
// ---------------------------------------------------------------------------
export default function AdminSpecials() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  const [editingSection, setEditingSection] = useState(null);
  const [showNewSectionForm, setShowNewSectionForm] = useState(false);
  const [newSection, setNewSection] = useState(BLANK_SECTION);
  const [sectionSaving, setSectionSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSections = useCallback(async () => {
    try {
      const data = await apiGet('/api/admin/specials');
      setSections(data);
    } catch (e) {
      setError(e.message || 'Failed to load specials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  async function handleSectionDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => `sec-${s.id}` === active.id);
    const newIndex = sections.findIndex((s) => `sec-${s.id}` === over.id);
    const reordered = arrayMove(sections, oldIndex, newIndex);
    setSections(reordered);
    const payload = reordered.map((s, idx) => ({ id: s.id, display_order: idx }));
    try {
      await apiPatch('/api/admin/specials/reorder', { items: payload });
    } catch {
      fetchSections();
    }
  }

  async function saveNewSection() {
    if (!newSection.course.trim()) { setGlobalError('Course name is required.'); return; }
    setSectionSaving(true); setGlobalError(null);
    try {
      const created = await apiPost('/api/admin/specials', {
        course: newSection.course.trim(),
        is_visible: newSection.is_visible,
      });
      setSections((prev) => [...prev, { ...created, items: [] }]);
      setNewSection(BLANK_SECTION);
      setShowNewSectionForm(false);
    } catch (e) {
      setGlobalError(e.message || 'Failed to create section.');
    } finally {
      setSectionSaving(false);
    }
  }

  async function saveEditSection() {
    if (!editingSection.course.trim()) { setGlobalError('Course name is required.'); return; }
    setSectionSaving(true); setGlobalError(null);
    try {
      const updated = await apiPatch(`/api/admin/specials/${editingSection.id}`, {
        course: editingSection.course.trim(),
        is_visible: editingSection.is_visible,
      });
      setSections((prev) =>
        prev.map((s) => (s.id === updated.id ? { ...updated, items: s.items } : s))
      );
      setEditingSection(null);
    } catch (e) {
      setGlobalError(e.message || 'Failed to update section.');
    } finally {
      setSectionSaving(false);
    }
  }

  function handleSaveItem(sectionId, item) {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const exists = s.items.some((i) => i.id === item.id);
        return {
          ...s,
          items: exists
            ? s.items.map((i) => (i.id === item.id ? item : i))
            : [...s.items, item],
        };
      })
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'section') {
        await apiDelete(`/api/admin/specials/${deleteTarget.data.id}`);
        setSections((prev) => prev.filter((s) => s.id !== deleteTarget.data.id));
      } else {
        await apiDelete(
          `/api/admin/specials/${deleteTarget.sectionId}/items/${deleteTarget.data.id}`
        );
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            items: s.items.filter((i) => i.id !== deleteTarget.data.id),
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
    return <p className="py-8 text-center text-sm text-gray-500">Loading specials…</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Admin"
        title="Daily Specials"
        description="Manage today's specials. Drag sections and dishes to reorder. Toggle visibility to show or hide from guests."
      />

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {sections.length === 0 && !showNewSectionForm && (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">No specials yet. Add a section to get started.</p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
        <SortableContext
          items={sections.map((s) => `sec-${s.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sections.map((section) =>
              editingSection?.id === section.id ? (
                <SectionForm
                  key={section.id}
                  draft={editingSection}
                  setDraft={setEditingSection}
                  onSave={saveEditSection}
                  onCancel={() => { setEditingSection(null); setGlobalError(null); }}
                  saving={sectionSaving}
                />
              ) : (
                <SortableSectionBlock
                  key={section.id}
                  section={section}
                  onEditSection={(s) => { setEditingSection({ ...s }); setShowNewSectionForm(false); }}
                  onDeleteSection={(s) => setDeleteTarget({ type: 'section', data: s })}
                  onSaveItem={handleSaveItem}
                  onDeleteItem={(sectionId, item) =>
                    setDeleteTarget({ type: 'item', sectionId, data: item })
                  }
                />
              )
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showNewSectionForm ? (
        <SectionForm
          draft={newSection}
          setDraft={setNewSection}
          onSave={saveNewSection}
          onCancel={() => { setShowNewSectionForm(false); setNewSection(BLANK_SECTION); setGlobalError(null); }}
          saving={sectionSaving}
          isNew
        />
      ) : (
        <button
          type="button"
          onClick={() => { setShowNewSectionForm(true); setEditingSection(null); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
        >
          + Add section
        </button>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-semibold text-gray-800">
              Delete {deleteTarget.type === 'section' ? 'section' : 'dish'}?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              <strong>{deleteTarget.data.name || deleteTarget.data.course}</strong> will be permanently removed.
              {deleteTarget.type === 'section' && ' All dishes in this section will also be deleted.'}
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
