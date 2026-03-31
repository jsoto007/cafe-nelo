import { useCallback, useEffect, useRef, useState } from 'react';
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
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import SectionTitle from '../../components/SectionTitle.jsx';

const TAG_OPTIONS = [
  { value: 'v', label: 'Vegetarian' },
  { value: 'gf', label: 'Gluten-Free' },
  { value: 'signature', label: 'Signature' },
];

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
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-800 text-sm">{item.name}</span>
          {!item.is_visible && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Hidden
            </span>
          )}
          {(item.tags || []).map((t) => (
            <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {t}
            </span>
          ))}
        </div>
        {item.description && (
          <p className="mt-0.5 truncate text-xs text-gray-500">{item.description}</p>
        )}
      </div>
      <span className="shrink-0 text-sm font-medium text-gray-700">
        {item.price != null ? `$${Number(item.price).toFixed(2)}` : <span className="text-xs text-gray-400">Ask server</span>}
      </span>
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
    <div ref={setNodeRef} style={style} className="rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
      {/* Category header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <DragHandle listeners={listeners} attributes={attributes} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-800">{category.name}</h3>
            {!category.is_visible && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Hidden
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-xs text-gray-500">{category.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEditCategory(category)}
          className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDeleteCategory(category)}
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
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
          >
            + Add item
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
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {isNew ? 'New item' : 'Edit item'}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Name *</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Burrata con Prosciutto"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Price (leave blank = Ask server)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="18.00"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-0.5">Description</label>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Short description…"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        {TAG_OPTIONS.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={(draft.tags || []).includes(value)}
              onChange={() => toggleTag(value)}
              className="rounded"
            />
            {label}
          </label>
        ))}
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={draft.is_visible}
            onChange={(e) => setDraft({ ...draft, is_visible: e.target.checked })}
            className="rounded"
          />
          Visible to guests
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category form (new + edit)
// ---------------------------------------------------------------------------
function CategoryForm({ draft, setDraft, onSave, onCancel, saving, isNew = false }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {isNew ? 'New category' : 'Edit category'}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Name *</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Antipasti"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Description (optional)</label>
          <input
            type="text"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Brief subtitle for this section"
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
