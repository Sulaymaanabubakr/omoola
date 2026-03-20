import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, Leaf } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/utils';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const totalItems = useCartStore(s => s.totalItems());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'Contact', to: '/contact' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-border'
          : 'bg-white border-b border-border'
      )}
    >
      <div className="container-app">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center shadow-md group-hover:bg-brand-800 transition-colors">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold text-brand-800">Omoola</span>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest -mt-0.5">Supermarket</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.to
                    ? 'text-brand-700 bg-brand-50'
                    : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search bar (desktop) */}
            <form
              onSubmit={handleSearch}
              className={cn(
                'hidden md:flex items-center transition-all duration-300 overflow-hidden',
                showSearch ? 'w-60' : 'w-10'
              )}
            >
              {showSearch ? (
                <div className="flex items-center w-full gap-2 bg-muted rounded-xl px-3 py-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="bg-transparent text-sm outline-none w-full text-foreground placeholder:text-muted-foreground"
                    onBlur={() => !searchQuery && setShowSearch(false)}
                  />
                  <button type="button" onClick={() => setShowSearch(false)}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSearch(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
                >
                  <Search className="w-5 h-5 text-foreground/70" />
                </button>
              )}
            </form>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-foreground/70" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-fade-in">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    location.pathname === link.to
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-foreground/70 hover:bg-muted'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
