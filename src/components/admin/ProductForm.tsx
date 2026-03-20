import { useState, useRef } from 'react';
import { X, Upload, ImageIcon, Star, Loader2 } from 'lucide-react';
import { Product, Category } from '@/types';
import { addProduct, updateProduct } from '@/services/products';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductForm({ product, categories, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    categoryId: product?.categoryId || '',
    imageUrl: product?.imageUrl || '',
    isFeatured: product?.isFeatured || false,
    inStock: product?.inStock ?? true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.imageUrl || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(er => { const n = { ...er }; delete n[field]; return n; });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price';
    if (!form.categoryId) e.categoryId = 'Select a category';
    if (!imageFile && !form.imageUrl) e.image = 'Product image is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl,
        isFeatured: form.isFeatured,
        inStock: form.inStock,
      };

      if (isEdit && product) {
        await updateProduct(product.id, data, imageFile || undefined);
        toast.success('Product updated!');
      } else {
        await addProduct(data, imageFile || undefined);
        toast.success('Product added!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="font-display text-xl font-bold">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Product Image *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-2xl cursor-pointer transition-colors overflow-hidden',
                errors.image ? 'border-destructive' : 'border-border hover:border-brand-400',
                imagePreview ? 'h-40' : 'h-32'
              )}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            {errors.image && <p className="text-destructive text-xs mt-1">{errors.image}</p>}
            <p className="text-xs text-muted-foreground mt-1">Or paste an image URL below:</p>
            <input
              value={form.imageUrl}
              onChange={e => {
                setForm(f => ({ ...f, imageUrl: e.target.value }));
                setImagePreview(e.target.value);
              }}
              placeholder="https://example.com/image.jpg"
              className="input-field mt-1 text-xs"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Product Name *</label>
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Golden Penny Semolina 2kg"
              className={cn('input-field', errors.name && 'border-destructive ring-1 ring-destructive')}
            />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Description *</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Brief product description..."
              rows={3}
              className={cn('input-field resize-none', errors.description && 'border-destructive ring-1 ring-destructive')}
            />
            {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Price + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Price (₦) *</label>
              <input
                type="number"
                min="0"
                step="50"
                value={form.price}
                onChange={set('price')}
                placeholder="2500"
                className={cn('input-field', errors.price && 'border-destructive ring-1 ring-destructive')}
              />
              {errors.price && <p className="text-destructive text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Category *</label>
              <select
                value={form.categoryId}
                onChange={set('categoryId')}
                className={cn('input-field', errors.categoryId && 'border-destructive ring-1 ring-destructive')}
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-destructive text-xs mt-1">{errors.categoryId}</p>}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  form.isFeatured ? 'bg-amber-400' : 'bg-muted'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                  form.isFeatured ? 'translate-x-5.5' : 'translate-x-0.5'
                )} style={{ transform: form.isFeatured ? 'translateX(22px)' : 'translateX(2px)' }} />
              </div>
              <span className="text-sm font-medium flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Featured
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  form.inStock ? 'bg-brand-500' : 'bg-muted'
                )}
              >
                <div className={cn(
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform'
                )} style={{ transform: form.inStock ? 'translateX(22px)' : 'translateX(2px)' }} />
              </div>
              <span className="text-sm font-medium">In Stock</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-brand-700 text-white rounded-xl font-bold text-sm hover:bg-brand-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
