import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Layers,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAdminDashboardStats } from "@/lib/supabase-admin";
import type { Product } from "@/types";

export function AdminPage() {
  const [stats, setStats] = useState<{
    lowStockProducts: Product[];
    topSellingProducts: Product[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const data = await fetchAdminDashboardStats();
        if (mounted && data) {
          setStats(data);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col pt-4 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor your store's products and inventory levels.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowStockProducts?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Selling Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topSellingProducts?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Products performing well</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats?.lowStockProducts?.length ? (
                <p className="text-sm text-muted-foreground">Inventory levels are healthy.</p>
              ) : (
                stats?.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-medium leading-none max-w-[200px] truncate">
                        <Link to={`/admin/products/edit/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </p>
                    </div>
                    <div className="font-medium text-destructive">
                      {product.stockQty} left
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!stats?.topSellingProducts?.length ? (
                <p className="text-sm text-muted-foreground">No best sellers marked yet.</p>
              ) : (
                stats?.topSellingProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#7C3AED]" />
                      <p className="text-sm font-medium leading-none max-w-[200px] truncate">
                        <Link to={`/admin/products/edit/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </p>
                    </div>
                    <div className="font-medium">
                      ₦{product.price.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
