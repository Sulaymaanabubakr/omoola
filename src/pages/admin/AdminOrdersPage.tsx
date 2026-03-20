import { useState } from 'react';
import {
  ShoppingBag, Clock, CheckCircle2, TrendingUp,
  AlertCircle, ChevronDown, ExternalLink, Search
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { updateOrderStatus } from '@/services/orders';
import { getOrderItems } from '@/services/orders';
import { Order, OrderItem } from '@/types';
import { formatPrice, formatDate } from '@/utils';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, class: 'text-amber-600 bg-amber-50 border-amber-200' },
  processing: { label: 'Processing', icon: TrendingUp, class: 'text-blue-600 bg-blue-50 border-blue-200' },
  completed: { label: 'Completed', icon: CheckCircle2, class: 'text-brand-600 bg-brand-50 border-brand-200' },
  cancelled: { label: 'Cancelled', icon: AlertCircle, class: 'text-destructive bg-destructive/5 border-destructive/20' },
};

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const sc = statusConfig[order.status] || statusConfig.pending;
  const Icon = sc.icon;

  const toggleExpand = async () => {
    if (!expanded && items.length === 0) {
      setLoadingItems(true);
      try {
        const fetched = await getOrderItems(order.id);
        setItems(fetched);
      } catch {
        toast.error('Failed to load order items');
      } finally {
        setLoadingItems(false);
      }
    }
    setExpanded(!expanded);
  };

  const handleStatusChange = async (status: Order['status']) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`Order marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <>
      <tr
        className="hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={toggleExpand}
      >
        <td className="px-5 py-4">
          <div>
            <p className="font-medium text-sm">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">{order.phone}</p>
          </div>
        </td>
        <td className="px-5 py-4 hidden sm:table-cell">
          <span className="font-bold text-brand-700 text-sm">
            {order.total ? formatPrice(order.total) : '—'}
          </span>
        </td>
        <td className="px-5 py-4">
          <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', sc.class)}>
            <Icon className="w-3 h-3" />
            {sc.label}
          </div>
        </td>
        <td className="px-5 py-4 text-muted-foreground text-xs hidden md:table-cell">
          {formatDate(order.createdAt)}
        </td>
        <td className="px-5 py-4">
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </td>
      </tr>

      {expanded && (
        <tr className="bg-muted/10">
          <td colSpan={5} className="px-5 py-4">
            <div className="space-y-4 animate-fade-in">
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Order Items</p>
                {loadingItems ? (
                  <p className="text-sm text-muted-foreground">Loading items...</p>
                ) : items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items found</p>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-9 h-9 rounded-lg object-cover bg-muted shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              {(order.address || order.notes) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {order.address && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Address</p>
                      <p className="text-sm">{order.address}</p>
                    </div>
                  )}
                  {order.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <p className="text-xs font-semibold text-muted-foreground mr-1">Update Status:</p>
                {(Object.keys(statusConfig) as Order['status'][]).map(s => (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(s); }}
                    disabled={updatingStatus || order.status === s}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                      order.status === s
                        ? cn(statusConfig[s].class, 'cursor-default')
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {statusConfig[s].label}
                  </button>
                ))}
                <a
                  href={`https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${order.customerName}, your Omoola Supermarket order is being processed!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="ml-auto flex items-center gap-1.5 text-xs font-medium text-[#16a34a] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  WhatsApp Customer
                </a>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminOrdersPage() {
  const { orders, loading } = useOrders();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.customerName.toLowerCase().includes(q) || o.phone.includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: '', label: `All (${counts.all})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'processing', label: `Processing (${counts.processing})` },
          { key: 'completed', label: `Completed (${counts.completed})` },
          { key: 'cancelled', label: `Cancelled (${counts.cancelled})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border shrink-0',
              filterStatus === tab.key
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-border hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-all max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="bg-transparent outline-none text-sm flex-1"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-10 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No orders found</p>
            <p className="text-muted-foreground text-sm">Orders will appear here when customers checkout.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Total</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="w-10 px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(order => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
