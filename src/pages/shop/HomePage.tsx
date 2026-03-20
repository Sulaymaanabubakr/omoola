import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Clock, Star, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import ProductGrid from '@/components/shop/ProductGrid';
import { cn } from '@/utils';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { products: featured, loading: featuredLoading } = useProducts({ isFeatured: true, limitCount: 8 });
  const { categories } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const perks = [
    { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery within Owode Yewa' },
    { icon: ShieldCheck, title: 'Quality Guaranteed', desc: 'Fresh and carefully selected products' },
    { icon: Clock, title: 'Open Daily', desc: 'Mon–Sat 7AM–9PM, Sunday 9AM–7PM' },
    { icon: Star, title: 'Trusted by Locals', desc: 'Your neighbourhood\'s favourite store' },
  ];

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-700/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cream-400/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="container-app relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-brand-700/50 border border-brand-600/50 text-brand-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Open Now · Owode Yewa, Ogun State
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Fresh Groceries,{' '}
              <span className="text-cream-300 italic">Every Day.</span>
            </h1>
            <p className="text-brand-200 text-lg leading-relaxed mb-8 max-w-xl">
              Shop quality groceries, provisions, and household essentials from the comfort of your home. 
              Order via WhatsApp — fast, simple, and reliable.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-lg">
              <div className="flex-1 flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 focus-within:bg-white/20 transition-colors">
                <Search className="w-4 h-4 text-brand-200 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for rice, tomatoes, soap..."
                  className="bg-transparent text-white placeholder:text-brand-300 outline-none flex-1 text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-cream-400 text-brand-950 font-bold px-5 py-3 rounded-2xl hover:bg-cream-300 transition-colors text-sm whitespace-nowrap"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="btn-primary inline-flex items-center gap-2 bg-white text-brand-900 hover:bg-cream-100">
                Shop All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '2348000000000'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                Order via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="border-b border-border bg-white">
        <div className="container-app py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map(perk => (
              <div key={perk.title} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <perk.icon className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{perk.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-app py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Shop by Category</h2>
            <Link to="/products" className="text-sm font-medium text-brand-700 hover:underline flex items-center gap-1">
              All products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 12).map((cat, i) => {
              const colors = [
                'bg-green-50 text-green-700 border-green-100 hover:bg-green-100',
                'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
                'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100',
                'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100',
                'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
                'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100',
              ];
              return (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                    colors[i % colors.length]
                  )}
                >
                  <span className="text-2xl">
                    {['🥬', '🍚', '🧴', '🥩', '🍞', '🥤', '🧹', '🥛', '🛒', '🌶️', '🐟', '🧆'][i % 12]}
                  </span>
                  <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container-app pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">Featured Products</h2>
            <p className="text-muted-foreground text-sm mt-1">Our most popular picks, just for you</p>
          </div>
          <Link to="/products?featured=true" className="text-sm font-medium text-brand-700 hover:underline flex items-center gap-1">
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ProductGrid products={featured} loading={featuredLoading} emptyMessage="No featured products yet. Check back soon!" />
      </section>

      {/* CTA */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 rounded-3xl bg-gradient-to-r from-brand-800 to-brand-700 text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="relative p-10 sm:p-14 max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to order? Let's chat on WhatsApp!
          </h2>
          <p className="text-brand-200 mb-8 leading-relaxed">
            Add items to your cart, proceed to checkout, and complete your order through WhatsApp. 
            We'll confirm and deliver straight to you.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-brand-900 font-bold px-7 py-3.5 rounded-2xl hover:bg-cream-100 transition-colors"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
