import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag, Check, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { addCategory, updateCategory, deleteCategory } from '@/services/categories';
import { Category } from '@/types';
import { formatDate } from '@/utils';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const { categories, loading } = useCategories();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addCategory(newName.trim());
      setNewName('');
      toast.success('Category added!');
    } catch {
      toast.error('Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateCategory(id, editName.trim());
      setEditId(null);
      toast.success('Category updated!');
    } catch {
      toast.error('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast.success('Category deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
  };

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {/* Add form */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-600" />
          Add New Category
        </h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Beverages, Grains & Cereals..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="flex items-center gap-2 bg-brand-700 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-50 shrink-0"
          >
            {adding ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>
      </div>

      {/* Categories list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="ml-auto skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
              <Tag className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No categories yet</p>
              <p className="text-muted-foreground text-sm mt-1">Add your first category above</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 group transition-colors">
                <div className="w-9 h-9 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>

                {editId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditId(null); }}
                      autoFocus
                      className="input-field flex-1 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleEdit(cat.id)}
                      disabled={saving}
                      className="p-2 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.slug}</p>
                    </div>
                    <p className="text-xs text-muted-foreground hidden sm:block shrink-0">
                      {formatDate(cat.createdAt)}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Category"
          message={`Delete "${deleteTarget.name}"? Products in this category will become uncategorised.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
