import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductGrid from '@/components/shop/ProductGrid';
import { cn } from '@/utils';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [showFeatured, setShowFeatured] = useState(searchParams.get('featured') === 'true');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const { products, loading } = useProducts({
    categoryId: selectedCategory || undefined,
    isFeatured: showFeatured || undefined,
    realtime: true,
  });

  const { categories } = useCategories();

  // Sync search params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchInput) params.search = searchInput;
    if (selectedCategory) params.category = selectedCategory;
    if (showFeatured) params.featured = 'true';
    setSearchParams(params, { replace: true });
  }, [searchInput, selectedCategory, setSearchParams, showFeatured]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...products];

    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);

    return result;
  }, [products, searchInput, sortBy]);

  const activeFiltersCount = [selectedCategory, showFeatured].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('');
    setShowFeatured(false);
    setSearchInput('');
  };

  return (
    <div className="container-app py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title mb-1">All Products</h1>
        <p className="text-muted-foreground text-sm">
          {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Search + controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1 flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')}>
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="input-field w-auto text-sm cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
            showFilters || activeFiltersCount > 0
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-card border-border hover:bg-muted'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 bg-white text-brand-700 text-xs font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Filter Products</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-destructive hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Categories */}
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                    selectedCategory === ''
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                      selectedCategory === cat.id
                        ? 'bg-brand-700 text-white border-brand-700'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Special
              </label>
              <button
                onClick={() => setShowFeatured(!showFeatured)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  showFeatured
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'border-border hover:bg-muted'
                )}
              >
                ⭐ Featured only
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category quick pills */}
      {!showFilters && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors shrink-0',
              selectedCategory === ''
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-border hover:bg-muted'
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors shrink-0',
                selectedCategory === cat.id
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'border-border hover:bg-muted'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <ProductGrid products={filtered} loading={loading} />
    </div>
  );
}
