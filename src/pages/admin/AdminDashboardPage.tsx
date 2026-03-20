import { Link } from 'react-router-dom';
import {
  Package, Tag, ShoppingBag, MessageSquare,
  TrendingUp, Clock, CheckCircle2, AlertCircle, ArrowRight
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useOrders } from '@/hooks/useOrders';
import { useMessages } from '@/hooks/useMessages';
import { formatPrice, formatDate } from '@/utils';
import { cn } from '@/utils';

function StatCard({ icon: Icon, label, value, sub, color, to }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  to: string;
}) {
  return (
    <Link to={to} className="stat-card hover:border-brand-300 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { products } = useProducts({ realtime: true });
  const { categories } = useCategories();
  const { orders } = useOrders();
  const { messages } = useMessages();

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const unreadMessages = messages.filter(m => !m.isRead).length;
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const featuredCount = products.filter(p => p.isFeatured).length;

  const recentOrders = orders.slice(0, 5);

  const statusConfig: Record<string, { label: string; icon: React.ElementType; class: string }> = {
    pending: { label: 'Pending', icon: Clock, class: 'text-amber-600 bg-amber-50' },
    processing: { label: 'Processing', icon: TrendingUp, class: 'text-blue-600 bg-blue-50' },
    completed: { label: 'Completed', icon: CheckCircle2, class: 'text-brand-600 bg-brand-50' },
    cancelled: { label: 'Cancelled', icon: AlertCircle, class: 'text-destructive bg-destructive/10' },
  };

  return (
    <div className="page-enter space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your store activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Products"
          value={products.length}
          sub={`${featuredCount} featured`}
          color="bg-brand-100 text-brand-700"
          to="/admin/products"
        />
        <StatCard
          icon={Tag}
          label="Categories"
          value={categories.length}
          color="bg-blue-100 text-blue-700"
          to="/admin/categories"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value={orders.length}
          sub={`${pendingOrders} pending · ${completedOrders} completed`}
          color="bg-amber-100 text-amber-700"
          to="/admin/orders"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={messages.length}
          sub={unreadMessages > 0 ? `${unreadMessages} unread` : 'All read'}
          color="bg-purple-100 text-purple-700"
          to="/admin/messages"
        />
      </div>

      {/* Revenue + alerts row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="stat-card bg-gradient-to-br from-brand-700 to-brand-800 text-white border-0">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-200" />
            <span className="text-brand-200 text-sm font-medium">Completed Revenue</span>
          </div>
          <p className="font-display text-3xl font-bold">{formatPrice(totalRevenue)}</p>
          <p className="text-brand-300 text-xs mt-1">From {completedOrders} completed orders</p>
        </div>

        {pendingOrders > 0 && (
          <Link to="/admin/orders" className="stat-card border-amber-200 bg-amber-50 hover:border-amber-300 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 text-sm font-semibold">Action Required</span>
            </div>
            <p className="text-2xl font-bold text-amber-800">{pendingOrders} pending order{pendingOrders !== 1 ? 's' : ''}</p>
            <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
              View and update order status <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        )}

        {unreadMessages > 0 && (
          <Link to="/admin/messages" className="stat-card border-purple-200 bg-purple-50 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700 text-sm font-semibold">New Messages</span>
            </div>
            <p className="text-2xl font-bold text-purple-800">{unreadMessages} unread</p>
            <p className="text-purple-600 text-xs mt-1 flex items-center gap-1">
              Check messages <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-brand-700 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map(order => {
                  const sc = statusConfig[order.status] || statusConfig.pending;
                  const Icon = sc.icon;
                  return (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{order.customerName}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{order.phone}</td>
                      <td className="px-5 py-3.5 font-semibold hidden sm:table-cell">
                        {order.total ? formatPrice(order.total) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.class)}>
                          <Icon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
