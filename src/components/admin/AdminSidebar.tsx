import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  MessageSquare,
  Leaf,
  X,
} from 'lucide-react';
import { cn } from '@/utils';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border flex flex-col transition-transform duration-300',
          'lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-brand-800 leading-none">Omoola</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn('admin-sidebar-link', isActive && 'active')
              }
            >
              <link.icon className="w-4.5 h-4.5 shrink-0" style={{ width: '18px', height: '18px' }} />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Omoola Admin v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
