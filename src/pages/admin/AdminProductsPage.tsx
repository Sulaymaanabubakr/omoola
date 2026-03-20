import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Star, Package } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { deleteProduct } from '@/services/products';
import { Product } from '@/types';
import { formatPrice, formatDate, getImagePlaceholder } from '@/utils';
import ProductForm from '@/components/admin/ProductForm';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

export default function AdminProductsPage() {
  const { products, loading } = useProducts({ realtime: true });
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let r = [...products];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    if (filterCat) r = r.filter(p => p.categoryId === filterCat);
    return r;
  }, [products, search, filterCat]);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—';

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id, deleteTarget.imageUrl);
      toast.success('Product deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-brand-700 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-all">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="input-field w-auto text-sm"
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
                <div className="skeleton h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">No products found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {search || filterCat ? 'Try adjusting your filters' : 'Add your first product to get started'}
              </p>
            </div>
            {!search && !filterCat && (
              <button
                onClick={() => { setEditProduct(null); setShowForm(true); }}
                className="btn-primary text-sm"
              >
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Added</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl || getImagePlaceholder(product.name)}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover bg-muted shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[180px]">{product.name}</p>
                          {product.isFeatured && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-500" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="badge-category">{getCategoryName(product.categoryId)}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-brand-700">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                        product.inStock !== false
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => { setEditProduct(product); setShowForm(true); }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          product={editProduct}
          categories={categories}
          onClose={() => { setShowForm(false); setEditProduct(null); }}
          onSaved={() => { setShowForm(false); setEditProduct(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Product"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
